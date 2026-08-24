import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { Router, type Request, type Response } from 'express';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '@workspace/db';
import {
  anonymousAccessAccountsTable,
  anonymousAccessRequestsTable,
  usersTable,
} from '@workspace/db/schema';
import {
  clearAnonymousSession,
  createSession,
  getAnonymousSessionId,
  setAnonymousSessionCookie,
  type SessionData,
} from '../lib/auth';
import { hashPassword, verifyPassword } from '../lib/password';
import { requireStudioRole } from '../middlewares/studioAuthMiddleware';

const router = Router();

const ACCESS_CODE_PATTERN = /^[A-Z0-9-]{4,32}$/;
const MIN_PASSWORD_LENGTH = 8;
const REQUEST_LIMIT = 5;
const LOGIN_LIMIT = 10;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const requestRateLimits = new Map<string, { count: number; resetAt: number }>();
const loginRateLimits = new Map<string, { count: number; resetAt: number }>();

function normalizeAccessCode(value: string): string {
  return value.trim().toUpperCase();
}

function parseId(value: string | string[] | undefined): number | null {
  const raw = Array.isArray(value) ? value[0] : value;
  const id = Number.parseInt(raw ?? '', 10);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function getTeacherEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean);
}

function isRateLimited(req: Request, bucket: Map<string, { count: number; resetAt: number }>, limit: number): boolean {
  const now = Date.now();
  const key = req.ip || req.socket.remoteAddress || 'unknown';
  const entry = bucket.get(key);
  if (!entry || entry.resetAt <= now) {
    bucket.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > limit;
}

async function sendAccessRequestEmail(req: Request, requestCode: string): Promise<void> {
  const smtpHost = process.env.SMTP_HOST;
  const teacherEmails = getTeacherEmails();
  if (!smtpHost || teacherEmails.length === 0) {
    req.log.warn(
      { requestCode, smtpConfigured: Boolean(smtpHost), teacherRecipients: teacherEmails.length },
      'Anonymous access request created without email notification',
    );
    return;
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: teacherEmails.join(', '),
    subject: 'New anonymous access request — Mind Matters',
    text: [
      'A student requested anonymous access to Mind Matters.',
      '',
      `Request ID: ${requestCode}`,
      '',
      'Open Mind Matters Studio → Anonymous Access to approve the request and issue a code and password.',
      'The request includes no student name, email address, or other personal information.',
    ].join('\n'),
    html: `
      <h2 style="color:#453329">New anonymous access request</h2>
      <p>A student requested anonymous access to Mind Matters.</p>
      <p><strong>Request ID:</strong> ${requestCode}</p>
      <p>Open <strong>Mind Matters Studio → Anonymous Access</strong> to approve the request and issue a code and password.</p>
      <p><em>This request includes no student name, email address, or other personal information.</em></p>
    `,
  });
}

