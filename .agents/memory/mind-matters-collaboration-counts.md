---
name: Mind Matters collaboration counts
description: Public collaboration-board count and visibility rules for comments awaiting moderation.
---

## Rule

Count submitted collaboration comments, including those awaiting authorization,
but expose comment text only after a moderator approves it. Use a grouped
post/comment relationship when calculating the count.

**Why:** Students need immediate feedback that their contribution registered,
while moderation requires the text itself to remain private. A scalar
relationship count did not reliably reflect a just-created pending comment.

**How to apply:** Refresh the board count after a successful comment
submission and when the board regains focus. Pair a nonzero pending count with
clear wording that unapproved comments will appear only after authorization.