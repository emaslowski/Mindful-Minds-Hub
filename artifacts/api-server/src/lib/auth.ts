import crypto from 'crypto';
import type { AuthUser } from '@workspace/api-zod';
import { db, sessionsTable } from '@workspace/db';
import { eq } from 'drizzle-orm';
import { type Request, type Response } from 'express';
import * as client from 'openid-client';

export const GOOGLE_ISSUER_URL = 'https://accounts.google.com';
export const SESSION_COOKIE = 'sid';
export const ANONYMOUS_SESSION_COOKIE = 'anonymous_sid';
export const SESSION_TTL = 7 * 24 * 60 * 60 * 1000;

export interface SessionData {
  user: AuthUser;
  provider: 'google' | 'anonymous';
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
}

let googleOidcConfig: client.Configuration | null = null;

export async function getGoogleOidcConfig(): Promise<client.Configuration> {
  if (!googleOidcConfig) {
    googleOidcConfig = await client.discovery(
      new URL(GOOGLE_ISSUER_URL),
      process.env.GOOGLE_CLIENT_ID!,
      process.env.GOOGLE_CLIENT_SECRET!,
    );
  }
  return googleOidcConfig;
}

export async function createSession(data: SessionData): Promise<string> {
  const sid = crypto.randomBytes(32).toString('hex');
  await db.insert(sessionsTable).values({
    sid,
    sess: data as unknown as Record<string, unknown>,
    expire: new Date(Date.now() + SESSION_TTL),
  });
  return sid;
}

export async function getSession(sid: string): Promise<SessionData | null> {
  const [row] = await db
    .select()
    .from(sessionsTable)
    .where(eq(sessionsTable.sid, sid));

  if (!row || row.expire < new Date()) {
    if (row) await deleteSession(sid);
    return null;
  }

  return row.sess as unknown as SessionData;
}

export async function updateSession(
  sid: string,
  data: SessionData,
): Promise<void> {
  await db
    .update(sessionsTable)
    .set({
      sess: data as unknown as Record<string, unknown>,
      expire: new Date(Date.now() + SESSION_TTL),
    })
    .where(eq(sessionsTable.sid, sid));
}

export async function deleteSession(sid: string): Promise<void> {
  await db.delete(sessionsTable).where(eq(sessionsTable.sid, sid));
}

export async function clearSession(res: Response, sid?: string): Promise<void> {
  if (sid) await deleteSession(sid);
  res.clearCookie(SESSION_COOKIE, { path: '/' });
}

export async function clearAnonymousSession(res: Response, sid?: string): Promise<void> {
  if (sid) await deleteSession(sid);
  res.clearCookie(ANONYMOUS_SESSION_COOKIE, { path: '/' });
}

export function getSessionId(req: Request): string | undefined {
  const authHeader = req.headers['authorization'];
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  return req.cookies?.[SESSION_COOKIE];
}

export function getAnonymousSessionId(req: Request): string | undefined {
  return req.cookies?.[ANONYMOUS_SESSION_COOKIE];
}

export function setAnonymousSessionCookie(res: Response, sid: string): void {
  res.cookie(ANONYMOUS_SESSION_COOKIE, sid, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL,
  });
}
