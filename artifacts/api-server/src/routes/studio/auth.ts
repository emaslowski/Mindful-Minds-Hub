import crypto from 'crypto';
import { db } from '@workspace/db';
import {
  studioProfilesTable,
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

// POST /api/studio/auth/login — teacher username/password login
router.post('/studio/auth/login', async (req: Request, res: Response) => {
  const { username, password } = req.body ?? {};

  if (typeof username !== 'string' || typeof password !== 'string') {
    res.status(400).json({ error: 'Username and password required' });
    return;
  }

  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminUsername || !adminPassword) {
    res.status(503).json({ error: 'Teacher login is not configured on this server' });
    return;
  }

  // Timing-safe comparison to prevent enumeration attacks
  const usernameOk = username.length === adminUsername.length &&
    crypto.timingSafeEqual(Buffer.from(username), Buffer.from(adminUsername));
  const passwordOk = password.length === adminPassword.length &&
    crypto.timingSafeEqual(Buffer.from(password), Buffer.from(adminPassword));

  if (!usernameOk || !passwordOk) {
    res.status(401).json({ error: 'Invalid username or password' });
    return;
  }

  const adminEmails = (process.env.ADMIN_EMAILS ?? '')
    .split(',').map((e) => e.trim()).filter(Boolean);
  const teacherEmail = adminEmails[0] ?? adminUsername;

  const studioUser: StudioUserSession = {
    id: 'teacher-admin',
    email: teacherEmail,
    displayName: 'Teacher',
    role: 'teacher',
    accountStatus: 'active',
  };

  const sid = await createStudioSession({ studioUser });
  setStudioSessionCookie(res, sid);
  res.json({ user: studioUser });
});

// GET /api/studio/auth/me — returns current studio user or null
router.get('/studio/auth/me', (req: Request, res: Response) => {
  if (!req.studioUser) {
    res.json({ user: null });
    return;
  }
  res.json({ user: req.studioUser });
});

// POST /api/studio/auth/logout
router.post('/studio/auth/logout', async (req: Request, res: Response) => {
  const sid = getStudioSessionId(req);
  await clearStudioSession(res, sid);
  res.json({ success: true });
});

// GET /api/studio/auth/profile — student's own studio profile details
router.get(
  '/studio/auth/profile',
  requireStudioRole('student', 'teacher'),
  async (req: Request, res: Response) => {
    const userId = req.studioUser!.id;

    const [profile] = await db
      .select({
        id: studioProfilesTable.id,
        displayName: studioProfilesTable.displayName,
        accountStatus: studioProfilesTable.accountStatus,
        cycleId: studioProfilesTable.cycleId,
        teamId: studioProfilesTable.teamId,
        jobId: studioProfilesTable.jobId,
        cycleName: studioClassCyclesTable.name,
        teamName: studioTeamsTable.name,
        jobTitle: studioJobsTable.title,
        createdAt: studioProfilesTable.createdAt,
      })
      .from(studioProfilesTable)
      .leftJoin(studioClassCyclesTable, eq(studioProfilesTable.cycleId, studioClassCyclesTable.id))
      .leftJoin(studioTeamsTable, eq(studioProfilesTable.teamId, studioTeamsTable.id))
      .leftJoin(studioJobsTable, eq(studioProfilesTable.jobId, studioJobsTable.id))
      .where(eq(studioProfilesTable.userId, userId))
      .limit(1);

    res.json({ profile: profile ?? null });
  },
);

export default router;
