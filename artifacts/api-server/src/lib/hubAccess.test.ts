import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { Request, Response } from 'express';

process.env.DATABASE_URL ??= 'postgres://u:p@localhost:5432/placeholder';
process.env.HUB_ACCESS_SECRET = 'test-secret';
const { HUB_ACCESS_COOKIE, grantHubAccess, hasHubAccess, isValidHubCode, normalizeHubCode } = await import('./hubAccess');

function fakeResponse() {
  const cookies: Record<string, string> = {};
  const res = {
    cookie(name: string, value: string) { cookies[name] = value; return res; },
    clearCookie(name: string) { delete cookies[name]; return res; },
  } as unknown as Response;
  return { res, cookies };
}

describe('school access code', () => {
  it('normalizes what people type', () => {
    assert.equal(normalizeHubCode('  lincoln 2026 '), 'LINCOLN-2026');
    assert.equal(normalizeHubCode('Bright-Demo'), 'BRIGHT-DEMO');
    assert.equal(normalizeHubCode(undefined), '');
  });

  it('accepts only letters, numbers and dashes, 4 to 32 long', () => {
    assert.equal(isValidHubCode('LINCOLN-2026'), true);
    assert.equal(isValidHubCode('ABC'), false);
    assert.equal(isValidHubCode(''), false);
    assert.equal(isValidHubCode('BAD CODE!'), false);
    assert.equal(isValidHubCode('A'.repeat(33)), false);
  });

  it('grants a cookie that matches only the code it was minted for', () => {
    const { res, cookies } = fakeResponse();
    grantHubAccess(res, 'LINCOLN-2026');
    const token = cookies[HUB_ACCESS_COOKIE];
    assert.match(token, /^[a-f0-9]{64}$/);
    const req = { cookies: { [HUB_ACCESS_COOKIE]: token } } as unknown as Request;
    assert.equal(hasHubAccess(req, 'LINCOLN-2026'), true);
    assert.equal(hasHubAccess(req, 'LINCOLN-2027'), false, 'changing the code signs everyone out');
    assert.equal(hasHubAccess({ cookies: {} } as unknown as Request, 'LINCOLN-2026'), false);
    assert.equal(hasHubAccess({ cookies: { [HUB_ACCESS_COOKIE]: 'LINCOLN-2026' } } as unknown as Request, 'LINCOLN-2026'), false, 'the raw code is not a token');
  });
});
