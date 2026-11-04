import { Router } from "express";
import { randomUUID } from "node:crypto";
import { db, athleteTable as athletes, type Athlete } from "@workspace/db";
import { and, count, desc, eq, gte, ne, sql } from "drizzle-orm";
import { RequestAthleteUploadBody, UpdateAthleteBody } from "@workspace/api-zod";
import { requireStudioRole } from "../middlewares/studioAuthMiddleware";
import { streamProjectVideo, videoStorage } from "../lib/projectVideoStorage";
import { verifyPublicationFile } from "../lib/publicationMedia";
import { challengeOwner, openChallengeSession, requireChallengeSession } from "../lib/challengeSession";
import { publicSubmissionLimit } from "../middlewares/publicSubmissionLimit";

const router = Router();
const signedIn = requireChallengeSession;
const teacher = requireStudioRole("teacher");
const moderationLock = 716205;
const validId = (value: unknown) => Number.isSafeInteger(Number(value)) && Number(value) > 0;
const serialize = (row: Athlete) => ({
  id: row.id, title: row.title, athleteName: row.athleteName, status: row.status,
  featuredMonth: row.featuredMonth, createdAt: row.createdAt.toISOString(),
  imageUrl: `/api/athlete/${row.id}/image`,
  mediaType: row.contentType.startsWith("video/") ? "video" as const : "image" as const,
});
const currentMonth = () => {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", year: "numeric", month: "2-digit" }).formatToParts();
  return `${parts.find(p => p.type === "year")!.value}-${parts.find(p => p.type === "month")!.value}`;
};

router.get("/athlete/session", openChallengeSession);

router.get("/athlete", async (_req, res) => {
  const month = currentMonth();
  const [rows, [featured]] = await Promise.all([
    db.select().from(athletes).where(eq(athletes.status, "approved")).orderBy(desc(athletes.createdAt)).limit(100),
    db.select().from(athletes).where(and(eq(athletes.status, "approved"), eq(athletes.featuredMonth, month))),
  ]);
  res.setHeader("Cache-Control", "no-store");
  res.json({ athletes: rows.map(serialize), featured: featured ? serialize(featured) : null, month });
});

router.get("/athlete/mine", signedIn, async (req, res) => {
  const rows = await db.select().from(athletes).where(and(
    eq(athletes.ownerId, challengeOwner(req)!), ne(athletes.status, "uploading"),
  )).orderBy(desc(athletes.createdAt));
  res.setHeader("Cache-Control", "private, no-store");
  res.json(rows.map(serialize));
});

router.post("/athlete/upload-url", signedIn, publicSubmissionLimit, async (req, res) => {
  const parsed = RequestAthleteUploadBody.safeParse(req.body);
  if (!parsed.success || !parsed.data.consent || !parsed.data.athleteName.trim() ||
    !parsed.data.title.trim() || !Number.isSafeInteger(parsed.data.size) ||
    (parsed.data.contentType.startsWith("image/") && parsed.data.size > 10 * 1024 * 1024)) {
    res.status(400).json({ error: "Enter a first name or nickname, a challenge title, and permission to share. Choose a photo up to 10 MB or an MP4, WebM, MOV, or OGV video up to 250 MB." }); return;
  }
  const ownerId = challengeOwner(req)!;
  const [{ total }] = await db.select({ total: count() }).from(athletes).where(and(
    eq(athletes.ownerId, ownerId), gte(athletes.createdAt, new Date(Date.now() - 24 * 60 * 60_000)),
  ));
  if (total >= 10) {
    res.status(429).json({ error: "You can start up to 10 challenge uploads per day. Please try again tomorrow." }); return;
  }
  const { athleteName, title, filename, contentType, size } = parsed.data;
  const uploadUrl = await videoStorage.getObjectEntityUploadURL();
  const [row] = await db.insert(athletes).values({
    ownerId, athleteName: athleteName.trim(), title: title.trim(),
    filename, contentType, size, objectPath: videoStorage.normalizeObjectEntityPath(uploadUrl),
  }).returning();
  res.status(201).json({ id: row!.id, uploadUrl });
});

