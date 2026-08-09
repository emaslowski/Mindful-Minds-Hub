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

## Workflow Stages (job-group flow)

1. **Assigned** → student creates project
2. **Researching** → Sources tab auto-focuses; student adds citations; "Done Researching" button in Sources tab
3. **Drafting** → Preview tab appears (renders `## Section\nbody` content as styled site preview)
4. **Peer Review** → auto-assigns `peerReviewerJobId = 269` (Editors & Designers); E&D sees it in their `/studio/peer-reviews` inbox; E&D submits checklist → advances to Ready for Teacher Review or Revision Needed
5. **Revision Needed** → student sees teacher feedback banner (from `GET /studio/projects/:id/teacher-feedback`)
6. **Ready for Teacher Review** → appears in teacher Command Center; teacher approves or returns with comment
7. **Teacher Reviewing / Approved / Published** → teacher-controlled

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
