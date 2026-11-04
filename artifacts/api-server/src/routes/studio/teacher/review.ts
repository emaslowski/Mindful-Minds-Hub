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
  studioJobsTable,
  studioVideoProductionsTable,
  studioPublicationEditsTable,
} from '@workspace/db/schema';
import { eq, desc, inArray, sql } from 'drizzle-orm';
import { Router, type Request, type Response } from 'express';
import { requireStudioRole } from '../../../middlewares/studioAuthMiddleware';
import { originalPublicationEdition, parsePublicationDraft, storePublicationEdition } from '../../../lib/publicationEditions';
import { publicationMediaError } from '../../../lib/publicationMedia';

const router = Router();

/**
 * The current Studio sessions identify the password-based admin with a string,
 * while older Studio databases require a numeric studio_accounts ID for
 * teacher_review records. Resolve that legacy ID when it is available.
 */
async function getTeacherReviewAuthorId(sessionUserId: string): Promise<string> {
  const column = await db.execute<{ data_type: string }>(sql`
    SELECT data_type FROM information_schema.columns
    WHERE table_schema = current_schema() AND table_name = 'studio_teacher_reviews' AND column_name = 'teacher_id'
  `);
  if (column.rows[0]?.data_type !== 'integer') return sessionUserId;

  // Password-based teacher sessions are synthetic. The live legacy accounts
  // table can be completely empty, so looking up an existing teacher is not
  // enough. This disabled, non-login identity is only an audit FK bridge.
  const result = await db.execute<{ id: number }>(sql`
    INSERT INTO studio_accounts (username, password_hash, display_name, role, account_status)
    VALUES ('studio-teacher-review-audit', '!audit-only-no-password-login', 'Teacher Command Center', 'teacher', 'disabled')
    ON CONFLICT (username) DO UPDATE SET username = EXCLUDED.username
    RETURNING id
  `);
  return String(result.rows[0]!.id);
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

  const [edition] = await db.select().from(studioPublicationEditsTable)
    .where(eq(studioPublicationEditsTable.projectId, id));
  const [publication] = await db.select({
    destinationSection: studioPublicationsTable.destinationSection,
    authorDisplay: studioPublicationsTable.authorDisplay,
    publicationStatus: studioPublicationsTable.publicationStatus,
  }).from(studioPublicationsTable).where(eq(studioPublicationsTable.projectId, id));

  res.json({
    project,
    student: student ?? null,
    safetyFlags,
    peerReviews,
    sources,
    teacherReviews,
    publicationDraft: edition?.draft ?? originalPublicationEdition(project),
    publicationDraftVersion: edition?.version ?? 0,
    publication: publication ?? null,
  });
});

