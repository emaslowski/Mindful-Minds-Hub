import { Router } from "express";
import { randomUUID } from "node:crypto";
import { db, artworkTable as artworks, type Artwork } from "@workspace/db";
import { and, desc, eq, ne, sql } from "drizzle-orm";
import { RequestArtworkUploadBody, UpdateArtworkBody } from "@workspace/api-zod";
import { requireStudioRole } from "../middlewares/studioAuthMiddleware";
import { videoStorage } from "../lib/projectVideoStorage";
import { verifyPublicationFile } from "../lib/publicationMedia";

const router = Router();
const signedIn = requireStudioRole("student", "teacher");
const teacher = requireStudioRole("teacher");
const validId = (value: unknown) => Number.isSafeInteger(Number(value)) && Number(value) > 0;
const serialize = (row: Artwork) => ({
  id: row.id, title: row.title, artistName: row.artistName, status: row.status,
  featuredMonth: row.featuredMonth, createdAt: row.createdAt.toISOString(),
  imageUrl: `/api/artwork/${row.id}/image`,
});
const currentMonth = () => {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", year: "numeric", month: "2-digit" }).formatToParts();
  return `${parts.find(p => p.type === "year")!.value}-${parts.find(p => p.type === "month")!.value}`;
};

router.get("/artwork", async (_req, res) => {
  const month = currentMonth();
  const [rows, [featured]] = await Promise.all([
    db.select().from(artworks).where(eq(artworks.status, "approved")).orderBy(desc(artworks.createdAt)).limit(100),
    db.select().from(artworks).where(and(eq(artworks.status, "approved"), eq(artworks.featuredMonth, month))),
  ]);
  res.json({ artworks: rows.map(serialize), featured: featured ? serialize(featured) : null, month });
});

router.get("/artwork/mine", signedIn, async (req, res) => {
  const rows = await db.select().from(artworks).where(and(
    eq(artworks.ownerId, req.studioUser!.id), ne(artworks.status, "uploading"),
  )).orderBy(desc(artworks.createdAt));
  res.setHeader("Cache-Control", "private, no-store");
  res.json(rows.map(serialize));
});

router.post("/artwork/upload-url", signedIn, async (req, res) => {
  const parsed = RequestArtworkUploadBody.safeParse(req.body);
  if (!parsed.success || !parsed.data.consent || !parsed.data.artistName.trim() ||
    !parsed.data.title.trim() || !Number.isSafeInteger(parsed.data.size)) {
    res.status(400).json({ error: "Enter a first name or nickname, a title, and permission to share. Choose a JPG, PNG, or WebP photo up to 10 MB." }); return;
  }
  const { artistName, title, filename, contentType, size } = parsed.data;
  const uploadUrl = await videoStorage.getObjectEntityUploadURL();
  const [row] = await db.insert(artworks).values({
    ownerId: req.studioUser!.id, artistName: artistName.trim(), title: title.trim(),
    filename, contentType, size, objectPath: videoStorage.normalizeObjectEntityPath(uploadUrl),
  }).returning();
  res.status(201).json({ id: row!.id, uploadUrl });
});

router.post("/artwork/:id/complete", signedIn, async (req, res) => {
  if (!validId(req.params.id)) { res.status(400).json({ error: "Invalid artwork" }); return; }
  const result = await db.transaction(async tx => {
    const [row] = await tx.select().from(artworks).where(and(
      eq(artworks.id, Number(req.params.id)), eq(artworks.ownerId, req.studioUser!.id),
    )).for("update");
    if (!row) return { code: 404, error: "Artwork not found" };
    if (row.status !== "uploading") return { row };
    if (Date.now() - row.createdAt.getTime() > 15 * 60_000) return { code: 400, error: "Upload expired. Please select your photo again." };
    // Seal the bytes in a new private object: the original PUT URL must not
    // allow someone to replace a photo after a teacher has approved it.
    const source = await videoStorage.getObjectEntityFile(row.objectPath).catch(() => null);
    if (!source) return { code: 400, error: "Your upload has not finished. Please try uploading the photo again." };
    const sealedName = `artwork-${randomUUID()}`;
    const destinationPath = row.objectPath.replace(/[^/]+$/, sealedName);
    const target = source.bucket.file(source.name.replace(/[^/]+$/, sealedName));
    try {
      await source.copy(target);
      await verifyPublicationFile(target, { ...row, kind: "image" });
    } catch {
      await target.delete({ ignoreNotFound: true }).catch(() => {});
      return { code: 400, error: "The photo could not be verified. Upload a valid JPG, PNG, or WebP photo matching the selected size." };
    }
    const [updated] = await tx.update(artworks).set({ status: "pending", objectPath: destinationPath })
      .where(eq(artworks.id, row.id)).returning();
    return { row: updated!, source };
  });
  if ("error" in result) { res.status(result.code!).json({ error: result.error }); return; }
  if (result.source) await result.source.delete({ ignoreNotFound: true }).catch(() => {});
  res.json(serialize(result.row));
});

