import {
  GetCurrentAuthUserResponse,
} from '@workspace/api-zod';
import { db, usersTable, studioProfilesTable } from '@workspace/db';
import { Router, type IRouter, type Request, type Response } from 'express';
import * as oidc from 'openid-client';
import { eq } from 'drizzle-orm';

import {
  clearSession,
  clearAnonymousSession,
  createSession,
  deleteSession,
  getGoogleOidcConfig,
  getAnonymousSessionId,
  getSessionId,
  SESSION_COOKIE,
  SESSION_TTL,
  type SessionData,
} from '../lib/auth';

const OIDC_COOKIE_TTL = 10 * 60 * 1000;

const router: IRouter = Router();

function getOrigin(req: Request): string {
  // APP_URL pins the public origin (e.g. https://brightsideproject.org) so the
  // OAuth callback URL matches what is registered with Google.
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/+$/, '');
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host =
    req.headers['x-forwarded-host'] || req.headers['host'] || 'localhost';
  return `${proto}://${host}`;
}

function setSessionCookie(res: Response, sid: string) {
  res.cookie(SESSION_COOKIE, sid, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL,
  });
}

function setOidcCookie(res: Response, name: string, value: string) {
  res.cookie(name, value, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: OIDC_COOKIE_TTL,
  });
}

