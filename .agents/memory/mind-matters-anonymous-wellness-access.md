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

Students receiving private-access credentials use school-issued email addresses.

**Why:** The user confirmed this while reporting missing approval emails. School mail restrictions are a possibility, not a confirmed cause.

**How to apply:** Distinguish application send failures, mail-provider acceptance, and school delivery filtering. Do not claim receipt from a successful approval or absence of logged errors.

Private-access approval emails must use the authorized school Gmail connection, not the general website SMTP sender. Keep other website email workflows unchanged.

**Why:** The user requested the school Gmail account as the sender after students did not receive credential emails.

**How to apply:** Verify the connected mailbox matches the configured sender before transmitting credentials. Do not silently fall back to another account. Gmail acceptance is not proof of delivery; preserve the teacher's manual credential fallback and never log passwords.

## Private plant-growth observations

Plant observations use the same private-identity precedence as Journal: private Journal credentials first, otherwise the individual app login. A shared Studio group login alone must never grant plant-journal access, and observations must never enter teacher publishing or public student-video workflows.

**Why:** The user requested an optional private record across days, explicitly excluding sharing between students or shared groups while leaving publication and videos unchanged.

**How to apply:** Keep personal observation ownership separate from Studio identities. Explain which private login is active so students return to the same account rather than expecting journals to merge.