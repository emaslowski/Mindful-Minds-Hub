import { createHash, randomBytes } from "node:crypto";
import type { Request, RequestHandler } from "express";

const COOKIE = "brightside_challenge";
const validToken = (token: unknown): token is string =>
  typeof token === "string" && /^[a-f0-9]{64}$/.test(token);

/** The browser holds the credential; only its hash is stored as ownership. */
export function challengeOwner(req: Request): string | undefined {
  if (req.studioUser?.accountStatus === "disabled") return undefined;
  if (req.studioUser) return req.studioUser.id;
  const token = req.cookies?.[COOKIE];
  return validToken(token) ? `challenge:${createHash("sha256").update(token).digest("hex")}` : undefined;
}

export const openChallengeSession: RequestHandler = (req, res) => {
  res.setHeader("Cache-Control", "private, no-store");
  if (req.studioUser?.accountStatus === "disabled") {
    res.status(403).json({ error: "This account cannot submit challenge media." });
    return;
  }
  if (!req.studioUser && !validToken(req.cookies?.[COOKIE])) {
    const token = randomBytes(32).toString("hex");
    req.cookies[COOKIE] = token;
    res.cookie(COOKIE, token, {
      httpOnly: true, secure: true, sameSite: "lax", path: "/",
      // A session cookie avoids leaving access to children's private uploads
      // behind indefinitely on shared school computers.
    });
  }
  res.json({ id: challengeOwner(req)! });
};

export const requireChallengeSession: RequestHandler = (req, res, next) => {
  if (!challengeOwner(req)) {
    res.status(401).json({ error: "Your challenge session expired. Reload this page before submitting." });
    return;
  }
  res.setHeader("Cache-Control", "private, no-store");
  next();
};
