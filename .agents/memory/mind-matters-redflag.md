---
name: Mind Matters red-flag journal alerts
description: How concerning journal entries are detected and flagged to the admin.
---

## Location
`artifacts/api-server/src/routes/journal.ts` — `containsRedFlag()` function + `sendRedFlagAlert()`.

## Keywords scanned
Checks `content.toLowerCase()` for: "kill myself", "end my life", "suicide", "suicidal", "hurt myself", "harm myself", "self-harm", "self harm", "don't want to live", "want to die", "cut myself", "cutting myself", "no reason to live", "worthless", "not worth living", "nobody cares", "everyone hates me", "rather be dead".

## Alert behavior
- Flagged entries are saved to DB with `flagged: true`
- Email sent to `elittle9514@gmail.com` via nodemailer (same SMTP config as blog)
- Requires env vars: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
- Fire-and-forget (`.catch(() => {})`) — save always succeeds even if email fails

## Student-facing message
Students see: "If your writing expresses something concerning, a trusted adult will be notified to check in with you." — so they're informed but not scared off from writing.
