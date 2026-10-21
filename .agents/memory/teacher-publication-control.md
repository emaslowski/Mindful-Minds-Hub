---
name: Teacher publication control
description: Teacher-controlled website editions and separation from original student submissions.
---

Teachers must be able to edit how a project appears on its destination website
page before publishing, and revise that public edition later.

**Why:** The user said teacher Review & Publish would not publish, and asked to
edit the project to make it look exactly how they want on the website page.
They clarified that this includes "videos and pictures and recipes, etc.",
not only article text and formatting.

**How to apply:** Keep the students' original work intact. Teacher draft saves
must not silently change an already published page; only an explicit publish
or update action changes the public edition. Use the same rendering for the
teacher preview and the website so formatting choices match.

Teachers want to post separately in each Movement drill/activity section.
Directed Draws videos should play directly on the illustrated easel, not require
opening a separate story first.

**Why:** The user asked to post in each different Movement drill section and
to put a video right on the Directed Draws easel.

**How to apply:** Preserve section-specific placement and the normal explicit
teacher publishing step; uploading or saving alone must not expose a draft.

Verify all teacher decisions from the Teacher Reviewing state, not just the
publish path. Clearly distinguish preview verification from a live-site fix.

**Why:** The user reported that none of the review buttons worked after preview
publishing had been verified, while the live site still ran the older code.

**How to apply:** Check the live deployment and its errors when this recurs.
Use disposable development projects to verify decisions; never change real
student submissions merely to test the buttons.

## Preview copies of live publications

When the user requests preview copies, copy only the already-published edition,
not private student drafts, accounts, or assignments. Give copied media its own
storage object rather than sharing the live object's path.

**Why:** The user wanted existing live work visible in the redesign preview
without changing the originals. Independent media prevents later preview edits
or deletions from affecting a live image.

**How to apply:** Import into development only, keep the published text and
appearance intact, and verify both the copied media and the unchanged live piece.
