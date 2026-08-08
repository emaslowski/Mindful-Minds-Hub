import { db } from '@workspace/db';
import {
  studioProfilesTable,
  studioProjectsTable,
  studioPublicationsTable,
  studioHandoffsTable,
  studioClassCyclesTable,
  studioImpactSettingsTable,
} from '@workspace/db/schema';
import { eq, count, and, sql } from 'drizzle-orm';
import { Router, type Request, type Response } from 'express';
import { requireStudioRole } from '../../../middlewares/studioAuthMiddleware';

const router = Router();

// GET /api/teacher/analytics — full analytics for teacher
router.get('/teacher/analytics', requireStudioRole('teacher'), async (_req, res) => {
  // Active students = enrolled profiles with accountStatus = 'active'
  const [activeStudents] = await db
    .select({ count: count() })
    .from(studioProfilesTable)
    .where(
      and(
        eq(studioProfilesTable.role, 'student'),
        eq(studioProfilesTable.accountStatus, 'active'),
      ),
    );

  const [totalProjects] = await db
    .select({ count: count() })
    .from(studioProjectsTable);

  const [pendingReview] = await db
    .select({ count: count() })
    .from(studioProjectsTable)
    .where(
      sql`${studioProjectsTable.status} IN ('Ready for Teacher Review', 'Teacher Reviewing')`,
    );

  const [published] = await db
    .select({ count: count() })
    .from(studioPublicationsTable)
    .where(eq(studioPublicationsTable.publicationStatus, 'active'));

  const [revisionNeeded] = await db
    .select({ count: count() })
    .from(studioProjectsTable)
    .where(eq(studioProjectsTable.status, 'Revision Needed'));

  const [handoffCount] = await db
    .select({ count: count() })
    .from(studioHandoffsTable);

  const [cycleCount] = await db
    .select({ count: count() })
    .from(studioClassCyclesTable);

  // Projects by status breakdown
  const statusBreakdown = await db
    .select({
      status: studioProjectsTable.status,
      count: count(),
    })
    .from(studioProjectsTable)
    .groupBy(studioProjectsTable.status);

  // Publications by content type
  const pubByType = await db
    .select({
      contentType: studioProjectsTable.contentType,
      count: count(),
    })
    .from(studioPublicationsTable)
    .innerJoin(studioProjectsTable, eq(studioPublicationsTable.projectId, studioProjectsTable.id))
    .where(eq(studioPublicationsTable.publicationStatus, 'active'))
    .groupBy(studioProjectsTable.contentType);

  // Impact settings
  const impactSettings = await db.select().from(studioImpactSettingsTable);

  res.json({
    summary: {
      activeStudents: activeStudents.count,
      totalProjects: totalProjects.count,
      pendingReview: pendingReview.count,
      published: published.count,
      revisionNeeded: revisionNeeded.count,
      handoffs: handoffCount.count,
      cycles: cycleCount.count,
    },
    statusBreakdown,
    pubByType,
    impactSettings,
  });
});

// PATCH /api/teacher/analytics/impact-settings — toggle which stats are public
router.patch(
  '/teacher/analytics/impact-settings',
  requireStudioRole('teacher'),
  async (req: Request, res: Response) => {
    const { settings } = req.body as {
      settings?: Array<{ settingKey: string; isVisible: boolean }>;
    };

    if (!Array.isArray(settings)) {
      res.status(400).json({ error: 'settings must be an array of { settingKey, isVisible }' });
      return;
    }

    for (const s of settings) {
      await db
        .update(studioImpactSettingsTable)
        .set({ isVisible: s.isVisible, updatedAt: new Date() })
        .where(eq(studioImpactSettingsTable.settingKey, s.settingKey));
    }

    res.json({ success: true });
  },
);

// GET /api/public/impact — teacher-controlled public stats (no auth required)
router.get('/public/impact', async (_req, res) => {
  const settings = await db
    .select()
    .from(studioImpactSettingsTable)
    .where(eq(studioImpactSettingsTable.isVisible, true));

  const visibleKeys = new Set(settings.map((s) => s.settingKey));
  const stats: Record<string, number> = {};

  if (visibleKeys.has('resources_published')) {
    const [r] = await db
      .select({ count: count() })
      .from(studioPublicationsTable)
      .where(eq(studioPublicationsTable.publicationStatus, 'active'));
    stats.resources_published = r.count;
  }

  if (visibleKeys.has('student_creators')) {
    const [r] = await db
      .select({ count: count() })
      .from(studioProfilesTable)
      .where(
        and(
          eq(studioProfilesTable.role, 'student'),
          eq(studioProfilesTable.accountStatus, 'active'),
        ),
      );
    stats.student_creators = r.count;
  }

  if (visibleKeys.has('projects_continued')) {
    const [r] = await db.select({ count: count() }).from(studioHandoffsTable);
    stats.projects_continued = r.count;
  }

  if (visibleKeys.has('class_cycles')) {
    const [r] = await db.select({ count: count() }).from(studioClassCyclesTable);
    stats.class_cycles = r.count;
  }

  res.json({ stats });
});

export default router;
