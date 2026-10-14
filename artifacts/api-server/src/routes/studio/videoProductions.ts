import { Router } from 'express';
import { db, studioProjectsTable, studioVideoProductionsTable } from '@workspace/db';
import { and, desc, eq, ne, sql } from 'drizzle-orm';
import { RequestVideoUploadBody, CompleteVideoUploadBody } from '@workspace/api-zod';
import { requireStudioRole } from '../../middlewares/studioAuthMiddleware';
import type { StudioUserSession } from '../../lib/studioAuth';
import { videoStorage, streamProjectVideo, verifyVideoFile } from '../../lib/projectVideoStorage';
import { ObjectNotFoundError } from '../../lib/objectStorage';

const router = Router();
const video = studioVideoProductionsTable;
const projects = studioProjectsTable;

router.param('projectId', (_req, res, next, value) => {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0) { res.status(400).json({ error: 'Invalid project ID' }); return; }
  next();
});

function canAccess(project: typeof projects.$inferSelect, assignment: typeof video.$inferSelect | undefined, user: StudioUserSession) {
  return user.role === 'teacher' ||
    (user.jobId != null && (project.jobId === user.jobId || assignment?.producerJobId === user.jobId)) ||
    project.assignedStudentId === user.id;
}

async function load(projectId: number) {
  const [row] = await db.select().from(projects)
    .leftJoin(video, eq(video.projectId, projects.id))
    .where(eq(projects.id, projectId));
  return row ? { project: row.studio_projects, assignment: row.studio_video_productions ?? undefined } : undefined;
}

function serialize(project: typeof projects.$inferSelect, assignment: typeof video.$inferSelect) {
  return {
    projectId: project.id, projectTitle: project.title,
    contentType: project.contentType, content: project.content, projectStatus: project.status,
    status: assignment.status, instructions: assignment.instructions,
    filename: assignment.filename, uploadedAt: assignment.uploadedAt,
    videoUrl: assignment.objectPath ? `/api/studio/video-productions/${project.id}/content` : null,
    createdAt: assignment.createdAt,
  };
}

router.get('/studio/video-productions', requireStudioRole('student', 'teacher'), async (req, res) => {
  const user = req.studioUser!;
  if (user.role !== 'teacher' && user.jobId == null) {
    res.json({ productions: [] });
    return;
  }
  const rows = await db.select().from(video)
    .innerJoin(projects, eq(video.projectId, projects.id))
    .where(and(ne(projects.status, 'Archived'),
      user.role === 'teacher' ? undefined : eq(video.producerJobId, user.jobId!)))
    .orderBy(desc(video.updatedAt));
  res.json({ productions: rows.map((row) => serialize(row.studio_projects, row.studio_video_productions)) });
});

router.get('/studio/video-productions/:projectId', requireStudioRole('student', 'teacher'), async (req, res) => {
  const row = await load(Number(req.params.projectId));
  if (!row) { res.status(404).json({ error: 'Project not found' }); return; }
  if (!canAccess(row.project, row.assignment, req.studioUser!)) {
    res.status(403).json({ error: 'Access denied' }); return;
  }
  res.json({ production: row.assignment ? serialize(row.project, row.assignment) : null });
});

