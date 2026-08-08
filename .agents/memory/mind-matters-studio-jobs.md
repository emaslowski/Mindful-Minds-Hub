---
name: Mind Matters Studio job-group sessions
description: How job-group logins work in the Studio and the DB fix required to support them
---

# Studio Job-Group Session DB Fix

## The Rule
Job-group sessions set `id: "job-{N}"` (a string) in the session. The `studio_projects` table has `assigned_student_id` and `peer_reviewer_id` as **integer** columns (referencing `studio_accounts`) in the actual DB — even though the Drizzle schema file says `varchar`. Passing the string `"job-NNN"` to these integer columns causes Postgres to throw "invalid input syntax for type integer".

**Why:** The actual DB was created in an earlier schema state. The Drizzle schema file was updated but the migration to change column types was never run.

## How to Apply
- Job sessions have `req.studioUser!.jobId` (number) in the session alongside `id: "job-NNN"`.
- For any query that would filter by `assignedStudentId`, check `if (req.studioUser!.jobId != null)` and use `eq(studioProjectsTable.jobId, req.studioUser!.jobId)` instead.
- Project creation: set `jobId` for job sessions, skip `assignedStudentId` and contributor insert.
- Access checks: use `isProjectOwner(project, user)` helper in `projects.ts` which handles both job and individual sessions.
- Peer reviews: return `[]` immediately for job sessions — no individual reviewer assignments.

## What Was Added to the DB
```sql
ALTER TABLE studio_projects ADD COLUMN IF NOT EXISTS job_id integer;
```
And `jobId: integer('job_id')` was added to `studioProjectsTable` in `lib/db/src/schema/studio.ts` (no FK constraint).

## Content Type Workspaces
- `artifacts/studio/src/components/studio/ContentWorkspace.tsx` — config-driven structured workspace for all 17 content types. Stores content as `## Section\nbody` formatted text (human-readable in teacher review).
- Added 3 new content types: `Video production`, `Music production`, `Social media campaign`.
- `CONTENT_TYPES` and `DESTINATION_SECTIONS` updated in `artifacts/studio/src/lib/studioApi.ts`.
