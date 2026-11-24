/**
 * End-to-end check of the school access code gate with the database stubbed:
 * an express app with the real cookie parser, gate middleware and routes, and
 * an in-memory stand-in for the studio_app_settings table.
 */
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import express from 'express';
import cookieParser from 'cookie-parser';

process.env.DATABASE_URL ??= 'postgres://u:p@localhost:5432/placeholder';
process.env.HUB_ACCESS_SECRET = 'test-secret';
process.env.HUB_ACCESS_CODE = 'Lincoln 2026';

const { db } = await import('@workspace/db');
const { hubAccessGate, HUB_ACCESS_COOKIE } = await import('../lib/hubAccess');
const { default: hubAccessRouter } = await import('./hubAccess');

// ── in-memory settings table ────────────────────────────────────────────────
const settings = new Map<string, string>();
const thenable = (rows: () => unknown) => {
  const chain: Record<string, unknown> = {};
  for (const m of ['from', 'where', 'limit', 'values', 'onConflictDoUpdate']) chain[m] = () => chain;
  chain.then = (ok: (v: unknown) => unknown, bad?: (e: unknown) => unknown) => Promise.resolve().then(rows).then(ok, bad);
  return chain;
};
let pendingInsert: { key: string; value: string } | null = null;
(db as unknown as Record<string, unknown>).select = () =>
  thenable(() => (settings.has('hub_access_code') ? [{ value: settings.get('hub_access_code') }] : []));
(db as unknown as Record<string, unknown>).insert = () => {
  const chain = thenable(() => { if (pendingInsert) settings.set(pendingInsert.key, pendingInsert.value); pendingInsert = null; return []; });
  (chain as Record<string, unknown>).values = (v: { key: string; value: string }) => { pendingInsert = v; return chain; };
  return chain;
};
(db as unknown as Record<string, unknown>).delete = () => thenable(() => { settings.delete('hub_access_code'); return []; });

// ── app under test ──────────────────────────────────────────────────────────
const app = express();
app.use(cookieParser());
app.use(express.json());
app.use((req, _res, next) => {
  if (req.headers['x-test-teacher']) {
    (req as unknown as { studioUser: unknown }).studioUser = { id: 't1', role: 'teacher', accountStatus: 'active' };
  }
  next();
});
app.use(hubAccessGate);
const api = express.Router();
api.use(hubAccessRouter);
api.get('/healthz', (_req, res) => res.json({ status: 'ok' }));
api.get('/public/ping', (_req, res) => res.json({ pong: true }));
api.get('/kits/schools/X', (_req, res) => res.json({ kits: true }));
app.use('/api', api);

let base = '';
let server: ReturnType<typeof app.listen>;
before(async () => {
  server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
after(() => server.close());

const call = (path: string, init: RequestInit & { cookie?: string } = {}) =>
  fetch(base + path, { ...init, headers: { 'content-type': 'application/json', ...(init.cookie ? { cookie: init.cookie } : {}), ...(init.headers ?? {}) } });

function cookieFrom(res: Response): string {
  const set = res.headers.get('set-cookie') ?? '';
  const m = set.match(new RegExp(`${HUB_ACCESS_COOKIE}=([a-f0-9]+)`));
  assert.ok(m, `expected a ${HUB_ACCESS_COOKIE} cookie, got: ${set}`);
  assert.match(set, /HttpOnly/i);
  assert.match(set, /Secure/i);
  return `${HUB_ACCESS_COOKIE}=${m![1]}`;
}

describe('hub access gate', () => {
  it('reports that a code is required and blocks the API without it', async () => {
    const status = await call('/api/hub-access').then((r) => r.json());
    assert.deepEqual(status, { required: true, granted: false });
    const blocked = await call('/api/public/ping');
    assert.equal(blocked.status, 403);
    assert.equal((await blocked.json()).code, 'hub_locked');
  });

  it('leaves health checks and the kits API open', async () => {
    assert.equal((await call('/api/healthz')).status, 200);
    assert.equal((await call('/api/kits/schools/X')).status, 200);
  });

  it('rejects a wrong code and accepts the right one in any spelling', async () => {
    const wrong = await call('/api/hub-access', { method: 'POST', body: JSON.stringify({ code: 'NOPE-0000' }) });
    assert.equal(wrong.status, 401);
    const right = await call('/api/hub-access', { method: 'POST', body: JSON.stringify({ code: ' lincoln-2026 ' }) });
    assert.equal(right.status, 200);
    const cookie = cookieFrom(right);
    const ok = await call('/api/public/ping', { cookie });
    assert.equal(ok.status, 200);
    assert.deepEqual(await call('/api/hub-access', { cookie }).then((r) => r.json()), { required: true, granted: true });
  });

  it('lets a signed-in Studio user through without the cookie', async () => {
    const res = await call('/api/public/ping', { headers: { 'x-test-teacher': '1' } });
    assert.equal(res.status, 200);
  });

  it('teacher can change the code, which signs everyone out, and turn it off', async () => {
    const teacher = { 'x-test-teacher': '1' };
    const grant = await call('/api/hub-access', { method: 'POST', body: JSON.stringify({ code: 'LINCOLN-2026' }) });
    const oldCookie = cookieFrom(grant);

    const view = await call('/api/teacher/hub-access', { headers: teacher }).then((r) => r.json());
    assert.deepEqual(view, { code: 'LINCOLN-2026', source: 'env', envCode: true });

    const changed = await call('/api/teacher/hub-access', { method: 'PUT', headers: teacher, body: JSON.stringify({ code: 'owls 2027' }) });
    assert.deepEqual(await changed.json(), { code: 'OWLS-2027', source: 'settings', envCode: true });
    // the cache is per process; a fresh read sees the new code immediately because the write clears it
    assert.equal((await call('/api/public/ping', { cookie: oldCookie })).status, 403, 'old cookie no longer valid');
    const again = await call('/api/hub-access', { method: 'POST', body: JSON.stringify({ code: 'OWLS-2027' }) });
    assert.equal((await call('/api/public/ping', { cookie: cookieFrom(again) })).status, 200);

    const bad = await call('/api/teacher/hub-access', { method: 'PUT', headers: teacher, body: JSON.stringify({ code: 'a!' }) });
    assert.equal(bad.status, 400);

    const off = await call('/api/teacher/hub-access', { method: 'PUT', headers: teacher, body: JSON.stringify({ code: '' }) });
    assert.deepEqual(await off.json(), { code: '', source: 'settings', envCode: true });
    assert.deepEqual(await call('/api/hub-access').then((r) => r.json()), { required: false, granted: true });
    assert.equal((await call('/api/public/ping')).status, 200, 'hub is open');

    const reset = await call('/api/teacher/hub-access', { method: 'DELETE', headers: teacher });
    assert.deepEqual(await reset.json(), { code: 'LINCOLN-2026', source: 'env', envCode: true });
    assert.equal((await call('/api/public/ping')).status, 403, 'back to the hub\'s original code');
  });

  it('teacher endpoints need a teacher', async () => {
    assert.equal((await call('/api/teacher/hub-access')).status, 403);
  });
});
