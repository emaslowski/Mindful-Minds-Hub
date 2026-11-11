/**
 * Order and quote requests from the Brightside kits site
 * (artifacts/brightside-kits). No payment happens here: the request is
 * emailed to the kit sales inbox, and a confirmation goes to the buyer, so the
 * owner can invoice the district, accept a purchase order, or send a checkout
 * link.
 *
 * Env:
 *   KIT_ORDER_EMAILS  comma-separated recipients (default: SITE_OWNER_EMAILS,
 *                     then the first ADMIN_EMAILS entry)
 *   SMTP_*            as for the rest of the app
 */
import { randomBytes } from "node:crypto";
import { Router, type IRouter } from "express";
import nodemailer from "nodemailer";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const KIT_NAMES: Record<string, string> = {
  classroom: "Classroom Kit",
  school: "School Kit",
  district: "District License",
};

const PAYMENT_LABELS: Record<string, string> = {
  card: "Card or ACH (send a checkout link)",
  purchase_order: "Purchase order (send quote and invoice)",
  quote: "Quote only",
};

/** On-site professional development add-on: allowed lengths in days. */
const PD_DAYS = new Set([2, 3]);

export function parsePdDays(v: unknown): number {
  const n = Number(v);
  return PD_DAYS.has(n) ? n : 0;
}

// Very small in-memory rate limit per IP so the public form cannot be used to
// flood the inbox. Resets when the process restarts, which is fine here.
const recent = new Map<string, number[]>();
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 10;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const times = (recent.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (times.length >= MAX_PER_WINDOW) return true;
  times.push(now);
  recent.set(ip, times);
  return false;
}

function str(v: unknown, max = 500): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function emailList(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function kitOrderRecipients(): string[] {
  const explicit = emailList(process.env.KIT_ORDER_EMAILS);
  if (explicit.length) return explicit;
  const owners = emailList(process.env.SITE_OWNER_EMAILS);
  if (owners.length) return owners;
  const admins = emailList(process.env.ADMIN_EMAILS);
  return admins.length ? [admins[0]] : [];
}

export interface KitOrderInput {
  kit: string;
  quantity: number;
  organization: string;
  contactName: string;
  role: string;
  email: string;
  phone: string;
  address: string;
  schools: string;
  teachers: string;
  students: string;
  /** 0 = no professional development; otherwise days on site (2 or 3). */
  pdDays: number;
  pdTiming: string;
  pdParticipants: string;
  pdLocation: string;
  payment: string;
  poNumber: string;
  notes: string;
  source: string;
}

export function parseKitOrder(body: unknown): { ok: true; order: KitOrderInput } | { ok: false; error: string } {
  const b = (body ?? {}) as Record<string, unknown>;
  const kit = str(b.kit, 40);
  if (!KIT_NAMES[kit]) return { ok: false, error: "Please choose a kit." };
  const payment = str(b.payment, 40);
  if (!PAYMENT_LABELS[payment]) return { ok: false, error: "Please choose how you would like to pay." };
  const organization = str(b.organization, 200);
  const contactName = str(b.contactName, 120);
  const email = str(b.email, 200);
  if (!organization) return { ok: false, error: "Please tell us your school or district." };
  if (!contactName) return { ok: false, error: "Please tell us your name." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "Please enter a valid email address." };
  const address = str(b.address, 600);
  if (kit !== "district" && !address) return { ok: false, error: "Please enter a shipping address." };
  const rawQty = Number(b.quantity);
  const quantity = kit === "district" ? 1 : Math.min(500, Math.max(1, Number.isFinite(rawQty) ? Math.floor(rawQty) : 1));
  return {
    ok: true,
    order: {
      kit,
      quantity,
      organization,
      contactName,
      role: str(b.role, 120),
      email,
      phone: str(b.phone, 60),
      address,
      schools: str(b.schools, 40),
      teachers: str(b.teachers, 40),
      students: str(b.students, 40),
      pdDays: parsePdDays(b.pdDays),
      pdTiming: str(b.pdTiming, 200),
      pdParticipants: str(b.pdParticipants, 40),
      pdLocation: str(b.pdLocation, 300),
      payment,
      poNumber: str(b.poNumber, 80),
      notes: str(b.notes, 4000),
      source: str(b.source, 200),
    },
  };
}

function makeReference(): string {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `BSK-${ymd}-${randomBytes(2).toString("hex").toUpperCase()}`;
}

function orderRows(order: KitOrderInput): [string, string][] {
  const rows: [string, string][] = [
    ["Kit", KIT_NAMES[order.kit]],
  ];
  if (order.kit !== "district") rows.push(["Quantity", String(order.quantity)]);
  if (order.schools) rows.push(["Schools", order.schools]);
  if (order.teachers) rows.push(["Teachers", order.teachers]);
  if (order.students) rows.push(["Students", order.students]);
  if (order.pdDays) {
    rows.push(["Professional development", `${order.pdDays}-day on-site institute`]);
    if (order.pdTiming) rows.push(["PD preferred dates", order.pdTiming]);
    if (order.pdParticipants) rows.push(["PD educators attending", order.pdParticipants]);
    if (order.pdLocation) rows.push(["PD location", order.pdLocation]);
  } else {
    rows.push(["Professional development", "None requested"]);
  }
  rows.push(
    ["School / district", order.organization],
    ["Contact", order.role ? `${order.contactName} (${order.role})` : order.contactName],
    ["Email", order.email],
  );
  if (order.phone) rows.push(["Phone", order.phone]);
  if (order.address) rows.push(["Shipping address", order.address]);
  rows.push(["Payment", PAYMENT_LABELS[order.payment]]);
  if (order.poNumber) rows.push(["PO number", order.poNumber]);
  if (order.notes) rows.push(["Notes", order.notes]);
  return rows;
}

function rowsText(rows: [string, string][]): string {
  return rows.map(([k, v]) => `${k}: ${v}`).join("\n");
}

function rowsHtml(rows: [string, string][]): string {
  return `<table style="width:100%;border-collapse:collapse;margin:16px 0">${rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:8px 12px 8px 0;font-weight:bold;color:#3a2d23;vertical-align:top;white-space:nowrap">${esc(k)}</td><td style="padding:8px 0;color:#555;white-space:pre-wrap">${esc(v)}</td></tr>`,
    )
    .join("")}</table>`;
}

function wrapHtml(title: string, intro: string, rows: [string, string][], footer: string): string {
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#fbf4ee;padding:32px;border-radius:16px;">
      <h2 style="color:#d96b5a;margin-top:0">${esc(title)}</h2>
      <p style="color:#555">${esc(intro)}</p>
      ${rowsHtml(rows)}
      <p style="color:#999;font-size:13px;margin-top:24px">${esc(footer)}</p>
    </div>`;
}

