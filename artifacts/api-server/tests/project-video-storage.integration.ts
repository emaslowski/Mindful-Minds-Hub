import assert from 'node:assert/strict';
import { db, pool, studioProjectsTable, studioPublicationMediaTable } from '@workspace/db';
import { eq } from 'drizzle-orm';
import { createStudioSession, deleteStudioSession } from '../src/lib/studioAuth';

// Check a real storage object through the development proxy without making it
// public, copying bytes to the database, or modifying the source upload.
if (process.env.NODE_ENV === 'production') throw new Error('Development test only');
const [objectPath, sizeText] = process.argv.slice(2);
const size = Number(sizeText);
if (!objectPath?.startsWith('/objects/') || !Number.isSafeInteger(size) || size <= 4 * 1024 * 1024) {
  throw new Error('Pass an existing video object path and its size (larger than 4 MiB)');
}
const origin = `https://${process.env.REPLIT_DEV_DOMAIN}`;
const session = await createStudioSession({ studioUser: {
  id: 'video-streaming-integration', email: null, displayName: 'Streaming test',
  role: 'teacher', accountStatus: 'active',
} });
let projectId: number | undefined;
try {
  const [project] = await db.insert(studioProjectsTable).values({
    title: '__private_video_streaming_test__', contentType: 'Meditation', status: 'Teacher Reviewing',
  }).returning();
  projectId = project!.id;
  const [media] = await db.insert(studioPublicationMediaTable).values({
    projectId, kind: 'video', filename: 'Streaming test.mp4', contentType: 'video/mp4',
    size, status: 'ready', objectPath,
  }).returning();
  const url = `${origin}/api/teacher/projects/${projectId}/publication-media/${media!.id}/content`;
  const authorization = { Authorization: `StudioBearer ${session}` };
  const chunkSize = 4 * 1024 * 1024;
  for (const [range, expected, contentRange] of [
    ['bytes=0-', chunkSize, `bytes 0-${chunkSize - 1}/${size}`],
    [`bytes=${chunkSize}-`, Math.min(size - chunkSize, chunkSize), `bytes ${chunkSize}-${Math.min(size - 1, 2 * chunkSize - 1)}/${size}`],
    ['bytes=-65536', Math.min(size, 65536), `bytes ${Math.max(0, size - 65536)}-${size - 1}/${size}`],
  ] as const) {
    const response = await fetch(url, { headers: { ...authorization, Range: range } });
    assert.equal(response.status, 206);
    assert.equal(response.headers.get('Content-Range'), contentRange);
    assert.equal((await response.arrayBuffer()).byteLength, expected);
    console.log(`PASS real storage through development proxy: ${range}`);
  }
  const head = await fetch(url, { method: 'HEAD', headers: authorization });
  assert.equal(head.status, 200);
  assert.equal(head.headers.get('Content-Length'), String(size));
  const full = await fetch(url, { headers: authorization });
  assert.equal(full.status, 200);
  assert.equal(full.headers.get('Content-Length'), null);
  await full.body?.cancel();
  console.log('PASS metadata and chunked full-download headers');
} finally {
  if (projectId) await db.delete(studioProjectsTable).where(eq(studioProjectsTable.id, projectId));
  await deleteStudioSession(session);
  await pool.end();
}
