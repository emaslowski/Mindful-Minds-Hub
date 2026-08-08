import { db } from '@workspace/db';
import {
  studioTeamsTable,
  studioJobsTable,
} from '@workspace/db/schema';
import { eq } from 'drizzle-orm';
import { Router, type Request, type Response } from 'express';
import { requireStudioRole } from '../../../middlewares/studioAuthMiddleware';

const router = Router();

// ── Teams ──────────────────────────────────────────────────────────────────

router.get('/teacher/teams', requireStudioRole('teacher'), async (_req, res) => {
  const teams = await db.select().from(studioTeamsTable).orderBy(studioTeamsTable.name);
  res.json({ teams });
});

// Also expose for students (needed to show team names in their dashboard)
router.get('/studio/teams', requireStudioRole('student', 'teacher'), async (_req, res) => {
  const teams = await db.select().from(studioTeamsTable).orderBy(studioTeamsTable.name);
  res.json({ teams });
});

router.post('/teacher/teams', requireStudioRole('teacher'), async (req: Request, res: Response) => {
  const { name, description } = req.body as { name?: string; description?: string };
  if (!name?.trim()) {
    res.status(400).json({ error: 'Team name is required' });
    return;
  }
  const [team] = await db
    .insert(studioTeamsTable)
    .values({ name: name.trim(), description: description ?? null })
    .returning();
  res.status(201).json({ team });
});

router.patch('/teacher/teams/:id', requireStudioRole('teacher'), async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { name, description } = req.body as { name?: string; description?: string };
  const [team] = await db
    .update(studioTeamsTable)
    .set({ ...(name ? { name: name.trim() } : {}), ...(description !== undefined ? { description } : {}) })
    .where(eq(studioTeamsTable.id, id))
    .returning();
  if (!team) { res.status(404).json({ error: 'Team not found' }); return; }
  res.json({ team });
});

router.delete('/teacher/teams/:id', requireStudioRole('teacher'), async (req: Request, res: Response) => {
  await db.delete(studioTeamsTable).where(eq(studioTeamsTable.id, Number(req.params.id)));
  res.json({ success: true });
});

// ── Jobs ───────────────────────────────────────────────────────────────────

router.get('/teacher/jobs', requireStudioRole('teacher'), async (_req, res) => {
  const jobs = await db.select().from(studioJobsTable).orderBy(studioJobsTable.title);
  res.json({ jobs });
});

// Also expose for students
router.get('/studio/jobs', requireStudioRole('student', 'teacher'), async (_req, res) => {
  const jobs = await db.select().from(studioJobsTable).orderBy(studioJobsTable.title);
  res.json({ jobs });
});

router.post('/teacher/jobs', requireStudioRole('teacher'), async (req: Request, res: Response) => {
  const { title, description } = req.body as { title?: string; description?: string };
  if (!title?.trim()) {
    res.status(400).json({ error: 'Job title is required' });
    return;
  }
  const [job] = await db
    .insert(studioJobsTable)
    .values({ title: title.trim(), description: description ?? null })
    .returning();
  res.status(201).json({ job });
});

router.patch('/teacher/jobs/:id', requireStudioRole('teacher'), async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { title, description } = req.body as { title?: string; description?: string };
  const [job] = await db
    .update(studioJobsTable)
    .set({ ...(title ? { title: title.trim() } : {}), ...(description !== undefined ? { description } : {}) })
    .where(eq(studioJobsTable.id, id))
    .returning();
  if (!job) { res.status(404).json({ error: 'Job not found' }); return; }
  res.json({ job });
});

router.delete('/teacher/jobs/:id', requireStudioRole('teacher'), async (req: Request, res: Response) => {
  await db.delete(studioJobsTable).where(eq(studioJobsTable.id, Number(req.params.id)));
  res.json({ success: true });
});

export default router;
