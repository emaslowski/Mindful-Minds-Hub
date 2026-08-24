import { db } from '@workspace/db';
import {
  studioProjectsTable,
  studioTeacherReviewsTable,
  studioPublicationsTable,
  studioProfilesTable,
  studioTeamsTable,
  studioSafetyFlagsTable,
  studioPeerReviewsTable,
  studioSourcesTable,
} from '@workspace/db/schema';
import { eq, desc, inArray, sql } from 'drizzle-orm';
import { Router, type Request, type Response } from 'express';
import { requireStudioRole } from '../../../middlewares/studioAuthMiddleware';

const router = Router();

/**
 * The current Studio sessions identify the password-based admin with a string,
 * while older Studio databases require a numeric studio_accounts ID for
 * teacher_review records. Resolve that legacy ID when it is available.
 */
async function getTeacherReviewAuthorId(sessionUserId: string): Promise<string> {
  if (/^\d+$/.test(sessionUserId)) return sessionUserId;

  try {
    const result = await db.execute<{ id: number }>(
      sql`SELECT id FROM studio_accounts
          WHERE role = 'teacher' AND account_status = 'active'
          ORDER BY id
          LIMIT 1`,
    );
    const legacyTeacherId = result.rows[0]?.id;
    if (legacyTeacherId != null) return String(legacyTeacherId);
  } catch {
    // Newer databases do not have the legacy studio_accounts table. In that
    // case, the current session user ID is the correct review author ID.
  }

  return sessionUserId;
}

// GET /api/teacher/projects — all projects with full detail for teacher
router.get('/teacher/projects', requireStudioRole('teacher'), async (req: Request, res: Response) => {
  const { status } = req.query as { status?: string };

  const projects = await db
    .select({
      id: studioProjectsTable.id,
      title: studioProjectsTable.title,
      contentType: studioProjectsTable.contentType,
      status: studioProjectsTable.status,
      contentFlagged: studioProjectsTable.contentFlagged,
      assignedStudentId: studioProjectsTable.assignedStudentId,
      // Display name from studio profile — cast assigned_student_id to text to handle
      // DB columns that are stored as integer but referenced as varchar in the schema
      studentName: studioProfilesTable.displayName,
      teamId: studioProjectsTable.teamId,
      teamName: studioTeamsTable.name,
      jobId: studioProjectsTable.jobId,
      createdAt: studioProjectsTable.createdAt,
      updatedAt: studioProjectsTable.updatedAt,
    })
    .from(studioProjectsTable)
    .leftJoin(
      studioProfilesTable,
      sql`${studioProjectsTable.assignedStudentId}::text = ${studioProfilesTable.userId}`,
    )
    .leftJoin(studioTeamsTable, eq(studioProjectsTable.teamId, studioTeamsTable.id))
    .orderBy(desc(studioProjectsTable.updatedAt));

  const filtered = status ? projects.filter((p) => p.status === status) : projects;
  res.json({ projects: filtered });
});

// GET /api/teacher/review/queue — submissions awaiting teacher review
router.get('/teacher/review/queue', requireStudioRole('teacher'), async (_req, res) => {
  const projects = await db
    .select({
      id: studioProjectsTable.id,
      title: studioProjectsTable.title,
      contentType: studioProjectsTable.contentType,
      status: studioProjectsTable.status,
      contentFlagged: studioProjectsTable.contentFlagged,
      assignedStudentId: studioProjectsTable.assignedStudentId,
      jobId: studioProjectsTable.jobId,
      // Cast assigned_student_id to text to handle integer vs varchar type mismatch in DB
      studentName: studioProfilesTable.displayName,
      teamName: studioTeamsTable.name,
      updatedAt: studioProjectsTable.updatedAt,
    })
    .from(studioProjectsTable)
    .leftJoin(
      studioProfilesTable,
      sql`${studioProjectsTable.assignedStudentId}::text = ${studioProfilesTable.userId}`,
    )
    .leftJoin(studioTeamsTable, eq(studioProjectsTable.teamId, studioTeamsTable.id))
    .where(
      inArray(studioProjectsTable.status, [
        'Ready for Teacher Review',
        'Teacher Reviewing',
      ]),
    )
    .orderBy(studioProjectsTable.updatedAt);

  res.json({ projects });
});

