import nodemailer from 'nodemailer';
import { OAuth2Client } from 'google-auth-library';

/** Minimal Gmail REST client: performs an authorized request against gmail.googleapis.com. */
export interface GmailClient {
  request(
    path: string,
    options: { method: 'GET' | 'POST'; body?: unknown },
  ): Promise<Response>;
}

interface CredentialMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

interface SenderOptions {
  sender?: string;
  gmail: GmailClient | null;
}

const GMAIL_API = 'https://gmail.googleapis.com';

/**
 * Builds a Gmail client for the school mailbox from an OAuth refresh token.
 * Returns null when not configured so callers report a clear failure.
 *
 * Env: GMAIL_REFRESH_TOKEN (required), GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET
 * (default to GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET). The token must be
 * granted the https://www.googleapis.com/auth/gmail.send and
 * https://www.googleapis.com/auth/gmail.readonly (or gmail.metadata) scopes.
 */
export function createGmailClientFromEnv(): GmailClient | null {
  const clientId = process.env.GMAIL_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) return null;

  const oauth = new OAuth2Client({ clientId, clientSecret });
  oauth.setCredentials({ refresh_token: refreshToken });

  return {
    async request(path, { method, body }) {
      const { token } = await oauth.getAccessToken();
      if (!token) return new Response(null, { status: 401 });
      return fetch(`${GMAIL_API}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(30_000),
      });
    },
  };
}

// Never fall back to SMTP: credentials must only leave through the authorized
// school mailbox, and a missing/revoked authorization must be reported as failure.
export async function sendCredentialEmail(
  message: CredentialMessage,
  options: SenderOptions = {
    sender: process.env.CREDENTIAL_EMAIL_SENDER,
    gmail: createGmailClientFromEnv(),
  },
): Promise<string> {
  const sender = options.sender?.trim().toLowerCase();
  const gmail = options.gmail;
  if (!sender || !gmail) {
    throw new Error('The school Gmail sender is not configured');
  }

  const profileResponse = await gmail.request('/gmail/v1/users/me/profile', { method: 'GET' });
  if (!profileResponse.ok) {
    // Do not log provider bodies: they may contain recipient or message data.
    throw new Error(`School Gmail authorization check failed (HTTP ${profileResponse.status})`);
  }
  const profile = await profileResponse.json() as { emailAddress?: string };
  if (profile.emailAddress?.toLowerCase() !== sender) {
    throw new Error('The connected Gmail account does not match the configured school sender');
  }

  // Nodemailer builds a standards-compliant MIME message only; Gmail performs
  // delivery using OAuth. No SMTP password is handled here.
  const composer = nodemailer.createTransport({
    streamTransport: true,
    buffer: true,
    newline: 'windows',
  });
  const compiled = await composer.sendMail({
    from: { name: 'The Brightside Project', address: sender },
    to: message.to,
    subject: message.subject,
    text: message.text,
    html: message.html,
    disableFileAccess: true,
    disableUrlAccess: true,
  });
  if (!Buffer.isBuffer(compiled.message)) {
    throw new Error('Unable to compose the credential email');
  }
  const raw = compiled.message.toString('base64url');
  const response = await gmail.request('/gmail/v1/users/me/messages/send', {
    method: 'POST',
    body: { raw },
  });
  if (!response.ok) {
    throw new Error(`School Gmail did not accept the credential email (HTTP ${response.status})`);
  }
  const result = await response.json() as { id?: string };
  if (!result.id) {
    throw new Error('School Gmail returned no confirmation for the credential email');
  }
  // Acceptance is not a guarantee of inbox delivery. Never automatically retry
  // an ambiguous response, which could send a duplicate credential email.
  return result.id;
}
