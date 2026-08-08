import bcrypt from 'bcryptjs';
import { db } from '@workspace/db';
import {
  studioAccountsTable,
  studioStudentProfilesTable,
  studioTeamsTable,
  studioJobsTable,
  studioClassCyclesTable,
} from '@workspace/db/schema';
import { eq } from 'drizzle-orm';
import { Router, type Request, type Response } from 'express';
import {
  clearStudioSession,
  createStudioSession,
  getStudioSessionId,
  setStudioSessionCookie,
  type StudioUserSession,
} from '../../lib/studioAuth';
import { requireStudioRole } from '../../middlewares/studioAuthMiddleware';

const router = Router();

// POST /api/studio/auth/login
router.post('/studio/auth/login', async (req: Request, res: Response) => {
  const { username, password } = req.body as { username?: string; password?: string };

  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }

  const [account] = await db
    .select()
    .from(studioAccountsTable)
    .where(eq(studioAccountsTable.username, username.trim().toLowerCase()));

  if (!account) {
    res.status(401).json({ error: 'Invalid username or password' });
    return;
  }

  if (account.accountStatus === 'disabled') {
    res.status(403).json({ error: 'Your account has been disabled. Please contact your teacher.' });
    return;
  }

  const valid = await bcrypt.compare(password, account.passwordHash);
  if (!valid) {
    res.status(401).json({ error: 'Invalid username or password' });
    return;
  }

  // Build session user — include student profile data if student
  const sessionUser: StudioUserSession = {
    id: account.id,
    username: account.username,
    displayName: account.displayName,
    role: account.role,
    accountStatus: account.accountStatus,
  };

  if (account.role === 'student') {
    const [profile] = await db
      .select({
        teamId: studioStudentProfilesTable.teamId,
        jobId: studioStudentProfilesTable.jobId,
        cycleId: studioStudentProfilesTable.cycleId,
        className: studioStudentProfilesTable.className,
        teamName: studioTeamsTable.name,
        jobTitle: studioJobsTable.title,
        cycleName: studioClassCyclesTable.name,
      })
      .from(studioStudentProfilesTable)
      .leftJoin(studioTeamsTable, eq(studioStudentProfilesTable.teamId, studioTeamsTable.id))
      .leftJoin(studioJobsTable, eq(studioStudentProfilesTable.jobId, studioJobsTable.id))
      .leftJoin(studioClassCyclesTable, eq(studioStudentProfilesTable.cycleId, studioClassCyclesTable.id))
      .where(eq(studioStudentProfilesTable.accountId, account.id));

    if (profile) {
      sessionUser.teamId = profile.teamId;
      sessionUser.jobId = profile.jobId;
      sessionUser.cycleId = profile.cycleId;
      sessionUser.className = profile.className;
      sessionUser.teamName = profile.teamName;
      sessionUser.jobTitle = profile.jobTitle;
      sessionUser.cycleName = profile.cycleName;
    }
  }

  const sid = await createStudioSession({ studioUser: sessionUser });
  setStudioSessionCookie(res, sid);

  res.json({ user: sessionUser });
});

// POST /api/studio/auth/logout
router.post('/studio/auth/logout', async (req: Request, res: Response) => {
  const sid = getStudioSessionId(req);
  await clearStudioSession(res, sid);
  res.json({ success: true });
});

// GET /api/studio/auth/me — returns current studio user or null
router.get('/studio/auth/me', (req: Request, res: Response) => {
  if (!req.studioUser) {
    res.json({ user: null });
    return;
  }
  res.json({ user: req.studioUser });
});

// POST /api/studio/auth/change-password — student can change their own password
router.post(
  '/studio/auth/change-password',
  requireStudioRole('student', 'teacher'),
  async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body as {
      currentPassword?: string;
      newPassword?: string;
    };

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Current and new password are required' });
      return;
    }
    if (newPassword.length < 8) {
      res.status(400).json({ error: 'New password must be at least 8 characters' });
      return;
    }

    const [account] = await db
      .select()
      .from(studioAccountsTable)
      .where(eq(studioAccountsTable.id, req.studioUser!.id));

    if (!account) {
      res.status(404).json({ error: 'Account not found' });
      return;
    }

    const valid = await bcrypt.compare(currentPassword, account.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Current password is incorrect' });
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await db
      .update(studioAccountsTable)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(studioAccountsTable.id, account.id));

    res.json({ success: true });
  },
);

export default router;
