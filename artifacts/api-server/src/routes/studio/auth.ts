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
  getStudioSessionId,
} from '../../lib/studioAuth';
import { requireStudioRole } from '../../middlewares/studioAuthMiddleware';

const router = Router();

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
