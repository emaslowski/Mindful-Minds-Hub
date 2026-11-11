/**
 * Coding Lab, student side.
 *
 *   GET  /studio/coding-lab                          published lessons with my progress, my builds, AI helper status
 *   GET  /studio/coding-lab/lessons/:slug            one lesson with my progress and my builds for it
 *   POST /studio/coding-lab/lessons/:slug/progress   { stepIndex, quizAnswer? }  marks a step done
 *   POST /studio/coding-lab/builds                   { lessonId?, stepIndex?, title, blocks }
 *   PUT  /studio/coding-lab/builds/:id               { title?, blocks? }
 *   POST /studio/coding-lab/builds/:id/submit        sends the build to the teacher as a Studio project
 *   POST /studio/coding-lab/ai                       { slug, stepIndex, chips: string[] }  AI helper (teacher-enabled)
 */
import { db } from '@workspace/db';
import {
  codingLabBuildsTable, codingLabLessonsTable, codingLabProgressTable,
  studioProjectContributorsTable, studioProjectsTable,
  type CodingLabBuild, type CodingLabProgress,
} from '@workspace/db/schema';
import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import { Router, type Request, type Response } from 'express';
import { requireStudioRole } from '../../middlewares/studioAuthMiddleware';
import { checkContent } from '../../lib/safetyCheck';
import { logger } from '../../lib/logger';
import { AiHelperError, countRunsToday, getAiSettings, isAiHelperConfigured, runAiHelper } from '../../lib/codingLab/ai';
import {
  blocksToProjectContent, buildMeetsStep, ensureStarterLessons, lessonFull, lessonSummary, validateBlocks,
} from '../../lib/codingLab/lessons';

const router = Router();
const lab = requireStudioRole('student', 'teacher');

export const CODING_LAB_CONTENT_TYPE = 'Coding Lab page';

function serializeProgress(p: CodingLabProgress | undefined, stepCount: number) {
  const completedSteps = p?.completedSteps ?? [];
  return {
    completedSteps,
    quizAnswers: p?.quizAnswers ?? {},
    completed: p?.completedAt != null || (stepCount > 0 && completedSteps.length >= stepCount),
    completedAt: p?.completedAt?.toISOString() ?? null,
  };
}

function serializeBuild(b: CodingLabBuild) {
  return {
    id: b.id, lessonId: b.lessonId, stepIndex: b.stepIndex, title: b.title, blocks: b.blocks,
    projectId: b.projectId, createdAt: b.createdAt.toISOString(), updatedAt: b.updatedAt.toISOString(),
  };
}

async function aiStatus(studentId: string) {
  const settings = await getAiSettings();
  const enabled = settings.aiPlayground && isAiHelperConfigured();
  return {
    aiHelper: enabled,
    aiDailyLimit: settings.aiDailyLimit,
    aiUsedToday: enabled ? await countRunsToday(studentId) : 0,
  };
}

router.get('/studio/coding-lab', lab, async (req: Request, res: Response) => {
  await ensureStarterLessons();
  const me = req.studioUser!;
  const lessons = await db.select().from(codingLabLessonsTable)
    .where(eq(codingLabLessonsTable.published, true))
    .orderBy(asc(codingLabLessonsTable.sortOrder), asc(codingLabLessonsTable.title));
  const progress = lessons.length
    ? await db.select().from(codingLabProgressTable)
      .where(and(eq(codingLabProgressTable.studentId, me.id), inArray(codingLabProgressTable.lessonId, lessons.map((l) => l.id))))
    : [];
  const builds = await db.select().from(codingLabBuildsTable)
    .where(eq(codingLabBuildsTable.studentId, me.id)).orderBy(desc(codingLabBuildsTable.updatedAt)).limit(50);
  const byLesson = new Map(progress.map((p) => [p.lessonId, p]));
  res.json({
    lessons: lessons.map((l) => ({ ...lessonSummary(l), progress: serializeProgress(byLesson.get(l.id), l.steps.length) })),
    builds: builds.map(serializeBuild),
    ...(await aiStatus(me.id)),
  });
});

