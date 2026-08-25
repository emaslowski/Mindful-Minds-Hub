---
name: Mind Matters moderation concurrency
description: Safe ordering rules when approving or permanently deleting collaboration board posts.
---

## Rule

Serialize approval and permanent deletion of the same collaboration board post
with one per-post transaction lock. Deletion is administrator-authorized for
both pending and already-approved posts.

**Why:** A check-then-delete sequence can otherwise observe a pending post,
allow approval to make it public, and then remove its comments without a clear
ordering. Approved-post deletion is now intentional, but it still must be
atomic with its child-comment cleanup.

**How to apply:** Any future operation that changes a board post's approval
state or removes it must take the same lock. Keep the lock through the child
comment operation and parent mutation, and require an explicit confirmation in
the administrator UI.