router.patch('/teacher/projects/:id/publication-draft', requireStudioRole('teacher'), async (req, res) => {
  const id = Number(req.params.id);
  const input = parsePublicationDraft(req.body);
  if (!Number.isSafeInteger(id) || id <= 0 || !input) {
    res.status(400).json({ error: 'Provide a title, valid appearance settings, and the current draft version.' }); return;
  }
  const result = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(${id})`);
    const [project] = await tx.select({ id: studioProjectsTable.id }).from(studioProjectsTable).where(eq(studioProjectsTable.id, id));
    if (!project) return { error: 'Project not found', code: 404 };
    const mediaError = await publicationMediaError(tx, id, input.draft, false);
    if (mediaError) return { error: mediaError, code: 400 };
    const saved = await storePublicationEdition(tx, id, input.draft, input.version, false);
    return saved ?? { error: 'This website draft was changed in another session. Your edits have not been overwritten. Reload to review the saved version.', code: 409 };
  });
  if ('error' in result) { res.status(result.code).json({ error: result.error }); return; }
  res.json(result);
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
      sendToVideoProducer,
      publicationDraft,
      publicationDraftVersion,
    } = req.body as {
      decision?: string;
      feedback?: string;
      destinationSection?: string;
      authorDisplay?: string;
      sendToVideoProducer?: boolean;
      publicationDraft?: unknown;
      publicationDraftVersion?: unknown;
    };

    const validDecisions = ['approve', 'approve_and_publish', 'return_for_revision', 'save_for_later', 'archive'];
    if (!decision || !validDecisions.includes(decision)) {
      res.status(400).json({ error: `decision must be one of: ${validDecisions.join(', ')}` });
      return;
    }

    if (!Number.isSafeInteger(id) || id <= 0 ||
      (sendToVideoProducer != null && typeof sendToVideoProducer !== 'boolean') ||
      (sendToVideoProducer && decision !== 'approve')) {
      res.status(400).json({ error: 'Video production is an option when approving a project without publishing yet.' }); return;
    }
    if (decision === 'approve_and_publish' && !destinationSection?.trim()) {
      res.status(400).json({ error: 'destinationSection is required when publishing' }); return;
    }
    const editionInput = publicationDraft !== undefined
      ? parsePublicationDraft({ draft: publicationDraft, version: publicationDraftVersion }) : null;
    if (publicationDraft !== undefined && !editionInput) {
      res.status(400).json({ error: 'Website draft settings are invalid. Check the title and formatting before publishing.' }); return;
    }
    const destinations = [
      'blog', 'podcast', 'learn', 'sign-language', 'create', 'calm-corner', 'dance-tutorials', 'focus-study', 'asmr', 'move', 'cooking', 'gardening', 'grow', 'events', 'resources',
      'move-morning-stretch', 'move-soccer-skills', 'move-basketball-drills',
      'move-yoga-for-calm', 'move-stretch-break', 'move-active-challenge',
      'directed-draws', 'cooking-food-reviews',
    ];
    if (decision === 'approve_and_publish' && !destinations.includes(destinationSection!)) {
      res.status(400).json({ error: 'Choose a supported destination page.' }); return;
    }
    const producerJobs = sendToVideoProducer ? await db.select({ id: studioJobsTable.id }).from(studioJobsTable)
      .where(sql`lower(trim(${studioJobsTable.title})) IN ('video producer', 'video producers', 'videographer', 'videographers')`) : [];
    if (sendToVideoProducer && producerJobs.length !== 1) {
      res.status(409).json({ error: 'Please keep one Video Producers job group in Jobs before assigning video production.' }); return;
    }
    const teacherId = await getTeacherReviewAuthorId(req.studioUser!.id);
    const result = await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT pg_advisory_xact_lock(${id})`);
      const [project] = await tx.select().from(studioProjectsTable).where(eq(studioProjectsTable.id, id));
      if (!project) return { error: 'Project not found', code: 404 };
      const [production] = await tx.select().from(studioVideoProductionsTable).where(eq(studioVideoProductionsTable.projectId, id));
      if (sendToVideoProducer && (project.status === 'Published' || project.status === 'Archived')) {
        return { error: 'Only an unpublished, active project can be sent for video production.', code: 409 };
      }
      if (sendToVideoProducer && production?.status === 'assigned' && project.status === 'Approved') {
        return { error: 'This project is already waiting for its video producer.', code: 409 };
      }
      if (decision === 'approve_and_publish' && production?.status === 'assigned') {
        return { error: 'Please wait for the video upload and review it before publishing.', code: 409 };
      }
      if (decision === 'approve_and_publish') {
        const [existingEdition] = await tx.select().from(studioPublicationEditsTable)
          .where(eq(studioPublicationEditsTable.projectId, id));
        const draft = editionInput?.draft ?? existingEdition?.draft ?? originalPublicationEdition(project);
        const mediaError = await publicationMediaError(tx, id, draft, true);
        if (mediaError) return { error: mediaError, code: 400 };
        const saved = await storePublicationEdition(
          tx, id, draft,
          editionInput?.version ?? existingEdition?.version ?? 0, true,
        );
        if (!saved) return { error: 'This website draft was changed in another session. Reload before publishing so you do not overwrite another teacher’s edits.', code: 409 };
      }
      await tx.insert(studioTeacherReviewsTable).values({
        projectId: id, teacherId,
        decision: decision as 'approve' | 'approve_and_publish' | 'return_for_revision' | 'save_for_later' | 'archive',
        feedback: feedback ?? null,
      });
      const statusMap: Record<string, typeof project.status> = {
        approve: 'Approved', approve_and_publish: 'Published', return_for_revision: 'Revision Needed',
        save_for_later: 'Teacher Reviewing', archive: 'Archived',
      };
      const newStatus = statusMap[decision]!;
      await tx.update(studioProjectsTable).set({
        status: newStatus, updatedAt: new Date(),
        ...(decision === 'approve_and_publish' ? { publishedAt: new Date() } : {}),
      }).where(eq(studioProjectsTable.id, id));
      if (sendToVideoProducer) {
        const assignment = {
          producerJobId: producerJobs[0]!.id, instructions: feedback ?? '', status: 'assigned',
          pendingObjectPath: null, pendingFilename: null, pendingMimeType: null,
          pendingSize: null, pendingExpiresAt: null, updatedAt: new Date(),
        };
        await tx.insert(studioVideoProductionsTable).values({ projectId: id, ...assignment })
          .onConflictDoUpdate({ target: studioVideoProductionsTable.projectId, set: assignment });
      }
      if (decision === 'approve_and_publish') {
        // Explicit shared columns also support older live databases that do not
        // have the optional slug/featured/unpublished_at columns.
        await tx.execute(sql`
          INSERT INTO studio_publications (project_id, destination_section, author_display, publication_status)
          VALUES (${id}, ${destinationSection!}, ${authorDisplay ?? 'The Brightside Project Student Team'}, 'active')
          ON CONFLICT (project_id) DO UPDATE SET
            destination_section = EXCLUDED.destination_section, author_display = EXCLUDED.author_display,
            publication_status = 'active', published_at = now()
        `);
      }
      if (decision === 'archive') {
        await tx.update(studioPublicationsTable).set({ publicationStatus: 'archived' })
          .where(eq(studioPublicationsTable.projectId, id));
      }
      return { newStatus };
    });
    if ('error' in result) { res.status(result.code!).json({ error: result.error }); return; }
    res.json({ success: true, ...result, sentToVideoProducer: !!sendToVideoProducer });
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
