---
name: Mind Matters OpenAPI quirks
description: Known issues with the OpenAPI spec + orval codegen for this project.
---

## Zod v3 incompatible formats
Never use these in the spec — orval generates zod v4 syntax that fails typecheck:
- `format: email` → generates `z.email()` (v4 only)
- `format: uri` → generates `z.url()` (v4 only)
- `type: integer` → generates `z.number().int()` which was a past issue

**Fix:** Remove format validators, use plain `type: string` or `type: number`.

## Mobile auth schema naming
The auth template expects schemas named `ExchangeMobileAuthorizationCodeBody`, `ExchangeMobileAuthorizationCodeResponse`, `LogoutMobileSessionResponse` from `@workspace/api-zod`. These are only generated if there are path operations (POST /mobile-auth/token-exchange, POST /mobile-auth/logout) in the spec. Adding them only as component schemas is NOT sufficient.

**Why:** Orval names Zod schemas after the operation, not the component schema name.

## api-server esbuild
`api-server` uses esbuild to bundle. `zod` is NOT in its package.json, so `import * as z from 'zod'` in any api-server source file will fail. Use schema validation from `@workspace/api-zod` or plain JS checks instead.
