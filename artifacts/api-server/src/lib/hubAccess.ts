/**
 * School access code for a hub.
 *
 * A hub is a school's private space. When a code is set, every visitor types
 * it once (the browser then keeps a signed cookie for six months) before the
 * site, the Student Studio or any API call works. Teachers and students who
 * are already signed in to the Studio pass without the cookie.
 *
 * Where the code comes from, in order:
 *   1. Command Center → Settings → School access code (stored in the hub's
 *      database; an empty value there turns the gate off even if the env var
 *      is set);
 *   2. the HUB_ACCESS_CODE environment variable, set when the hub is created
 *      (scripts/new-school-hub.ps1 uses the school's kit code);
 *   3. nothing: the hub is open to anyone with the link.
 *
 * The cookie holds an HMAC of the code, so changing the code signs everyone
 * out of the hub at once.
 */
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import type { Request, RequestHandler, Response } from 'express';
import { db } from '@workspace/db';
import { studioAppSettingsTable } from '@workspace/db/schema';
import { eq } from 'drizzle-orm';

export const HUB_ACCESS_COOKIE = 'brightside_hub';
export const HUB_ACCESS_SETTINGS_KEY = 'hub_access_code';
const CODE_PATTERN = /^[A-Z0-9-]{4,32}$/;
const CACHE_MS = 15_000;
const COOKIE_MAX_AGE_MS = 180 * 24 * 60 * 60 * 1000;

/** Paths that stay open: health checks, the code endpoint itself, and the kits site's API. */
const OPEN_PREFIXES = ['/api/healthz', '/api/hub-access', '/api/kits/'];

export interface HubAccessSetting {
  /** Normalized code, or '' when the hub is open. */
  code: string;
  source: 'settings' | 'env' | 'none';
}

export function normalizeHubCode(raw: unknown): string {
  return String(raw ?? '').trim().toUpperCase().replace(/\s+/g, '-');
}

export function isValidHubCode(code: string): boolean {
  return CODE_PATTERN.test(code);
}

let cache: { at: number; value: HubAccessSetting } | null = null;

export async function getHubAccessCode(): Promise<HubAccessSetting> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.value;
  let value: HubAccessSetting;
  const row = await db
    .select({ value: studioAppSettingsTable.value })
    .from(studioAppSettingsTable)
    .where(eq(studioAppSettingsTable.key, HUB_ACCESS_SETTINGS_KEY))
    .limit(1)
    .then((r) => r[0]);
  if (row) {
    let stored = '';
    try {
      const parsed = JSON.parse(row.value) as { code?: unknown };
      stored = normalizeHubCode(parsed?.code);
    } catch {
      stored = '';
    }
    value = { code: isValidHubCode(stored) ? stored : '', source: 'settings' };
  } else {
    const env = normalizeHubCode(process.env.HUB_ACCESS_CODE);
    value = isValidHubCode(env) ? { code: env, source: 'env' } : { code: '', source: 'none' };
  }
  cache = { at: Date.now(), value };
  return value;
}

/** Saves the teacher's code. An empty string turns the gate off for this hub. */
export async function setHubAccessCode(code: string): Promise<HubAccessSetting> {
  const value = JSON.stringify({ code });
  await db
    .insert(studioAppSettingsTable)
    .values({ key: HUB_ACCESS_SETTINGS_KEY, value })
    .onConflictDoUpdate({ target: studioAppSettingsTable.key, set: { value, updatedAt: new Date() } });
  cache = null;
  return getHubAccessCode();
}

/** Forgets the teacher's choice so the HUB_ACCESS_CODE env var applies again. */
export async function resetHubAccessCode(): Promise<HubAccessSetting> {
  await db.delete(studioAppSettingsTable).where(eq(studioAppSettingsTable.key, HUB_ACCESS_SETTINGS_KEY));
  cache = null;
  return getHubAccessCode();
}

function secret(): string {
  const explicit = process.env.HUB_ACCESS_SECRET;
  if (explicit) return explicit;
  // Per-deployment material: the database connection (with its password) plus the
  // per-school database name, so two hubs never mint the same cookie.
  return createHash('sha256')
    .update(`${process.env.DATABASE_URL ?? ''}|${process.env.DATABASE_NAME ?? ''}|hub-access`)
    .digest('hex');
}

function tokenFor(code: string): string {
  return createHmac('sha256', secret()).update(code).digest('hex');
}

export function hasHubAccess(req: Request, code: string): boolean {
  const cookie = req.cookies?.[HUB_ACCESS_COOKIE];
  if (typeof cookie !== 'string' || cookie.length !== 64) return false;
  const expected = tokenFor(code);
  return timingSafeEqual(Buffer.from(cookie, 'utf8'), Buffer.from(expected, 'utf8'));
}

export function grantHubAccess(res: Response, code: string): void {
  res.cookie(HUB_ACCESS_COOKIE, tokenFor(code), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE_MS,
  });
}

export function revokeHubAccess(res: Response): void {
  res.clearCookie(HUB_ACCESS_COOKIE, { path: '/' });
}

/** True when this request may use the hub: no code set, valid cookie, or a signed-in Studio user. */
export async function requestMayEnter(req: Request): Promise<{ required: boolean; granted: boolean }> {
  const { code } = await getHubAccessCode();
  if (!code) return { required: false, granted: true };
  return { required: true, granted: !!req.studioUser || hasHubAccess(req, code) };
}

/**
 * Blocks API calls until the visitor has entered the school code. Static files
 * (the site and Studio shells) still load, so the browser can show the code
 * prompt; everything they display comes through the API, which is what this
 * guards.
 */
export const hubAccessGate: RequestHandler = async (req, res, next) => {
  if (!req.path.startsWith('/api/')) return next();
  if (OPEN_PREFIXES.some((p) => req.path === p || req.path.startsWith(p))) return next();
  try {
    const { granted } = await requestMayEnter(req);
    if (granted) return next();
  } catch (err) {
    req.log?.error({ err }, 'hub access check failed');
    return next(err);
  }
  res.setHeader('Cache-Control', 'private, no-store');
  res.status(403).json({ error: 'Enter your school code to use this hub.', code: 'hub_locked' });
};
