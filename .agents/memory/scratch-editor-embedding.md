---
name: Scratch editor embedding
description: Distinguishes TurboWarp project-player embedding from full block-editor hosting.
---

The hosted TurboWarp full editor cannot be used as an in-site coding iframe. Its supported embeds are project players, not editable coding workspaces.

**Why:** A real browser showed “Invalid TurboWarp Embed” when loading the hosted editor in the classroom playground. The upstream editor explicitly checks whether it is framed. Successful HTTP requests and the absence of restrictive frame headers do not prove editor embedding works.

**How to apply:** Do not recommend the hosted editor iframe based on TurboWarp’s project-embedding documentation. Use a new-tab editor, or separately integrate and verify an appropriately licensed, self-hosted open-source editor. Test actual editing and .sb3 export/import before claiming the coding playground is working.

## Approved hosting

The user chose “Host Scratch on this site.” Keep the coding editor inside Games rather than replacing it with an external-editor-only workflow.

**Why:** The user explicitly chose self-hosting after learning that hosted TurboWarp does not allow full-editor embedding.

**How to apply:** Preserve the local editor and its source/license offer. Keep the editor isolated from the main site's signed-in session; do not grant same-origin sandbox access merely to satisfy upstream cookie or storage expectations.

## Browser verification

Check the testing browser's WebGL capability before treating Scratch's unsupported-browser dialog as an application defect.

**Why:** The standard capture/testing browser lacked WebGL, while locally launched Chromium with software rendering displayed the actual editor. The upstream bundle also expected cookie access during initialization, even without a Scratch account.

**How to apply:** Use a WebGL-capable browser or a local Chromium software renderer for game verification. Keep browser web security and the editor's sandbox enabled. Handle unavailable browser APIs without exposing real site cookies or storage.

For save/reopen verification, use a fresh editor session if file-picker automation hangs on a second selection.

**Why:** Local Chromium/CDP successfully loaded, edited, and exported a project, but its second file-selection command timed out without an application error. Loading the exported file first in a fresh session restored the edited block and its correct gameplay.

**How to apply:** Distinguish a file-picker automation failure from a genuine import failure. Reopen the exported file in a fresh session and execute the edited behavior; ZIP integrity alone does not verify the full round trip.
