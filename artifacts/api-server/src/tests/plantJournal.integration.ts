/** Run with pnpm --filter @workspace/scripts exec tsx ../artifacts/api-server/src/tests/plantJournal.integration.ts.
 * Uses synthetic sessions against the real middleware and database; always cleans up. */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import { db, pool, sessionsTable, usersTable, anonymousAccessAccountsTable, anonymousAccessRequestsTable } from "@workspace/db";
import { eq, inArray } from "drizzle-orm";
import app from "../app";
import type { PlantJournal, PlantObservation } from "@workspace/api-zod";

const suffix = randomUUID();
const ids = [`plant-test-a-${suffix}`, `plant-test-b-${suffix}`];
const sids = ids.map((id) => `plant-session-${id}`);
const anonSid = `plant-anon-${suffix}`;
const groupSid = `plant-group-${suffix}`;
let requestId: number | undefined;
// The plant_observations table comes from lib/db/post-merge/plant-observations.sql
// (`pnpm run db:migrate`), so run that before this test.
const server = app.listen(0, "127.0.0.1");
await once(server, "listening");
const address = server.address();
assert(address && typeof address !== "string");
const base = `http://127.0.0.1:${address.port}/api/plant-journal`;
async function call(cookie = "", method = "GET", body?: unknown, path = "") {
  const res = await fetch(base + path, {
    method, headers: { Cookie: cookie, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: res.status, data: await res.json() as PlantJournal & PlantObservation, cache: res.headers.get("cache-control") };
}
try {
  await db.insert(usersTable).values(ids.map((id) => ({ id })));
  await db.insert(sessionsTable).values(ids.map((id, i) => ({
    sid: sids[i]!, expire: new Date(Date.now() + 600000),
    sess: { provider: "google", user: { id, role: "none" }, access_token: "" },
  })));
  await db.insert(sessionsTable).values({
    sid: groupSid, expire: new Date(Date.now() + 600000),
    sess: { studioUser: { id: "job:plant-test", role: "student", accountStatus: "active" } },
  });
  const a = `sid=${sids[0]}`, b = `sid=${sids[1]}`;
  const input = { ownerId: ids[0], date: "2026-10-20", nickname: " Bean ", heightCm: 0, leafCount: 0, observations: "First day" };
  assert.equal((await call()).data.ownerId, null);
  assert.equal((await call("", "POST", input)).status, 401);
  assert.equal((await call(`studio_sid=${groupSid}`)).data.ownerId, null);
  assert.equal((await call(`studio_sid=${groupSid}`, "POST", input)).status, 401);
  const first = await call(a, "POST", input);
  assert.equal(first.status, 201);
  assert.equal(first.data.nickname, "Bean");
  assert.equal(first.data.heightCm, 0);
  const second = await call(a, "POST", { ...input, date: "2026-10-23", heightCm: 5.5, leafCount: 2 });
  assert.equal(second.status, 201);
  const saved = await call(a);
  assert.match(saved.cache!, /no-store/);
  assert.equal(saved.data.entries.length, 2);
  assert.equal(saved.data.entries[0].date, "2026-10-23");
  assert.equal((await call(b)).data.entries.length, 0);
  assert.equal((await call(b, "PUT", { ...input, ownerId: ids[1] }, `/${first.data.id}`)).status, 404);
  assert.equal((await call(b, "POST", input)).status, 409);
  assert.equal((await call(a, "PUT", { ...input, heightCm: null, leafCount: null, observations: "Updated" }, `/${first.data.id}`)).status, 200);
  const reloaded = (await call(a)).data.entries.find((e: { id: number }) => e.id === first.data.id);
  assert(reloaded);
  assert.equal(reloaded.observations, "Updated");
  assert.equal(reloaded.heightCm, null);
  for (const bad of [{ date: "2026-02-30" }, { leafCount: 1.5 }, { heightCm: -1 }, { nickname: " " }, { observations: "x".repeat(1001) }, { userId: ids[1] }]) {
    assert.equal((await call(a, "POST", { ...input, ...bad })).status, 400);
  }
  const [request] = await db.insert(anonymousAccessRequestsTable).values({ requestCode: suffix.slice(0, 20) }).returning();
  requestId = request!.id;
  await db.insert(anonymousAccessAccountsTable).values({
    requestId, userId: ids[1]!, accessCode: suffix.slice(0, 32), passwordHash: "test-only-not-a-login",
  });
  await db.insert(sessionsTable).values({
    sid: anonSid, expire: new Date(Date.now() + 600000),
    sess: { provider: "anonymous", user: { id: ids[1], role: "none" }, access_token: "" },
  });
  const both = `${a}; anonymous_sid=${anonSid}`;
  assert.equal((await call(both)).data.accessKind, "journal");
  assert.equal((await call(both)).data.ownerId, ids[1]);
  assert.equal((await call(both)).data.entries.length, 0);
  assert.equal((await call(both, "PUT", input, `/${first.data.id}`)).status, 409);
  await db.update(anonymousAccessAccountsTable).set({ status: "disabled" }).where(eq(anonymousAccessAccountsTable.userId, ids[1]!));
  assert.equal((await call(`anonymous_sid=${anonSid}`)).data.ownerId, null);
  console.info("PASS: persistence, edits, validation, ownership, shared-group exclusion, private identity precedence and disabled access");
} finally {
  await db.delete(sessionsTable).where(inArray(sessionsTable.sid, [...sids, anonSid, groupSid]));
  await db.delete(anonymousAccessAccountsTable).where(inArray(anonymousAccessAccountsTable.userId, ids));
  if (requestId) await db.delete(anonymousAccessRequestsTable).where(eq(anonymousAccessRequestsTable.id, requestId));
  await db.delete(usersTable).where(inArray(usersTable.id, ids)); // plant rows cascade
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  await pool.end();
}
