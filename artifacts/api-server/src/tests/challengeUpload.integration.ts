/** Disposable real-storage regression: direct upload, moderation, isolation, playback, withdrawal. */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { db, pool, athleteTable, sessionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import app from "../app";
import { videoStorage } from "../lib/projectVideoStorage";

const folder = await mkdtemp(join(tmpdir(), "challenge-test-"));
const sid = `challenge-test-${randomUUID()}`;
const server = app.listen(0, "127.0.0.1");
await once(server, "listening");
const address = server.address();
assert(address && typeof address !== "string");
const base = `http://127.0.0.1:${address.port}/api`;
const rowIds: number[] = [];
const objectPaths = new Set<string>();
async function call(path: string, cookie = "", method = "GET", body?: unknown) {
  return fetch(base + path, {
    method, headers: { cookie, ...(body ? { "Content-Type": "application/json" } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}
try {
  const mov = process.argv.includes("--mov");
  const filename = mov ? "test.MOV" : "test.webm";
  const contentType = mov ? "video/quicktime" : "video/webm";
  execFileSync("ffmpeg", ["-v", "error", "-f", "lavfi", "-i", "color=c=blue:s=160x120:d=1",
    "-c:v", mov ? "mpeg4" : "libvpx", "-an", join(folder, filename)]);
  const bytes = await readFile(join(folder, filename));
  const session = await call("/athlete/session");
  assert.equal(session.status, 200);
  const cookieHeader = session.headers.get("set-cookie")!;
  assert.match(cookieHeader, /HttpOnly/i);
  assert.match(cookieHeader, /Secure/i);
  const cookie = cookieHeader.split(";")[0]!;
  const identity = await session.json();
  assert.equal((await (await call("/athlete/session", cookie)).json()).id, identity.id);
  const otherSession = await call("/athlete/session");
  const other = otherSession.headers.get("set-cookie")!.split(";")[0]!;
  assert.notEqual((await otherSession.json()).id, identity.id);

  const input = {
    athleteName: "Test mover", title: "Disposable challenge video",
    filename, contentType, size: bytes.length, consent: true,
  };
  assert.equal((await call("/athlete/upload-url", "", "POST", input)).status, 401);
  for (const invalid of [{ consent: false }, { contentType: "text/html" }, { size: 262144001 },
    { contentType: "image/png", size: 10485761 }, { athleteName: " " }]) {
    assert.equal((await call("/athlete/upload-url", cookie, "POST", { ...input, ...invalid })).status, 400);
  }
  const ticketRes = await call("/athlete/upload-url", cookie, "POST", input);
  assert.equal(ticketRes.status, 201);
  const ticket = await ticketRes.json();
  rowIds.push(ticket.id);
  const [initial] = await db.select().from(athleteTable).where(eq(athleteTable.id, ticket.id));
  objectPaths.add(initial!.objectPath);
  assert.equal((await call(`/athlete/${ticket.id}/complete`, other, "POST")).status, 404);
  assert.equal((await call(`/athlete/${ticket.id}/image`, cookie)).status, 404);
  const uploaded = await fetch(ticket.uploadUrl, { method: "PUT", headers: { "Content-Type": contentType }, body: bytes });
  assert(uploaded.ok);
  const completed = await call(`/athlete/${ticket.id}/complete`, cookie, "POST");
  assert.equal(completed.status, 200);
  const pending = await completed.json();
  assert.equal(pending.status, "pending");
  assert.equal(pending.mediaType, "video");
  const [sealed] = await db.select().from(athleteTable).where(eq(athleteTable.id, ticket.id));
  objectPaths.add(sealed!.objectPath);
  assert.notEqual(sealed!.objectPath, initial!.objectPath);
  assert.equal((await (await call("/athlete/mine", cookie)).json()).some((r: { id: number }) => r.id === ticket.id), true);
  assert.equal((await (await call("/athlete/mine", other)).json()).length, 0);
  assert.equal((await call(`/athlete/${ticket.id}/image`)).status, 404);
  assert.equal((await call(`/athlete/${ticket.id}/image`, other)).status, 404);
  assert.equal((await (await call("/athlete")).json()).athletes.some((r: { id: number }) => r.id === ticket.id), false);
  assert.equal((await call(`/athlete/${ticket.id}`, other, "DELETE")).status, 404);

  await db.insert(sessionsTable).values({
    sid, expire: new Date(Date.now() + 600_000),
    sess: { studioUser: { id: sid, role: "teacher", accountStatus: "active", email: null, displayName: "Test teacher" } },
  });
  const teacher = `studio_sid=${sid}`;
  assert.equal((await call(`/teacher/athlete/${ticket.id}`, cookie, "PATCH", { status: "approved" })).status, 401);
  const review = await call("/teacher/athlete", teacher);
  assert.equal(review.status, 200);
  assert((await review.json()).some((r: { id: number; mediaType: string }) => r.id === ticket.id && r.mediaType === "video"));
  assert.equal((await call(`/teacher/athlete/${ticket.id}`, teacher, "PATCH", { status: "approved" })).status, 200);
  const range = await fetch(`${base}/athlete/${ticket.id}/image`, { headers: { Range: "bytes=0-63" } });
  assert.equal(range.status, 206);
  assert.equal(range.headers.get("content-type"), contentType);
  assert.equal(Buffer.from(await range.arrayBuffer()).equals(bytes.subarray(0, 64)), true);
  assert.equal((await (await call("/athlete")).json()).athletes.some((r: { id: number }) => r.id === ticket.id), true);
  assert.equal((await call(`/athlete/${ticket.id}`, cookie, "DELETE")).status, 204);
  assert.equal((await call(`/athlete/${ticket.id}/image`)).status, 404);
  console.log("PASS: direct video upload, validation, private ownership, teacher approval, ranged playback, and withdrawal.");
} finally {
  for (const id of rowIds) await db.delete(athleteTable).where(eq(athleteTable.id, id));
  await db.delete(sessionsTable).where(eq(sessionsTable.sid, sid));
  for (const path of objectPaths) {
    await (await videoStorage.getObjectEntityFile(path).catch(() => null))?.delete({ ignoreNotFound: true }).catch(() => {});
  }
  await rm(folder, { recursive: true, force: true });
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await pool.end();
}
