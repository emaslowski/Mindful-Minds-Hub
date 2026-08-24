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
import { randomUUID } from 'node:crypto';

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

// POST /api/teacher/students — create a name-only student roster record.
// Students use their job group's login, so an individual username/password is
// not needed. A private placeholder email satisfies the profile identity field.
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

    if (!displayName?.trim()) {
      res.status(400).json({ error: 'displayName is required' });
      return;
    }

    const normalizedEmail = email?.trim().toLowerCase()
      || `student-${randomUUID()}@mindmatters.local`;

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

// POST /api/teacher/students/bulk — bulk pre-enroll students by email list
// Stub: imports a list of { email, displayName?, cycleId?, teamId?, jobId? } and
// inserts them, skipping duplicates. Returns counts for created / skipped rows.
router.post(
  '/teacher/students/bulk',
  requireStudioRole('teacher'),
  async (req: Request, res: Response) => {
    const { students } = req.body as {
      students?: Array<{
        email?: string;
        displayName?: string;
        teamId?: number;
        jobId?: number;
        cycleId?: number;
      }>;
    };

    if (!Array.isArray(students) || students.length === 0) {
      res.status(400).json({ error: 'students array is required and must not be empty' });
      return;
    }

    let created = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const s of students) {
      if (!s.email?.trim()) {
        errors.push(`Skipped row with missing email`);
        skipped++;
        continue;
      }
      const normalizedEmail = s.email.trim().toLowerCase();
      const [inserted] = await db
        .insert(studioProfilesTable)
        .values({
          email: normalizedEmail,
          displayName: s.displayName?.trim() ?? null,
          role: 'student',
          accountStatus: 'active',
          teamId: s.teamId ?? null,
          jobId: s.jobId ?? null,
          cycleId: s.cycleId ?? null,
        })
        .onConflictDoNothing()
        .returning();

      if (inserted) {
        created++;
      } else {
        skipped++;
      }
    }

    res.status(201).json({ created, skipped, errors });
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
