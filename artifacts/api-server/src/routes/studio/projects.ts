import { db } from '@workspace/db';
import {
  studioProjectsTable,
  studioProjectContributorsTable,
  studioSafetyFlagsTable,
  studioTeamsTable,
  studioClassCyclesTable,
  studioProfilesTable,
  studioTeacherReviewsTable,
} from '@workspace/db/schema';
import { eq, and, desc, or } from 'drizzle-orm';
import { Router, type Request, type Response } from 'express';
import { requireStudioRole } from '../../middlewares/studioAuthMiddleware';
import { checkContent } from '../../lib/safetyCheck';
import nodemailer from 'nodemailer';
import { logger } from '../../lib/logger';

const router = Router();

/** True if the loaded project is owned by (or accessible to) this session. */
function isProjectOwner(
  project: { jobId?: number | null; assignedStudentId?: string | null; peerReviewerId?: string | null },
  user: { role: string; jobId?: number | null; id: string },
): boolean {
  if (user.role === 'teacher') return true;
  if (user.jobId != null && project.jobId === user.jobId) return true;
  return false;
}

/** True when the session is the project's assigned peer reviewer. Read-only project access uses this separately from ownership. */
function isAssignedPeerReviewer(
  project: { peerReviewerId?: string | null; peerReviewerJobId?: number | null },
  user: { jobId?: number | null; id: string },
): boolean {
  return project.peerReviewerId === user.id ||
    (user.jobId != null && project.peerReviewerJobId === user.jobId);
}

async function sendReadyForReviewEmail(
  projectTitle: string,
  studentDisplayName: string,
  teacherEmails: string[],
): Promise<void> {
  const smtpHost = process.env.SMTP_HOST;
  if (!smtpHost || teacherEmails.length === 0) return;

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: teacherEmails.join(', '),
    subject: `📬 New Submission Ready for Review — ${projectTitle}`,
    text: [
      `A student has submitted a project for your review.`,
      ``,
      `Project: ${projectTitle}`,
      `Student: ${studentDisplayName}`,
      ``,
      `Please log in to the Mind Matters Command Center to review and provide feedback.`,
    ].join('\n'),
    html: `
      <h2 style="color:#4a4a8a">📬 New Submission Ready for Review</h2>
      <p>A student has submitted a project for your review.</p>
      <table style="border-collapse:collapse;margin:16px 0">
        <tr>
          <td style="padding:6px 12px 6px 0;font-weight:bold;color:#555">Project</td>
          <td style="padding:6px 0">${projectTitle}</td>
        </tr>
        <tr>
          <td style="padding:6px 12px 6px 0;font-weight:bold;color:#555">Student</td>
          <td style="padding:6px 0">${studentDisplayName}</td>
        </tr>
      </table>
      <p>Please log in to the <strong>Mind Matters Command Center</strong> to review and provide feedback.</p>
    `,
  });
}

const WORKFLOW_TRANSITIONS: Record<string, string[]> = {
  'Assigned':                  ['Researching'],
  'Researching':               ['Drafting'],
  'Drafting':                  ['Peer Review'],
  'Peer Review':               [],            // advanced by peer reviewer
  'Revision Needed':           ['Drafting'],
  'Ready for Teacher Review':  [],            // advanced by teacher
  'Teacher Reviewing':         [],            // advanced by teacher
  'Approved':                  [],
  'Published':                 [],
  'Archived':                  [],
};

// GET /api/studio/projects — student's own projects (teachers use /api/teacher/projects)
router.get(
  '/studio/projects',
  requireStudioRole('student'),
  async (req: Request, res: Response) => {
    const { status } = req.query as { status?: string };

    let query = db
      .select({
        id: studioProjectsTable.id,
        title: studioProjectsTable.title,
        contentType: studioProjectsTable.contentType,
        status: studioProjectsTable.status,
        notes: studioProjectsTable.notes,
        teamId: studioProjectsTable.teamId,
        teamName: studioTeamsTable.name,
        cycleId: studioProjectsTable.currentCycleId,
        cycleName: studioClassCyclesTable.name,
        createdAt: studioProjectsTable.createdAt,
        updatedAt: studioProjectsTable.updatedAt,
        publishedAt: studioProjectsTable.publishedAt,
        peerReviewerId: studioProjectsTable.peerReviewerId,
      })
      .from(studioProjectsTable)
      .leftJoin(studioTeamsTable, eq(studioProjectsTable.teamId, studioTeamsTable.id))
      .leftJoin(studioClassCyclesTable, eq(studioProjectsTable.currentCycleId, studioClassCyclesTable.id))
      .where(
        req.studioUser!.jobId != null
          ? eq(studioProjectsTable.jobId, req.studioUser!.jobId)
          : eq(studioProjectsTable.assignedStudentId, req.studioUser!.id),
      )
      .orderBy(desc(studioProjectsTable.updatedAt));

    const projects = await query;

    const filtered = status
      ? projects.filter((p) => p.status === status)
      : projects;

    res.json({ projects: filtered });
  },
);

