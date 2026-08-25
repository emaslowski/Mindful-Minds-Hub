---
name: Mind Matters moderation concurrency
description: Safe ordering rules when approving or permanently deleting collaboration board posts.
---

## Rule

Serialize approval and permanent deletion of the same collaboration board post
with one per-post transaction lock. The deletion path must acquire that lock and
confirm the post is still pending before it deletes any associated comments.

**Why:** A check-then-delete sequence can otherwise observe a pending post,
allow approval to make it public, and then remove its comments before the
parent delete notices the status changed.

**How to apply:** Any future operation that changes a board post's approval
state or removes it must take the same lock. Keep the lock through the child
comment operation and parent mutation, and cover the approval-wins ordering in
an integration check.