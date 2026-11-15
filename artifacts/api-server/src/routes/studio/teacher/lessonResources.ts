import { Router, type Request, type Response } from 'express';
import { requireStudioRole } from '../../../middlewares/studioAuthMiddleware';
import { objectStorageClient, parseObjectPath, signObjectURL } from '../../../lib/objectStorage';
import { FOLDERS, MAX_FILE_BYTES, contentTypeFor, folderTitle, parseFilename, parseFolder } from '../../../lib/lessonResources';

/** Lesson printables library for teachers. Naming rules and storage layout: see lib/lessonResources.ts. */

const router = Router();
const teacher = requireStudioRole('teacher');

function libraryRoot(): { bucketName: string; prefix: string } {
  const dir = process.env.PRIVATE_OBJECT_DIR || '';
  if (!dir) throw new Error('PRIVATE_OBJECT_DIR not set. Set it to a /bucket/folder path in your Google Cloud Storage bucket.');
  const { bucketName, objectName } = parseObjectPath(`${dir.replace(/\/+$/, '')}/lesson-resources`);
  return { bucketName, prefix: objectName };
}

function objectFor(folder: string, filename: string) {
  const { bucketName, prefix } = libraryRoot();
  return { bucketName, objectName: `${prefix}/${folder}/${filename}` };
}

export interface LessonResourceFile {
  folder: string;
  name: string;
  size: number;
  contentType: string;
  updatedAt: string | null;
  url: string;
}

function fileUrl(folder: string, name: string): string {
  return `/api/teacher/lesson-resources/file/${folder}/${encodeURIComponent(name)}`;
}

router.get('/teacher/lesson-resources', teacher, async (_req: Request, res: Response) => {
  const { bucketName, prefix } = libraryRoot();
  const [objects] = await objectStorageClient.bucket(bucketName).getFiles({ prefix: `${prefix}/` });
  const byFolder = new Map<string, LessonResourceFile[]>(FOLDERS.map((f) => [f, []]));
  for (const object of objects) {
    const rel = object.name.slice(prefix.length + 1);
    const slash = rel.indexOf('/');
    if (slash < 0) continue;
    const folder = rel.slice(0, slash);
    const name = rel.slice(slash + 1);
    if (!byFolder.has(folder) || !name) continue;
    byFolder.get(folder)!.push({
      folder,
      name,
      size: Number(object.metadata.size ?? 0),
      contentType: String(object.metadata.contentType ?? contentTypeFor(name)),
      updatedAt: object.metadata.updated ? String(object.metadata.updated) : null,
      url: fileUrl(folder, name),
    });
  }
  const sections = FOLDERS.map((folder) => ({
    folder,
    title: folderTitle(folder),
    files: byFolder.get(folder)!.sort((a, b) => a.name.localeCompare(b.name, 'en', { numeric: true })),
  }));
  res.setHeader('Cache-Control', 'private, no-store');
  res.json({ sections });
});

router.get('/teacher/lesson-resources/file/:folder/:name', teacher, async (req: Request, res: Response) => {
  const folder = parseFolder(req.params.folder);
  const name = parseFilename(req.params.name);
  if (!folder || !name) { res.status(404).json({ error: 'File not found' }); return; }
  const { bucketName, objectName } = objectFor(folder, name);
  const file = objectStorageClient.bucket(bucketName).file(objectName);
  const [exists] = await file.exists();
  if (!exists) { res.status(404).json({ error: 'File not found' }); return; }
  const [metadata] = await file.getMetadata();
  const disposition = req.query.download === '1' ? 'attachment' : 'inline';
  res.setHeader('Content-Type', String(metadata.contentType ?? contentTypeFor(name)));
  if (metadata.size) res.setHeader('Content-Length', String(metadata.size));
  res.setHeader('Content-Disposition', `${disposition}; filename*=UTF-8''${encodeURIComponent(name)}`);
  res.setHeader('Cache-Control', 'private, max-age=300');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  const stream = file.createReadStream();
  stream.on('error', () => {
    if (!res.headersSent) res.status(502).end();
    else res.destroy();
  });
  res.on('close', () => stream.destroy());
  stream.pipe(res);
});

router.post('/teacher/lesson-resources/upload-url', teacher, async (req: Request, res: Response) => {
  const body = (req.body ?? {}) as { folder?: unknown; filename?: unknown; size?: unknown };
  const folder = parseFolder(body.folder);
  const name = parseFilename(body.filename);
  const size = Number(body.size);
  if (!folder) { res.status(400).json({ error: 'Choose a lesson for this file.' }); return; }
  if (!name) { res.status(400).json({ error: 'Use a file name of up to 120 characters ending in .pdf, .pptx, .docx, .xlsx, .png, .jpg or .zip.' }); return; }
  if (!Number.isSafeInteger(size) || size < 1 || size > MAX_FILE_BYTES) {
    res.status(400).json({ error: 'Files must be 100 MB or smaller.' }); return;
  }
  const { bucketName, objectName } = objectFor(folder, name);
  const uploadUrl = await signObjectURL({ bucketName, objectName, method: 'PUT', ttlSec: 900 });
  res.json({ uploadUrl, contentType: contentTypeFor(name), file: { folder, name, url: fileUrl(folder, name) } });
});

router.delete('/teacher/lesson-resources/file/:folder/:name', teacher, async (req: Request, res: Response) => {
  const folder = parseFolder(req.params.folder);
  const name = parseFilename(req.params.name);
  if (!folder || !name) { res.status(404).json({ error: 'File not found' }); return; }
  const { bucketName, objectName } = objectFor(folder, name);
  await objectStorageClient.bucket(bucketName).file(objectName).delete({ ignoreNotFound: true });
  res.json({ ok: true });
});

export default router;