router.post('/studio/video-productions/:projectId/upload-url', requireStudioRole('student'), async (req, res) => {
  const input = RequestVideoUploadBody.safeParse(req.body);
  if (!input.success || !Number.isSafeInteger(input.data.size)) {
    res.status(400).json({ error: 'Choose an MP4, WebM, MOV, or OGV video between 1 byte and 250 MB.' }); return;
  }
  const projectId = Number(req.params.projectId);
  const user = req.studioUser!;
  const result = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(${projectId})`);
    const [assignment] = await tx.select().from(video).where(eq(video.projectId, projectId));
    const [project] = await tx.select().from(projects).where(eq(projects.id, projectId));
    if (!assignment || !project) return { error: 'Video assignment not found', code: 404 };
    if (user.jobId == null || assignment.producerJobId !== user.jobId) return { error: 'Only the assigned Video Producer group can upload this video', code: 403 };
    if (assignment.status !== 'assigned' || project.status !== 'Approved') return { error: 'This project is not awaiting video production', code: 409 };
    const uploadUrl = await videoStorage.getObjectEntityUploadURL();
    const objectPath = videoStorage.normalizeObjectEntityPath(uploadUrl);
    await tx.update(video).set({
      pendingObjectPath: objectPath, pendingFilename: input.data.filename,
      pendingMimeType: input.data.contentType, pendingSize: input.data.size,
      pendingExpiresAt: new Date(Date.now() + 15 * 60 * 1000), updatedAt: new Date(),
    }).where(eq(video.projectId, projectId));
    return { uploadUrl, objectPath };
  });
  if ('error' in result) { res.status(result.code!).json({ error: result.error }); return; }
  res.json(result);
});

router.post('/studio/video-productions/:projectId/complete', requireStudioRole('student'), async (req, res) => {
  const input = CompleteVideoUploadBody.safeParse(req.body);
  if (!input.success) { res.status(400).json({ error: 'Upload reference is required' }); return; }
  const projectId = Number(req.params.projectId);
  const user = req.studioUser!;
  const result = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(${projectId})`);
    const [assignment] = await tx.select().from(video).where(eq(video.projectId, projectId));
    const [project] = await tx.select().from(projects).where(eq(projects.id, projectId));
    if (!assignment || !project) return { error: 'Video assignment not found', code: 404 };
    if (user.jobId == null || assignment.producerJobId !== user.jobId) return { error: 'Access denied', code: 403 };
    // Idempotency makes retrying the save safe after a response was lost.
    if (assignment.status === 'uploaded' && assignment.objectPath === input.data.objectPath) return { success: true };
    if (assignment.status !== 'assigned' || project.status !== 'Approved') return { error: 'This project is not awaiting video production', code: 409 };
    if (assignment.pendingObjectPath !== input.data.objectPath || !assignment.pendingExpiresAt ||
      assignment.pendingExpiresAt.getTime() < Date.now() || !assignment.pendingMimeType || !assignment.pendingSize) {
      return { error: 'The upload reference is invalid or expired. Please select your video and upload again.', code: 400 };
    }
    try {
      const file = await videoStorage.getObjectEntityFile(assignment.pendingObjectPath);
      await verifyVideoFile(file, assignment.pendingMimeType, assignment.pendingSize);
    } catch (error) {
      if (error instanceof ObjectNotFoundError) return { error: 'The video has not finished uploading. Try again.', code: 400 };
      return { error: error instanceof Error ? error.message : 'Could not verify the uploaded video', code: 400 };
    }
    await tx.update(video).set({
      objectPath: assignment.pendingObjectPath, filename: assignment.pendingFilename,
      mimeType: assignment.pendingMimeType, size: assignment.pendingSize,
      status: 'uploaded', uploadedAt: new Date(), updatedAt: new Date(),
      pendingObjectPath: null, pendingFilename: null, pendingMimeType: null,
      pendingSize: null, pendingExpiresAt: null,
    }).where(eq(video.projectId, projectId));
    await tx.update(projects).set({ status: 'Ready for Teacher Review', updatedAt: new Date() })
      .where(eq(projects.id, projectId));
    return { success: true };
  });
  if ('error' in result) { res.status(result.code!).json({ error: result.error }); return; }
  res.json({ success: true, message: 'Video uploaded and sent to the Teacher Command Center for review.' });
});

router.get('/studio/video-productions/:projectId/content', requireStudioRole('student', 'teacher'), async (req, res) => {
  const row = await load(Number(req.params.projectId));
  if (!row?.assignment?.objectPath) { res.status(404).json({ error: 'Video not found' }); return; }
  if (!canAccess(row.project, row.assignment, req.studioUser!)) {
    res.status(403).json({ error: 'Access denied' }); return;
  }
  try {
    const file = await videoStorage.getObjectEntityFile(row.assignment.objectPath);
    await streamProjectVideo(file, req, res);
  } catch (error) {
    if (error instanceof ObjectNotFoundError) { res.status(404).json({ error: 'Video not found' }); return; }
    throw error;
  }
});

export default router;
