import { describe, it } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import kitOrdersRouter, { parseKitOrder, kitOrderRecipients } from "./kitOrders";

const valid = {
  kit: "school",
  quantity: 2,
  organization: "Roy-Hart CSD",
  contactName: "Pat Example",
  role: "Principal",
  email: "pat@example.org",
  phone: "555-0100",
  address: "1 School St, Middleport NY",
  payment: "purchase_order",
  poNumber: "PO-123",
  notes: "Start in January",
  source: "https://kits.example",
};

describe("parseKitOrder", () => {
  it("accepts a complete order", () => {
    const r = parseKitOrder(valid);
    assert.equal(r.ok, true);
    if (r.ok) {
      assert.equal(r.order.kit, "school");
      assert.equal(r.order.quantity, 2);
      assert.equal(r.order.poNumber, "PO-123");
    }
  });

  it("rejects unknown kits and payment methods", () => {
    assert.equal(parseKitOrder({ ...valid, kit: "mega" }).ok, false);
    assert.equal(parseKitOrder({ ...valid, payment: "bitcoin" }).ok, false);
  });

  it("requires organization, name and a valid email", () => {
    assert.equal(parseKitOrder({ ...valid, organization: " " }).ok, false);
    assert.equal(parseKitOrder({ ...valid, contactName: "" }).ok, false);
    assert.equal(parseKitOrder({ ...valid, email: "not-an-email" }).ok, false);
  });

  it("requires a shipping address except for district quotes", () => {
    assert.equal(parseKitOrder({ ...valid, address: "" }).ok, false);
    const district = parseKitOrder({ ...valid, kit: "district", address: "", payment: "quote", quantity: 99 });
    assert.equal(district.ok, true);
    if (district.ok) assert.equal(district.order.quantity, 1);
  });

  it("clamps quantity and trims long text", () => {
    const r = parseKitOrder({ ...valid, quantity: 9999, notes: "x".repeat(10_000) });
    assert.equal(r.ok, true);
    if (r.ok) {
      assert.equal(r.order.quantity, 500);
      assert.equal(r.order.notes.length, 4000);
    }
  });
});

describe("POST /kits/orders", () => {
  it("acknowledges an order with a reference when SMTP is not configured, and rejects bad input", async () => {
    const saved = { ...process.env };
    delete process.env.SMTP_HOST;
    const app = express();
    app.use(express.json());
    app.use("/api", kitOrdersRouter);
    const server = app.listen(0);
    try {
      const { port } = server.address() as { port: number };
      const url = `http://127.0.0.1:${port}/api/kits/orders`;
      const ok = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(valid) });
      assert.equal(ok.status, 200);
      const body = (await ok.json()) as { ok: boolean; reference: string };
      assert.equal(body.ok, true);
      assert.match(body.reference, /^BSK-\d{8}-[0-9A-F]{4}$/);

      const bad = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...valid, email: "nope" }) });
      assert.equal(bad.status, 400);
      assert.deepEqual(await bad.json(), { error: "Please enter a valid email address." });
    } finally {
      server.close();
      process.env = saved;
    }
  });
});

describe("kitOrderRecipients", () => {
  it("prefers KIT_ORDER_EMAILS, then SITE_OWNER_EMAILS, then the first admin", () => {
    const saved = { ...process.env };
    try {
      process.env.KIT_ORDER_EMAILS = "sales@example.org, two@example.org";
      process.env.SITE_OWNER_EMAILS = "owner@example.org";
      process.env.ADMIN_EMAILS = "admin1@example.org,admin2@example.org";
      assert.deepEqual(kitOrderRecipients(), ["sales@example.org", "two@example.org"]);
      delete process.env.KIT_ORDER_EMAILS;
      assert.deepEqual(kitOrderRecipients(), ["owner@example.org"]);
      delete process.env.SITE_OWNER_EMAILS;
      assert.deepEqual(kitOrderRecipients(), ["admin1@example.org"]);
    } finally {
      process.env = saved;
    }
  });
});
