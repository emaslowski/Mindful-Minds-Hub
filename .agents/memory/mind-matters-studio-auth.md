---
name: Mind Matters Studio auth approach
description: Username/password auth for the student studio — why and how it's wired
---

## The decision
Google OAuth was abandoned because Google explicitly rejects `.replit.dev` domains as valid OAuth redirect URIs (they require a public TLD). Username + password (bcryptjs) was implemented instead.

## How it works
- `studio_accounts` table stores hashed passwords and role (`teacher` | `student`)
- Sessions use a **separate cookie** `studio_sid` (prefix `studio_`) stored in the existing `sessions` DB table — chosen so it never collides with the Replit OIDC `sid` cookie
- `src/lib/studioAuth.ts` — `createStudioSession`, `getStudioSession`, `deleteStudioSession`, `setStudioSessionCookie`
- `src/middlewares/studioAuthMiddleware.ts` — `studioAuthMiddleware` (globally attached, optional) + `requireStudioRole(...roles)` factory returning 401/403
- Teacher account auto-seeded from `ADMIN_USERNAME` / `ADMIN_PASSWORD` env vars on server startup (`src/lib/seed.ts`)
- Students cannot self-register; teacher creates accounts via Command Center

## API surface
- `POST /api/studio/auth/login` — sets `studio_sid` cookie
- `POST /api/studio/auth/logout` — clears cookie
- `GET /api/studio/auth/me` — returns `{ user: StudioUser | null }`
- `POST /api/studio/auth/change-password` — student can update own password

## Frontend hook
`useStudioAuth.ts` exports:
- `useStudioUser()` — TanStack Query wrapper around `/api/studio/auth/me`
- `useStudioLogout()` — mutation that clears cache and redirects to `/studio/login`
- `useRequireStudioRole(...roles)` — redirects unauthenticated users to `/studio/login`; redirects wrong-role users to their own dashboard root

**Why:** Studio pages live at `/studio/*` within the existing mind-matters Vite app. The `AppRouter` component detects `/studio` prefix and renders `StudioRouter` (bypasses the public `Layout`). All other paths go through `PublicRouter` with the original `Layout` unchanged.
