import { type NextFunction, type Request, type Response } from 'express';
import { db } from '@workspace/db';
import {
  studioProfilesTable,
  studioTeamsTable,
  studioJobsTable,
  studioClassCyclesTable,
} from '@workspace/db/schema';
import { eq } from 'drizzle-orm';
import {
  clearStudioSession,
  createStudioSession,
  getStudioSession,
  getStudioSessionId,
  setStudioSessionCookie,
  type StudioUserSession,
} from '../lib/studioAuth';

// Augment Express Request with studio user
declare global {
  namespace Express {
    interface Request {
      studioUser?: StudioUserSession;
      isStudioAuthenticated(): boolean;
    }
  }
}

/**
 * Build a StudioUserSession from a Google-authenticated user (req.user).
 * Looks up the studio profile and joins team/job/cycle names.
 * Returns null if the user has no studio profile or is not enrolled.
 */
async function buildStudioUserFromGoogleAuth(
  userId: string,
  email: string | null,
  role: string,
): Promise<StudioUserSession | null> {
  if (role !== 'teacher' && role !== 'student') return null;

  // Teacher — no profile needed
  if (role === 'teacher') {
    return {
      id: userId,
      email,
      displayName: null,
      role: 'teacher',
      accountStatus: 'active',
    };
  }

  // Student — look up studio profile
  const [profile] = await db
    .select({
      displayName: studioProfilesTable.displayName,
      accountStatus: studioProfilesTable.accountStatus,
      teamId: studioProfilesTable.teamId,
      jobId: studioProfilesTable.jobId,
      cycleId: studioProfilesTable.cycleId,
      teamName: studioTeamsTable.name,
      jobTitle: studioJobsTable.title,
      cycleName: studioClassCyclesTable.name,
    })
    .from(studioProfilesTable)
    .leftJoin(studioTeamsTable, eq(studioProfilesTable.teamId, studioTeamsTable.id))
    .leftJoin(studioJobsTable, eq(studioProfilesTable.jobId, studioJobsTable.id))
    .leftJoin(studioClassCyclesTable, eq(studioProfilesTable.cycleId, studioClassCyclesTable.id))
    .where(eq(studioProfilesTable.userId, userId))
    .limit(1);

  return {
    id: userId,
    email,
    displayName: profile?.displayName ?? null,
    role: 'student',
    accountStatus: profile?.accountStatus ?? 'active',
    teamId: profile?.teamId ?? null,
    jobId: profile?.jobId ?? null,
    cycleId: profile?.cycleId ?? null,
    teamName: profile?.teamName ?? null,
    jobTitle: profile?.jobTitle ?? null,
    cycleName: profile?.cycleName ?? null,
  };
}

/**
 * Global studio middleware — optional, attaches req.studioUser when a
 * valid session is present. Falls back to the Google-auth main session
 * (req.user) when no dedicated studio session cookie exists.
 */
export async function studioAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  req.isStudioAuthenticated = function () {
    return this.studioUser != null;
  };

  // 1. Try dedicated studio session cookie
  const sid = getStudioSessionId(req);
  if (sid) {
    const session = await getStudioSession(sid);
    if (session?.studioUser) {
      req.studioUser = session.studioUser;
      next();
      return;
    }
    await clearStudioSession(res, sid);
  }

  // 2. Fall back to Google OAuth main session (req.user set by authMiddleware)
  if (req.user?.id && req.user.role && req.user.role !== 'none') {
    const studioUser = await buildStudioUserFromGoogleAuth(
      req.user.id,
      req.user.email,
      req.user.role,
    );
    if (studioUser) {
      req.studioUser = studioUser;
      // Persist as a studio session so subsequent requests don't hit the DB every time
      const newSid = await createStudioSession({ studioUser });
      setStudioSessionCookie(res, newSid);
    }
  }

  next();
}

/**
 * Middleware factory that requires the requesting user to have one of the
 * given roles. Returns 401 if not authenticated, 403 if wrong role or disabled.
 */
export function requireStudioRole(...roles: ('teacher' | 'student')[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.studioUser) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    if (req.studioUser.accountStatus === 'disabled') {
      res
        .status(403)
        .json({ error: 'Your account has been disabled. Please contact your teacher.' });
      return;
    }
    if (roles.length > 0 && !roles.includes(req.studioUser.role)) {
      res.status(403).json({ error: 'You do not have permission to access this resource' });
      return;
    }
    next();
  };
}
