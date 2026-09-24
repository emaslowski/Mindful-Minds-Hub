import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { and, desc, eq, isNotNull, ne, or, sql } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  anonymousAccessAccountsTable,
  anonymousAccessRequestsTable,
  friendshipProfilesTable,
  studioProfilesTable,
  usersTable,
} from "@workspace/db/schema";
import {
  GetFriendshipProfileResponse,
  SaveFriendshipProfileBody,
  SaveFriendshipProfileResponse,
  GetFriendshipMatchesResponse,
  GetFriendshipJoinRequestsResponse,
  DecideFriendshipJoinRequestBody,
  DecideFriendshipJoinRequestResponse,
} from "@workspace/api-zod";
import { requireStudioRole } from "../middlewares/studioAuthMiddleware";

const router: IRouter = Router();
declare global {
  namespace Express {
    interface Request {
      matchingUserId?: string;
    }
  }
}

// Shared Studio group sessions are not matching identities. Primary accounts
// require active student enrollment; Journal accounts use their own validated
// secondary session. Neither identity inherits approval from the other.
async function requireMatchingStudent(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.user && !req.anonymousUser) {
    res.status(401).json({ error: "Sign in with a student or Journal account" });
    return;
  }
  if (!req.user && req.anonymousUser) {
    req.matchingUserId = req.anonymousUser.id;
    next();
    return;
  }
  if (req.user?.role === "student") {
    const [enrollment] = await db.select({ id: studioProfilesTable.id })
      .from(studioProfilesTable)
      .where(and(
        eq(studioProfilesTable.userId, req.user.id),
        eq(studioProfilesTable.role, "student"),
        eq(studioProfilesTable.accountStatus, "active"),
      ))
      .limit(1);
    if (enrollment) {
      req.matchingUserId = req.user.id;
      next();
      return;
    }
  }
  if (req.anonymousUser) {
    req.matchingUserId = req.anonymousUser.id;
    next();
    return;
  }
  res.status(403).json({ error: "An active enrolled student or Journal account is required" });
}

router.use("/friendship", requireMatchingStudent);
function matchingUserId(req: Request): string {
  return req.matchingUserId!;
}

