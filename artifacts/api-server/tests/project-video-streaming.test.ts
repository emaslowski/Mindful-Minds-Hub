import assert from 'node:assert/strict';
import { once } from 'node:events';
import { Readable } from 'node:stream';
import { after, before, test } from 'node:test';
import express from 'express';
import type { File } from '@google-cloud/storage';
import { MAX_VIDEO_CHUNK_BYTES, streamProjectVideo } from '../src/lib/projectVideoStorage';

const SIZE = 40 * 1024 * 1024 + 23;
let streamsCreated = 0;
const file = (size: number) => ({
  getMetadata: async () => [{ size: String(size), contentType: 'video/mp4' }],
  createReadStream: ({ start, end }: { start: number; end: number }) => {
    streamsCreated++;
    return Readable.from((function* () {
      let remaining = end - start + 1;
      while (remaining > 0) {
        const length = Math.min(remaining, 64 * 1024);
        remaining -= length;
        yield Buffer.alloc(length, 42);
      }
    })());
  },
}) as unknown as File;
const app = express();
app.get('/large', (req, res) => streamProjectVideo(file(SIZE), req, res));
app.get('/small', (req, res) => streamProjectVideo(file(100), req, res));
const server = app.listen(0, '127.0.0.1');
let origin = '';
before(async () => {
  if (!server.listening) await once(server, 'listening');
  const address = server.address();
  assert(address && typeof address !== 'string');
  origin = `http://127.0.0.1:${address.port}`;
});
after(() => {
  server.closeAllConnections();
  server.close();
});

test('open-ended browser requests return bounded chunks and the total file size', async () => {
  const response = await fetch(`${origin}/large`, { headers: { Range: 'bytes=0-' } });
  assert.equal(response.status, 206);
  assert.equal(response.headers.get('Content-Range'), `bytes 0-${MAX_VIDEO_CHUNK_BYTES - 1}/${SIZE}`);
  assert.equal((await response.arrayBuffer()).byteLength, MAX_VIDEO_CHUNK_BYTES);
});

test('subsequent browser chunks continue at the requested byte without gaps', async () => {
  const start = MAX_VIDEO_CHUNK_BYTES;
  const response = await fetch(`${origin}/large`, { headers: { Range: `bytes=${start}-` } });
  assert.equal(response.headers.get('Content-Range'), `bytes ${start}-${start + MAX_VIDEO_CHUNK_BYTES - 1}/${SIZE}`);
  assert.equal((await response.arrayBuffer()).byteLength, MAX_VIDEO_CHUNK_BYTES);
});

test('explicit large ranges are also bounded below production response limits', async () => {
  const response = await fetch(`${origin}/large`, { headers: { Range: `bytes=0-${SIZE - 1}` } });
  assert.equal(response.status, 206);
  assert.equal(Number(response.headers.get('Content-Length')), MAX_VIDEO_CHUNK_BYTES);
  await response.arrayBuffer();
});

test('small ranges and MP4 metadata at the file tail retain exact byte ranges', async () => {
  for (const range of ['bytes=0-1', 'bytes=-128', `bytes=${SIZE - 128}-${SIZE + 100}`]) {
    const response = await fetch(`${origin}/large`, { headers: { Range: range } });
    assert.equal(response.status, 206);
    assert.equal((await response.arrayBuffer()).byteLength, range === 'bytes=0-1' ? 2 : 128);
  }
});

test('full large downloads use chunked transfer instead of a huge Content-Length', async () => {
  const response = await fetch(`${origin}/large`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Content-Length'), null);
  assert.equal(response.headers.get('Transfer-Encoding'), 'chunked');
  let received = 0;
  for await (const chunk of response.body!) received += chunk.length;
  assert.equal(received, SIZE);
});

test('small full responses still report their exact size', async () => {
  const response = await fetch(`${origin}/small`);
  assert.equal(response.headers.get('Content-Length'), '100');
  assert.equal((await response.arrayBuffer()).byteLength, 100);
});

test('HEAD reports size without opening a storage stream', async () => {
  const count = streamsCreated;
  const response = await fetch(`${origin}/large`, { method: 'HEAD' });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Content-Length'), String(SIZE));
  assert.equal(streamsCreated, count);
  assert.equal((await response.arrayBuffer()).byteLength, 0);
});

test('invalid, reversed, out-of-bounds, and unsafe ranges are rejected', async () => {
  for (const range of ['bytes=-0', 'bytes=10-1', `bytes=${SIZE}-`, 'bytes=0-1,3-4', 'bytes=-9007199254740992']) {
    const response = await fetch(`${origin}/large`, { headers: { Range: range } });
    assert.equal(response.status, 416, range);
    assert.equal(response.headers.get('Content-Range'), `bytes */${SIZE}`);
  }
});
