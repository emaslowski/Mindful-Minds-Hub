/**
 * Craft Corner: craft ideas teachers post for students.
 *
 *   GET    /crafts                         published crafts, newest first (everyone)
 *   GET    /crafts/:id/image               the craft's photo
 *   GET    /teacher/crafts                 every craft, drafts included
 *   POST   /teacher/crafts                 { title, description?, materials?, steps?, link?, published? }
 *   PATCH  /teacher/crafts/:id
 *   DELETE /teacher/crafts/:id
 *   POST   /teacher/crafts/:id/image/upload-url   { filename, contentType, size } -> { uploadUrl }
 *   POST   /teacher/crafts/:id/image/complete     verifies the uploaded file, then shows it
 *   DELETE /teacher/crafts/:id/image
 */
import { Router, type Request, type Response } from 'express';
import { db } from '@workspace/db';
import { craftsTable } from '@workspace/db/schema';
import { desc, eq } from 'drizzle-orm';
import { requireStudioRole } from '../middlewares/studioAuthMiddleware';
import { videoStorage } from '../lib/projectVideoStorage';
import { verifyPublicationFile } from '../lib/publicationMedia';
import { parseCraft, parseCraftImage, serializeCraft, type CraftInput } from '../lib/crafts';

const router = Router();
const teacher = requireStudioRole('teacher');

function craftId(req: Request): number | null {
  const n = Number(req.params.id);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

async function deleteObject(objectPath: string | null) {
  if (!objectPath) return;
  const file = await videoStorage.getObjectEntityFile(objectPath).catch(() => null);
  await file?.delete({ ignoreNotFound: true }).catch(() => {});
}

router.get('/crafts', async (_req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=30');
  const rows = await db.select().from(craftsTable).where(eq(craftsTable.published, true)).orderBy(desc(craftsTable.createdAt)).limit(100);
  res.json({ crafts: rows.map(serializeCraft) });
});

router.get('/crafts/:id/image', async (req, res) => {
  const id = craftId(req);
  if (!id) { res.status(404).end(); return; }
  const [row] = await db.select().from(craftsTable).where(eq(craftsTable.id, id));
  const isTeacher = req.studioUser?.role === 'teacher' && req.studioUser.accountStatus !== 'disabled';
  if (!row || !row.imageReady || !row.imageObjectPath || (!row.published && !isTeacher)) { res.status(404).end(); return; }
  const file = await videoStorage.getObjectEntityFile(row.imageObjectPath).catch(() => null);
  if (!file) { res.status(404).end(); return; }
  res.setHeader('Content-Type', row.imageContentType ?? 'application/octet-stream');
  if (row.imageSize) res.setHeader('Content-Length', row.imageSize);
  res.setHeader('Cache-Control', row.published ? 'public, max-age=3600' : 'private, no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  const stream = file.createReadStream();
  stream.on('error', () => { if (!res.headersSent) res.status(502).end(); else res.destroy(); });
  res.on('close', () => stream.destroy());
  stream.pipe(res);
});

// -- Teacher editing --------------------------------------------------------

router.get('/teacher/crafts', teacher, async (_req, res) => {
  res.setHeader('Cache-Control', 'private, no-store');
  const rows = await db.select().from(craftsTable).orderBy(desc(craftsTable.createdAt));
  res.json({ crafts: rows.map(serializeCraft) });
});

router.post('/teacher/crafts', teacher, async (req: Request, res: Response) => {
  const parsed = parseCraft((req.body ?? {}) as CraftInput, false);
  if ('error' in parsed) { res.status(400).json({ error: parsed.error }); return; }
  const [row] = await db.insert(craftsTable).values({ ...parsed.values, title: parsed.values.title!, createdBy: req.studioUser!.id }).returning();
  res.status(201).json({ craft: serializeCraft(row!) });
});

router.patch('/teacher/crafts/:id', teacher, async (req: Request, res: Response) => {
  const id = craftId(req);
  if (!id) { res.status(404).json({ error: 'Craft not found' }); return; }
  const parsed = parseCraft((req.body ?? {}) as CraftInput, true);
  if ('error' in parsed) { res.status(400).json({ error: parsed.error }); return; }
  if (Object.keys(parsed.values).length === 0) { res.status(400).json({ error: 'Nothing to change.' }); return; }
  const [row] = await db.update(craftsTable).set({ ...parsed.values, updatedAt: new Date() }).where(eq(craftsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: 'Craft not found' }); return; }
  res.json({ craft: serializeCraft(row) });
});

router.delete('/teacher/crafts/:id', teacher, async (req: Request, res: Response) => {
  const id = craftId(req);
  if (!id) { res.status(404).json({ error: 'Craft not found' }); return; }
  const [row] = await db.delete(craftsTable).where(eq(craftsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: 'Craft not found' }); return; }
  await deleteObject(row.imageObjectPath);
  res.json({ success: true, id });
});

