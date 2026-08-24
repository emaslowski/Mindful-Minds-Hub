---
name: Mind Matters peer-review identities
description: How peer reviews support individual and shared job-group reviewer sessions.
---

## Rule

Store peer-review records, individual peer-review assignments, and contributor
records as stable text Studio identities: an individual user ID or a job-group
ID such as `job-269`. Do not require them to reference the general `users`
table.

**Why:** Peer review is performed both by individual students and shared job
groups. A legacy database version used an integer foreign key to
`studio_accounts`, which cannot represent shared session identities. A foreign
key to `users` would similarly require impersonating or creating a person for a
job group.

**How to apply:** Reviewer-facing queries must filter review history by the
current session ID. Teachers may retrieve the full history. Preserve the
compatibility migrations that convert legacy integer reviewer and contributor
values to text without deleting historical work.

## Submission consistency

Serialize peer-review submission per project, check for an existing review by
the current reviewer identity, then create the review and advance project
status in the same transaction.

**Why:** Shared job credentials can be used in multiple tabs at once. Without
serialization, duplicate reviews can race each other and leave conflicting
workflow outcomes.

**How to apply:** Treat an existing review from the same identity as already
submitted, while allowing a separately assigned reviewer to submit after
reassignment. Submission and teacher reassignment must share the same
per-project transaction lock, and every assignment must clear the inactive
individual or job-group reviewer route.