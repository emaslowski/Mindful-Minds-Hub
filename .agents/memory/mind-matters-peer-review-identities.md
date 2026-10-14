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

Serialize peer-review submission per project, prevent duplicate submissions
in the same review round, then create the review and advance project status
in the same transaction. A new peer-review round after revisions may be
reviewed by the same identity without deleting its earlier feedback.

**Why:** Shared job credentials can be used in multiple tabs at once. Without
serialization, duplicate reviews can race each other and leave conflicting
workflow outcomes.

**How to apply:** Treat an existing review from the same identity in the current
round as already submitted, while allowing a new round or a separately assigned
reviewer after reassignment. Submission and teacher reassignment must share the same
per-project transaction lock, and every assignment must clear the inactive
individual or job-group reviewer route.

## Group routing across environments

Do not assume a job group's numeric ID is the same in development and production.
Resolve the actual Editors & Designers group in the current database and recognize
its role independently of its numeric ID.

**Why:** A live Blog Writers submission was routed to a development-only job ID.
The published database had a different Editors & Designers ID, leaving the project
in Peer Review but invisible to the reviewers.

**How to apply:** If the editorial group is missing or ambiguous, fail before
advancing the project. Restore orphaned pending automatic assignments without
overwriting valid teacher-selected reviewers, deleting review history, changing
content, or requiring students to resubmit.