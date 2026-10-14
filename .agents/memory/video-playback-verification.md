---
name: Browser codec limits during video verification
description: Separate storage/streaming checks from browser codec support when testing uploaded school videos.
---

When a video player's media error occurs during automated testing, test the same recording locally in that browser before assuming the upload or streaming implementation is broken.

**Why:** The development test browser rejected a valid H.264 MP4 both from its authenticated streaming endpoint and as a local data URL. The uploaded and original bytes matched, and authenticated range requests succeeded. Playback was therefore not verified despite successful upload and retrieval.

**How to apply:** Treat upload persistence, access control, byte delivery, and codec playback as separate checks. Use a browser-supported video encoding for future playback verification, and report unverified playback honestly rather than claiming the full media experience passed.