async function createRequestCode(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const requestCode = `MM-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const [existing] = await db
      .select({ id: anonymousAccessRequestsTable.id })
      .from(anonymousAccessRequestsTable)
      .where(eq(anonymousAccessRequestsTable.requestCode, requestCode))
      .limit(1);
    if (!existing) return requestCode;
  }
  throw new Error('Unable to generate a unique anonymous request code');
}

function setSessionCookie(res: Response, sid: string): void {
  setAnonymousSessionCookie(res, sid);
}

// POST /api/anonymous-access/requests — no student information is collected.
router.post('/anonymous-access/requests', async (req: Request, res: Response): Promise<void> => {
  if (isRateLimited(req, requestRateLimits, REQUEST_LIMIT)) {
    res.status(429).json({ error: 'Too many access requests. Please wait before trying again.' });
    return;
  }

  const requestCode = await createRequestCode();
  const [request] = await db
    .insert(anonymousAccessRequestsTable)
    .values({ requestCode })
    .returning();

  sendAccessRequestEmail(req, requestCode).catch((error) => {
    req.log.error({ err: error, requestCode }, 'Unable to send anonymous access request email');
  });

  res.status(201).json({
    requestCode: request.requestCode,
    createdAt: request.createdAt.toISOString(),
  });
});

// POST /api/anonymous-access/login
router.post('/anonymous-access/login', async (req: Request, res: Response): Promise<void> => {
  if (isRateLimited(req, loginRateLimits, LOGIN_LIMIT)) {
    res.status(429).json({ error: 'Too many sign-in attempts. Please wait before trying again.' });
    return;
  }

  const { accessCode, password } = req.body ?? {};
  if (typeof accessCode !== 'string' || typeof password !== 'string') {
    res.status(400).json({ error: 'Access code and password are required' });
    return;
  }

  const normalizedCode = normalizeAccessCode(accessCode);
  const [account] = await db
    .select()
    .from(anonymousAccessAccountsTable)
    .where(eq(anonymousAccessAccountsTable.accessCode, normalizedCode))
    .limit(1);

  if (!account || !verifyPassword(password, account.passwordHash)) {
    res.status(401).json({ error: 'That access code or password is not correct' });
    return;
  }
  if (account.status !== 'active') {
    res.status(403).json({ error: 'This access code is currently disabled. Please ask your teacher for help.' });
    return;
  }

  const sessionData: SessionData = {
    user: {
      id: account.userId,
      email: null,
      firstName: null,
      lastName: null,
      profileImageUrl: null,
      displayName: 'Student',
      role: 'none',
    },
    provider: 'anonymous',
    access_token: 'anonymous',
  };

  const previousAnonymousSessionId = getAnonymousSessionId(req);
  if (previousAnonymousSessionId) await clearAnonymousSession(res, previousAnonymousSessionId);
  const sid = await createSession(sessionData);
  setSessionCookie(res, sid);

  res.json({ accessCode: account.accessCode });
});

// POST /api/anonymous-access/logout
router.post('/anonymous-access/logout', async (req: Request, res: Response): Promise<void> => {
  await clearAnonymousSession(res, getAnonymousSessionId(req));
  res.json({ success: true });
});

// GET /api/teacher/anonymous-access
router.get(
  '/teacher/anonymous-access',
  requireStudioRole('teacher'),
  async (_req: Request, res: Response): Promise<void> => {
    const [requests, accounts] = await Promise.all([
      db
        .select({
          id: anonymousAccessRequestsTable.id,
          requestCode: anonymousAccessRequestsTable.requestCode,
          status: anonymousAccessRequestsTable.status,
          createdAt: anonymousAccessRequestsTable.createdAt,
          approvedAt: anonymousAccessRequestsTable.approvedAt,
        })
        .from(anonymousAccessRequestsTable)
        .orderBy(desc(anonymousAccessRequestsTable.createdAt)),
      db
        .select({
          id: anonymousAccessAccountsTable.id,
          requestCode: anonymousAccessRequestsTable.requestCode,
          accessCode: anonymousAccessAccountsTable.accessCode,
          status: anonymousAccessAccountsTable.status,
          createdAt: anonymousAccessAccountsTable.createdAt,
          updatedAt: anonymousAccessAccountsTable.updatedAt,
        })
        .from(anonymousAccessAccountsTable)
        .innerJoin(
          anonymousAccessRequestsTable,
          eq(anonymousAccessAccountsTable.requestId, anonymousAccessRequestsTable.id),
        )
        .orderBy(desc(anonymousAccessAccountsTable.createdAt)),
    ]);

    res.json({ requests, accounts });
  },
);

// POST /api/teacher/anonymous-access/requests/:id/approve
router.post(
  '/teacher/anonymous-access/requests/:id/approve',
  requireStudioRole('teacher'),
  async (req: Request, res: Response): Promise<void> => {
    const requestId = parseId(req.params.id);
    const { accessCode, password } = req.body ?? {};
    const normalizedCode = typeof accessCode === 'string' ? normalizeAccessCode(accessCode) : '';

    if (!requestId) {
      res.status(400).json({ error: 'Invalid request' });
      return;
    }
    if (!ACCESS_CODE_PATTERN.test(normalizedCode)) {
      res.status(400).json({ error: 'Use 4–32 letters, numbers, or hyphens for the access code' });
      return;
    }
    if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
      res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` });
      return;
    }

    const [request] = await db
      .select()
      .from(anonymousAccessRequestsTable)
      .where(eq(anonymousAccessRequestsTable.id, requestId))
      .limit(1);
    if (!request || request.status !== 'pending') {
      res.status(404).json({ error: 'This pending request is no longer available' });
      return;
    }

    const [existingAccount] = await db
      .select({ id: anonymousAccessAccountsTable.id })
      .from(anonymousAccessAccountsTable)
      .where(eq(anonymousAccessAccountsTable.accessCode, normalizedCode))
      .limit(1);
    if (existingAccount) {
      res.status(409).json({ error: 'That access code is already in use' });
      return;
    }

    const userId = `anonymous-${crypto.randomUUID()}`;
    const passwordHash = hashPassword(password);
    const account = await db.transaction(async (tx) => {
      await tx.insert(usersTable).values({ id: userId });
      const [created] = await tx
        .insert(anonymousAccessAccountsTable)
        .values({
          requestId,
          userId,
          accessCode: normalizedCode,
          passwordHash,
          status: 'active',
        })
        .returning();
      await tx
        .update(anonymousAccessRequestsTable)
        .set({ status: 'approved', approvedAt: new Date() })
        .where(
          and(
            eq(anonymousAccessRequestsTable.id, requestId),
            eq(anonymousAccessRequestsTable.status, 'pending'),
          ),
        );
      return created;
    });

    res.status(201).json({
      account: {
        id: account.id,
        accessCode: account.accessCode,
        status: account.status,
      },
    });
  },
);

