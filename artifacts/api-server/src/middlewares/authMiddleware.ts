import type { AuthUser } from '@workspace/api-zod';
import { db } from '@workspace/db';
import { anonymousAccessAccountsTable } from '@workspace/db/schema';
import { eq } from 'drizzle-orm';
import { type NextFunction, type Request, type Response } from 'express';

import {
  clearSession,
  clearAnonymousSession,
  deleteSession,
  getAnonymousSessionId,
  getSession,
  getSessionId,
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

/**
 * The server-side session row (7-day TTL) is the source of truth for Google
 * and anonymous sessions. Sessions from any other provider (e.g. the retired
 * Replit sign-in) are no longer valid and force a fresh login.
 */
function validateProvider(session: SessionData): SessionData | null {
  return session.provider === 'google' || session.provider === 'anonymous'
    ? session
    : null;
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
  // Google authentication. Wellness routes opt into anonymousUser;
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

  const refreshed = validateProvider(session);
  if (!refreshed) {
    await clearSession(res, sid);
    next();
    return;
  }

  req.user = refreshed.user;
  req.authProvider = refreshed.provider;
  next();
}
