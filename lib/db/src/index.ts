import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

/**
 * DATABASE_NAME swaps the database inside DATABASE_URL. Each school hub runs
 * as its own Cloud Run service against its own database on the shared Cloud
 * SQL instance, so every hub can use the one DATABASE_URL secret plus a plain
 * DATABASE_NAME env var (no password copied into another secret).
 */
export function resolveDatabaseUrl(url: string, name = process.env.DATABASE_NAME): string {
  if (!name) return url;
  if (!/^[a-z][a-z0-9_]{0,62}$/.test(name)) throw new Error(`DATABASE_NAME "${name}" is not a valid database name.`);
  // postgres://user:pass@host:port/dbname?query  or  postgres://user:pass@/dbname?host=/cloudsql/...
  return url.replace(/^([a-z]+:\/\/[^/?#]*\/)[^?#]*/i, `$1${name}`);
}

export const pool = new Pool({ connectionString: resolveDatabaseUrl(process.env.DATABASE_URL) });
export const db = drizzle(pool, { schema });

export * from "./schema";
