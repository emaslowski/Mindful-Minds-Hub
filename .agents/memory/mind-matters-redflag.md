---
name: Mind Matters red-flag journal alerts
description: How concerning journal entries are detected and flagged to the admin.
---

## Location
`artifacts/api-server/src/routes/journal.ts` — `containsRedFlag()` function + `sendRedFlagAlert()`.

## Detection scope
The detector recognizes phrases and natural variations involving suicidal thoughts, self-harm, possible harm to others, abuse, hopelessness, social isolation, and self-deprecating statements such as feeling worthless, hated, unwanted, friendless, or like a failure.

**Why:** The alert is meant to prompt a trusted-adult check-in when a student may be in distress, rather than to diagnose a student or wait for a single exact phrase.

**How to apply:** Keep detection intentionally broad for self-hatred, isolation, and threats of harm. Normalize curly apostrophes before matching so common writing variations are covered.

## Alert behavior
- Flagged entries are saved to DB with `flagged: true`
- Email sent to `elittle9514@gmail.com` via nodemailer (same SMTP config as blog)
- Alert includes the student login email when the authenticated session has one
- Requires env vars: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
- Fire-and-forget (`.catch(() => {})`) — save always succeeds even if email fails

## Student-facing message
Students see: "If your writing expresses something concerning, a trusted adult will be notified to check in with you." — so they're informed but not scared off from writing.
