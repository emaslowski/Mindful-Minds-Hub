import { Router } from "express";
import { db } from "@workspace/db";
import { eventsTable } from "@workspace/db/schema";
import { gte } from "drizzle-orm";
import { sql } from "drizzle-orm";

const router = Router();

// GET /api/events
router.get("/events", async (_req, res) => {
  const events = await db
    .select()
    .from(eventsTable)
    .orderBy(eventsTable.eventDate);
  res.json(
    events.map((e) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      eventDate: e.eventDate,
      location: e.location,
      createdAt: e.createdAt.toISOString(),
    })),
  );
});

export default router;
