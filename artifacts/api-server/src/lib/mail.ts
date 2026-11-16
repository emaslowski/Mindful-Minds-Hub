import nodemailer from 'nodemailer';
import { createGmailClientFromEnv, sendCredentialEmail } from './credentialEmail';
import { logger } from './logger';

export interface OutgoingMail {
  to: string | string[];
  replyTo?: string;
  subject: string;
  text: string;
  html: string;
}

/**
 * How mail leaves the server, in order of preference:
 * 1. the school Gmail account the hub uses for credential emails
 *    (CREDENTIAL_EMAIL_SENDER + GMAIL_REFRESH_TOKEN), no password involved;
 * 2. SMTP, but only when SMTP_HOST, SMTP_USER and SMTP_PASS are all set:
 *    a host without a login would be rejected by the mail server;
 * 3. none: callers log what they could not send.
 */
export function chooseMailTransport(): { kind: 'gmail' | 'smtp'; send: (mail: OutgoingMail) => Promise<void> } | null {
  const sender = process.env.CREDENTIAL_EMAIL_SENDER?.trim();
  const gmail = createGmailClientFromEnv();
  if (sender && gmail) {
    return { kind: 'gmail', send: async (mail) => { await sendCredentialEmail(mail, { sender, gmail }); } };
  }
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (host && user && pass) {
    const port = Number(process.env.SMTP_PORT ?? 587);
    const transporter = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
    const from = { name: 'The Brightside Wellness Project', address: user };
    return { kind: 'smtp', send: async (mail) => { await transporter.sendMail({ from, ...mail }); } };
  }
  return null;
}

/** Sends one email; never throws. Returns false (and logs why) when it could not be sent. */
export async function sendMail(mail: OutgoingMail, what = 'email'): Promise<boolean> {
  const recipients = Array.isArray(mail.to) ? mail.to : [mail.to];
  if (recipients.length === 0) {
    logger.warn({ what }, 'No recipients configured; email not sent');
    return false;
  }
  const transport = chooseMailTransport();
  if (!transport) {
    logger.warn({ what, recipients: recipients.length }, 'Email delivery is not configured (SMTP_USER/SMTP_PASS or the Gmail sender); email not sent');
    return false;
  }
  try {
    await transport.send(mail);
    return true;
  } catch (err) {
    logger.error({ err, what, transport: transport.kind }, 'Email could not be sent');
    return false;
  }
}
