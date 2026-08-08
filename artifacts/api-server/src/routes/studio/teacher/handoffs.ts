import { db } from '@workspace/db';
import {
  studioHandoffsTable,
  studioProjectsTable,
  studioClassCyclesTable,
} from '@workspace/db/schema';
import { eq, desc } from 'drizzle-orm';
import { Router, type Request, type Response } from 'express';
import { requireStudioRole } from '../../../middlewares/studioAuthMiddleware';

const router = Router();

// GET /api/teacher/handoffs — all handoffs
router.get('/teacher/handoffs', requireStudioRole('teacher'), async (_req, res) => {
  const handoffs = await db
    .select({
      id: studioHandoffsTable.id,
      projectId: studioHandoffsTable.projectId,
      projectTitle: studioProjectsTable.title,
      contentType: studioProjectsTable.contentType,
      completedWork: studioHandoffsTable.completedWork,
      remainingWork: studioHandoffsTable.remainingWork,
      ideas: studioHandoffsTable.ideas,
      notes: studioHandoffsTable.notes,
      teacherNotes: studioHandoffsTable.teacherNotes,
      isVisible: studioHandoffsTable.isVisible,
      previousCycleName: studioClassCyclesTable.name,
      createdAt: studioHandoffsTable.createdAt,
    })
    .from(studioHandoffsTable)
    .innerJoin(studioProjectsTable, eq(studioHandoffsTable.projectId, studioProjectsTable.id))
    .leftJoin(studioClassCyclesTable, eq(studioHandoffsTable.previousCycleId, studioClassCyclesTable.id))
    .orderBy(desc(studioHandoffsTable.createdAt));

  res.json({ handoffs });
});

// PATCH /api/teacher/handoffs/:id — update visibility, teacher notes, or next cycle
router.patch('/teacher/handoffs/:id', requireStudioRole('teacher'), async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { isVisible, teacherNotes, nextCycleId } = req.body as {
    isVisible?: boolean;
    teacherNotes?: string;
    nextCycleId?: number;
  };

  const updates: Partial<typeof studioHandoffsTable.$inferInsert> = {};
  if (isVisible !== undefined) updates.isVisible = isVisible;
  if (teacherNotes !== undefined) updates.teacherNotes = teacherNotes;
  if (nextCycleId !== undefined) updates.nextCycleId = nextCycleId;

  const [handoff] = await db
    .update(studioHandoffsTable)
    .set(updates)
    .where(eq(studioHandoffsTable.id, id))
    .returning();

  if (!handoff) { res.status(404).json({ error: 'Handoff not found' }); return; }
  res.json({ handoff });
});

// POST /api/teacher/handoffs/:id/assign — assign handoff project to a student
router.post(
  '/teacher/handoffs/:id/assign',
  requireStudioRole('teacher'),
  async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const { studentId, cycleId } = req.body as { studentId?: string; cycleId?: number };

    if (!studentId) {
      res.status(400).json({ error: 'studentId is required' });
      return;
    }

    const [handoff] = await db
      .select()
      .from(studioHandoffsTable)
      .where(eq(studioHandoffsTable.id, id));

    if (!handoff) { res.status(404).json({ error: 'Handoff not found' }); return; }

    // Reassign the project to the new student and update cycle
    await db
      .update(studioProjectsTable)
      .set({
        assignedStudentId: studentId,
        currentCycleId: cycleId ?? handoff.nextCycleId ?? null,
        status: 'Assigned',
        updatedAt: new Date(),
      })
      .where(eq(studioProjectsTable.id, handoff.projectId));

    // Link handoff to next cycle
    if (cycleId) {
      await db
        .update(studioHandoffsTable)
        .set({ nextCycleId: cycleId })
        .where(eq(studioHandoffsTable.id, id));
    }

    res.json({ success: true });
  },
);

export default router;
