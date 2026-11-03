import type { RequestHandler } from 'express';

const buckets = new Map<string, { count: number; until: number }>();
export const publicSubmissionLimit: RequestHandler = (req, res, next) => {
  const now = Date.now();
  if (buckets.size > 10000) {
    for (const [key, entry] of buckets) if (entry.until <= now) buckets.delete(key);
  }
  const key = req.ip || req.socket.remoteAddress || 'unknown';
  let entry = buckets.get(key);
  if (!entry || entry.until <= now) {
    entry = { count: 0, until: now + 15 * 60 * 1000 };
    buckets.set(key, entry);
  }
  // A whole classroom may share one school-network address.
  if (entry.count >= 120) {
    res.status(429).json({ error: 'Too many submissions. Please try again later.' });
    return;
  }
  entry.count++;
  next();
};
