/** Disposable regression: retries do not lock students out; credentials still apply. */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import { db, pool, usersTable, anonymousAccessAccountsTable, anonymousAccessRequestsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import app from "../app";
import { hashPassword } from "../lib/password";

const userId = `student-retry-test-${randomUUID()}`;
const accessCode = `TEST-${randomUUID().slice(0, 8).toUpperCase()}`;
const password = randomUUID();
let requestId: number | undefined;
let cookie = "";
const server = app.listen(0, "127.0.0.1");
await once(server, "listening");
const address = server.address();
assert(address && typeof address !== "string");
const base = `http://127.0.0.1:${address.port}/api/anonymous-access`;
const login = (value: string) => fetch(`${base}/login`, {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ accessCode, password: value }),
});
try {
  await db.insert(usersTable).values({ id: userId });
  const [request] = await db.insert(anonymousAccessRequestsTable).values({
    requestCode: randomUUID().slice(0, 20), status: "approved",
  }).returning();
  requestId = request!.id;
  await db.insert(anonymousAccessAccountsTable).values({
    requestId, userId, accessCode, passwordHash: hashPassword(password),
  });
  for (let index = 0; index < 12; index++) {
    const response = await login("deliberately-incorrect");
    assert.equal(response.status, 401, `Incorrect attempt ${index + 1} must reject credentials without a retry lockout`);
  }
  const success = await login(password);
  assert.equal(success.status, 200, "Correct credentials work immediately after repeated mistakes");
  cookie = success.headers.get("set-cookie")!.split(";")[0]!;
  await db.update(anonymousAccessAccountsTable).set({ status: "disabled" })
    .where(eq(anonymousAccessAccountsTable.userId, userId));
  assert.equal((await login(password)).status, 403, "Disabled accounts remain blocked");
  console.log("PASS: 12 failed attempts without timeout, immediate successful login, and disabled-account protection.");
} finally {
  if (cookie) await fetch(`${base}/logout`, { method: "POST", headers: { cookie } });
  await db.delete(anonymousAccessAccountsTable).where(eq(anonymousAccessAccountsTable.userId, userId));
  if (requestId) await db.delete(anonymousAccessRequestsTable).where(eq(anonymousAccessRequestsTable.id, requestId));
  await db.delete(usersTable).where(eq(usersTable.id, userId));
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await pool.end();
}
