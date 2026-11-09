import assert from "node:assert/strict";
import { writeFile, readFile, unlink } from "node:fs/promises";
import { db, pool, artworkTable } from "@workspace/db";
import { inArray } from "drizzle-orm";
import { createStudioSession, deleteStudioSession } from "../src/lib/studioAuth";
import { videoStorage } from "../src/lib/projectVideoStorage";

if (process.env.NODE_ENV === "production") throw new Error("Development checks only");
const fixturePath = "/tmp/brightside-artwork-ui-fixtures.json";
const owners = ["artwork-test-student", "artwork-test-other", "artwork-test-teacher"];
const origin = (process.env.APP_URL ?? 'http://localhost:8080').replace(/\/+$/, '');
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=", "base64");
async function clean() {
  const rows = await db.delete(artworkTable).where(inArray(artworkTable.ownerId, owners)).returning();
  for (const row of rows) {
    const file = await videoStorage.getObjectEntityFile(row.objectPath).catch(() => null);
    await file?.delete({ ignoreNotFound: true }).catch(() => {});
  }
  const fixtures = JSON.parse(await readFile(fixturePath, "utf8").catch(() => "{}"));
  for (const sid of Object.values(fixtures) as string[]) await deleteStudioSession(sid);
  await unlink(fixturePath).catch(() => {});
}
if (process.argv.includes("--cleanup")) {
  await clean();
  await pool.end();
  console.log("Removed artwork test submissions, uploaded objects, and synthetic sessions.");
} else {
  await clean();
  const student = await createStudioSession({ studioUser: { id: owners[0]!, role: "student", email: null, displayName: "Test artist", accountStatus: "active" } });
  const other = await createStudioSession({ studioUser: { id: owners[1]!, role: "student", email: null, displayName: "Other artist", accountStatus: "active" } });
  const teacher = await createStudioSession({ studioUser: { id: owners[2]!, role: "teacher", email: null, displayName: "Test teacher", accountStatus: "active" } });
  await writeFile(fixturePath, JSON.stringify({ student, other, teacher }), { mode: 0o600 });
  const request = (path: string, sid?: string, method = "GET", data?: unknown) => fetch(`${origin}/api${path}`, {
    method, headers: { "Content-Type": "application/json", ...(sid ? { Authorization: `StudioBearer ${sid}` } : {}) },
    ...(data === undefined ? {} : { body: JSON.stringify(data) }),
  });
  async function upload() {
    const response = await request("/artwork/upload-url", student, "POST", {
      artistName: "Test artist", title: "Test drawing", filename: "drawing.png", contentType: "image/png", size: png.length, consent: true,
    });
    assert.equal(response.status, 201);
    const reservation = await response.json();
    assert.equal((await fetch(reservation.uploadUrl, { method: "PUT", headers: { "Content-Type": "image/png" }, body: png })).status, 200);
    assert.equal((await request(`/artwork/${reservation.id}/complete`, other, "POST")).status, 404);
    const completed = await request(`/artwork/${reservation.id}/complete`, student, "POST");
    assert.equal(completed.status, 200);
    assert.equal((await completed.json()).status, "pending");
    return reservation.id as number;
  }
  try {
    assert.equal((await request("/artwork/upload-url", undefined, "POST", {})).status, 401);
    assert.equal((await request("/teacher/artwork", student)).status, 403);
    assert.equal((await request("/artwork/upload-url", student, "POST", { consent: false })).status, 400);
    const id = await upload();
    assert.equal((await request(`/artwork/${id}/image`)).status, 404);
    assert.equal((await request(`/artwork/${id}/image`, other)).status, 404);
    assert.equal((await request(`/artwork/${id}/image`, student)).status, 200);
    assert.equal((await request(`/artwork/${id}/image`, teacher)).status, 200);
    assert.equal((await request(`/artwork/${id}`, other, "DELETE")).status, 404);
    const mine = await (await request("/artwork/mine", student)).json();
    assert(mine.some((row: { id: number }) => row.id === id));
    const before = await (await request("/artwork")).json();
    assert(!before.artworks.some((row: { id: number }) => row.id === id));
    assert.equal((await request(`/teacher/artwork/${id}`, student, "PATCH", { status: "approved" })).status, 403);
    assert.equal((await request(`/teacher/artwork/${id}`, teacher, "PATCH", { featuredMonth: "2088-01" })).status, 400);
    assert.equal((await request(`/teacher/artwork/${id}`, teacher, "PATCH", { status: "approved", featuredMonth: "2088-01" })).status, 200);
    assert.equal((await request(`/artwork/${id}/image`)).status, 200);
    const after = await (await request("/artwork")).json();
    assert(after.artworks.some((row: { id: number }) => row.id === id));
    assert.equal(after.featured?.id === id, false, "Future winners must not be featured this month");
    const second = await upload();
    const reviews = await Promise.all([id, second].map(artworkId =>
      request(`/teacher/artwork/${artworkId}`, teacher, "PATCH", { status: "approved", featuredMonth: "2088-01" })));
    assert(reviews.every(response => response.status === 200));
    const queue = await (await request("/teacher/artwork", teacher)).json();
    const winners = queue.filter((row: { featuredMonth: string }) => row.featuredMonth === "2088-01");
    assert.equal(winners.length, 1, "Concurrent selection must retain exactly one monthly winner");
    assert.equal((await request(`/teacher/artwork/${winners[0].id}`, teacher, "PATCH", { status: "rejected" })).status, 200);
    assert.equal((await request(`/artwork/${winners[0].id}/image`)).status, 404);
    for (const artworkId of [id, second]) {
      assert.equal((await request(`/artwork/${artworkId}`, student, "DELETE")).status, 204);
      assert.equal((await request(`/artwork/${artworkId}/image`, teacher)).status, 404);
    }
    console.log("PASS real private photo upload, completion, ownership, anonymous isolation, moderation, gallery publishing, concurrent monthly selection, rejection, and withdrawal.");
  } finally {
    if (!process.argv.includes("--keep-sessions")) await clean();
    await pool.end();
  }
}
