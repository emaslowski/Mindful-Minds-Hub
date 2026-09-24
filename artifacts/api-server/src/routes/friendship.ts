import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@workspace/db";
import { friendshipProfilesTable, studioProfilesTable, usersTable } from "@workspace/db/schema";
import {
  GetFriendshipProfileResponse,
  SaveFriendshipProfileBody,
  SaveFriendshipProfileResponse,
  GetFriendshipMatchesResponse,
} from "@workspace/api-zod";
import { requireRole } from "../middlewares/requireRoleMiddleware";

const router: IRouter = Router();
router.use("/friendship", requireRole("student"));

// Main-site matching requires an individual enrolled account, not a shared
// Studio job-group login or an anonymous journal session.
async function requireEnrolledStudent(req: Request, res: Response, next: NextFunction): Promise<void> {
  const [enrollment] = await db.select({ id: studioProfilesTable.id })
    .from(studioProfilesTable)
    .where(and(
      eq(studioProfilesTable.userId, req.user!.id),
      eq(studioProfilesTable.role, "student"),
      eq(studioProfilesTable.accountStatus, "active"),
    ))
    .limit(1);
  if (!enrollment) {
    res.status(403).json({ error: "An active enrolled student account is required" });
    return;
  }
  next();
}

router.use("/friendship", requireEnrolledStudent);

router.get("/friendship/profile", async (req, res): Promise<void> => {
  const [profile] = await db.select({
    interests: friendshipProfilesTable.interests,
    qualities: friendshipProfilesTable.qualities,
  }).from(friendshipProfilesTable).where(eq(friendshipProfilesTable.userId, req.user!.id));
  res.json(GetFriendshipProfileResponse.parse({
    optedIn: Boolean(profile),
    interests: profile?.interests ?? [],
    qualities: profile?.qualities ?? [],
  }));
});

router.put("/friendship/profile", async (req, res): Promise<void> => {
  const parsed = SaveFriendshipProfileBody.safeParse(req.body);
  if (!parsed.success ||
      new Set(parsed.data?.interests).size !== parsed.data?.interests.length ||
      new Set(parsed.data?.qualities).size !== parsed.data?.qualities.length) {
    res.status(400).json({ error: "Choose unique interests and qualities from the list" });
    return;
  }
  const { interests, qualities } = parsed.data;
  await db.insert(friendshipProfilesTable)
    .values({ userId: req.user!.id, interests, qualities })
    .onConflictDoUpdate({
      target: friendshipProfilesTable.userId,
      set: { interests, qualities, updatedAt: new Date() },
    });
  res.json(SaveFriendshipProfileResponse.parse({ optedIn: true, interests, qualities }));
});

router.delete("/friendship/profile", async (req, res): Promise<void> => {
  await db.delete(friendshipProfilesTable).where(eq(friendshipProfilesTable.userId, req.user!.id));
  res.sendStatus(204);
});

router.get("/friendship/matches", async (req, res): Promise<void> => {
  const [mine] = await db.select({
    interests: friendshipProfilesTable.interests,
    qualities: friendshipProfilesTable.qualities,
  }).from(friendshipProfilesTable).where(eq(friendshipProfilesTable.userId, req.user!.id));
  // No browsing other students without opting in first.
  if (!mine) {
    res.json(GetFriendshipMatchesResponse.parse([]));
    return;
  }

  const candidates = await db.select({
    firstName: usersTable.firstName,
    interests: friendshipProfilesTable.interests,
    qualities: friendshipProfilesTable.qualities,
  })
    .from(friendshipProfilesTable)
    .innerJoin(studioProfilesTable, and(
      eq(studioProfilesTable.userId, friendshipProfilesTable.userId),
      eq(studioProfilesTable.role, "student"),
      eq(studioProfilesTable.accountStatus, "active"),
    ))
    .innerJoin(usersTable, eq(usersTable.id, friendshipProfilesTable.userId))
    .where(ne(friendshipProfilesTable.userId, req.user!.id));

  const interests = new Set(mine.interests);
  const qualities = new Set(mine.qualities);
  const matches = candidates.map((candidate) => {
    const sharedInterests = candidate.interests.filter((item) => interests.has(item));
    const sharedQualities = candidate.qualities.filter((item) => qualities.has(item));
    return {
      displayName: candidate.firstName?.trim().split(/\s+/)[0].slice(0, 30) || "A classmate",
      sharedInterests,
      sharedQualities,
      rank: sharedInterests.length * 2 + sharedQualities.length,
    };
  })
    .filter((match) => match.rank > 0)
    .sort((a, b) => b.rank - a.rank)
    .slice(0, 6)
    .map(({ displayName, sharedInterests, sharedQualities }) =>
      ({ displayName, sharedInterests, sharedQualities }));
  res.json(GetFriendshipMatchesResponse.parse(matches));
});

export default router;