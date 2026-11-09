// Applies the reviewed, repeatable SQL migrations in lib/db/post-merge/ to
// DATABASE_URL, each in its own transaction. Every file is written to be safe
// to run more than once, so this can run on every deploy.
//
// Usage: pnpm run db:migrate   (reads DATABASE_URL from the env or ./.env)
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const here = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.resolve(here, '../post-merge');

try {
  process.loadEnvFile(path.resolve(here, '../../../.env'));
} catch {
  // No .env file; rely on the real environment.
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is required.');
  process.exit(1);
}

const files = (await readdir(migrationsDir)).filter((f) => f.endsWith('.sql')).sort();
const client = new pg.Client({ connectionString: url, connectionTimeoutMillis: 10_000 });
await client.connect();
try {
  for (const file of files) {
    console.log(`Applying migration: ${file}`);
    const sql = await readFile(path.join(migrationsDir, file), 'utf8');
    await client.query('BEGIN');
    try {
      await client.query(sql);
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    }
  }
  console.log(`Applied ${files.length} migration(s).`);
} finally {
  await client.end();
}
