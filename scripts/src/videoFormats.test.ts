import { test } from "node:test";
import assert from "node:assert/strict";
import { uploadVideoContentType } from "../../lib/api-client-react/src/video-file";
import { RequestAthleteUploadBody, RequestPublicationMediaUploadBody, RequestVideoUploadBody } from "../../lib/api-zod/src/generated/api";

test("MOV files normalize consistently across browser file-type variants", () => {
  for (const name of ["clip.mov", "CLIP.MOV", "Phone.Recording.MoV"]) {
    for (const type of ["", "application/octet-stream", "video/quicktime", "video/mov", "video/x-quicktime", "video/mp4"]) {
      assert.equal(uploadVideoContentType({ name, type }), "video/quicktime");
    }
  }
  assert.equal(uploadVideoContentType({ name: "clip.MOV", type: "text/html" }), "text/html");
  assert.equal(uploadVideoContentType({ name: "image.png", type: "image/png" }), "image/png");
  assert.equal(uploadVideoContentType({ name: "clip.webm", type: "video/webm" }), "video/webm");
});

test("every video upload API accepts canonical MOV metadata", () => {
  const metadata = { filename: "Phone.MOV", size: 1024, contentType: "video/quicktime" };
  assert(RequestPublicationMediaUploadBody.safeParse(metadata).success);
  assert(RequestVideoUploadBody.safeParse(metadata).success);
  assert(RequestAthleteUploadBody.safeParse({
    ...metadata, athleteName: "Mover", title: "Movement", consent: true,
  }).success);
  assert(!RequestPublicationMediaUploadBody.safeParse({ ...metadata, contentType: "text/html" }).success);
  assert(!RequestPublicationMediaUploadBody.safeParse({ ...metadata, size: 262144001 }).success);
});
