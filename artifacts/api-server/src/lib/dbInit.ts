import { readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { pool } from '@workspace/db';
import { logger } from './logger';

/**
 * First-boot database setup for a hub, so a new school's hub needs nothing but
 * an empty database (set DB_INIT_ON_START=1 on the service):
 *
 * 1. If the database has no tables yet, apply lib/db/schema-sql/*.sql, the full
 *    schema generated from the drizzle schema (`drizzle-kit generate`).
 * 2. Apply lib/db/post-merge/*.sql, the repeatable migrations. They are written
 *    to be safe to run on every start.
 *
 * The main hub was set up by hand and keeps DB_INIT_ON_START unset, so this
 * never touches it. Regenerate the snapshot when the schema changes:
 * see scripts/new-school-hub.ps1 for the command.
 */

function dbDir(): string {
  // The image runs from /app; in development the API runs from artifacts/api-server.
  for (const base of [process.cwd(), path.resolve(process.cwd(), '../..')]) {
    const dir = path.join(base, 'lib', 'db');
    if (existsSync(path.join(dir, 'post-merge'))) return dir;
  }
  throw new Error('lib/db was not found next to the server; cannot initialize the database.');
}

async function sqlFiles(dir: string): Promise<string[]> {
  if (!existsSync(dir)) return [];
  return (await readdir(dir)).filter((f) => f.endsWith('.sql')).sort().map((f) => path.join(dir, f));
}

export async function initDatabase(): Promise<void> {
  if (process.env.DB_INIT_ON_START !== '1') return;
  const dir = dbDir();
  const client = await pool.connect();
  try {
    const { rows } = await client.query<{ n: string }>(
      "SELECT count(*)::text AS n FROM information_schema.tables WHERE table_schema = 'public'",
    );
    const empty = Number(rows[0]?.n ?? 0) === 0;
    const files = [...(empty ? await sqlFiles(path.join(dir, 'schema-sql')) : []), ...(await sqlFiles(path.join(dir, 'post-merge')))];
    if (empty) logger.info({ files: files.length }, 'Empty database: creating the schema');
    for (const file of files) {
      const sql = await readFile(file, 'utf8');
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw new Error(`Database setup failed in ${path.basename(file)}: ${(err as Error).message}`);
      }
    }
    logger.info({ applied: files.length, createdSchema: empty }, 'Database setup complete');
  } finally {
    client.release();
  }
}
