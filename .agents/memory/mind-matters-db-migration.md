---
name: Mind Matters DB migration approach
description: How to apply schema changes to the dev DB when drizzle-kit push fails (TTY requirement)
---

## Problem
`drizzle-kit push` and `drizzle-kit push --force` both fail in non-TTY shells with:
"Interactive prompts require a TTY terminal" — triggered by `promptNamedWithSchemasConflict`
when drizzle detects tables that might be renames of existing ones.

## Working approach
1. `cd lib/db && npx drizzle-kit generate --name <label>` — generates SQL in `lib/db/drizzle/<N>_<label>.sql` (no TTY needed)
2. Apply directly: `psql "$DATABASE_URL" -f lib/db/drizzle/<file>.sql`
3. If only specific tables need creating, extract and apply them manually.

**Why:** drizzle-kit's interactive conflict resolution requires stdin/stdout TTY.
`--force` bypasses data-destructive prompts but NOT schema-conflict naming prompts.

## FK constraints
PostgreSQL does NOT support `ADD CONSTRAINT IF NOT EXISTS`. Use a DO block:
```sql
DO $$
BEGIN
  BEGIN
    ALTER TABLE t ADD CONSTRAINT c FOREIGN KEY ...;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;
```

## Schema history note
The `studio_profiles` and `studio_content_types` tables were in drizzle's snapshot
(migration 0000) but the actual DB only had the older `studio_student_profiles` /
`studio_accounts` tables from a different migration run. Tables were created manually
via psql to match the current drizzle schema.