function getSafeReturnTo(value: unknown): string {
  if (
    typeof value !== 'string' ||
    !value.startsWith('/') ||
    value.startsWith('//')
  ) {
    return '/';
  }
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getErrorStatus(
  value: Record<string, unknown>,
): number | string | undefined {
  if (typeof value.status === 'number' || typeof value.status === 'string') {
    return value.status;
  }
  if (
    typeof value.statusCode === 'number' ||
    typeof value.statusCode === 'string'
  ) {
    return value.statusCode;
  }
  return undefined;
}

function getSafeErrorMetadata(error: unknown) {
  if (!isRecord(error)) {
    return { errorName: typeof error };
  }

  const errorStatus = getErrorStatus(error);
  const causeStatus = isRecord(error.cause)
    ? getErrorStatus(error.cause)
    : undefined;

  return {
    errorName: error instanceof Error ? error.name : 'Error',
    errorStatus: errorStatus ?? causeStatus,
  };
}

async function upsertUser(claims: Record<string, unknown>) {
  const userData = {
    id: claims.sub as string,
    email: (claims.email as string) || null,
    firstName: ((claims.given_name || claims.first_name) as string) || null,
    lastName: ((claims.family_name || claims.last_name) as string) || null,
    profileImageUrl: (claims.profile_image_url || claims.picture) as
      | string
      | null,
  };

  const [user] = await db
    .insert(usersTable)
    .values(userData)
    .onConflictDoUpdate({
      target: usersTable.id,
      set: {
        ...userData,
        updatedAt: new Date(),
      },
    })
    .returning();
  return user;
}

/**
 * Determine the role of a user based on their email.
 * - 'teacher' if email is in ADMIN_EMAILS env var (comma-separated)
 * - 'student' if a studio_profile was pre-created for this email
 * - 'none' otherwise
 *
 * Also links a pre-created studio_profile to the user's DB id on first login.
 */
async function determineRoleAndLinkProfile(
  userId: string,
  email: string | null,
): Promise<'teacher' | 'student' | 'none'> {
  if (!email) return 'none';

  // Check teacher list first
  const adminEmails = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (adminEmails.includes(email.toLowerCase())) return 'teacher';

  // Check if there's a pre-created studio profile for this email
  const [profile] = await db
    .select()
    .from(studioProfilesTable)
    .where(eq(studioProfilesTable.email, email.toLowerCase()))
    .limit(1);

  if (!profile) return 'none';

  // Link the userId on first login if not yet linked
  if (!profile.userId) {
    await db
      .update(studioProfilesTable)
      .set({ userId, updatedAt: new Date() })
      .where(eq(studioProfilesTable.email, email.toLowerCase()));
  }

  return profile.role === 'teacher' ? 'teacher' : 'student';
}

// ─── Current user ──────────────────────────────────────────────────────────────

router.get('/auth/user', (req: Request, res: Response) => {
  res.json(
    GetCurrentAuthUserResponse.parse({
      user: req.user
        ? { ...req.user, accountType: 'primary', journalAccountActive: !!req.anonymousUser }
        : req.anonymousUser
          ? { ...req.anonymousUser, accountType: 'journal' }
          : null,
    }),
  );
});

// ─── Google OAuth (primary login for Studio) ──────────────────────────────────


router.get('/auth/google', async (req: Request, res: Response) => {
  const config = await getGoogleOidcConfig();
  const callbackUrl = `${getOrigin(req)}/api/auth/google/callback`;
  const returnTo = getSafeReturnTo(req.query.returnTo);

  const state = oidc.randomState();
  const nonce = oidc.randomNonce();
  const codeVerifier = oidc.randomPKCECodeVerifier();
  const codeChallenge = await oidc.calculatePKCECodeChallenge(codeVerifier);

  const redirectTo = oidc.buildAuthorizationUrl(config, {
    redirect_uri: callbackUrl,
    scope: 'openid email profile',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    access_type: 'offline',
    prompt: 'consent',
    state,
    nonce,
  });

  setOidcCookie(res, 'g_code_verifier', codeVerifier);
  setOidcCookie(res, 'g_nonce', nonce);
  setOidcCookie(res, 'g_state', state);
  setOidcCookie(res, 'g_return_to', returnTo);

  res.redirect(redirectTo.href);
});

router.get('/auth/google/callback', async (req: Request, res: Response) => {
  const config = await getGoogleOidcConfig();
  const callbackUrl = `${getOrigin(req)}/api/auth/google/callback`;

  const codeVerifier = req.cookies?.g_code_verifier;
  const nonce = req.cookies?.g_nonce;
  const expectedState = req.cookies?.g_state;
  const returnTo = getSafeReturnTo(req.cookies?.g_return_to);

  res.clearCookie('g_code_verifier', { path: '/' });
  res.clearCookie('g_nonce', { path: '/' });
  res.clearCookie('g_state', { path: '/' });
  res.clearCookie('g_return_to', { path: '/' });

  if (!codeVerifier || !expectedState) {
    res.redirect('/api/auth/google');
    return;
  }

  const currentUrl = new URL(
    `${callbackUrl}?${new URL(req.url, `http://${req.headers.host}`).searchParams}`,
  );

  let tokens: oidc.TokenEndpointResponse & oidc.TokenEndpointResponseHelpers;
  try {
    tokens = await oidc.authorizationCodeGrant(config, currentUrl, {
      pkceCodeVerifier: codeVerifier,
      expectedNonce: nonce,
      expectedState,
      idTokenExpected: true,
    });
  } catch (err) {
    req.log.warn(getSafeErrorMetadata(err), 'Google OAuth callback error');
    res.redirect('/api/auth/google');
    return;
  }

  const claims = tokens.claims();
  if (!claims) {
    res.redirect('/api/auth/google');
    return;
  }

  const dbUser = await upsertUser(claims as unknown as Record<string, unknown>);

  // Determine role — redirect to login with error if not enrolled
  const role = await determineRoleAndLinkProfile(dbUser.id, dbUser.email);
  if (role === 'none') {
    res.redirect('/studio/login?error=not_enrolled');
    return;
  }

  const now = Math.floor(Date.now() / 1000);

  // Build displayName from Google profile
  const displayName =
    (claims.name as string) ||
    [claims.given_name, claims.family_name].filter(Boolean).join(' ') ||
    dbUser.email ||
    null;

  const sessionData: SessionData = {
    user: {
      id: dbUser.id,
      email: dbUser.email,
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      profileImageUrl: dbUser.profileImageUrl,
      displayName: displayName as string | null,
      role,
    },
    provider: 'google',
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: tokens.expiresIn() ? now + tokens.expiresIn()! : undefined,
  };

  const sid = await createSession(sessionData);
  setSessionCookie(res, sid);
  res.redirect(returnTo);
});

router.get('/auth/google/logout', async (req: Request, res: Response) => {
  const sid = getSessionId(req);
  await clearSession(res, sid);
  const returnTo = getSafeReturnTo(req.query.returnTo);
  res.redirect(returnTo);
});

// ─── Generic login/logout (Google sign-in is the only identity provider) ──────

router.get('/login', (req: Request, res: Response) => {
  const returnTo = getSafeReturnTo(req.query.returnTo);
  res.redirect(`/api/auth/google?returnTo=${encodeURIComponent(returnTo)}`);
});

router.get('/callback', (_req: Request, res: Response) => {
  res.redirect('/api/auth/google');
});

router.get('/logout', async (req: Request, res: Response) => {
  const returnTo = getSafeReturnTo(req.query.returnTo);
  const sid = getSessionId(req);

  // The primary session owns the app-wide logout action. Anonymous wellness
  // access has its own endpoint and must not prevent an OAuth user from
  // logging out when both sessions exist.
  if (!sid) {
    const anonymousSid = getAnonymousSessionId(req);
    if (anonymousSid) {
      await clearAnonymousSession(res, anonymousSid);
    }
    res.redirect(returnTo);
    return;
  }

  const anonymousSid = getAnonymousSessionId(req);
  if (anonymousSid) await clearAnonymousSession(res, anonymousSid);

  // Sessions are stored server-side, so deleting the row signs the user out.
  await clearSession(res, sid);
  res.redirect(returnTo);
});

router.post('/mobile-auth/logout', async (req: Request, res: Response) => {
  const sid = getSessionId(req);
  if (sid) {
    await deleteSession(sid);
  }
  res.json({ success: true });
});

export default router;
