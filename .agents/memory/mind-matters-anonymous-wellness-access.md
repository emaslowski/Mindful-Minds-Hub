---
name: Mind Matters anonymous wellness access
description: Session-boundary rule for anonymous journal/gratitude access alongside existing OAuth and Studio authentication.
---

Anonymous wellness credentials are an independently validated secondary identity for journal and gratitude routes only. They must never overwrite or take precedence over the primary Replit/Google identity that powers normal app behavior and Studio authorization.

**Why:** A browser can hold anonymous wellness access and an OAuth/Studio session at the same time. Treating the anonymous identity as global masks the authenticated user and breaks normal Studio role resolution. Disabling a code must also invalidate the anonymous session centrally, not only in a page handler.

**How to apply:** Keep anonymous access in its own cookie/session and request field. Wellness routes may explicitly prefer it; global identity and Studio authentication use the primary session. Any app-wide logout should deliberately clear both session types, while anonymous-only logout can stay local.