router.post('/teacher/crafts/:id/image/upload-url', teacher, async (req: Request, res: Response) => {
  const id = craftId(req);
  if (!id) { res.status(404).json({ error: 'Craft not found' }); return; }
  const parsed = parseCraftImage(req.body ?? {});
  if ('error' in parsed) { res.status(400).json({ error: parsed.error }); return; }
  const [existing] = await db.select().from(craftsTable).where(eq(craftsTable.id, id));
  if (!existing) { res.status(404).json({ error: 'Craft not found' }); return; }
  const uploadUrl = await videoStorage.getObjectEntityUploadURL();
  await db.update(craftsTable).set({
    imageObjectPath: videoStorage.normalizeObjectEntityPath(uploadUrl),
    imageContentType: parsed.contentType, imageSize: parsed.size, imageReady: false, updatedAt: new Date(),
  }).where(eq(craftsTable.id, id));
  // The previous photo is no longer referenced.
  await deleteObject(existing.imageObjectPath);
  res.json({ uploadUrl });
});

router.post('/teacher/crafts/:id/image/complete', teacher, async (req: Request, res: Response) => {
  const id = craftId(req);
  if (!id) { res.status(404).json({ error: 'Craft not found' }); return; }
  const [row] = await db.select().from(craftsTable).where(eq(craftsTable.id, id));
  if (!row) { res.status(404).json({ error: 'Craft not found' }); return; }
  if (!row.imageObjectPath || !row.imageContentType || !row.imageSize) { res.status(400).json({ error: 'Choose a photo first.' }); return; }
  if (row.imageReady) { res.json({ craft: serializeCraft(row) }); return; }
  try {
    const file = await videoStorage.getObjectEntityFile(row.imageObjectPath);
    await verifyPublicationFile(file, { kind: 'image', contentType: row.imageContentType, size: row.imageSize });
  } catch {
    res.status(400).json({ error: 'The photo could not be verified. Choose a JPG, PNG, WebP or GIF and upload it again.' }); return;
  }
  const [updated] = await db.update(craftsTable).set({ imageReady: true, updatedAt: new Date() }).where(eq(craftsTable.id, id)).returning();
  res.json({ craft: serializeCraft(updated!) });
});

router.delete('/teacher/crafts/:id/image', teacher, async (req: Request, res: Response) => {
  const id = craftId(req);
  if (!id) { res.status(404).json({ error: 'Craft not found' }); return; }
  const [row] = await db.select().from(craftsTable).where(eq(craftsTable.id, id));
  if (!row) { res.status(404).json({ error: 'Craft not found' }); return; }
  const [updated] = await db.update(craftsTable).set({
    imageObjectPath: null, imageContentType: null, imageSize: null, imageReady: false, updatedAt: new Date(),
  }).where(eq(craftsTable.id, id)).returning();
  await deleteObject(row.imageObjectPath);
  res.json({ craft: serializeCraft(updated!) });
});

export default router;
