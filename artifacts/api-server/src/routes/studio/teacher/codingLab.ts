/**
 * Coding Lab, teacher side.
 *
 *   GET    /teacher/coding-lab/lessons                 all lessons (published or not) with completion counts
 *   GET    /teacher/coding-lab/lessons/:id             one lesson with its steps
 *   POST   /teacher/coding-lab/lessons                 { title, slug?, emoji?, summary?, steps, published?, sortOrder? }
 *   PATCH  /teacher/coding-lab/lessons/:id
 *   DELETE /teacher/coding-lab/lessons/:id
 *   POST   /teacher/coding-lab/lessons/restore-starters
 *   GET    /teacher/coding-lab/progress                students x lessons, recent pages, recent AI runs
 *   GET    /teacher/coding-lab/settings
 *   PATCH  /teacher/coding-lab/settings                { aiPlayground?, aiDailyLimit? }
 */
import { db } from '@workspace/db';
import {
  codingLabAiRunsTable, codingLabBuildsTable, codingLabLessonsTable, codingLabProgressTable, studioProjectsTable,
} from '@workspace/db/schema';
import { asc, desc, eq, sql } from 'drizzle-orm';
import { Router, type Request, type Response } from 'express';
import { requireStudioRole } from '../../../middlewares/studioAuthMiddleware';
import { CODING_LAB_MODEL, getAiSettings, isAiHelperConfigured, setAiSettings } from '../../../lib/codingLab/ai';
import { ensureStarterLessons, lessonFull, lessonSummary, restoreStarterLessons, validateLesson, type LessonInput } from '../../../lib/codingLab/lessons';

const router = Router();
const teacher = requireStudioRole('teacher');

function lessonId(req: Request, res: Response): number | null {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) { res.status(404).json({ error: 'Lesson not found' }); return null; }
  return id;
}

router.get('/teacher/coding-lab/lessons', teacher, async (_req, res) => {
  await ensureStarterLessons();
  const lessons = await db.select().from(codingLabLessonsTable)
    .orderBy(asc(codingLabLessonsTable.sortOrder), asc(codingLabLessonsTable.title));
  const counts = await db.select({
    lessonId: codingLabProgressTable.lessonId,
    started: sql<number>`count(*)::int`,
    completed: sql<number>`count(${codingLabProgressTable.completedAt})::int`,
  }).from(codingLabProgressTable).groupBy(codingLabProgressTable.lessonId);
  const byLesson = new Map(counts.map((c) => [c.lessonId, c]));
  res.json({
    lessons: lessons.map((l) => ({
      ...lessonSummary(l),
      started: byLesson.get(l.id)?.started ?? 0,
      completed: byLesson.get(l.id)?.completed ?? 0,
    })),
  });
});

router.post('/teacher/coding-lab/lessons/restore-starters', teacher, async (req, res) => {
  const added = await restoreStarterLessons(req.studioUser!.id);
  res.json({ added });
});

router.get('/teacher/coding-lab/lessons/:id', teacher, async (req, res) => {
  const id = lessonId(req, res);
  if (id == null) return;
  const [lesson] = await db.select().from(codingLabLessonsTable).where(eq(codingLabLessonsTable.id, id));
  if (!lesson) { res.status(404).json({ error: 'Lesson not found' }); return; }
  res.json({ lesson: lessonFull(lesson) });
});

router.post('/teacher/coding-lab/lessons', teacher, async (req, res) => {
  const body = (req.body ?? {}) as LessonInput;
  const parsed = validateLesson({ ...body, slug: body.slug ?? body.title }, false);
  if ('error' in parsed) { res.status(400).json({ error: parsed.error }); return; }
  const values = parsed.value as typeof codingLabLessonsTable.$inferInsert;
  const [clash] = await db.select({ id: codingLabLessonsTable.id }).from(codingLabLessonsTable).where(eq(codingLabLessonsTable.slug, values.slug));
  if (clash) { res.status(409).json({ error: `A lesson with the address "${values.slug}" already exists. Choose another slug.` }); return; }
  const [lesson] = await db.insert(codingLabLessonsTable).values({ ...values, createdBy: req.studioUser!.id }).returning();
  res.status(201).json({ lesson: lessonFull(lesson!) });
});

router.patch('/teacher/coding-lab/lessons/:id', teacher, async (req, res) => {
  const id = lessonId(req, res);
  if (id == null) return;
  const parsed = validateLesson((req.body ?? {}) as LessonInput, true);
  if ('error' in parsed) { res.status(400).json({ error: parsed.error }); return; }
  if (Object.keys(parsed.value).length === 0) { res.status(400).json({ error: 'Nothing to change.' }); return; }
  if (parsed.value.slug) {
    const [clash] = await db.select({ id: codingLabLessonsTable.id }).from(codingLabLessonsTable).where(eq(codingLabLessonsTable.slug, parsed.value.slug));
    if (clash && clash.id !== id) { res.status(409).json({ error: `A lesson with the address "${parsed.value.slug}" already exists.` }); return; }
  }
  const [lesson] = await db.update(codingLabLessonsTable).set({ ...parsed.value, updatedAt: new Date() })
    .where(eq(codingLabLessonsTable.id, id)).returning();
  if (!lesson) { res.status(404).json({ error: 'Lesson not found' }); return; }
  res.json({ lesson: lessonFull(lesson) });
});