// POST /api/teacher/anonymous-access/accounts/:id/reset-password
router.post(
  '/teacher/anonymous-access/accounts/:id/reset-password',
  requireStudioRole('teacher'),
  async (req: Request, res: Response): Promise<void> => {
    const accountId = parseId(req.params.id);
    const { password } = req.body ?? {};
    if (!accountId) {
      res.status(400).json({ error: 'Invalid account' });
      return;
    }
    if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
      res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` });
      return;
    }

    const [account] = await db
      .update(anonymousAccessAccountsTable)
      .set({ passwordHash: hashPassword(password), updatedAt: new Date() })
      .where(eq(anonymousAccessAccountsTable.id, accountId))
      .returning({ id: anonymousAccessAccountsTable.id, accessCode: anonymousAccessAccountsTable.accessCode });
    if (!account) {
      res.status(404).json({ error: 'Anonymous access account not found' });
      return;
    }
    res.json({ account });
  },
);

// PATCH /api/teacher/anonymous-access/accounts/:id
router.patch(
  '/teacher/anonymous-access/accounts/:id',
  requireStudioRole('teacher'),
  async (req: Request, res: Response): Promise<void> => {
    const accountId = parseId(req.params.id);
    const { status } = req.body ?? {};
    if (!accountId || (status !== 'active' && status !== 'disabled')) {
      res.status(400).json({ error: 'A valid account and status are required' });
      return;
    }

    const [account] = await db
      .update(anonymousAccessAccountsTable)
      .set({ status, updatedAt: new Date() })
      .where(eq(anonymousAccessAccountsTable.id, accountId))
      .returning({
        id: anonymousAccessAccountsTable.id,
        accessCode: anonymousAccessAccountsTable.accessCode,
        status: anonymousAccessAccountsTable.status,
      });
    if (!account) {
      res.status(404).json({ error: 'Anonymous access account not found' });
      return;
    }
    res.json({ account });
  },
);

export default router;