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

## Local caption transcription

Local Whisper caption generation may need FFmpeg-decoded mono PCM arrays instead
of passing filenames into the transcription library.

**Why:** Faster Whisper's file decoder passed a removed `metadata_errors`
argument to the installed PyAV version. Decoding with FFmpeg avoided that
incompatibility and retained word-level timestamps.

**How to apply:** Keep transcription models and intermediates outside Git.
Check proper names against the site's established spelling before shipping
captions, and retain synchronized WebVTT tracks rather than burning text into
the video.

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

## MOV upload support

All website video-upload destinations must accept `.MOV` files, including teacher
publication media, Video Production, and direct Active Challenge submissions.
Normalize missing, generic, and alternate QuickTime browser MIME labels
consistently for validation, upload tickets, and the actual storage PUT.

**Why:** The user asked to “allow the whole website to accept .MOV videos.”

**How to apply:** Preserve existing upload limits and moderation. MOV acceptance
does not guarantee browser decoding of every codec; do not claim universal
playback or silently add transcoding as part of a format-validation change.