router.get('/studio/coding-lab/lessons/:slug', lab, async (req: Request, res: Response) => {
  const me = req.studioUser!;
  const [lesson] = await db.select().from(codingLabLessonsTable).where(eq(codingLabLessonsTable.slug, String(req.params.slug)));
  if (!lesson || (!lesson.published && me.role !== 'teacher')) { res.status(404).json({ error: 'Lesson not found' }); return; }
  const [progress] = await db.select().from(codingLabProgressTable)
    .where(and(eq(codingLabProgressTable.studentId, me.id), eq(codingLabProgressTable.lessonId, lesson.id)));
  const builds = await db.select().from(codingLabBuildsTable)
    .where(and(eq(codingLabBuildsTable.studentId, me.id), eq(codingLabBuildsTable.lessonId, lesson.id)))
    .orderBy(desc(codingLabBuildsTable.updatedAt));
  res.json({
    lesson: lessonFull(lesson),
    progress: serializeProgress(progress, lesson.steps.length),
    builds: builds.map(serializeBuild),
    ...(await aiStatus(me.id)),
  });
});

router.post('/studio/coding-lab/lessons/:slug/progress', lab, async (req: Request, res: Response) => {
  const me = req.studioUser!;
  const { stepIndex, quizAnswer } = (req.body ?? {}) as { stepIndex?: unknown; quizAnswer?: unknown };
  const [lesson] = await db.select().from(codingLabLessonsTable).where(eq(codingLabLessonsTable.slug, String(req.params.slug)));
  if (!lesson || (!lesson.published && me.role !== 'teacher')) { res.status(404).json({ error: 'Lesson not found' }); return; }
  if (!Number.isInteger(stepIndex) || (stepIndex as number) < 0 || (stepIndex as number) >= lesson.steps.length) {
    res.status(400).json({ error: 'stepIndex is out of range.' }); return;
  }
  const index = stepIndex as number;
  const step = lesson.steps[index];

  // The server decides whether a step counts as done, so a lesson cannot be
  // "finished" by calling the endpoint with the wrong answer.
  let quizRecord: number | null = null;
  if (step.type === 'quiz') {
    if (!Number.isInteger(quizAnswer) || (quizAnswer as number) !== step.answer) {
      res.status(400).json({ error: 'That is not the right answer yet. Try again!' }); return;
    }
    quizRecord = quizAnswer as number;
  } else if (step.type === 'build') {
    const [build] = await db.select().from(codingLabBuildsTable)
      .where(and(eq(codingLabBuildsTable.studentId, me.id), eq(codingLabBuildsTable.lessonId, lesson.id), eq(codingLabBuildsTable.stepIndex, index)))
      .orderBy(desc(codingLabBuildsTable.updatedAt)).limit(1);
    if (!build || !buildMeetsStep(build.blocks, step)) {
      res.status(400).json({ error: 'Your page does not have all the required blocks yet.' }); return;
    }
  }

  const [existing] = await db.select().from(codingLabProgressTable)
    .where(and(eq(codingLabProgressTable.studentId, me.id), eq(codingLabProgressTable.lessonId, lesson.id)));
  const completedSteps = [...new Set([...(existing?.completedSteps ?? []), index])].sort((a, b) => a - b);
  const quizAnswers = { ...(existing?.quizAnswers ?? {}), ...(quizRecord != null ? { [index]: quizRecord } : {}) };
  const done = completedSteps.length >= lesson.steps.length;
  const values = {
    completedSteps, quizAnswers, studentName: me.displayName, updatedAt: new Date(),
    completedAt: done ? (existing?.completedAt ?? new Date()) : null,
  };
  const [saved] = existing
    ? await db.update(codingLabProgressTable).set(values).where(eq(codingLabProgressTable.id, existing.id)).returning()
    : await db.insert(codingLabProgressTable).values({ ...values, studentId: me.id, lessonId: lesson.id }).returning();
  res.json({ progress: serializeProgress(saved, lesson.steps.length) });
});

