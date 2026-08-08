import crypto from 'crypto';
import { db, sessionsTable } from '@workspace/db';
import { eq } from 'drizzle-orm';
import { type Request, type Response } from 'express';

export const STUDIO_SESSION_COOKIE = 'studio_sid';
export const STUDIO_SESSION_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface StudioUserSession {
  /** Google user ID (usersTable.id / Google sub) */
  id: string;
  email: string | null;
  displayName: string | null;
  role: 'teacher' | 'student';
  accountStatus: 'active' | 'disabled';
  // Student-only fields (from studioProfilesTable)
  teamId?: number | null;
  jobId?: number | null;
  cycleId?: number | null;
  teamName?: string | null;
  jobTitle?: string | null;
  cycleName?: string | null;
}

export interface StudioSessionData {
  studioUser: StudioUserSession;
}

export function getStudioSessionId(req: Request): string | undefined {
  const authHeader = req.headers['authorization'];
  if (authHeader?.startsWith('StudioBearer ')) {
    return authHeader.slice(13);
  }
  return req.cookies?.[STUDIO_SESSION_COOKIE];
}

export async function createStudioSession(data: StudioSessionData): Promise<string> {
  const sid = 'studio_' + crypto.randomBytes(32).toString('hex');
  await db.insert(sessionsTable).values({
    sid,
    sess: data as unknown as Record<string, unknown>,
    expire: new Date(Date.now() + STUDIO_SESSION_TTL),
  });
  return sid;
}

export async function getStudioSession(sid: string): Promise<StudioSessionData | null> {
  const [row] = await db
    .select()
    .from(sessionsTable)
    .where(eq(sessionsTable.sid, sid));

  if (!row || row.expire < new Date()) {
    if (row) await deleteStudioSession(sid);
    return null;
  }

  return row.sess as unknown as StudioSessionData;
}

export async function deleteStudioSession(sid: string): Promise<void> {
  await db.delete(sessionsTable).where(eq(sessionsTable.sid, sid));
}

export async function clearStudioSession(res: Response, sid?: string): Promise<void> {
  if (sid) await deleteStudioSession(sid);
  res.clearCookie(STUDIO_SESSION_COOKIE, { path: '/' });
}

export function setStudioSessionCookie(res: Response, sid: string): void {
  res.cookie(STUDIO_SESSION_COOKIE, sid, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: STUDIO_SESSION_TTL,
  });
}
