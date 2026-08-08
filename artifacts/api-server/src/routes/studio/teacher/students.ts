import { db } from '@workspace/db';
import {
  studioProfilesTable,
  studioTeamsTable,
  studioJobsTable,
  studioClassCyclesTable,
  studioProjectsTable,
  usersTable,
} from '@workspace/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { Router, type Request, type Response } from 'express';
import { requireStudioRole } from '../../../middlewares/studioAuthMiddleware';

const router = Router();

// GET /api/teacher/students — list all pre-created student profiles with linked user data
router.get(
  '/teacher/students',
  requireStudioRole('teacher'),
  async (_req, res) => {
    const students = await db
      .select({
        id: studioProfilesTable.id,
        email: studioProfilesTable.email,
        displayName: studioProfilesTable.displayName,
        accountStatus: studioProfilesTable.accountStatus,
        role: studioProfilesTable.role,
        createdAt: studioProfilesTable.createdAt,
        // Linked Google user (null if not yet logged in)
        userId: studioProfilesTable.userId,
        googleName: usersTable.firstName,
        // Assignment data
        teamId: studioProfilesTable.teamId,
        teamName: studioTeamsTable.name,
        jobId: studioProfilesTable.jobId,
        jobTitle: studioJobsTable.title,
        cycleId: studioProfilesTable.cycleId,
        cycleName: studioClassCyclesTable.name,
      })
      .from(studioProfilesTable)
      .leftJoin(usersTable, eq(studioProfilesTable.userId, usersTable.id))
      .leftJoin(studioTeamsTable, eq(studioProfilesTable.teamId, studioTeamsTable.id))
      .leftJoin(studioJobsTable, eq(studioProfilesTable.jobId, studioJobsTable.id))
      .leftJoin(studioClassCyclesTable, eq(studioProfilesTable.cycleId, studioClassCyclesTable.id))
      .where(eq(studioProfilesTable.role, 'student'))
      .orderBy(studioProfilesTable.displayName);

    res.json({ students });
  },
);

// POST /api/teacher/students — pre-create a student record by email
// The student doesn't have a Google account yet; they get enrolled by email.
router.post(
  '/teacher/students',
  requireStudioRole('teacher'),
  async (req: Request, res: Response) => {
    const { email, displayName, teamId, jobId, cycleId } = req.body as {
      email?: string;
      displayName?: string;
      teamId?: number;
      jobId?: number;
      cycleId?: number;
    };

    if (!email?.trim()) {
      res.status(400).json({ error: 'email is required' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    const [profile] = await db
      .insert(studioProfilesTable)
      .values({
        email: normalizedEmail,
        displayName: displayName?.trim() ?? null,
        role: 'student',
        accountStatus: 'active',
        teamId: teamId ?? null,
        jobId: jobId ?? null,
        cycleId: cycleId ?? null,
      })
      .onConflictDoNothing()
      .returning();

    if (!profile) {
      res.status(409).json({ error: 'A student with this email already exists' });
      return;
    }

    res.status(201).json({ profile });
  },
);

// PATCH /api/teacher/students/:id — update student profile (team, job, cycle, status, displayName)
router.patch(
  '/teacher/students/:id',
  requireStudioRole('teacher'),
  async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const { teamId, jobId, cycleId, accountStatus, displayName } = req.body as {
      teamId?: number | null;
      jobId?: number | null;
      cycleId?: number | null;
      accountStatus?: 'active' | 'disabled';
      displayName?: string;
    };

    const [existing] = await db
      .select()
      .from(studioProfilesTable)
      .where(and(eq(studioProfilesTable.id, id), eq(studioProfilesTable.role, 'student')));

    if (!existing) {
      res.status(404).json({ error: 'Student not found' });
      return;
    }

    const updates: Partial<typeof studioProfilesTable.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (accountStatus) updates.accountStatus = accountStatus;
    if (displayName?.trim()) updates.displayName = displayName.trim();
    if (teamId !== undefined) updates.teamId = teamId;
    if (jobId !== undefined) updates.jobId = jobId;
    if (cycleId !== undefined) updates.cycleId = cycleId;

    const [updated] = await db
      .update(studioProfilesTable)
      .set(updates)
      .where(eq(studioProfilesTable.id, id))
      .returning();

    res.json({ profile: updated });
  },
);

// GET /api/teacher/students/:id/projects
router.get(
  '/teacher/students/:id/projects',
  requireStudioRole('teacher'),
  async (req: Request, res: Response) => {
    const id = Number(req.params.id);

    // Look up the student profile to get their Google user ID
    const [profile] = await db
      .select({ userId: studioProfilesTable.userId })
      .from(studioProfilesTable)
      .where(and(eq(studioProfilesTable.id, id), eq(studioProfilesTable.role, 'student')));

    if (!profile) {
      res.status(404).json({ error: 'Student not found' });
      return;
    }

    if (!profile.userId) {
      // Student hasn't logged in yet — no projects
      res.json({ projects: [] });
      return;
    }

    const projects = await db
      .select()
      .from(studioProjectsTable)
      .where(eq(studioProjectsTable.assignedStudentId, profile.userId))
      .orderBy(desc(studioProjectsTable.updatedAt));

    res.json({ projects });
  },
);

export default router;
