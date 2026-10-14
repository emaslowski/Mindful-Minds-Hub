import type { Request, Response } from 'express';
import type { File } from '@google-cloud/storage';
import { ObjectStorageService } from './objectStorage';

export const videoStorage = new ObjectStorageService();
export const MAX_VIDEO_BYTES = 250 * 1024 * 1024;

export async function verifyVideoFile(file: File, mimeType: string, expectedSize: number) {
  const [metadata] = await file.getMetadata();
  const size = Number(metadata.size);
  if (!Number.isSafeInteger(size) || size < 1 || size > MAX_VIDEO_BYTES || size !== expectedSize) {
    throw new Error('The uploaded file size does not match the selected video. Please upload again.');
  }
  if (metadata.contentType !== mimeType) {
    throw new Error('The uploaded video format does not match the selected file.');
  }
  const [header] = await file.download({ start: 0, end: Math.min(63, size - 1) });
  const isMp4OrMov = ['ftyp', 'moov', 'mdat', 'wide', 'free', 'skip'].includes(header.toString('ascii', 4, 8));
  const valid = mimeType === 'video/webm'
    ? header.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))
    : mimeType === 'video/ogg'
      ? header.toString('ascii', 0, 4) === 'OggS'
      : isMp4OrMov;
  if (!valid) throw new Error('This file is not a supported video. Choose an MP4, WebM, MOV, or OGV video.');
  return metadata;
}

/** Auth is checked by the caller before resolving any object. Range requests
 * keep video playback/seeking from downloading the whole recording each time. */
export async function streamProjectVideo(file: File, req: Request, res: Response) {
  const [metadata] = await file.getMetadata();
  const size = Number(metadata.size);
  res.setHeader('Content-Type', metadata.contentType ?? 'application/octet-stream');
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Accept-Ranges', 'bytes');
  const range = req.headers.range;
  let start = 0;
  let end = size - 1;
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!match || (!match[1] && !match[2])) {
      res.setHeader('Content-Range', `bytes */${size}`);
      res.status(416).end();
      return;
    }
    if (!match[1]) {
      start = Math.max(0, size - Number(match[2]));
    } else {
      start = Number(match[1]);
      if (match[2]) end = Math.min(Number(match[2]), end);
    }
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= size) {
      res.setHeader('Content-Range', `bytes */${size}`);
      res.status(416).end();
      return;
    }
    res.status(206);
    res.setHeader('Content-Range', `bytes ${start}-${end}/${size}`);
  }
  res.setHeader('Content-Length', end - start + 1);
  const stream = file.createReadStream({ start, end });
  stream.on('error', () => {
    if (!res.headersSent) res.status(502).end();
    else res.destroy();
  });
  res.on('close', () => stream.destroy());
  stream.pipe(res);
}
