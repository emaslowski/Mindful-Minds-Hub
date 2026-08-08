import { Router } from "express";
import { db } from "@workspace/db";
import { pageViewsTable } from "@workspace/db/schema";
import { sql } from "drizzle-orm";

const router = Router();

// POST /api/analytics/track
router.post("/analytics/track", async (req, res) => {
  const { path, section } = req.body;
  if (!path) {
    res.status(400).json({ error: "path is required" });
    return;
  }
  await db.insert(pageViewsTable).values({
    path: path.trim(),
    section: section ?? null,
  });
  res.status(201).json({ success: true, message: "Tracked" });
});

// GET /api/analytics/summary
router.get("/analytics/summary", async (_req, res) => {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(pageViewsTable);

  const topSections = await db
    .select({
      section: pageViewsTable.section,
      count: sql<number>`count(*)::int`,
    })
    .from(pageViewsTable)
    .where(sql`${pageViewsTable.section} IS NOT NULL`)
    .groupBy(pageViewsTable.section)
    .orderBy(sql`count(*) DESC`)
    .limit(10);

  const recentDailyVisits = await db
    .select({
      date: sql<string>`DATE(created_at)::text`,
      count: sql<number>`count(*)::int`,
    })
    .from(pageViewsTable)
    .where(sql`created_at >= NOW() - INTERVAL '30 days'`)
    .groupBy(sql`DATE(created_at)`)
    .orderBy(sql`DATE(created_at)`);

  res.json({
    totalVisits: count,
    topSections: topSections.map((s) => ({
      section: s.section ?? "unknown",
      count: s.count,
    })),
    recentDailyVisits: recentDailyVisits.map((d) => ({
      date: d.date,
      count: d.count,
    })),
  });
});

export default router;
