import type { File } from '@google-cloud/storage';
import { db, studioPublicationMediaTable as media, type PublicationEdition } from '@workspace/db';
import { and, eq, inArray } from 'drizzle-orm';
import { verifyVideoFile } from './projectVideoStorage';

export function mediaKind(contentType: string): 'image' | 'video' | 'audio' {
  return contentType.startsWith('image/') ? 'image' : contentType.startsWith('audio/') ? 'audio' : 'video';
}

export function mediaLimit(kind: 'image' | 'video' | 'audio') {
  return (kind === 'image' ? 15 : kind === 'audio' ? 100 : 250) * 1024 * 1024;
}

export function serializePublicationMedia(row: typeof media.$inferSelect) {
  return {
    id: row.id, projectId: row.projectId, kind: row.kind, filename: row.filename,
    contentType: row.contentType, size: row.size, status: row.status,
    url: `/api/teacher/projects/${row.projectId}/publication-media/${row.id}/content`,
  };
}

export async function verifyPublicationFile(file: File, row: Pick<typeof media.$inferSelect, 'kind' | 'contentType' | 'size'>): Promise<void> {
  if (row.kind === 'video') {
    await verifyVideoFile(file, row.contentType, row.size);
    return;
  }
  const [metadata] = await file.getMetadata();
  if (Number(metadata.size) !== row.size || metadata.contentType !== row.contentType ||
    row.size < 1 || row.size > mediaLimit(row.kind)) {
    throw new Error('The uploaded file does not match the selected file. Please upload it again.');
  }
  const [header] = await file.download({ start: 0, end: Math.min(63, row.size - 1) });
  const ascii = (start: number, end: number) => header.toString('ascii', start, end);
  const valid = {
    'image/png': header.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
    'image/jpeg': header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff,
    'image/gif': ['GIF87a', 'GIF89a'].includes(ascii(0, 6)),
    'image/webp': ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP',
    'audio/mpeg': ascii(0, 3) === 'ID3' || (header[0] === 0xff && (header[1]! & 0xe0) === 0xe0),
    'audio/mp4': ascii(4, 8) === 'ftyp',
    'audio/wav': ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WAVE',
    'audio/x-wav': ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WAVE',
    'audio/ogg': ascii(0, 4) === 'OggS',
    'audio/webm': header.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3])),
  }[row.contentType];
  if (!valid) throw new Error('This file’s contents do not match its image or audio format. Choose a supported file.');
}

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Validate references inside the same project, not arbitrary object URLs. */
export async function publicationMediaError(tx: Transaction, projectId: number, draft: PublicationEdition, publish: boolean) {
  const blocks = draft.blocks ?? [];
  const mediaBlocks = blocks.filter(b => ['image', 'video', 'audio'].includes(b.type));
  const ids = [...new Set(mediaBlocks.flatMap(b => b.mediaId == null ? [] : [b.mediaId]))];
  const rows = ids.length ? await tx.select().from(media).where(and(
    eq(media.projectId, projectId), eq(media.status, 'ready'), inArray(media.id, ids),
  )) : [];
  if (mediaBlocks.some(b => b.mediaId != null && !rows.some(row => row.id === b.mediaId && row.kind === b.type))) {
    return 'Choose a finished upload from this project’s media library. Media from another project cannot be used.';
  }
  if (publish) {
    if (mediaBlocks.some(b => b.mediaId == null)) return 'Upload or select a file for each image, video, and audio block before publishing.';
    if (blocks.some(b => b.type === 'recipe' && (!b.recipe?.name.trim() || !b.recipe.ingredients.trim() || !b.recipe.steps.trim()))) {
      return 'Each recipe needs a name, ingredients, and instructions before publishing.';
    }
    if (!draft.content.trim() && !blocks.some(b =>
      (b.type === 'text' && b.text?.trim()) || b.mediaId != null || (b.type === 'recipe' && b.recipe?.name.trim()))) {
      return 'Add text, an image, a video, audio, or a recipe before publishing.';
    }
  }
  return null;
}
