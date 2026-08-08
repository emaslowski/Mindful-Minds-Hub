import { type NextFunction, type Request, type Response } from 'express';
import {
  clearStudioSession,
  getStudioSession,
  getStudioSessionId,
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
 * Global studio middleware — optional, just attaches req.studioUser when a
 * valid studio session cookie is present. Does NOT block unauthenticated requests.
 */
export async function studioAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  req.isStudioAuthenticated = function () {
    return this.studioUser != null;
  };

  const sid = getStudioSessionId(req);
  if (!sid) {
    next();
    return;
  }

  const session = await getStudioSession(sid);
  if (!session?.studioUser) {
    await clearStudioSession(res, sid);
    next();
    return;
  }

  req.studioUser = session.studioUser;
  next();
}

/**
 * Middleware factory that requires the requesting user to have one of the
 * given roles. Returns 401 if not authenticated, 403 if wrong role,
 * 403 if account is disabled.
 */
export function requireStudioRole(...roles: ('teacher' | 'student')[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.studioUser) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    if (req.studioUser.accountStatus === 'disabled') {
      res.status(403).json({ error: 'Your account has been disabled. Please contact your teacher.' });
      return;
    }
    if (roles.length > 0 && !roles.includes(req.studioUser.role)) {
      res.status(403).json({ error: 'You do not have permission to access this resource' });
      return;
    }
    next();
  };
}
