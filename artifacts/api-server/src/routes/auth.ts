import {
  GetCurrentAuthUserResponse,
} from '@workspace/api-zod';

function parseMobileTokenBody(body: unknown): { code: string; code_verifier: string; redirect_uri: string; state: string; nonce?: string } | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;
  if (typeof b.code !== 'string' || !b.code) return null;
  if (typeof b.code_verifier !== 'string' || !b.code_verifier) return null;
  if (typeof b.redirect_uri !== 'string' || !b.redirect_uri) return null;
  if (typeof b.state !== 'string' || !b.state) return null;
  return {
    code: b.code,
    code_verifier: b.code_verifier,
    redirect_uri: b.redirect_uri,
    state: b.state,
    nonce: typeof b.nonce === 'string' ? b.nonce : undefined,
  };
}
import { db, usersTable, studioProfilesTable } from '@workspace/db';
import { Router, type IRouter, type Request, type Response } from 'express';
import * as oidc from 'openid-client';
import { eq } from 'drizzle-orm';

import {
  clearSession,
  clearAnonymousSession,
  createSession,
  deleteSession,
  getSession,
  getGoogleOidcConfig,
  getAnonymousSessionId,
  getOidcConfig,
  getSessionId,
  ISSUER_URL,
  SESSION_COOKIE,
  SESSION_TTL,
  type SessionData,
} from '../lib/auth';

const OIDC_COOKIE_TTL = 10 * 60 * 1000;

const router: IRouter = Router();

function getOrigin(req: Request): string {
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
      user: req.user ?? req.anonymousUser ?? null,
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

// ─── Legacy Replit OIDC (kept for mobile / backward compat) ───────────────────

router.get('/login', async (req: Request, res: Response) => {
  const config = await getOidcConfig();
  const callbackUrl = `${getOrigin(req)}/api/callback`;

  const returnTo = getSafeReturnTo(req.query.returnTo);

  const state = oidc.randomState();
  const nonce = oidc.randomNonce();
  const codeVerifier = oidc.randomPKCECodeVerifier();
  const codeChallenge = await oidc.calculatePKCECodeChallenge(codeVerifier);

  const redirectTo = oidc.buildAuthorizationUrl(config, {
    redirect_uri: callbackUrl,
    scope: 'openid email profile offline_access',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    prompt: 'login consent',
    state,
    nonce,
  });

  setOidcCookie(res, 'code_verifier', codeVerifier);
  setOidcCookie(res, 'nonce', nonce);
  setOidcCookie(res, 'state', state);
  setOidcCookie(res, 'return_to', returnTo);

  res.redirect(redirectTo.href);
});

// Query params are not validated because the OIDC provider may include
// parameters not expressed in the schema.
router.get('/callback', async (req: Request, res: Response) => {
  const config = await getOidcConfig();
  const callbackUrl = `${getOrigin(req)}/api/callback`;

  const codeVerifier = req.cookies?.code_verifier;
  const nonce = req.cookies?.nonce;
  const expectedState = req.cookies?.state;

  if (!codeVerifier || !expectedState) {
    res.redirect('/api/login');
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
  } catch {
    res.redirect('/api/login');
    return;
  }

  const returnTo = getSafeReturnTo(req.cookies?.return_to);

  res.clearCookie('code_verifier', { path: '/' });
  res.clearCookie('nonce', { path: '/' });
  res.clearCookie('state', { path: '/' });
  res.clearCookie('return_to', { path: '/' });

  const claims = tokens.claims();
  if (!claims) {
    res.redirect('/api/login');
    return;
  }

  const dbUser = await upsertUser(claims as unknown as Record<string, unknown>);

  const now = Math.floor(Date.now() / 1000);
  const sessionData: SessionData = {
    user: {
      id: dbUser.id,
      email: dbUser.email,
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      profileImageUrl: dbUser.profileImageUrl,
      displayName: null,
      role: 'none',
    },
    provider: 'replit',
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: tokens.expiresIn() ? now + tokens.expiresIn()! : claims.exp,
  };

  const sid = await createSession(sessionData);
  setSessionCookie(res, sid);
  res.redirect(returnTo);
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

  const session = sid ? await getSession(sid) : null;
  await clearSession(res, sid);

  // A legacy anonymous session stored in the primary cookie should still use
  // the local return flow rather than invoking OIDC logout.
  if (session?.provider === 'anonymous') {
    res.redirect(returnTo);
    return;
  }

  const config = await getOidcConfig();
  const origin = getOrigin(req);
  const postLogoutRedirectUrl = new URL(returnTo, `${origin}/`).href;
  const endSessionUrl = oidc.buildEndSessionUrl(config, {
    client_id: process.env.REPL_ID!,
    post_logout_redirect_uri: postLogoutRedirectUrl,
  });

  res.redirect(endSessionUrl.href);
});

router.post(
  '/mobile-auth/token-exchange',
  async (req: Request, res: Response) => {
    const parsed = parseMobileTokenBody(req.body);
    if (!parsed) {
      res.status(400).json({ error: 'Missing or invalid required parameters' });
      return;
    }

    const { code, code_verifier, redirect_uri, state, nonce } = parsed;

    try {
      const config = await getOidcConfig();

      const callbackUrl = new URL(redirect_uri);
      callbackUrl.searchParams.set('code', code);
      callbackUrl.searchParams.set('state', state);
      callbackUrl.searchParams.set('iss', ISSUER_URL);

      const tokens = await oidc.authorizationCodeGrant(config, callbackUrl, {
        pkceCodeVerifier: code_verifier,
        expectedNonce: nonce ?? undefined,
        expectedState: state,
        idTokenExpected: true,
      });

      const claims = tokens.claims();
      if (!claims) {
        res.status(401).json({ error: 'No claims in ID token' });
        return;
      }

      const dbUser = await upsertUser(
        claims as unknown as Record<string, unknown>,
      );

      const now = Math.floor(Date.now() / 1000);
      const sessionData: SessionData = {
        user: {
          id: dbUser.id,
          email: dbUser.email,
          firstName: dbUser.firstName,
          lastName: dbUser.lastName,
          profileImageUrl: dbUser.profileImageUrl,
          displayName: null,
          role: 'none',
        },
        provider: 'replit',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: tokens.expiresIn() ? now + tokens.expiresIn()! : claims.exp,
      };

      const sid = await createSession(sessionData);
      res.json({ token: sid });
    } catch (err) {
      req.log.error(getSafeErrorMetadata(err), 'Mobile token exchange error');
      res.status(500).json({ error: 'Token exchange failed' });
    }
  },
);

router.post('/mobile-auth/logout', async (req: Request, res: Response) => {
  const sid = getSessionId(req);
  if (sid) {
    await deleteSession(sid);
  }
  res.json({ success: true });
});

export default router;
