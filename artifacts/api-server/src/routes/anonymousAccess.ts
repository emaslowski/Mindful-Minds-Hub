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
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
const REQUEST_LIMIT = 5;
const LOGIN_LIMIT = 10;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const VALID_GRADES = new Set([
  'Kindergarten',
  '1st grade',
  '2nd grade',
  '3rd grade',
  '4th grade',
  '5th grade',
  '6th grade',
  '7th grade',
  '8th grade',
  '9th grade',
  '10th grade',
  '11th grade',
  '12th grade',
]);
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

function cleanStudentDetail(value: unknown, label: string): string {
  if (typeof value !== 'string') throw new Error(`${label} is required`);
  const cleaned = value.trim().replace(/\s+/g, ' ');
  if (!cleaned) throw new Error(`${label} is required`);
  if (cleaned.length > 100) throw new Error(`${label} must be 100 characters or fewer`);
  return cleaned;
}

function cleanStudentEmail(value: unknown): string {
  if (typeof value !== 'string') throw new Error('Email address is required');
  const email = value.trim().toLowerCase();
  if (!email) throw new Error('Email address is required');
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    throw new Error('Please enter a valid email address');
  }
  return email;
}

function getStudentDetails(body: unknown): {
  firstName: string;
  lastName: string;
  grade: string;
  studentEmail: string;
} {
  const values = body && typeof body === 'object' ? body as Record<string, unknown> : {};
  const firstName = cleanStudentDetail(values.firstName, 'First name');
  const lastName = cleanStudentDetail(values.lastName, 'Last name');
  const grade = typeof values.grade === 'string' ? values.grade.trim() : '';
  if (!VALID_GRADES.has(grade)) throw new Error('Please choose a valid grade');
  const studentEmail = cleanStudentEmail(values.studentEmail);
  return { firstName, lastName, grade, studentEmail };
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character] ?? character);
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

async function sendAccessRequestEmail(
  req: Request,
  request: {
    requestCode: string;
    firstName: string;
    lastName: string;
    grade: string;
    studentEmail: string;
  },
): Promise<void> {
  const smtpHost = process.env.SMTP_HOST;
  const teacherEmails = getTeacherEmails();
  if (!smtpHost || teacherEmails.length === 0) {
    req.log.warn(
      { requestCode: request.requestCode, smtpConfigured: Boolean(smtpHost), teacherRecipients: teacherEmails.length },
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
    subject: 'New private journal access request — The Brightside Project',
    text: [
      'A student requested private access to The Brightside Project journal and gratitude journal.',
      '',
      `Student: ${request.firstName} ${request.lastName}`,
      `Grade: ${request.grade}`,
      `Student email: ${request.studentEmail}`,
      `Request ID: ${request.requestCode}`,
      '',
      'Open The Brightside Project Studio → Anonymous Access to approve the request and issue a code and password.',
    ].join('\n'),
    html: `
      <h2 style="color:#453329">New anonymous access request</h2>
      <p>A student requested private access to The Brightside Project journal and gratitude journal.</p>
      <p><strong>Student:</strong> ${escapeHtml(request.firstName)} ${escapeHtml(request.lastName)}</p>
      <p><strong>Grade:</strong> ${escapeHtml(request.grade)}</p>
      <p><strong>Student email:</strong> <a href="mailto:${escapeHtml(request.studentEmail)}">${escapeHtml(request.studentEmail)}</a></p>
      <p><strong>Request ID:</strong> ${escapeHtml(request.requestCode)}</p>
      <p>Open <strong>The Brightside Project Studio → Anonymous Access</strong> to approve the request and issue a code and password.</p>
    `,
  });
}

async function sendCredentialsEmail(
  req: Request,
  details: {
    studentEmail: string;
    firstName: string;
    accessCode: string;
    password: string;
  },
): Promise<void> {
  const smtpHost = process.env.SMTP_HOST;
  if (!smtpHost) {
    req.log.warn(
      { studentEmail: details.studentEmail, smtpConfigured: false },
      'Anonymous access approved without student credential email',
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
    to: details.studentEmail,
    subject: 'Your Brightside Project private access details',
    text: [
      `Hi ${details.firstName},`,
      '',
      'Your teacher approved your private Brightside Project journal and gratitude journal access.',
      '',
      `Access code: ${details.accessCode}`,
      `Password: ${details.password}`,
      '',
      'Keep these details private. Use them on The Brightside Project private access page to open your journal.',
    ].join('\n'),
    html: `
      <h2 style="color:#453329">Your Brightside Project private access details</h2>
      <p>Hi ${escapeHtml(details.firstName)},</p>
      <p>Your teacher approved your private Brightside Project journal and gratitude journal access.</p>
      <p><strong>Access code:</strong> ${escapeHtml(details.accessCode)}</p>
      <p><strong>Password:</strong> ${escapeHtml(details.password)}</p>
      <p><em>Keep these details private. Use them on The Brightside Project private access page to open your journal.</em></p>
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

// POST /api/anonymous-access/requests — collects only the details needed for teacher approval.
router.post('/anonymous-access/requests', async (req: Request, res: Response): Promise<void> => {
  if (isRateLimited(req, requestRateLimits, REQUEST_LIMIT)) {
    res.status(429).json({ error: 'Too many access requests. Please wait before trying again.' });
    return;
  }

  let studentDetails: ReturnType<typeof getStudentDetails>;
  try {
    studentDetails = getStudentDetails(req.body);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Student details are required' });
    return;
  }

  const requestCode = await createRequestCode();
  const [request] = await db
    .insert(anonymousAccessRequestsTable)
    .values({ requestCode, ...studentDetails })
    .returning();

  sendAccessRequestEmail(req, {
    requestCode,
    ...studentDetails,
  }).catch((error) => {
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
        firstName: anonymousAccessRequestsTable.firstName,
        lastName: anonymousAccessRequestsTable.lastName,
        grade: anonymousAccessRequestsTable.grade,
        studentEmail: anonymousAccessRequestsTable.studentEmail,
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
          firstName: anonymousAccessRequestsTable.firstName,
          lastName: anonymousAccessRequestsTable.lastName,
          grade: anonymousAccessRequestsTable.grade,
          studentEmail: anonymousAccessRequestsTable.studentEmail,
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

    let emailSent = false;
    if (request.studentEmail) {
      try {
        await sendCredentialsEmail(req, {
          studentEmail: request.studentEmail,
          firstName: request.firstName ?? 'there',
          accessCode: account.accessCode,
          password,
        });
        emailSent = true;
      } catch (error) {
        req.log.error(
          { err: error, requestCode: request.requestCode, studentEmail: request.studentEmail },
          'Unable to send anonymous access credentials email',
        );
      }
    }

    res.status(201).json({
      account: {
        id: account.id,
        accessCode: account.accessCode,
        status: account.status,
      },
      emailSent,
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