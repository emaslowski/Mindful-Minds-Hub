/**
 * School access code endpoints.
 *
 *   GET  /hub-access            → { required, granted }   is a code needed, and does this browser have it?
 *   POST /hub-access { code }   → { granted: true }       checks the code and sets the cookie
 *   GET  /teacher/hub-access    → { code, source, envCode }   (teachers) the current code
 *   PUT  /teacher/hub-access { code }  → same              (teachers) set a new code; '' turns the gate off
 *   DELETE /teacher/hub-access  → same                     (teachers) go back to the hub's configured code
 */
import { Router, type IRouter, type Request, type Response } from 'express';
import {
  getHubAccessCode,
  grantHubAccess,
  isValidHubCode,
  normalizeHubCode,
  requestMayEnter,
  resetHubAccessCode,
  setHubAccessCode,
} from '../lib/hubAccess';
import { requireStudioRole } from '../middlewares/studioAuthMiddleware';

const router: IRouter = Router();

// Wrong guesses are counted per address. A whole school often shares one address
// (and behind Cloud Run's proxy every visitor can look like one), so the limit is
// generous and correct entries never count: a class typing the code together
// is never locked out.
const FAILURE_LIMIT = 40;
const FAILURE_WINDOW_MS = 15 * 60 * 1000;
const failures = new Map<string, { count: number; resetAt: number }>();

function failureKey(req: Request): string {
  return req.ip ?? 'unknown';
}

function tooManyFailures(req: Request): boolean {
  const entry = failures.get(failureKey(req));
  return !!entry && entry.resetAt > Date.now() && entry.count >= FAILURE_LIMIT;
}

function recordFailure(req: Request): void {
  const key = failureKey(req);
  const now = Date.now();
  const entry = failures.get(key);
  if (!entry || entry.resetAt < now) failures.set(key, { count: 1, resetAt: now + FAILURE_WINDOW_MS });
  else entry.count += 1;
}

router.get('/hub-access', async (req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'private, no-store');
  res.json(await requestMayEnter(req));
});

router.post('/hub-access', async (req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'private, no-store');
  const { code } = await getHubAccessCode();
  if (!code) {
    res.json({ granted: true });
    return;
  }
  if (tooManyFailures(req)) {
    res.status(429).json({ error: 'Too many tries. Wait a few minutes and try again.' });
    return;
  }
  const entered = normalizeHubCode((req.body as { code?: unknown } | undefined)?.code);
  if (!entered || entered !== code) {
    recordFailure(req);
    res.status(401).json({ error: 'That code did not match. Check the welcome email from your school or ask your teacher.' });
    return;
  }
  grantHubAccess(res, code);
  res.json({ granted: true });
});

function teacherView(setting: Awaited<ReturnType<typeof getHubAccessCode>>) {
  return {
    code: setting.code,
    source: setting.source,
    envCode: isValidHubCode(normalizeHubCode(process.env.HUB_ACCESS_CODE)),
  };
}

router.get('/teacher/hub-access', requireStudioRole('teacher'), async (_req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'private, no-store');
  res.json(teacherView(await getHubAccessCode()));
});

router.put('/teacher/hub-access', requireStudioRole('teacher'), async (req: Request, res: Response) => {
  const code = normalizeHubCode((req.body as { code?: unknown } | undefined)?.code);
  if (code && !isValidHubCode(code)) {
    res.status(400).json({ error: 'Use 4 to 32 letters, numbers or dashes, for example LINCOLN-2026.' });
    return;
  }
  res.json(teacherView(await setHubAccessCode(code)));
});

router.delete('/teacher/hub-access', requireStudioRole('teacher'), async (_req: Request, res: Response) => {
  res.json(teacherView(await resetHubAccessCode()));
});

export default router;
