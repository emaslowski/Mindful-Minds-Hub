---
name: Mind Matters Studio job-group sessions
description: How job-group logins work in the Studio, the DB fix for job ownership, and the full peer-review workflow
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
- Sources access: same pattern in `sources.ts` via `canAccessProject()` helper.
- Peer reviews: job sessions use `peerReviewerJobId` on the project; `reviewerId` stored as `String(jobId)`.
- Teacher decisions from the password-based Command Center must resolve the active
  legacy `studio_accounts` teacher ID before inserting a teacher review; the admin
  session ID (`teacher-admin`) is not valid for the legacy integer FK.

**Why:** the password-based admin session is intentionally synthetic, while older
Studio databases still enforce `studio_teacher_reviews.teacher_id` against
`studio_accounts.id`.

**How to apply:** use the active teacher account as the review author when the
session ID is not numeric; retain the session ID fallback for newer databases.

## Workflow policy

See [Editorial and teacher review workflow](editorial-teacher-workflow.md) for the user's current review order and removal of a separate drafting stage. Editorial reviewers recommend changes; the teacher decides whether to return work for revisions.

## Columns Added to studio_projects
```sql
ALTER TABLE studio_projects ADD COLUMN IF NOT EXISTS job_id integer;
ALTER TABLE studio_projects ADD COLUMN IF NOT EXISTS peer_reviewer_job_id integer;
```

## Key Job IDs
- Editors and Designers: `jobId = 269`
- All other jobs: 267–292 range

## ContentWorkspace Format
Content stored as `## Section\nbody` text. `ContentPreview` component in `artifacts/studio/src/components/studio/ContentPreview.tsx` renders this as a styled site preview.

## Roster and Team Model

**The Rule:** The Studio is jobs-only. Teacher-managed student records are name-only roster entries; students do not receive individual usernames or passwords.

**Why:** The class works through shared job-group credentials, so individual account credentials and team management add unnecessary setup and confusion.

**How to apply:** Keep team navigation, team assignment controls, and team display out of the Studio UI. Preserve existing team data unless the user explicitly asks to remove it. Create roster records from a display name and manage access through job groups.

## Class Cycle Choices

**The Rule:** Student and handoff cycle selectors use only the `Even` and `Odd` class cycles.

**Why:** The class schedule alternates between two groups rather than using named seasonal cycles.

**How to apply:** Keep the Even and Odd cycle records available in the database and filter cycle dropdowns to those two choices.