async function parseBuildBody(body: Record<string, unknown>, partial: boolean) {
  const values: Partial<typeof codingLabBuildsTable.$inferInsert> = {};
  if (body.title !== undefined || !partial) {
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    if (title.length > 120) return { error: 'The title is too long (max 120 characters).' };
    values.title = title || 'My page';
  }
  if (body.blocks !== undefined || !partial) {
    const blocks = validateBlocks(body.blocks ?? []);
    if ('error' in blocks) return blocks;
    values.blocks = blocks.value;
  }
  return { values };
}

router.post('/studio/coding-lab/builds', lab, async (req: Request, res: Response) => {
  const me = req.studioUser!;
  const body = (req.body ?? {}) as Record<string, unknown>;
  const parsed = await parseBuildBody(body, false);
  if ('error' in parsed) { res.status(400).json({ error: parsed.error }); return; }
  let lessonId: number | null = null;
  let stepIndex: number | null = null;
  if (body.lessonId != null) {
    if (!Number.isInteger(body.lessonId)) { res.status(400).json({ error: 'lessonId must be a number.' }); return; }
    const [lesson] = await db.select({ id: codingLabLessonsTable.id, steps: codingLabLessonsTable.steps })
      .from(codingLabLessonsTable).where(eq(codingLabLessonsTable.id, body.lessonId as number));
    if (!lesson) { res.status(404).json({ error: 'Lesson not found' }); return; }
    lessonId = lesson.id;
    if (body.stepIndex != null) {
      if (!Number.isInteger(body.stepIndex) || (body.stepIndex as number) < 0 || (body.stepIndex as number) >= lesson.steps.length) {
        res.status(400).json({ error: 'stepIndex is out of range.' }); return;
      }
      stepIndex = body.stepIndex as number;
    }
  }
  const [build] = await db.insert(codingLabBuildsTable).values({
    ...parsed.values, title: parsed.values.title!, blocks: parsed.values.blocks!,
    studentId: me.id, studentName: me.displayName, lessonId, stepIndex,
  }).returning();
  res.status(201).json({ build: serializeBuild(build!) });
});

async function ownBuild(req: Request, res: Response): Promise<CodingLabBuild | null> {
  const id = Number(req.params.id);
  const [build] = Number.isInteger(id)
    ? await db.select().from(codingLabBuildsTable).where(eq(codingLabBuildsTable.id, id))
    : [];
  if (!build || build.studentId !== req.studioUser!.id) { res.status(404).json({ error: 'Page not found' }); return null; }
  return build;
}

router.put('/studio/coding-lab/builds/:id', lab, async (req: Request, res: Response) => {
  const build = await ownBuild(req, res);
  if (!build) return;
  const parsed = await parseBuildBody((req.body ?? {}) as Record<string, unknown>, true);
  if ('error' in parsed) { res.status(400).json({ error: parsed.error }); return; }
  const [saved] = await db.update(codingLabBuildsTable).set({ ...parsed.values, updatedAt: new Date() })
    .where(eq(codingLabBuildsTable.id, build.id)).returning();
  res.json({ build: serializeBuild(saved!) });
});

router.delete('/studio/coding-lab/builds/:id', lab, async (req: Request, res: Response) => {
  const build = await ownBuild(req, res);
  if (!build) return;
  await db.delete(codingLabBuildsTable).where(eq(codingLabBuildsTable.id, build.id));
  res.json({ success: true });
});

