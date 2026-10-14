import { db } from '@workspace/db';
import { sql } from 'drizzle-orm';

/** Additive, idempotent migration, safe for existing school records. Run before
 * serving requests so publishing this feature cannot leave its table missing. */
export async function ensureStudioVideoProductions() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS studio_video_productions (
      id serial PRIMARY KEY,
      project_id integer NOT NULL UNIQUE REFERENCES studio_projects(id) ON DELETE CASCADE,
      producer_job_id integer NOT NULL REFERENCES studio_jobs(id),
      status text NOT NULL DEFAULT 'assigned',
      instructions text NOT NULL DEFAULT '',
      object_path text, filename text, mime_type text, size integer,
      pending_object_path text, pending_filename text, pending_mime_type text,
      pending_size integer, pending_expires_at timestamptz, uploaded_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);
}