router.get("/artwork/:id/image", async (req, res) => {
  if (!validId(req.params.id)) { res.status(404).end(); return; }
  const [row] = await db.select().from(artworks).where(eq(artworks.id, Number(req.params.id)));
  const user = req.studioUser?.accountStatus !== "disabled" ? req.studioUser : undefined;
  if (!row || row.status === "uploading" || (row.status !== "approved" && user?.id !== row.ownerId && user?.role !== "teacher")) {
    res.status(404).end(); return;
  }
  const file = await videoStorage.getObjectEntityFile(row.objectPath);
  res.setHeader("Content-Type", row.contentType);
  res.setHeader("Content-Length", row.size);
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  const stream = file.createReadStream();
  stream.on("error", () => { if (!res.headersSent) res.status(502).end(); else res.destroy(); });
  res.on("close", () => stream.destroy());
  stream.pipe(res);
});

router.delete("/artwork/:id", signedIn, async (req, res) => {
  if (!validId(req.params.id)) { res.status(400).json({ error: "Invalid artwork" }); return; }
  const [row] = await db.delete(artworks).where(and(eq(artworks.id, Number(req.params.id)),
    eq(artworks.ownerId, req.studioUser!.id))).returning();
  if (!row) { res.status(404).json({ error: "Artwork not found" }); return; }
  await (await videoStorage.getObjectEntityFile(row.objectPath).catch(() => null))?.delete({ ignoreNotFound: true }).catch(() => {});
  res.status(204).end();
});

router.get("/teacher/artwork", teacher, async (_req, res) => {
  const rows = await db.select().from(artworks).where(ne(artworks.status, "uploading")).orderBy(desc(artworks.createdAt));
  res.setHeader("Cache-Control", "private, no-store");
  res.json(rows.map(serialize));
});

router.patch("/teacher/artwork/:id", teacher, async (req, res) => {
  const parsed = UpdateArtworkBody.safeParse(req.body);
  if (!validId(req.params.id) || !parsed.success || !Object.keys(parsed.data).length ||
    (parsed.data.featuredMonth != null && !/^\d{4}-(0[1-9]|1[0-2])$/.test(parsed.data.featuredMonth))) {
    res.status(400).json({ error: "Choose a review decision or a valid feature month (YYYY-MM)." }); return;
  }
  const result = await db.transaction(async tx => {
    // Serialize moderation, replacement, and withdrawal to avoid resurrecting
    // rejected work or selecting two winners for the same month.
    await tx.execute(sql`SELECT pg_advisory_xact_lock(716204)`);
    const [row] = await tx.select().from(artworks).where(eq(artworks.id, Number(req.params.id))).for("update");
    if (!row || row.status === "uploading") return { code: 404, error: "Artwork not found" };
    const { status = row.status, featuredMonth = row.featuredMonth } = parsed.data;
    if (featuredMonth && status !== "approved" && parsed.data.status !== "rejected") {
      return { code: 400, error: "Approve this artwork before selecting it as a monthly winner." };
    }
    if (featuredMonth && status === "approved") {
      await tx.update(artworks).set({ featuredMonth: null }).where(eq(artworks.featuredMonth, featuredMonth));
    }
    const [updated] = await tx.update(artworks).set({
      status, featuredMonth: status === "approved" ? featuredMonth : null,
    }).where(eq(artworks.id, row.id)).returning();
    return { row: updated! };
  });
  if ("error" in result) { res.status(result.code!).json({ error: result.error }); return; }
  res.json(serialize(result.row));
});

export default router;