router.post("/kits/orders", async (req, res) => {
  const ip = req.ip ?? "unknown";
  if (rateLimited(ip)) {
    res.status(429).json({ error: "Too many requests. Please try again in an hour or email us directly." });
    return;
  }

  const parsed = parseKitOrder(req.body);
  if (!parsed.ok) {
    res.status(400).json({ error: parsed.error });
    return;
  }
  const { order } = parsed;
  const reference = makeReference();
  const rows = orderRows(order);
  const recipients = kitOrderRecipients();

  logger.info({ reference, kit: order.kit, pdDays: order.pdDays, payment: order.payment, organization: order.organization }, "Kit order received");

  const smtpHost = process.env.SMTP_HOST;
  if (!smtpHost || !recipients.length) {
    // Email not configured: log the full order so it is not lost, and still
    // acknowledge so the form works.
    logger.warn({ reference, order }, "Kit order could not be emailed (SMTP or recipients not configured)");
    res.status(200).json({ ok: true, reference, note: "Email not configured — order recorded in the server log." });
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    const from = { name: "The Brightside Wellness Project", address: process.env.SMTP_USER ?? "" };
    const kitName = KIT_NAMES[order.kit];
    const isQuote = order.payment === "quote";
    const pdSuffix = order.pdDays ? ` + ${order.pdDays}-day PD` : "";

    await transporter.sendMail({
      from,
      to: recipients,
      replyTo: order.email,
      subject: `${isQuote ? "Quote request" : "Kit order"} ${reference}: ${kitName}${pdSuffix} for ${order.organization}`,
      text: `New ${isQuote ? "quote request" : "kit order"} from the Brightside kits site.\n\nReference: ${reference}\n${rowsText(rows)}\n\nReply to this email to answer ${order.contactName} directly.`,
      html: wrapHtml(
        `${isQuote ? "Quote request" : "Kit order"} ${reference}`,
        `New ${isQuote ? "quote request" : "kit order"} from the Brightside kits site${order.source ? ` (${order.source})` : ""}.`,
        rows,
        `Reply to this email to answer ${order.contactName} directly.`,
      ),
    });

    const nextStep =
      order.payment === "card"
        ? "We will email a secure checkout link within two school days. Your kit ships as soon as payment clears."
        : order.payment === "purchase_order"
          ? "We will email a formal quote and invoice within two school days, along with a W-9 for your business office."
          : "We will email a quote within two school days.";
    const pdNote = order.pdDays ? " We will also reach out to confirm dates for your on-site professional development." : "";

    await transporter.sendMail({
      from,
      to: order.email,
      subject: `We received your ${isQuote ? "quote request" : "order"} (${reference}) — The Brightside Wellness Project`,
      text: `Hi ${order.contactName},\n\nThank you for your interest in The Brightside Wellness Project. ${nextStep}${pdNote}\n\nReference: ${reference}\n${rowsText(rows)}\n\nQuestions? Just reply to this email.`,
      html: wrapHtml(
        `Thank you, ${order.contactName}!`,
        `We received your ${isQuote ? "quote request" : "order"}. ${nextStep}${pdNote} Your reference is ${reference}.`,
        rows,
        "Questions? Just reply to this email.",
      ),
    }).catch((err: unknown) => {
      // The owner already has the order; a failed buyer confirmation is not fatal.
      logger.warn({ err, reference }, "Kit order: buyer confirmation email failed");
    });

    res.status(200).json({ ok: true, reference });
  } catch (err) {
    logger.error({ err, reference }, "Kit order email failed");
    res.status(500).json({ error: "We could not send your order. Please try again or email us directly." });
  }
});

export default router;
