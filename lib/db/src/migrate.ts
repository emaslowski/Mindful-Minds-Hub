/**
 * Applies the latest Drizzle schema to the dev database by:
 * 1. Dropping old studio tables that no longer match the schema
 * 2. Creating new tables from the migration SQL
 *
 * Run with: cd lib/db && pnpm exec tsx src/migrate.ts
 */
import { db } from '.';
import { sql } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

const OLD_TABLES = [
  'safety_flags',
  'publications',
  'handoffs',
  'teacher_reviews',
  'peer_reviews',
  'sources',
  'project_contributors',
  'projects',
  'content_types',
  'class_cycles',
  'jobs',
  'teams',
  'studio_profiles', // old version — will be recreated
];

const OLD_ENUMS = [
  'studio_account_status',
  'studio_project_status',
  'studio_publication_status',
  'studio_role',
  'studio_teacher_decision',
];

async function main() {
  console.log('--- Dropping old tables ---');
  for (const table of OLD_TABLES) {
    try {
      await db.execute(sql.raw(`DROP TABLE IF EXISTS "${table}" CASCADE`));
      console.log(`  dropped: ${table}`);
    } catch (e) {
      console.warn(`  warning dropping ${table}:`, (e as Error).message);
    }
  }

  console.log('--- Dropping old enums ---');
  for (const e of OLD_ENUMS) {
    try {
      await db.execute(sql.raw(`DROP TYPE IF EXISTS "${e}" CASCADE`));
      console.log(`  dropped enum: ${e}`);
    } catch (err) {
      console.warn(`  warning dropping enum ${e}:`, (err as Error).message);
    }
  }

  console.log('--- Applying migration SQL ---');
  const migrationDir = path.join(import.meta.dirname, '..', 'drizzle');
  const files = fs
    .readdirSync(migrationDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const content = fs.readFileSync(path.join(migrationDir, file), 'utf-8');
    // Split on Drizzle statement separator
    const statements = content
      .split('--> statement-breakpoint')
      .map((s) => s.trim())
      .filter(Boolean);

    console.log(`  applying ${file} (${statements.length} statements)...`);
    for (const stmt of statements) {
      try {
        await db.execute(sql.raw(stmt));
      } catch (e: unknown) {
        const cause = (e as { cause?: { code?: string } }).cause;
        const pg = cause?.code ?? '';
        // 42P07 = relation already exists, 42710 = type already exists, 42P16 = constraint already exists
        if (['42P07', '42710', '42P16', '42P11'].includes(pg)) {
          console.warn(`    skipped (already exists): ${stmt.slice(0, 60)}...`);
        } else {
          console.error(`    ERROR in statement: ${stmt.slice(0, 80)}`);
          throw e;
        }
      }
    }
    console.log(`  ✓ ${file}`);
  }

  console.log('Migration complete.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