// GET /api/studio/projects/:id — full project detail
router.get(
  '/studio/projects/:id',
  requireStudioRole('student', 'teacher'),
  async (req: Request, res: Response) => {
    const id = Number(req.params.id);

    const [project] = await db
      .select()
      .from(studioProjectsTable)
      .where(eq(studioProjectsTable.id, id));

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    // Authors can manage their own projects. Assigned peer reviewers may read
    // project details to complete their checklist, but remain unable to edit,
    // delete, or transition the author's project.
    if (
      req.studioUser!.role === 'student' &&
      !isProjectOwner(project, req.studioUser!) &&
      !isAssignedPeerReviewer(project, req.studioUser!)
    ) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    res.json({ project });
  },
);

// POST /api/studio/projects — create a new project
router.post(
  '/studio/projects',
  requireStudioRole('student', 'teacher'),
  async (req: Request, res: Response) => {
    const { title, contentType, teamId, cycleId } = req.body as {
      title?: string;
      contentType?: string;
      teamId?: number;
      cycleId?: number;
    };

    if (!title?.trim() || !contentType?.trim()) {
      res.status(400).json({ error: 'Title and content type are required' });
      return;
    }

    const isJobSession = req.studioUser!.jobId != null;

    const [project] = await db
      .insert(studioProjectsTable)
      .values({
        title: title.trim(),
        contentType,
        status: 'Assigned',
        // Job-group sessions: track ownership via jobId, not assignedStudentId
        ...(isJobSession
          ? { jobId: req.studioUser!.jobId }
          : { assignedStudentId: req.studioUser!.id }),
        teamId: teamId ?? req.studioUser!.teamId ?? null,
        originalCycleId: cycleId ?? req.studioUser!.cycleId ?? null,
        currentCycleId: cycleId ?? req.studioUser!.cycleId ?? null,
      })
      .returning();

    // Record contributor only for individual (non-job) sessions
    if (!isJobSession) {
      await db.insert(studioProjectContributorsTable).values({
        projectId: project.id,
        studentId: req.studioUser!.id,
        contributionType: 'author',
        cycleId: project.currentCycleId,
      });
    }

    res.status(201).json({ project });
  },
);

// PATCH /api/studio/projects/:id — update title, content, or notes
router.patch(
  '/studio/projects/:id',
  requireStudioRole('student', 'teacher'),
  async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const { title, content, notes } = req.body as {
      title?: string;
      content?: string;
      notes?: string;
    };

    const [existing] = await db
      .select()
      .from(studioProjectsTable)
      .where(eq(studioProjectsTable.id, id));

    if (!existing) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    if (req.studioUser!.role === 'student' && !isProjectOwner(existing, req.studioUser!)) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Safety check on content
    const combinedText = [title, content, notes].filter(Boolean).join(' ');
    const safety = checkContent(combinedText);
    if (safety.flagged) {
      // Create safety flag silently — student does NOT see this
      await db.insert(studioSafetyFlagsTable).values({
        projectId: id,
        flagReason: safety.reasons.join('; '),
        teacherAttentionRecommended: true,
      }).onConflictDoNothing();
    }

    const updates: Partial<typeof studioProjectsTable.$inferInsert> = {
      updatedAt: new Date(),
      contentFlagged: safety.flagged || existing.contentFlagged,
    };
    if (title !== undefined) updates.title = title.trim();
    if (content !== undefined) updates.content = content;
    if (notes !== undefined) updates.notes = notes;

    const [updated] = await db
      .update(studioProjectsTable)
      .set(updates)
      .where(eq(studioProjectsTable.id, id))
      .returning();

    res.json({ project: updated });
  },
);