// Sends the page to the teacher as an ordinary Studio project (or refreshes the
// project's content when it was sent before and is still in an early stage).
router.post('/studio/coding-lab/builds/:id/submit', lab, async (req: Request, res: Response) => {
  const me = req.studioUser!;
  const build = await ownBuild(req, res);
  if (!build) return;
  if (build.blocks.length === 0) { res.status(400).json({ error: 'Add some blocks to your page first.' }); return; }
  const content = blocksToProjectContent(build.blocks);
  const title = build.title.trim() || build.blocks.find((b) => b.type === 'heading')?.text?.trim() || 'My Coding Lab page';
  const safety = checkContent(`${title} ${content}`);

  if (build.projectId != null) {
    const [project] = await db.select().from(studioProjectsTable).where(eq(studioProjectsTable.id, build.projectId));
    if (project && ['Assigned', 'Researching', 'Drafting', 'Revision Needed'].includes(project.status)) {
      const [updated] = await db.update(studioProjectsTable)
        .set({ title, content, updatedAt: new Date(), contentFlagged: safety.flagged || project.contentFlagged })
        .where(eq(studioProjectsTable.id, project.id)).returning();
      res.json({ project: { id: updated!.id, title: updated!.title, status: updated!.status }, updated: true });
      return;
    }
    if (project && project.status !== 'Archived') {
      res.status(409).json({ error: `This page was already sent and is now "${project.status}". Make a new page to send another version.` });
      return;
    }
  }

  const isJobSession = me.jobId != null;
  const [project] = await db.insert(studioProjectsTable).values({
    title, contentType: CODING_LAB_CONTENT_TYPE, status: 'Assigned', content,
    notes: 'Built in the Coding Lab.',
    contentFlagged: safety.flagged,
    ...(isJobSession ? { jobId: me.jobId } : { assignedStudentId: me.id }),
    teamId: me.teamId ?? null, originalCycleId: me.cycleId ?? null, currentCycleId: me.cycleId ?? null,
  }).returning();
  if (!isJobSession) {
    await db.insert(studioProjectContributorsTable).values({
      projectId: project!.id, studentId: me.id, contributionType: 'author', cycleId: project!.currentCycleId,
    }).onConflictDoNothing();
  }
  await db.update(codingLabBuildsTable).set({ projectId: project!.id, updatedAt: new Date() }).where(eq(codingLabBuildsTable.id, build.id));
  res.status(201).json({ project: { id: project!.id, title: project!.title, status: project!.status }, updated: false });
});

// The prompt is rebuilt on the server from the lesson's own chips, so a
// student can only send text their teacher wrote.
router.post('/studio/coding-lab/ai', lab, async (req: Request, res: Response) => {
  const me = req.studioUser!;
  const { slug, stepIndex, chips } = (req.body ?? {}) as { slug?: unknown; stepIndex?: unknown; chips?: unknown };
  const [lesson] = typeof slug === 'string'
    ? await db.select().from(codingLabLessonsTable).where(eq(codingLabLessonsTable.slug, slug)) : [];
  if (!lesson) { res.status(404).json({ error: 'Lesson not found' }); return; }
  const step = Number.isInteger(stepIndex) ? lesson.steps[stepIndex as number] : undefined;
  if (!step || step.type !== 'prompt') { res.status(400).json({ error: 'This step has no prompt builder.' }); return; }
  if (!step.allowAi) { res.status(403).json({ error: 'This step does not use the AI helper.' }); return; }
  if (!Array.isArray(chips) || chips.length === 0 || chips.length > 12) { res.status(400).json({ error: 'Pick some chips first.' }); return; }
  const allowed = new Set(step.groups.flatMap((g) => g.chips));
  if (chips.some((c) => typeof c !== 'string' || !allowed.has(c))) { res.status(400).json({ error: 'Only the chips in this step can be used.' }); return; }
  const prompt = (chips as string[]).join(' ');
  try {
    const result = await runAiHelper({ studentId: me.id, studentName: me.displayName, lessonId: lesson.id, prompt });
    res.json({ prompt, ...result });
  } catch (err) {
    if (err instanceof AiHelperError) { res.status(err.status).json({ error: err.message }); return; }
    logger.error({ err }, 'Coding Lab AI helper failed');
    res.status(502).json({ error: 'The AI helper did not answer. Try again in a moment.' });
  }
});

export default router;
