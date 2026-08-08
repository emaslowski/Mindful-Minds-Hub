import { type NextFunction, type Request, type Response } from 'express';

export type UserRole = 'teacher' | 'student' | 'none';

/**
 * Middleware factory that enforces role-based access control.
 * Returns 401 if the request is not authenticated, 403 if the user's
 * role is not in the allowed list.
 *
 * Usage:
 *   router.use('/studio', requireRole('student', 'teacher'), studioRouter);
 *   router.use('/teacher', requireRole('teacher'), teacherRouter);
 */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.isAuthenticated()) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const userRole = req.user?.role as UserRole | undefined;
    if (!userRole || !roles.includes(userRole)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
}