router.post("/athlete/:id/complete", signedIn, async (req, res) => {
  if (!validId(req.params.id)) { res.status(400).json({ error: "Invalid submission" }); return; }
  const result = await db.transaction(async tx => {
    const [row] = await tx.select().from(athletes).where(and(
      eq(athletes.id, Number(req.params.id)), eq(athletes.ownerId, challengeOwner(req)!),
    )).for("update");
    if (!row) return { code: 404, error: "Challenge submission not found" };
    if (row.status !== "uploading") return { row };
    if (Date.now() - row.createdAt.getTime() > 15 * 60_000) return { code: 400, error: "Upload expired. Please select your file again." };
    // Seal the bytes separately so the original PUT URL cannot replace an
    // approved image. Never expose the upload object directly.
    const source = await videoStorage.getObjectEntityFile(row.objectPath).catch(() => null);
    if (!source) return { code: 400, error: "Your upload has not finished. Please try uploading the file again." };
    const sealedName = `athlete-${randomUUID()}`;
    const destinationPath = row.objectPath.replace(/[^/]+$/, sealedName);
    const target = source.bucket.file(source.name.replace(/[^/]+$/, sealedName));
    try {
      await source.copy(target);
      await verifyPublicationFile(target, { ...row, kind: row.contentType.startsWith("video/") ? "video" : "image" });
    } catch {
      await target.delete({ ignoreNotFound: true }).catch(() => {});
      return { code: 400, error: "The file could not be verified. Upload a supported photo or video matching the selected format and size." };
    }
    const [updated] = await tx.update(athletes).set({ status: "pending", objectPath: destinationPath })
      .where(eq(athletes.id, row.id)).returning();
    return { row: updated!, source };
  });
  if ("error" in result) { res.status(result.code!).json({ error: result.error }); return; }
  if (result.source) await result.source.delete({ ignoreNotFound: true }).catch(() => {});
  res.json(serialize(result.row));
});

router.get("/athlete/:id/image", async (req, res) => {
  if (!validId(req.params.id)) { res.status(404).end(); return; }
  const [row] = await db.select().from(athletes).where(eq(athletes.id, Number(req.params.id)));
  const user = req.studioUser?.accountStatus !== "disabled" ? req.studioUser : undefined;
  if (!row || row.status === "uploading" || (row.status !== "approved" && challengeOwner(req) !== row.ownerId && user?.role !== "teacher")) {
    res.status(404).end(); return;
  }
  const file = await videoStorage.getObjectEntityFile(row.objectPath);
  if (row.contentType.startsWith("video/")) {
    await streamProjectVideo(file, req, res);
    return;
  }
  res.setHeader("Content-Type", row.contentType);
  res.setHeader("Content-Length", row.size);
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  const stream = file.createReadStream();
  stream.on("error", () => { if (!res.headersSent) res.status(502).end(); else res.destroy(); });
  res.on("close", () => stream.destroy());
  stream.pipe(res);
});

router.delete("/athlete/:id", signedIn, async (req, res) => {
  if (!validId(req.params.id)) { res.status(400).json({ error: "Invalid submission" }); return; }
  const row = await db.transaction(async tx => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(${moderationLock})`);
    const [deleted] = await tx.delete(athletes).where(and(
      eq(athletes.id, Number(req.params.id)), eq(athletes.ownerId, challengeOwner(req)!),
    )).returning();
    return deleted;
  });
  if (!row) { res.status(404).json({ error: "Challenge photo not found" }); return; }
  await (await videoStorage.getObjectEntityFile(row.objectPath).catch(() => null))?.delete({ ignoreNotFound: true }).catch(() => {});
  res.status(204).end();
});

router.get("/teacher/athlete", teacher, async (_req, res) => {
  const rows = await db.select().from(athletes).where(ne(athletes.status, "uploading")).orderBy(desc(athletes.createdAt));
  res.setHeader("Cache-Control", "private, no-store");
  res.json(rows.map(serialize));
});

router.patch("/teacher/athlete/:id", teacher, async (req, res) => {
  const parsed = UpdateAthleteBody.safeParse(req.body);
  if (!validId(req.params.id) || !parsed.success || !Object.keys(parsed.data).length ||
    (parsed.data.featuredMonth != null && !/^\d{4}-(0[1-9]|1[0-2])$/.test(parsed.data.featuredMonth))) {
    res.status(400).json({ error: "Choose a review decision or a valid feature month (YYYY-MM)." }); return;
  }
  const result = await db.transaction(async tx => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(${moderationLock})`);
    const [row] = await tx.select().from(athletes).where(eq(athletes.id, Number(req.params.id))).for("update");
    if (!row || row.status === "uploading") return { code: 404, error: "Challenge photo not found" };
    const { status = row.status, featuredMonth = row.featuredMonth } = parsed.data;
    if (featuredMonth && status !== "approved" && parsed.data.status !== "rejected") {
      return { code: 400, error: "Approve this photo before selecting the Athlete of the Month." };
    }
    if (featuredMonth && status === "approved") {
      await tx.update(athletes).set({ featuredMonth: null }).where(eq(athletes.featuredMonth, featuredMonth));
    }
    const [updated] = await tx.update(athletes).set({
      status, featuredMonth: status === "approved" ? featuredMonth : null,
    }).where(eq(athletes.id, row.id)).returning();
    return { row: updated! };
  });
  if ("error" in result) { res.status(result.code!).json({ error: result.error }); return; }
  res.json(serialize(result.row));
});

export default router;