// GET /api/teacher/projects/:id — full project detail for teacher review
router.get('/teacher/projects/:id', requireStudioRole('teacher'), async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  const [project] = await db
    .select()
    .from(studioProjectsTable)
    .where(eq(studioProjectsTable.id, id));

  if (!project) { res.status(404).json({ error: 'Project not found' }); return; }

  // Mark as "Teacher Reviewing" when opened
  if (project.status === 'Ready for Teacher Review') {
    await db
      .update(studioProjectsTable)
      .set({ status: 'Teacher Reviewing', updatedAt: new Date() })
      .where(eq(studioProjectsTable.id, id));
    project.status = 'Teacher Reviewing';
  }

  const [student] = project.assignedStudentId
    ? await db
        .select({ displayName: studioProfilesTable.displayName, email: studioProfilesTable.email })
        .from(studioProfilesTable)
        .where(eq(studioProfilesTable.userId, project.assignedStudentId))
    : [];

  const safetyFlags = await db
    // The development database predates the optional resolution columns.
    // Select only columns present in both schema versions so opening a project
    // does not fail before the teacher review page can render.
    .select({
      id: studioSafetyFlagsTable.id,
      projectId: studioSafetyFlagsTable.projectId,
      flagReason: studioSafetyFlagsTable.flagReason,
      createdAt: studioSafetyFlagsTable.createdAt,
    })
    .from(studioSafetyFlagsTable)
    .where(eq(studioSafetyFlagsTable.projectId, id));

  const peerReviews = await db
    .select()
    .from(studioPeerReviewsTable)
    .where(eq(studioPeerReviewsTable.projectId, id));

  const sources = await db
    .select()
    .from(studioSourcesTable)
    .where(eq(studioSourcesTable.projectId, id));

  const teacherReviews = await db
    .select()
    .from(studioTeacherReviewsTable)
    .where(eq(studioTeacherReviewsTable.projectId, id))
    .orderBy(desc(studioTeacherReviewsTable.reviewedAt));

  res.json({
    project,
    student: student ?? null,
    safetyFlags,
    peerReviews,
    sources,
    teacherReviews,
  });
});

// POST /api/teacher/projects/:id/decision — approve, publish, return, etc.
router.post(
  '/teacher/projects/:id/decision',
  requireStudioRole('teacher'),
  async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const {
      decision,
      feedback,
      destinationSection,
      authorDisplay,
    } = req.body as {
      decision?: string;
      feedback?: string;
      destinationSection?: string;
      authorDisplay?: string;
    };

    const validDecisions = ['approve', 'approve_and_publish', 'return_for_revision', 'save_for_later', 'archive'];
    if (!decision || !validDecisions.includes(decision)) {
      res.status(400).json({ error: `decision must be one of: ${validDecisions.join(', ')}` });
      return;
    }

    const [project] = await db
      .select()
      .from(studioProjectsTable)
      .where(eq(studioProjectsTable.id, id));

    if (!project) { res.status(404).json({ error: 'Project not found' }); return; }

    const teacherId = await getTeacherReviewAuthorId(req.studioUser!.id);

    // Record the teacher review.
    await db.insert(studioTeacherReviewsTable).values({
      projectId: id,
      teacherId,
      decision: decision as 'approve' | 'approve_and_publish' | 'return_for_revision' | 'save_for_later' | 'archive',
      feedback: feedback ?? null,
    });

    // Update project status
    const statusMap: Record<string, string> = {
      approve: 'Approved',
      approve_and_publish: 'Published',
      return_for_revision: 'Revision Needed',
      save_for_later: 'Teacher Reviewing',
      archive: 'Archived',
    };

    const newStatus = statusMap[decision]!;
    const statusUpdates: Partial<typeof studioProjectsTable.$inferInsert> = {
      status: newStatus as typeof project.status,
      updatedAt: new Date(),
    };
    if (decision === 'approve_and_publish') {
      statusUpdates.publishedAt = new Date();
    }

    await db
      .update(studioProjectsTable)
      .set(statusUpdates)
      .where(eq(studioProjectsTable.id, id));

    // Create publication record if publishing
    if (decision === 'approve_and_publish') {
      if (!destinationSection) {
        res.status(400).json({ error: 'destinationSection is required when publishing' });
        return;
      }
      await db
        .insert(studioPublicationsTable)
        .values({
          projectId: id,
          destinationSection,
          authorDisplay: authorDisplay ?? 'Mind Matters Student Team',
          publicationStatus: 'active',
        })
        .onConflictDoUpdate({
          target: studioPublicationsTable.projectId,
          set: {
            destinationSection,
            authorDisplay: authorDisplay ?? 'Mind Matters Student Team',
            publicationStatus: 'active',
            publishedAt: new Date(),
          },
        });
    }

    res.json({ success: true, newStatus });
  },
);

// POST /api/teacher/projects/:id/assign-reviewer — assign peer reviewer
router.post(
  '/teacher/projects/:id/assign-reviewer',
  requireStudioRole('teacher'),
  async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    // reviewerId is now a Google user ID string
    const { reviewerId } = req.body as { reviewerId?: string };

    if (!reviewerId) {
      res.status(400).json({ error: 'reviewerId is required' });
      return;
    }

    const [project] = await db.transaction(async (tx) => {
      // Coordinate reassignment with peer-review submission so the reviewer
      // identity and project status change together in a defined order.
      await tx.execute(sql`SELECT pg_advisory_xact_lock(${id})`);

      return tx
        .update(studioProjectsTable)
        .set({
          peerReviewerId: reviewerId,
          peerReviewerJobId: null,
          status: 'Peer Review',
          updatedAt: new Date(),
        })
        .where(eq(studioProjectsTable.id, id))
        .returning({ id: studioProjectsTable.id });
    });

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    res.json({ success: true });
  },
);

export default router;
