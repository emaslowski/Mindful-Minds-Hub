---
name: Browser codec limits during video verification
description: Separate storage/streaming checks from browser codec support when testing uploaded school videos.
---

When a video player's media error occurs during automated testing, test the same recording locally in that browser before assuming the upload or streaming implementation is broken.

**Why:** The development test browser rejected a valid H.264 MP4 both from its authenticated streaming endpoint and as a local data URL. The uploaded and original bytes matched, and authenticated range requests succeeded. Playback was therefore not verified despite successful upload and retrieval.

**How to apply:** Treat upload persistence, access control, byte delivery, and codec playback as separate checks. Use a browser-supported video encoding for future playback verification, and report unverified playback honestly rather than claiming the full media experience passed.

For supplied homepage videos, retain an H.264/AAC MP4 and a VP9/Opus WebM
fallback so browsers without proprietary codec support can still play the video.

**Why:** The preview browser could download and verify the complete MP4 but could
not decode it; codec compatibility requires an alternate encoding, not a storage fix.

**How to apply:** Switch to the alternate format when the primary format fails;
keep the formats synchronized to the same complete recording and audio.

Keep browser byte-range responses bounded, and use chunked transfer for full
large-media downloads rather than advertising a huge fixed Content-Length.

**Why:** A valid 186 MB H.264/AAC meditation upload could be read from storage
but repeatedly aborted on the published site, while a 13 MB video worked.
Cloud Run limits non-chunked HTTP/1 responses to 32 MiB. Browsers often request
an open-ended range, which otherwise becomes one response for the entire file.

**How to apply:** Test open-ended and explicit large ranges, continuation,
tail metadata, and full downloads above 32 MiB—not just tiny range requests.
Preserve authentication and the active-publication media checks; do not replace
private serving with public storage URLs to work around playback failures.
