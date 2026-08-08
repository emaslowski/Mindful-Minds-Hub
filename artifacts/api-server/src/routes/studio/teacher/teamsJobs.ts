import { db } from '@workspace/db';
import {
  studioTeamsTable,
  studioJobsTable,
} from '@workspace/db/schema';
import { eq } from 'drizzle-orm';
import { Router, type Request, type Response } from 'express';
import { requireStudioRole } from '../../../middlewares/studioAuthMiddleware';
import { hashPassword } from '../../../lib/password';

const router = Router();

// ── Teams ──────────────────────────────────────────────────────────────────

router.get('/teacher/teams', requireStudioRole('teacher'), async (_req, res) => {
  const teams = await db.select().from(studioTeamsTable).orderBy(studioTeamsTable.name);
  res.json({ teams });
});

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
    .values({ name: name.trim(), description: description?.trim() || null })
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
  const rows = await db
    .select({
      id: studioJobsTable.id,
      title: studioJobsTable.title,
      description: studioJobsTable.description,
      username: studioJobsTable.username,
      hasPassword: studioJobsTable.passwordHash,
      createdAt: studioJobsTable.createdAt,
    })
    .from(studioJobsTable)
    .orderBy(studioJobsTable.title);
  const jobs = rows.map(({ hasPassword, ...j }) => ({ ...j, hasPassword: !!hasPassword }));
  res.json({ jobs });
});

router.get('/studio/jobs', requireStudioRole('student', 'teacher'), async (_req, res) => {
  const jobs = await db
    .select({
      id: studioJobsTable.id,
      title: studioJobsTable.title,
      description: studioJobsTable.description,
    })
    .from(studioJobsTable)
    .orderBy(studioJobsTable.title);
  res.json({ jobs });
});

router.post('/teacher/jobs', requireStudioRole('teacher'), async (req: Request, res: Response) => {
  const { title, description, username, password } = req.body as {
    title?: string; description?: string; username?: string; password?: string;
  };
  if (!title?.trim()) {
    res.status(400).json({ error: 'Job title is required' });
    return;
  }
  if (username?.trim() && !password?.trim()) {
    res.status(400).json({ error: 'A password is required when setting a username' });
    return;
  }
  const [row] = await db
    .insert(studioJobsTable)
    .values({
      title: title.trim(),
      description: description?.trim() || null,
      username: username?.trim() || null,
      passwordHash: password?.trim() ? hashPassword(password.trim()) : null,
    })
    .returning({
      id: studioJobsTable.id,
      title: studioJobsTable.title,
      description: studioJobsTable.description,
      username: studioJobsTable.username,
      passwordHash: studioJobsTable.passwordHash,
      createdAt: studioJobsTable.createdAt,
    });
  const { passwordHash, ...job } = row;
  res.status(201).json({ job: { ...job, hasPassword: !!passwordHash } });
});

router.patch('/teacher/jobs/:id', requireStudioRole('teacher'), async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { title, description, username, password } = req.body as {
    title?: string; description?: string; username?: string; password?: string;
  };

  const updates: Record<string, unknown> = {};
  if (title) updates.title = title.trim();
  if (description !== undefined) updates.description = description.trim() || null;
  if (username !== undefined) updates.username = username.trim() || null;
  if (password?.trim()) updates.passwordHash = hashPassword(password.trim());

  const [row] = await db
    .update(studioJobsTable)
    .set(updates)
    .where(eq(studioJobsTable.id, id))
    .returning({
      id: studioJobsTable.id,
      title: studioJobsTable.title,
      description: studioJobsTable.description,
      username: studioJobsTable.username,
      passwordHash: studioJobsTable.passwordHash,
      createdAt: studioJobsTable.createdAt,
    });
  if (!row) { res.status(404).json({ error: 'Job not found' }); return; }
  const { passwordHash, ...job } = row;
  res.json({ job: { ...job, hasPassword: !!passwordHash } });
});

router.delete('/teacher/jobs/:id', requireStudioRole('teacher'), async (req: Request, res: Response) => {
  await db.delete(studioJobsTable).where(eq(studioJobsTable.id, Number(req.params.id)));
  res.json({ success: true });
});

export default router;
