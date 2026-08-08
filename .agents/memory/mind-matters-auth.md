---
name: Mind Matters auth setup
description: Replit Auth is wired into api-server and mind-matters frontend. Key quirks for future work.
---

## Setup
- Auth template files copied from `.local/skills/replit-auth/templates/`
- `lib/replit-auth-web` package added and linked to `artifacts/mind-matters`
- `useAuth()` imported from `@workspace/replit-auth-web` in all auth-gated pages

## Critical Quirk: mobile auth.ts imports
The auth route template imports `ExchangeMobileAuthorizationCodeBody`, `ExchangeMobileAuthorizationCodeResponse`, `LogoutMobileSessionResponse` from `@workspace/api-zod`. These are NOT generated because we don't have mobile-auth paths in the OpenAPI spec. Fix: inline a plain JS `parseMobileTokenBody()` validation function in `artifacts/api-server/src/routes/auth.ts` instead of importing those types.

**Why:** api-zod types are only generated for path-level operations. Component-only schemas don't get named exports that match the template's expected names.

## lib/replit-auth-web ImportMeta fix
The lib uses `import.meta.env.BASE_URL`. TypeScript complains because the lib's tsconfig doesn't include vite/client types. Fix: declare a global `interface ImportMeta { env: { BASE_URL: string } }` directly in `lib/replit-auth-web/src/use-auth.ts`.

**Why:** Adding `types: ["vite/client"]` to the tsconfig doesn't work because vite isn't in the lib's devDependencies.
