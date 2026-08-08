---
name: Mind Matters Google OAuth + roles
description: Google OAuth + role-based auth for Mind Matters Studio; studio_profiles enrollment table; how studioAuthMiddleware bridges to main Google session
---

# Mind Matters Google OAuth + Roles

## Rule
Google OAuth is the auth provider for the Studio. Replit OIDC is kept for legacy public routes. `studioProfilesTable` is the enrollment list — teacher pre-creates rows by email; `userId` is backfilled on first Google login by `determineRoleAndLinkProfile()` in `routes/auth.ts`.

**Why:** Main OIDC required a Replit account; school students use Google Workspace accounts. Students must be pre-enrolled by the teacher (no self-registration).

## How to apply
- `GET /api/auth/google` → Google login; callback sets role in session from `ADMIN_EMAILS` env var (teacher) or `studioProfilesTable` (student); 403 if neither.
- `studioAuthMiddleware` first checks a dedicated `studio_sid` cookie, then falls back to `req.user` (Google session) and auto-creates a studio session. No separate studio login needed.
- `StudioUserSession.id` is a `string` (Google sub / `usersTable.id` varchar), NOT a number.
- All Studio table FKs to user identity use `varchar` → `usersTable.id`, not integer.
- Column names kept backward-compat with routes: `assignedStudentId`, `peerReviewerId`, `reviewerId` (in peer_reviews), `teacherId` (in teacher_reviews), `studentId` (in project_contributors) — all are now `varchar`.
- `ADMIN_EMAILS` env var: comma-separated teacher emails. Teacher studio profile auto-seeded at server startup.
- `bcryptjs` is NOT installed — no password logic anywhere in the codebase (Task 10 adds password update later).
