import type { Request, Response } from 'express';
import { objectStorageClient, parseObjectPath } from './objectStorage';
import { FOLDERS, contentTypeFor, folderTitle } from './lessonResources';

/**
 * Reads the lesson printables library from Google Cloud Storage:
 *   <PRIVATE_OBJECT_DIR>/lesson-resources/<folder>/<filename>
 * Authorization is the caller's job (a school access code on the kits site).
 */

export interface LessonResourceFile {
  folder: string;
  name: string;
  size: number;
  contentType: string;
  updatedAt: string | null;
}

export interface LessonResourceSection {
  folder: string;
  title: string;
  files: LessonResourceFile[];
}

function libraryRoot(): { bucketName: string; prefix: string } {
  const dir = process.env.PRIVATE_OBJECT_DIR || '';
  if (!dir) throw new Error('PRIVATE_OBJECT_DIR not set. Set it to a /bucket/folder path in your Google Cloud Storage bucket.');
  const { bucketName, objectName } = parseObjectPath(`${dir.replace(/\/+$/, '')}/lesson-resources`);
  return { bucketName, prefix: objectName };
}

export async function listLibrary(): Promise<LessonResourceSection[]> {
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
    });
  }
  return FOLDERS.map((folder) => ({
    folder,
    title: folderTitle(folder),
    files: byFolder.get(folder)!.sort((a, b) => a.name.localeCompare(b.name, 'en', { numeric: true })),
  }));
}

/** Streams one library file; 404 when it does not exist. `?download=1` forces a save instead of opening inline. */
export async function streamLibraryFile(folder: string, name: string, req: Request, res: Response): Promise<void> {
  const { bucketName, prefix } = libraryRoot();
  const file = objectStorageClient.bucket(bucketName).file(`${prefix}/${folder}/${name}`);
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
}
