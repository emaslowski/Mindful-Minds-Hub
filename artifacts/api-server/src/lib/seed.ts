import bcrypt from 'bcryptjs';
import { db } from '@workspace/db';
import {
  studioAccountsTable,
  studioJobsTable,
  studioTeamsTable,
  studioImpactSettingsTable,
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

    // Seed impact settings
    for (const settingKey of DEFAULT_IMPACT_KEYS) {
      await db
        .insert(studioImpactSettingsTable)
        .values({ settingKey, isVisible: false })
        .onConflictDoNothing();
    }

    // Seed teacher account from env vars if provided
    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (adminUsername && adminPassword) {
      const existing = await db
        .select()
        .from(studioAccountsTable)
        .where(eq(studioAccountsTable.username, adminUsername));

      if (existing.length === 0) {
        const passwordHash = await bcrypt.hash(adminPassword, 12);
        await db.insert(studioAccountsTable).values({
          username: adminUsername,
          passwordHash,
          displayName: 'Teacher',
          role: 'teacher',
          accountStatus: 'active',
        });
        logger.info({ username: adminUsername }, 'Teacher account created from env vars');
      }
    } else {
      logger.warn(
        'ADMIN_USERNAME and ADMIN_PASSWORD env vars not set — no teacher account auto-created.',
      );
    }

    logger.info('Studio seed completed');
  } catch (err) {
    logger.error({ err }, 'Studio seed failed');
  }
}
