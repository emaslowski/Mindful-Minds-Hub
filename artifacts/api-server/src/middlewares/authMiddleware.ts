import type { AuthUser } from '@workspace/api-zod';
import { db } from '@workspace/db';
import { anonymousAccessAccountsTable } from '@workspace/db/schema';
import { eq } from 'drizzle-orm';
import { type NextFunction, type Request, type Response } from 'express';
import * as oidc from 'openid-client';

import {
  clearSession,
  clearAnonymousSession,
  deleteSession,
  getAnonymousSessionId,
  getOidcConfig,
  getSession,
  getSessionId,
  updateSession,
  type SessionData,
} from '../lib/auth';

declare global {
  namespace Express {
    interface User extends AuthUser {}

    interface Request {
      isAuthenticated(): this is AuthedRequest;

      user?: User | undefined;
      anonymousUser?: User | undefined;
      authProvider?: SessionData['provider'];
    }

    export interface AuthedRequest {
      user: User;
    }
  }
}

async function refreshIfExpired(
  sid: string,
  session: SessionData,
): Promise<SessionData | null> {
  // Google sessions do not use Replit's token refresh — the session itself
  // is the source of truth (7-day TTL). Skip refresh for Google provider.
  if (session.provider === 'google' || session.provider === 'anonymous') return session;

  const now = Math.floor(Date.now() / 1000);
  if (!session.expires_at || now <= session.expires_at) return session;

  if (!session.refresh_token) return null;

  try {
    const config = await getOidcConfig();
    const tokens = await oidc.refreshTokenGrant(config, session.refresh_token);
    session.access_token = tokens.access_token;
    session.refresh_token = tokens.refresh_token ?? session.refresh_token;
    session.expires_at = tokens.expiresIn()
      ? now + tokens.expiresIn()!
      : session.expires_at;
    await updateSession(sid, session);
    return session;
  } catch {
    return null;
  }
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  req.isAuthenticated = function (this: Request) {
    return this.user != null;
  } as Request['isAuthenticated'];

  // Anonymous wellness access uses a dedicated identity so it never replaces
  // Replit/Google authentication. Wellness routes opt into anonymousUser;
  // generic and Studio routes continue to use the primary user session.
  const anonymousSid = getAnonymousSessionId(req);
  if (anonymousSid) {
    const session = await getSession(anonymousSid);
    if (session?.provider === 'anonymous' && session.user?.id) {
      const [account] = await db
        .select({ status: anonymousAccessAccountsTable.status })
        .from(anonymousAccessAccountsTable)
        .where(eq(anonymousAccessAccountsTable.userId, session.user.id))
        .limit(1);

      if (account?.status === 'active') {
        req.anonymousUser = session.user;
      }

      if (account?.status !== 'active') await deleteSession(anonymousSid);
    }

    if (!req.anonymousUser) await clearAnonymousSession(res);
  }

  const sid = getSessionId(req);
  if (!sid) {
    next();
    return;
  }

  const session = await getSession(sid);
  if (!session?.user?.id) {
    await clearSession(res, sid);
    next();
    return;
  }

  const refreshed = await refreshIfExpired(sid, session);
  if (!refreshed) {
    await clearSession(res, sid);
    next();
    return;
  }

  req.user = refreshed.user;
  req.authProvider = refreshed.provider;
  next();
}
