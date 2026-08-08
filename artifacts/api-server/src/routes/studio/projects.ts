import { db } from '@workspace/db';
import {
  studioProjectsTable,
  studioProjectContributorsTable,
  studioSafetyFlagsTable,
  studioTeamsTable,
  studioClassCyclesTable,
} from '@workspace/db/schema';
import { eq, and, desc, or } from 'drizzle-orm';
import { Router, type Request, type Response } from 'express';
import { requireStudioRole } from '../../middlewares/studioAuthMiddleware';
import { checkContent } from '../../lib/safetyCheck';

const router = Router();

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

// GET /api/studio/projects — student's own projects
router.get(
  '/studio/projects',
  requireStudioRole('student', 'teacher'),
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
      .where(eq(studioProjectsTable.assignedStudentId, req.studioUser!.id))
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

    // Students can only view their own projects or ones they are peer-reviewing
    if (
      req.studioUser!.role === 'student' &&
      project.assignedStudentId !== req.studioUser!.id &&
      project.peerReviewerId !== req.studioUser!.id
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

    const [project] = await db
      .insert(studioProjectsTable)
      .values({
        title: title.trim(),
        contentType,
        status: 'Assigned',
        assignedStudentId: req.studioUser!.id,
        teamId: teamId ?? req.studioUser!.teamId ?? null,
        originalCycleId: cycleId ?? req.studioUser!.cycleId ?? null,
        currentCycleId: cycleId ?? req.studioUser!.cycleId ?? null,
      })
      .returning();

    // Record contributor
    await db.insert(studioProjectContributorsTable).values({
      projectId: project.id,
      studentId: req.studioUser!.id,
      contributionType: 'author',
      cycleId: project.currentCycleId,
    });

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

    if (
      req.studioUser!.role === 'student' &&
      existing.assignedStudentId !== req.studioUser!.id
    ) {
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

    if (
      req.studioUser!.role === 'student' &&
      project.assignedStudentId !== req.studioUser!.id
    ) {
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
          eq(studioProjectsTable.assignedStudentId, req.studioUser!.id),
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

    const [updated] = await db
      .update(studioProjectsTable)
      .set({ status: toStatus as typeof project.status, updatedAt: new Date() })
      .where(eq(studioProjectsTable.id, id))
      .returning();

    res.json({ project: updated });
  },
);

export default router;
