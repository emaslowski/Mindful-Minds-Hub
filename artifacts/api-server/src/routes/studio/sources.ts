import { db } from '@workspace/db';
import {
  studioSourcesTable,
  studioProjectsTable,
} from '@workspace/db/schema';
import { eq, and } from 'drizzle-orm';
import { Router, type Request, type Response } from 'express';
import { requireStudioRole } from '../../middlewares/studioAuthMiddleware';

const router = Router();

// GET /api/studio/projects/:id/sources
router.get(
  '/studio/projects/:id/sources',
  requireStudioRole('student', 'teacher'),
  async (req: Request, res: Response) => {
    const projectId = Number(req.params.id);

    const [project] = await db
      .select({ assignedStudentId: studioProjectsTable.assignedStudentId, peerReviewerId: studioProjectsTable.peerReviewerId })
      .from(studioProjectsTable)
      .where(eq(studioProjectsTable.id, projectId));

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    if (
      req.studioUser!.role === 'student' &&
      project.assignedStudentId !== req.studioUser!.id &&
      project.peerReviewerId !== req.studioUser!.id
    ) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const sources = await db
      .select()
      .from(studioSourcesTable)
      .where(eq(studioSourcesTable.projectId, projectId));

    res.json({ sources });
  },
);

// POST /api/studio/projects/:id/sources
router.post(
  '/studio/projects/:id/sources',
  requireStudioRole('student', 'teacher'),
  async (req: Request, res: Response) => {
    const projectId = Number(req.params.id);
    const { title, author, website, url, accessedDate, notes } = req.body as {
      title?: string;
      author?: string;
      website?: string;
      url?: string;
      accessedDate?: string;
      notes?: string;
    };

    if (!title?.trim()) {
      res.status(400).json({ error: 'Source title is required' });
      return;
    }

    const [project] = await db
      .select({ assignedStudentId: studioProjectsTable.assignedStudentId })
      .from(studioProjectsTable)
      .where(eq(studioProjectsTable.id, projectId));

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

    const [source] = await db
      .insert(studioSourcesTable)
      .values({
        projectId,
        title: title.trim(),
        author: author ?? null,
        website: website ?? null,
        url: url ?? null,
        accessedDate: accessedDate ?? null,
        notes: notes ?? null,
      })
      .returning();

    res.status(201).json({ source });
  },
);

// DELETE /api/studio/projects/:id/sources/:sourceId
router.delete(
  '/studio/projects/:id/sources/:sourceId',
  requireStudioRole('student', 'teacher'),
  async (req: Request, res: Response) => {
    const projectId = Number(req.params.id);
    const sourceId = Number(req.params.sourceId);

    const [project] = await db
      .select({ assignedStudentId: studioProjectsTable.assignedStudentId })
      .from(studioProjectsTable)
      .where(eq(studioProjectsTable.id, projectId));

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

    await db
      .delete(studioSourcesTable)
      .where(
        and(
          eq(studioSourcesTable.id, sourceId),
          eq(studioSourcesTable.projectId, projectId),
        ),
      );

    res.json({ success: true });
  },
);

export default router;
