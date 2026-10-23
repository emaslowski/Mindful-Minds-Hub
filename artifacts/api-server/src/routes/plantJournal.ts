import { Router, type Request } from "express";
import { db, plantObservationsTable as plants } from "@workspace/db";
import { CreatePlantObservationBody } from "@workspace/api-zod";
import { and, desc, eq } from "drizzle-orm";

const router = Router();

// Never resolve a private owner from studioUser (which can be a shared job group).
// Match the private Journal's explicit preference for separately validated access.
function owner(req: Request) {
  if (req.anonymousUser) return { ownerId: req.anonymousUser.id, accessKind: "journal" as const };
  if (req.user && req.authProvider !== "anonymous") {
    return { ownerId: req.user.id, accessKind: "individual" as const };
  }
  return null;
}

const publicFields = {
  id: plants.id, date: plants.date, nickname: plants.nickname,
  heightCm: plants.heightCm, leafCount: plants.leafCount, observations: plants.observations,
};

router.use("/plant-journal", (_req, res, next) => {
  res.set("Cache-Control", "private, no-store");
  next();
});

router.get("/plant-journal", async (req, res) => {
  const identity = owner(req);
  if (!identity) {
    res.json({ ownerId: null, accessKind: null, entries: [] });
    return;
  }
  const entries = await db.select(publicFields).from(plants)
    .where(eq(plants.userId, identity.ownerId))
    .orderBy(desc(plants.date), desc(plants.id));
  res.json({ ...identity, entries });
});

const observationInput = CreatePlantObservationBody.strict()
  .refine((data) => data.nickname.trim().length > 0, { message: "Enter a plant nickname" })
  .refine((data) => {
    const parsed = new Date(`${data.date}T00:00:00Z`);
    return data.date >= "0001-01-01" && Number.isFinite(parsed.getTime())
      && parsed.toISOString().slice(0, 10) === data.date;
  }, { message: "Enter a valid calendar date" })
  .refine((data) => data.leafCount === null || Number.isInteger(data.leafCount), {
    message: "Leaf count must be a whole number",
  });

router.post("/plant-journal", saveObservation);
router.put("/plant-journal/:id", saveObservation);

async function saveObservation(req: Request, res: import("express").Response) {
  const identity = owner(req);
  if (!identity) {
    res.status(401).json({ error: "Use your individual login or private Journal credentials to save observations." });
    return;
  }
  const result = observationInput.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: "Check the date, plant nickname, measurements, and observations." });
    return;
  }
  // This is only a stale-account guard; ownership always comes from the session.
  if (result.data.ownerId !== identity.ownerId) {
    res.status(409).json({ error: "Your private account changed. Reload the journal before saving." });
    return;
  }
  const { ownerId: _expectedOwner, ...data } = result.data;
  const values = { ...data, nickname: data.nickname.trim(), userId: identity.ownerId };
  if (req.method === "POST") {
    const [entry] = await db.insert(plants).values(values).returning(publicFields);
    res.status(201).json(entry);
    return;
  }
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id <= 0) {
    res.status(400).json({ error: "Invalid observation ID" });
    return;
  }
  const [entry] = await db.update(plants).set(values)
    .where(and(eq(plants.id, id), eq(plants.userId, identity.ownerId)))
    .returning(publicFields);
  if (!entry) {
    res.status(404).json({ error: "Observation not found" });
    return;
  }
  res.json(entry);
}

export default router;
