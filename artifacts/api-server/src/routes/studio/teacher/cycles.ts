import { db } from '@workspace/db';
import {
  studioClassCyclesTable,
  studioProjectsTable,
  studioAccountsTable,
  studioStudentProfilesTable,
} from '@workspace/db/schema';
import { eq, count, desc } from 'drizzle-orm';
import { Router, type Request, type Response } from 'express';
import { requireStudioRole } from '../../../middlewares/studioAuthMiddleware';

const router = Router();

// GET /api/teacher/cycles
router.get('/teacher/cycles', requireStudioRole('teacher'), async (_req, res) => {
  const cycles = await db
    .select()
    .from(studioClassCyclesTable)
    .orderBy(desc(studioClassCyclesTable.createdAt));
  res.json({ cycles });
});

// Also expose for students
router.get('/studio/cycles', requireStudioRole('student', 'teacher'), async (_req, res) => {
  const cycles = await db
    .select()
    .from(studioClassCyclesTable)
    .orderBy(desc(studioClassCyclesTable.createdAt));
  res.json({ cycles });
});

// POST /api/teacher/cycles
router.post('/teacher/cycles', requireStudioRole('teacher'), async (req: Request, res: Response) => {
  const { name, startDate, endDate, isActive } = req.body as {
    name?: string;
    startDate?: string;
    endDate?: string;
    isActive?: boolean;
  };

  if (!name?.trim()) {
    res.status(400).json({ error: 'Cycle name is required' });
    return;
  }

  // If new cycle is active, deactivate others
  if (isActive) {
    await db
      .update(studioClassCyclesTable)
      .set({ isActive: false })
      .where(eq(studioClassCyclesTable.isActive, true));
  }

  const [cycle] = await db
    .insert(studioClassCyclesTable)
    .values({
      name: name.trim(),
      startDate: startDate ?? null,
      endDate: endDate ?? null,
      isActive: isActive ?? false,
    })
    .returning();

  res.status(201).json({ cycle });
});

// PATCH /api/teacher/cycles/:id
router.patch('/teacher/cycles/:id', requireStudioRole('teacher'), async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { name, startDate, endDate, isActive } = req.body as {
    name?: string;
    startDate?: string;
    endDate?: string;
    isActive?: boolean;
  };

  if (isActive) {
    await db
      .update(studioClassCyclesTable)
      .set({ isActive: false })
      .where(eq(studioClassCyclesTable.isActive, true));
  }

  const updates: Partial<typeof studioClassCyclesTable.$inferInsert> = {};
  if (name?.trim()) updates.name = name.trim();
  if (startDate !== undefined) updates.startDate = startDate;
  if (endDate !== undefined) updates.endDate = endDate;
  if (isActive !== undefined) updates.isActive = isActive;

  const [cycle] = await db
    .update(studioClassCyclesTable)
    .set(updates)
    .where(eq(studioClassCyclesTable.id, id))
    .returning();

  if (!cycle) { res.status(404).json({ error: 'Cycle not found' }); return; }
  res.json({ cycle });
});

export default router;