router.delete('/teacher/coding-lab/lessons/:id', teacher, async (req, res) => {
  const id = lessonId(req, res);
  if (id == null) return;
  const deleted = await db.delete(codingLabLessonsTable).where(eq(codingLabLessonsTable.id, id)).returning({ id: codingLabLessonsTable.id });
  if (deleted.length === 0) { res.status(404).json({ error: 'Lesson not found' }); return; }
  res.json({ success: true });
});

router.get('/teacher/coding-lab/progress', teacher, async (_req, res) => {
  const lessons = await db.select({ id: codingLabLessonsTable.id, title: codingLabLessonsTable.title, emoji: codingLabLessonsTable.emoji, stepCount: sql<number>`jsonb_array_length(${codingLabLessonsTable.steps})::int` })
    .from(codingLabLessonsTable).orderBy(asc(codingLabLessonsTable.sortOrder), asc(codingLabLessonsTable.title));
  const progress = await db.select().from(codingLabProgressTable).orderBy(desc(codingLabProgressTable.updatedAt));
  const builds = await db.select({
    id: codingLabBuildsTable.id, studentId: codingLabBuildsTable.studentId, studentName: codingLabBuildsTable.studentName,
    lessonId: codingLabBuildsTable.lessonId, title: codingLabBuildsTable.title, projectId: codingLabBuildsTable.projectId,
    blockCount: sql<number>`jsonb_array_length(${codingLabBuildsTable.blocks})::int`, updatedAt: codingLabBuildsTable.updatedAt,
    projectStatus: studioProjectsTable.status,
  }).from(codingLabBuildsTable)
    .leftJoin(studioProjectsTable, eq(codingLabBuildsTable.projectId, studioProjectsTable.id))
    .orderBy(desc(codingLabBuildsTable.updatedAt)).limit(100);
  const aiRuns = await db.select().from(codingLabAiRunsTable).orderBy(desc(codingLabAiRunsTable.createdAt)).limit(100);

  const students = new Map<string, { studentId: string; studentName: string | null; lessons: Record<number, { completedSteps: number; completed: boolean; updatedAt: string }> }>();
  for (const p of progress) {
    const row = students.get(p.studentId) ?? { studentId: p.studentId, studentName: p.studentName, lessons: {} };
    row.studentName ??= p.studentName;
    row.lessons[p.lessonId] = { completedSteps: p.completedSteps.length, completed: p.completedAt != null, updatedAt: p.updatedAt.toISOString() };
    students.set(p.studentId, row);
  }
  res.json({
    lessons,
    students: [...students.values()].sort((a, b) => (a.studentName ?? '').localeCompare(b.studentName ?? '')),
    builds: builds.map((b) => ({ ...b, updatedAt: b.updatedAt.toISOString() })),
    aiRuns: aiRuns.map((r) => ({
      id: r.id, studentId: r.studentId, studentName: r.studentName, lessonId: r.lessonId, prompt: r.prompt, response: r.response,
      model: r.model, createdAt: r.createdAt.toISOString(),
    })),
  });
});

router.get('/teacher/coding-lab/settings', teacher, async (_req, res) => {
  res.json({ ...(await getAiSettings()), aiConfigured: isAiHelperConfigured(), model: CODING_LAB_MODEL });
});

router.patch('/teacher/coding-lab/settings', teacher, async (req, res) => {
  const { aiPlayground, aiDailyLimit } = (req.body ?? {}) as { aiPlayground?: unknown; aiDailyLimit?: unknown };
  const patch: { aiPlayground?: boolean; aiDailyLimit?: number } = {};
  if (aiPlayground !== undefined) {
    if (typeof aiPlayground !== 'boolean') { res.status(400).json({ error: 'aiPlayground must be true or false.' }); return; }
    patch.aiPlayground = aiPlayground;
  }
  if (aiDailyLimit !== undefined) {
    if (!Number.isInteger(aiDailyLimit) || (aiDailyLimit as number) < 0 || (aiDailyLimit as number) > 200) { res.status(400).json({ error: 'aiDailyLimit must be a whole number from 0 to 200.' }); return; }
    patch.aiDailyLimit = aiDailyLimit as number;
  }
  if (Object.keys(patch).length === 0) { res.status(400).json({ error: 'Nothing to change.' }); return; }
  res.json({ ...(await setAiSettings(patch)), aiConfigured: isAiHelperConfigured(), model: CODING_LAB_MODEL });
});

export default router;
