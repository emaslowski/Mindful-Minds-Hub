import { Router } from 'express';
import { db, studioProjectsTable as projects, studioPublicationMediaTable as media, studioVideoProductionsTable as productions } from '@workspace/db';
import { and, eq, desc, sql } from 'drizzle-orm';
import { CreateTeacherWebsiteProjectBody, RequestPublicationMediaUploadBody } from '@workspace/api-zod';
import { requireStudioRole } from '../../../middlewares/studioAuthMiddleware';
import { mediaKind, mediaLimit, serializePublicationMedia, verifyPublicationFile } from '../../../lib/publicationMedia';
import { videoStorage, streamProjectVideo } from '../../../lib/projectVideoStorage';

const router = Router();
const positiveId = (value: unknown) => Number.isSafeInteger(Number(value)) && Number(value) > 0;

router.post('/teacher/projects', requireStudioRole('teacher'), async (req, res) => {
  const parsed = CreateTeacherWebsiteProjectBody.safeParse(req.body);
  if (!parsed.success || !parsed.data.title.trim() || !parsed.data.contentType.trim()) {
    res.status(400).json({ error: 'Enter a title and choose a content type.' }); return;
  }
  const [project] = await db.insert(projects).values({
    title: parsed.data.title.trim(), contentType: parsed.data.contentType.trim(),
    content: '', status: 'Teacher Reviewing',
  }).returning();
  res.status(201).json({ project });
});

router.get('/teacher/projects/:id/publication-media', requireStudioRole('teacher'), async (req, res) => {
  if (!positiveId(req.params.id)) { res.status(400).json({ error: 'Invalid project' }); return; }
  const [project] = await db.select({ id: projects.id }).from(projects).where(eq(projects.id, Number(req.params.id)));
  if (!project) { res.status(404).json({ error: 'Project not found' }); return; }
  const rows = await db.select().from(media).where(eq(media.projectId, project.id)).orderBy(desc(media.createdAt));
  res.json({ media: rows.map(serializePublicationMedia) });
});

router.post('/teacher/projects/:id/publication-media/upload-url', requireStudioRole('teacher'), async (req, res) => {
  const parsed = RequestPublicationMediaUploadBody.safeParse(req.body);
  if (!positiveId(req.params.id) || !parsed.success || !Number.isSafeInteger(parsed.data.size)) {
    res.status(400).json({ error: 'Select a supported image, video, or audio file.' }); return;
  }
  const projectId = Number(req.params.id);
  const { filename, contentType, size } = parsed.data;
  const kind = mediaKind(contentType);
  if (size > mediaLimit(kind)) { res.status(400).json({ error: `Choose a ${kind} file smaller than ${mediaLimit(kind) / 1024 / 1024} MB.` }); return; }
  const [project] = await db.select({ id: projects.id }).from(projects).where(eq(projects.id, projectId));
  if (!project) { res.status(404).json({ error: 'Project not found' }); return; }
  const uploadUrl = await videoStorage.getObjectEntityUploadURL();
  const [row] = await db.insert(media).values({
    projectId, kind, filename, contentType, size,
    objectPath: videoStorage.normalizeObjectEntityPath(uploadUrl),
    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
  }).returning();
  res.json({ mediaId: row!.id, uploadUrl });
});

router.post('/teacher/projects/:id/publication-media/:mediaId/complete', requireStudioRole('teacher'), async (req, res) => {
  if (!positiveId(req.params.id) || !positiveId(req.params.mediaId)) {
    res.status(400).json({ error: 'Invalid upload reference' }); return;
  }
  const result = await db.transaction(async tx => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(${Number(req.params.id)})`);
    const [row] = await tx.select().from(media).where(and(eq(media.id, Number(req.params.mediaId)), eq(media.projectId, Number(req.params.id))));
    if (!row) return { error: 'Upload not found', code: 404 };
    if (row.status === 'ready') return { media: serializePublicationMedia(row) };
    if (!row.expiresAt || row.expiresAt < new Date()) return { error: 'This upload expired. Select the file and upload it again.', code: 400 };
    try {
      await verifyPublicationFile(await videoStorage.getObjectEntityFile(row.objectPath), row);
    } catch {
      return { error: 'The upload could not be verified. Check its format and size, then upload the file again.', code: 400 };
    }
    const [updated] = await tx.update(media).set({ status: 'ready', expiresAt: null })
      .where(eq(media.id, row.id)).returning();
    return { media: serializePublicationMedia(updated!) };
  });
  if ('error' in result) { res.status(result.code!).json({ error: result.error }); return; }
  res.json(result);
});

router.post('/teacher/projects/:id/publication-media/import-video', requireStudioRole('teacher'), async (req, res) => {
  if (!positiveId(req.params.id)) { res.status(400).json({ error: 'Invalid project' }); return; }
  const projectId = Number(req.params.id);
  const [production] = await db.select().from(productions).where(eq(productions.projectId, projectId));
  if (!production || production.status !== 'uploaded' || !production.objectPath ||
    !production.filename || !production.mimeType || !production.size) {
    res.status(409).json({ error: 'The Video Producers must return a finished video before you can add it to the website edition.' }); return;
  }
  await db.insert(media).values({
    projectId, kind: 'video', objectPath: production.objectPath, filename: production.filename,
    contentType: production.mimeType, size: production.size, status: 'ready',
  }).onConflictDoNothing({ target: media.objectPath });
  const [row] = await db.select().from(media).where(and(eq(media.projectId, projectId), eq(media.objectPath, production.objectPath)));
  if (!row) { res.status(409).json({ error: 'That recording is already linked to a different project.' }); return; }
  res.json({ media: serializePublicationMedia(row) });
});

router.get('/teacher/projects/:id/publication-media/:mediaId/content', requireStudioRole('teacher'), async (req, res) => {
  if (!positiveId(req.params.id) || !positiveId(req.params.mediaId)) { res.status(404).end(); return; }
  const [row] = await db.select().from(media).where(and(
    eq(media.id, Number(req.params.mediaId)), eq(media.projectId, Number(req.params.id)), eq(media.status, 'ready'),
  ));
  if (!row) { res.status(404).end(); return; }
  try { await streamProjectVideo(await videoStorage.getObjectEntityFile(row.objectPath), req, res); }
  catch { if (!res.headersSent) res.status(404).end(); }
});

export default router;