router.get("/friendship/profile", async (req, res): Promise<void> => {
  const [profile] = await db.select({
    interests: friendshipProfilesTable.interests,
    qualities: friendshipProfilesTable.qualities,
    approvalStatus: friendshipProfilesTable.approvalStatus,
  }).from(friendshipProfilesTable).where(eq(friendshipProfilesTable.userId, matchingUserId(req)));
  res.json(GetFriendshipProfileResponse.parse({
    optedIn: Boolean(profile),
    approvalStatus: profile?.approvalStatus ?? "none",
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
  const [profile] = await db.insert(friendshipProfilesTable)
    .values({ userId: matchingUserId(req), interests, qualities })
    .onConflictDoUpdate({
      target: friendshipProfilesTable.userId,
      // Editing an approved profile keeps access. A rejected student can
      // request another review; pending students remain hidden until approval.
      set: {
        interests,
        qualities,
        approvalStatus: sql`CASE WHEN ${friendshipProfilesTable.approvalStatus} = 'approved' THEN 'approved' ELSE 'pending' END`,
        updatedAt: new Date(),
      },
    })
    .returning({ approvalStatus: friendshipProfilesTable.approvalStatus });
  res.json(SaveFriendshipProfileResponse.parse({ optedIn: true, approvalStatus: profile.approvalStatus, interests, qualities }));
});

router.delete("/friendship/profile", async (req, res): Promise<void> => {
  await db.delete(friendshipProfilesTable).where(eq(friendshipProfilesTable.userId, matchingUserId(req)));
  res.sendStatus(204);
});

router.get("/friendship/matches", async (req, res): Promise<void> => {
  const [mine] = await db.select({
    interests: friendshipProfilesTable.interests,
    qualities: friendshipProfilesTable.qualities,
    approvalStatus: friendshipProfilesTable.approvalStatus,
  }).from(friendshipProfilesTable).where(eq(friendshipProfilesTable.userId, matchingUserId(req)));
  // No browsing before teacher approval, even by calling the endpoint directly.
  if (mine?.approvalStatus !== "approved") {
    res.json(GetFriendshipMatchesResponse.parse([]));
    return;
  }

  const candidates = await db.select({
    firstName: usersTable.firstName,
    journalFirstName: anonymousAccessRequestsTable.firstName,
    interests: friendshipProfilesTable.interests,
    qualities: friendshipProfilesTable.qualities,
  })
    .from(friendshipProfilesTable)
    .leftJoin(studioProfilesTable, and(
      eq(studioProfilesTable.userId, friendshipProfilesTable.userId),
      eq(studioProfilesTable.role, "student"),
      eq(studioProfilesTable.accountStatus, "active"),
    ))
    .leftJoin(anonymousAccessAccountsTable, and(
      eq(anonymousAccessAccountsTable.userId, friendshipProfilesTable.userId),
      eq(anonymousAccessAccountsTable.status, "active"),
    ))
    .leftJoin(anonymousAccessRequestsTable, eq(anonymousAccessRequestsTable.id, anonymousAccessAccountsTable.requestId))
    .innerJoin(usersTable, eq(usersTable.id, friendshipProfilesTable.userId))
    .where(and(
      ne(friendshipProfilesTable.userId, matchingUserId(req)),
      eq(friendshipProfilesTable.approvalStatus, "approved"),
      or(isNotNull(studioProfilesTable.id), isNotNull(anonymousAccessAccountsTable.id)),
    ));

  const interests = new Set(mine.interests);
  const qualities = new Set(mine.qualities);
  const matches = candidates.map((candidate) => {
    const sharedInterests = candidate.interests.filter((item) => interests.has(item));
    const sharedQualities = candidate.qualities.filter((item) => qualities.has(item));
    return {
      displayName: (candidate.firstName || candidate.journalFirstName)?.trim().split(/\s+/)[0].slice(0, 30) || "A classmate",
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

router.get("/teacher/friendship/requests", requireStudioRole("teacher"), async (_req, res): Promise<void> => {
  const requests = await db.select({
    userId: friendshipProfilesTable.userId,
    displayName: studioProfilesTable.displayName,
    enrolledEmail: studioProfilesTable.email,
    journalFirstName: anonymousAccessRequestsTable.firstName,
    journalLastName: anonymousAccessRequestsTable.lastName,
    journalRequestCode: anonymousAccessRequestsTable.requestCode,
    interests: friendshipProfilesTable.interests,
    qualities: friendshipProfilesTable.qualities,
    requestedAt: friendshipProfilesTable.updatedAt,
  })
    .from(friendshipProfilesTable)
    .leftJoin(studioProfilesTable, and(
      eq(studioProfilesTable.userId, friendshipProfilesTable.userId),
      eq(studioProfilesTable.role, "student"),
      eq(studioProfilesTable.accountStatus, "active"),
    ))
    .leftJoin(anonymousAccessAccountsTable, and(
      eq(anonymousAccessAccountsTable.userId, friendshipProfilesTable.userId),
      eq(anonymousAccessAccountsTable.status, "active"),
    ))
    .leftJoin(anonymousAccessRequestsTable, eq(anonymousAccessRequestsTable.id, anonymousAccessAccountsTable.requestId))
    .where(and(
      eq(friendshipProfilesTable.approvalStatus, "pending"),
      or(isNotNull(studioProfilesTable.id), isNotNull(anonymousAccessAccountsTable.id)),
    ))
    .orderBy(desc(friendshipProfilesTable.updatedAt));

  res.json(GetFriendshipJoinRequestsResponse.parse(requests.map((request) => ({
    ...request,
    displayName: request.journalRequestCode
      ? `${[request.journalFirstName, request.journalLastName].filter(Boolean).join(" ") || "Student"} (Journal account · ${request.journalRequestCode})`
      : request.displayName?.trim() || request.enrolledEmail,
    requestedAt: request.requestedAt.toISOString(),
  }))));
});

router.post("/teacher/friendship/requests/:userId/decision", requireStudioRole("teacher"), async (req, res): Promise<void> => {
  const input = DecideFriendshipJoinRequestBody.safeParse(req.body);
  const userId = req.params.userId;
  if (!input.success || typeof userId !== "string" || !userId) {
    res.status(400).json({ error: "A valid decision and student are required" });
    return;
  }

  // The conditional update makes simultaneous approvals/withdrawals safe:
  // only an active student's still-pending request may be changed.
  const [updated] = await db.update(friendshipProfilesTable)
    .set({ approvalStatus: input.data.decision === "approve" ? "approved" : "rejected" })
    .where(and(
      eq(friendshipProfilesTable.userId, userId),
      eq(friendshipProfilesTable.approvalStatus, "pending"),
      or(
        sql`EXISTS (SELECT 1 FROM studio_profiles sp WHERE sp.user_id = ${friendshipProfilesTable.userId} AND sp.role = 'student' AND sp.account_status = 'active')`,
        sql`EXISTS (SELECT 1 FROM anonymous_access_accounts aa WHERE aa.user_id = ${friendshipProfilesTable.userId} AND aa.status = 'active')`,
      ),
    ))
    .returning({ approvalStatus: friendshipProfilesTable.approvalStatus });
  if (!updated) {
    res.status(409).json({ error: "This request is no longer pending or the account is inactive" });
    return;
  }
  res.json(DecideFriendshipJoinRequestResponse.parse(updated));
});

export default router;