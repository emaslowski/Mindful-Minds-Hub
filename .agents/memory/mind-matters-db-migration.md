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

Some Studio tables can also be missing optional columns declared in the current
Drizzle schema. Avoid `select()` of every table column on a user-facing read path
until its migration has been applied; select the fields that are required by the
response instead.

**Why:** a missing optional column causes the entire project-detail query to return
500, even when the UI only needs the older fields.

**How to apply:** reconcile the generated migration with the development database
when practical. Until then, use explicit compatible projections for legacy tables.
Before one-off data imports, inspect the actual destination columns through
`information_schema` rather than assuming every declared column exists.

## Adding details to existing requests
When evolving a request table that may already contain student submissions,
introduce newly collected fields as nullable at the database layer and require
them in the application only for new submissions. Teacher views must label
missing legacy details clearly instead of failing.

**Why:** PostgreSQL cannot add a `NOT NULL` column with no default to a populated
table. A migration must preserve historical requests so a deployment does not
fail or discard records.

**How to apply:** use server validation to enforce new required details, keep the
schema/migration nullable for legacy records, and verify the migration against a
fixture that already contains a request.
