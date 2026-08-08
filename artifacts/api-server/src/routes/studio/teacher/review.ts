import { db } from '@workspace/db';
import {
  studioProjectsTable,
  studioTeacherReviewsTable,
  studioPublicationsTable,
  studioAccountsTable,
  studioTeamsTable,
  studioSafetyFlagsTable,
  studioPeerReviewsTable,
  studioSourcesTable,
} from '@workspace/db/schema';
import { eq, desc, inArray } from 'drizzle-orm';
import { Router, type Request, type Response } from 'express';
import { requireStudioRole } from '../../../middlewares/studioAuthMiddleware';

const router = Router();

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
      studentName: studioAccountsTable.displayName,
      teamId: studioProjectsTable.teamId,
      teamName: studioTeamsTable.name,
      createdAt: studioProjectsTable.createdAt,
      updatedAt: studioProjectsTable.updatedAt,
    })
    .from(studioProjectsTable)
    .leftJoin(studioAccountsTable, eq(studioProjectsTable.assignedStudentId, studioAccountsTable.id))
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
      studentName: studioAccountsTable.displayName,
      teamName: studioTeamsTable.name,
      updatedAt: studioProjectsTable.updatedAt,
    })
    .from(studioProjectsTable)
    .leftJoin(studioAccountsTable, eq(studioProjectsTable.assignedStudentId, studioAccountsTable.id))
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

  const [student] = await db
    .select({ displayName: studioAccountsTable.displayName })
    .from(studioAccountsTable)
    .where(eq(studioAccountsTable.id, project.assignedStudentId!));

  const safetyFlags = await db
    .select()
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
    student,
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

    // Record the teacher review
    await db.insert(studioTeacherReviewsTable).values({
      projectId: id,
      teacherId: req.studioUser!.id,
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
    const { reviewerId } = req.body as { reviewerId?: number };

    if (!reviewerId) {
      res.status(400).json({ error: 'reviewerId is required' });
      return;
    }

    await db
      .update(studioProjectsTable)
      .set({ peerReviewerId: reviewerId, status: 'Peer Review', updatedAt: new Date() })
      .where(eq(studioProjectsTable.id, id));

    res.json({ success: true });
  },
);

export default router;
