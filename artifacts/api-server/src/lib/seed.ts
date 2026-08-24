import { db } from '@workspace/db';
import {
  studioJobsTable,
  studioTeamsTable,
  studioClassCyclesTable,
  studioImpactSettingsTable,
  studioProfilesTable,
} from '@workspace/db/schema';
import { eq } from 'drizzle-orm';
import { logger } from './logger';

const DEFAULT_JOBS = [
  'Blog Writer',
  'Researcher',
  'Podcast Producer',
  'Podcast Host',
  'Creative Designer',
  'Wellness Activity Creator',
  'Calm Corner Designer',
  'Movement Team',
  'Healthy Habits Team',
  'Community Events Team',
  'Research / Fact Checker',
  'Editor',
  'Website Organization Team',
  'Data & Survey Team',
];

const DEFAULT_TEAMS = [
  'Stress & Coping',
  'Friendships',
  'Emotions',
  'School Stress',
  'Healthy Habits',
  'Calm Corner',
  'Podcasts',
  'Creative Activities',
  'Movement',
  'Community Connections',
];

const DEFAULT_CYCLES = ['Even', 'Odd'];

const DEFAULT_IMPACT_KEYS = [
  'resources_published',
  'student_creators',
  'resources_viewed',
  'projects_continued',
  'class_cycles',
  'articles',
  'podcasts',
  'activities',
];

export async function runSeed(): Promise<void> {
  try {
    // Seed default jobs
    for (const title of DEFAULT_JOBS) {
      await db
        .insert(studioJobsTable)
        .values({ title })
        .onConflictDoNothing();
    }

    // Seed default teams
    for (const name of DEFAULT_TEAMS) {
      await db
        .insert(studioTeamsTable)
        .values({ name })
        .onConflictDoNothing();
    }

    // The Studio alternates students between the Even and Odd cycles.
    for (const name of DEFAULT_CYCLES) {
      await db
        .insert(studioClassCyclesTable)
        .values({ name })
        .onConflictDoNothing();
    }

    // Seed impact settings
    for (const settingKey of DEFAULT_IMPACT_KEYS) {
      await db
        .insert(studioImpactSettingsTable)
        .values({ settingKey, isVisible: false })
        .onConflictDoNothing();
    }

    // Seed teacher studio profile from ADMIN_EMAILS if not already present.
    // This pre-creates a teacher profile so the first teacher login works without
    // needing a separate onboarding step.
    const adminEmails = (process.env.ADMIN_EMAILS ?? '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    for (const email of adminEmails) {
      const existing = await db
        .select()
        .from(studioProfilesTable)
        .where(eq(studioProfilesTable.email, email))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(studioProfilesTable).values({
          email,
          role: 'teacher',
          displayName: 'Teacher',
          accountStatus: 'active',
        });
        logger.info({ email }, 'Teacher studio profile created from ADMIN_EMAILS');
      }
    }

    if (adminEmails.length === 0) {
      logger.warn('ADMIN_EMAILS env var not set — no teacher profile auto-created.');
    }

    logger.info('Studio seed completed');
  } catch (err) {
    logger.error({ err }, 'Studio seed failed');
  }
}
