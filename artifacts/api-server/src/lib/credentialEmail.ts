import nodemailer from 'nodemailer';
import { ReplitConnectors } from '@replit/connectors-sdk';

type GmailProxy = Pick<ReplitConnectors, 'proxy'>;

interface CredentialMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

interface SenderOptions {
  sender?: string;
  connectionId?: string;
  connectors: GmailProxy;
}

// Never fall back to SMTP: credentials must only leave through the authorized
// school mailbox, and a missing/revoked connection must be reported as failure.
export async function sendCredentialEmail(
  message: CredentialMessage,
  options: SenderOptions = {
    sender: process.env.CREDENTIAL_EMAIL_SENDER,
    connectionId: process.env.CREDENTIAL_EMAIL_CONNECTION_ID,
    connectors: new ReplitConnectors(),
  },
): Promise<string> {
  const sender = options.sender?.trim().toLowerCase();
  if (!sender || !options.connectionId) {
    throw new Error('The school Gmail sender is not configured');
  }

  const selection = { connectionId: options.connectionId };
  const profileResponse = await options.connectors.proxy(
    'google-mail',
    '/gmail/v1/users/me/profile',
    { ...selection, method: 'GET' },
  );
  if (!profileResponse.ok) {
    // Do not log provider bodies: they may contain recipient or message data.
    throw new Error(`School Gmail authorization check failed (HTTP ${profileResponse.status})`);
  }
  const profile = await profileResponse.json() as { emailAddress?: string };
  if (profile.emailAddress?.toLowerCase() !== sender) {
    throw new Error('The connected Gmail account does not match the configured school sender');
  }

  // Nodemailer builds a standards-compliant MIME message only; Gmail performs
  // delivery using OAuth. No SMTP password or access token is handled here.
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
  const response = await options.connectors.proxy(
    'google-mail',
    '/gmail/v1/users/me/messages/send',
    { ...selection, method: 'POST', body: { raw } },
  );
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