// DELETE /api/studio/projects/:id — soft-delete by archiving (students only on own projects)
router.delete(
  '/studio/projects/:id',
  requireStudioRole('student', 'teacher'),
  async (req: Request, res: Response) => {
    const id = Number(req.params.id);

    const [project] = await db
      .select()
      .from(studioProjectsTable)
      .where(eq(studioProjectsTable.id, id));

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    if (req.studioUser!.role === 'student' && !isProjectOwner(project, req.studioUser!)) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Students may only delete projects in early stages
    if (
      req.studioUser!.role === 'student' &&
      !['Assigned', 'Researching', 'Drafting'].includes(project.status)
    ) {
      res.status(400).json({
        error: 'Projects in this status can only be deleted by a teacher',
      });
      return;
    }

    await db
      .update(studioProjectsTable)
      .set({ status: 'Archived', updatedAt: new Date() })
      .where(eq(studioProjectsTable.id, id));

    res.json({ success: true });
  },
);

// POST /api/studio/projects/:id/transition — advance workflow status
router.post(
  '/studio/projects/:id/transition',
  requireStudioRole('student'),
  async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const { toStatus } = req.body as { toStatus?: string };

    const [project] = await db
      .select()
      .from(studioProjectsTable)
      .where(
        and(
          eq(studioProjectsTable.id, id),
          req.studioUser!.jobId != null
            ? eq(studioProjectsTable.jobId, req.studioUser!.jobId)
            : eq(studioProjectsTable.assignedStudentId, req.studioUser!.id),
        ),
      );

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const allowed = WORKFLOW_TRANSITIONS[project.status] ?? [];
    if (!toStatus || !allowed.includes(toStatus)) {
      res.status(400).json({
        error: `Cannot transition from "${project.status}" to "${toStatus}". Allowed: ${allowed.join(', ') || 'none'}`,
      });
      return;
    }

    const EDITORS_DESIGNERS_JOB_ID = 269; // Editors and Designers job group

    const [updated] = await db
      .update(studioProjectsTable)
      .set({
        status: toStatus as typeof project.status,
        updatedAt: new Date(),
        // Auto-assign E&D as peer reviewer when entering Peer Review stage
        ...(toStatus === 'Peer Review' && {
          peerReviewerId: null,
          peerReviewerJobId: EDITORS_DESIGNERS_JOB_ID,
        }),
      })
      .where(eq(studioProjectsTable.id, id))
      .returning();

    // Notify teachers when a student submits for review
    if (toStatus === 'Ready for Teacher Review') {
      (async () => {
        try {
          // Fetch all active teacher emails
          const teachers = await db
            .select({ email: studioProfilesTable.email })
            .from(studioProfilesTable)
            .where(eq(studioProfilesTable.role, 'teacher'));

          const teacherEmails = teachers.map((t) => t.email).filter(Boolean);

          const studentName = req.studioUser!.displayName ?? 'A student';

          await sendReadyForReviewEmail(project.title, studentName, teacherEmails);
        } catch (err) {
          logger.error({ err }, 'Failed to send ready-for-review email');
        }
      })();
    }

    res.json({ project: updated });
  },
);

// GET /api/studio/projects/:id/teacher-feedback — latest teacher review (student-accessible)
router.get(
  '/studio/projects/:id/teacher-feedback',
  requireStudioRole('student', 'teacher'),
  async (req: Request, res: Response) => {
    const id = Number(req.params.id);

    const [project] = await db
      .select()
      .from(studioProjectsTable)
      .where(eq(studioProjectsTable.id, id));

    if (!project) {
      res.status(404).json({ error: 'Not found' });
      return;
    }

    if (req.studioUser!.role === 'student' && !isProjectOwner(project, req.studioUser!)) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const [review] = await db
      .select()
      .from(studioTeacherReviewsTable)
      .where(eq(studioTeacherReviewsTable.projectId, id))
      .orderBy(desc(studioTeacherReviewsTable.reviewedAt))
      .limit(1);

    res.json({ review: review ?? null });
  },
);

export default router;
