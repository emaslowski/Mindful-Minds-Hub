import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { eventsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { requireStudioRole } from "../middlewares/studioAuthMiddleware";

const router = Router();

function serialize(e: typeof eventsTable.$inferSelect) {
  return {
    id: e.id,
    title: e.title,
    description: e.description,
    eventDate: e.eventDate,
    location: e.location,
    createdAt: e.createdAt.toISOString(),
  };
}

// GET /api/events
router.get("/events", async (_req, res) => {
  const events = await db
    .select()
    .from(eventsTable)
    .orderBy(eventsTable.eventDate);
  res.json(events.map(serialize));
});

// ── Teacher editing ────────────────────────────────────────────────────────

interface EventInput { title?: unknown; description?: unknown; eventDate?: unknown; location?: unknown }

function parseEvent(body: EventInput, partial: boolean): { error: string } | { values: Partial<typeof eventsTable.$inferInsert> } {
  const values: Partial<typeof eventsTable.$inferInsert> = {};
  if (body.title !== undefined) {
    if (typeof body.title !== 'string' || !body.title.trim() || body.title.length > 200) return { error: 'Give the event a title (up to 200 characters).' };
    values.title = body.title.trim();
  } else if (!partial) return { error: 'Give the event a title.' };
  if (body.eventDate !== undefined) {
    if (typeof body.eventDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(body.eventDate) || Number.isNaN(Date.parse(body.eventDate))) {
      return { error: 'eventDate must be a date like 2026-12-05.' };
    }
    values.eventDate = body.eventDate;
  } else if (!partial) return { error: 'eventDate is required (YYYY-MM-DD).' };
  if (body.description !== undefined) {
    if (body.description !== null && (typeof body.description !== 'string' || body.description.length > 4000)) return { error: 'description must be text (up to 4000 characters) or null.' };
    values.description = body.description === null ? null : (body.description as string).trim() || null;
  }
  if (body.location !== undefined) {
    if (body.location !== null && (typeof body.location !== 'string' || body.location.length > 300)) return { error: 'location must be text (up to 300 characters) or null.' };
    values.location = body.location === null ? null : (body.location as string).trim() || null;
  }
  return { values };
}

function eventId(req: Request): number | null {
  const n = Number(req.params.id);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

// POST /api/teacher/events
router.post("/teacher/events", requireStudioRole('teacher'), async (req: Request, res: Response) => {
  const parsed = parseEvent((req.body ?? {}) as EventInput, false);
  if ('error' in parsed) { res.status(400).json({ error: parsed.error }); return; }
  const [event] = await db.insert(eventsTable).values(parsed.values as typeof eventsTable.$inferInsert).returning();
  res.status(201).json({ event: serialize(event!) });
});

// PATCH /api/teacher/events/:id
router.patch("/teacher/events/:id", requireStudioRole('teacher'), async (req: Request, res: Response) => {
  const id = eventId(req);
  const parsed = parseEvent((req.body ?? {}) as EventInput, true);
  if (!id) { res.status(404).json({ error: 'Event not found' }); return; }
  if ('error' in parsed) { res.status(400).json({ error: parsed.error }); return; }
  if (Object.keys(parsed.values).length === 0) { res.status(400).json({ error: 'Nothing to change.' }); return; }
  const [event] = await db.update(eventsTable).set(parsed.values).where(eq(eventsTable.id, id)).returning();
  if (!event) { res.status(404).json({ error: 'Event not found' }); return; }
  res.json({ event: serialize(event) });
});

// DELETE /api/teacher/events/:id
router.delete("/teacher/events/:id", requireStudioRole('teacher'), async (req: Request, res: Response) => {
  const id = eventId(req);
  if (!id) { res.status(404).json({ error: 'Event not found' }); return; }
  const deleted = await db.delete(eventsTable).where(eq(eventsTable.id, id)).returning({ id: eventsTable.id });
  if (deleted.length === 0) { res.status(404).json({ error: 'Event not found' }); return; }
  res.json({ success: true, id });
});

export default router;
