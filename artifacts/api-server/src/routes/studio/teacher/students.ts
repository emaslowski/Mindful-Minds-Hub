import bcrypt from 'bcryptjs';
import { db } from '@workspace/db';
import {
  studioAccountsTable,
  studioStudentProfilesTable,
  studioTeamsTable,
  studioJobsTable,
  studioClassCyclesTable,
  studioProjectsTable,
} from '@workspace/db/schema';
import { eq, and, count, desc } from 'drizzle-orm';
import { Router, type Request, type Response } from 'express';
import { requireStudioRole } from '../../../middlewares/studioAuthMiddleware';

const router = Router();

// GET /api/teacher/students — list all students with profiles
router.get(
  '/teacher/students',
  requireStudioRole('teacher'),
  async (req: Request, res: Response) => {
    const students = await db
      .select({
        id: studioAccountsTable.id,
        username: studioAccountsTable.username,
        displayName: studioAccountsTable.displayName,
        accountStatus: studioAccountsTable.accountStatus,
        createdAt: studioAccountsTable.createdAt,
        teamId: studioStudentProfilesTable.teamId,
        teamName: studioTeamsTable.name,
        jobId: studioStudentProfilesTable.jobId,
        jobTitle: studioJobsTable.title,
        cycleId: studioStudentProfilesTable.cycleId,
        cycleName: studioClassCyclesTable.name,
        className: studioStudentProfilesTable.className,
      })
      .from(studioAccountsTable)
      .leftJoin(
        studioStudentProfilesTable,
        eq(studioStudentProfilesTable.accountId, studioAccountsTable.id),
      )
      .leftJoin(studioTeamsTable, eq(studioStudentProfilesTable.teamId, studioTeamsTable.id))
      .leftJoin(studioJobsTable, eq(studioStudentProfilesTable.jobId, studioJobsTable.id))
      .leftJoin(studioClassCyclesTable, eq(studioStudentProfilesTable.cycleId, studioClassCyclesTable.id))
      .where(eq(studioAccountsTable.role, 'student'))
      .orderBy(studioAccountsTable.displayName);

    res.json({ students });
  },
);

// POST /api/teacher/students — create a student account
router.post(
  '/teacher/students',
  requireStudioRole('teacher'),
  async (req: Request, res: Response) => {
    const { username, password, displayName, teamId, jobId, cycleId, className } = req.body as {
      username?: string;
      password?: string;
      displayName?: string;
      teamId?: number;
      jobId?: number;
      cycleId?: number;
      className?: string;
    };

    if (!username?.trim() || !password || !displayName?.trim()) {
      res.status(400).json({ error: 'username, password, and displayName are required' });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [account] = await db
      .insert(studioAccountsTable)
      .values({
        username: username.trim().toLowerCase(),
        passwordHash,
        displayName: displayName.trim(),
        role: 'student',
        accountStatus: 'active',
      })
      .returning();

    const [profile] = await db
      .insert(studioStudentProfilesTable)
      .values({
        accountId: account.id,
        teamId: teamId ?? null,
        jobId: jobId ?? null,
        cycleId: cycleId ?? null,
        className: className ?? null,
      })
      .returning();

    res.status(201).json({ account: { ...account, passwordHash: undefined }, profile });
  },
);

// PATCH /api/teacher/students/:id — update student profile (team, job, cycle, status)
router.patch(
  '/teacher/students/:id',
  requireStudioRole('teacher'),
  async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const { teamId, jobId, cycleId, className, accountStatus, displayName, newPassword } = req.body as {
      teamId?: number | null;
      jobId?: number | null;
      cycleId?: number | null;
      className?: string;
      accountStatus?: 'active' | 'disabled';
      displayName?: string;
      newPassword?: string;
    };

    const [account] = await db
      .select()
      .from(studioAccountsTable)
      .where(and(eq(studioAccountsTable.id, id), eq(studioAccountsTable.role, 'student')));

    if (!account) {
      res.status(404).json({ error: 'Student not found' });
      return;
    }

    // Update account fields
    const accountUpdates: Partial<typeof studioAccountsTable.$inferInsert> = { updatedAt: new Date() };
    if (accountStatus) accountUpdates.accountStatus = accountStatus;
    if (displayName?.trim()) accountUpdates.displayName = displayName.trim();
    if (newPassword) {
      if (newPassword.length < 6) {
        res.status(400).json({ error: 'Password must be at least 6 characters' });
        return;
      }
      accountUpdates.passwordHash = await bcrypt.hash(newPassword, 12);
    }

    await db.update(studioAccountsTable).set(accountUpdates).where(eq(studioAccountsTable.id, id));

    // Upsert student profile
    const profileUpdates: Partial<typeof studioStudentProfilesTable.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (teamId !== undefined) profileUpdates.teamId = teamId;
    if (jobId !== undefined) profileUpdates.jobId = jobId;
    if (cycleId !== undefined) profileUpdates.cycleId = cycleId;
    if (className !== undefined) profileUpdates.className = className;

    await db
      .insert(studioStudentProfilesTable)
      .values({ accountId: id, ...profileUpdates })
      .onConflictDoUpdate({ target: studioStudentProfilesTable.accountId, set: profileUpdates });

    res.json({ success: true });
  },
);

// GET /api/teacher/students/:id/projects
router.get(
  '/teacher/students/:id/projects',
  requireStudioRole('teacher'),
  async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const projects = await db
      .select()
      .from(studioProjectsTable)
      .where(eq(studioProjectsTable.assignedStudentId, id))
      .orderBy(desc(studioProjectsTable.updatedAt));

    res.json({ projects });
  },
);

export default router;
