---
name: Mind Matters anonymous wellness access
description: Session-boundary rule for anonymous journal/gratitude access alongside existing OAuth and Studio authentication.
---

Anonymous wellness credentials are an independently validated secondary identity for journal and gratitude routes, and may also be used to request Friendship Matchmaker participation. They must never overwrite the primary Replit/Google identity that powers normal app behavior and Studio authorization. Matchmaker consent and approval remain separate from Journal access.

**Why:** A browser can hold anonymous wellness access and an OAuth/Studio session at the same time. Treating the anonymous identity as global masks the authenticated user and breaks normal Studio role resolution. The user explicitly chose Journal credentials as sufficient to request Matchmaker access, but that does not authorize matching without a separate teacher decision. Disabling a code must also invalidate the anonymous session centrally, not only in a page handler.

**How to apply:** Keep anonymous access in its own cookie/session and request field. Wellness routes may explicitly prefer it; Matchmaker may explicitly accept it after separate opt-in and approval, without exposing journal entries. Global identity and Studio authentication use the primary session. Any app-wide logout should deliberately clear both session types, while anonymous-only logout can stay local.

## Credential delivery

New wellness-access requests collect a student email alongside the approval details, and approval sends the new code and password to that address. This replaces requiring the student to show a request ID in person.

**Why:** The credential handoff needs to work remotely while keeping Student Studio authentication separate.

**How to apply:** Require and validate an email for new requests, retain nullable email fields for legacy requests, and show teachers clear delivery status with a manual fallback if sending fails. Do not reuse this email to create, authorize, or sign into a Studio account.

## Private plant-growth observations

Plant observations use the same private-identity precedence as Journal: private Journal credentials first, otherwise the individual app login. A shared Studio group login alone must never grant plant-journal access, and observations must never enter teacher publishing or public student-video workflows.

**Why:** The user requested an optional private record across days, explicitly excluding sharing between students or shared groups while leaving publication and videos unchanged.

**How to apply:** Keep personal observation ownership separate from Studio identities. Explain which private login is active so students return to the same account rather than expecting journals to merge.