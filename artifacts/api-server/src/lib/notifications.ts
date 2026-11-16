import { db } from '@workspace/db';
import { studioAppSettingsTable } from '@workspace/db/schema';
import { eq } from 'drizzle-orm';
import { sendMail, type OutgoingMail } from './mail';
import { logger } from './logger';

/**
 * Who gets the teacher notifications: red-flag journal alerts, submissions
 * waiting for review, collaboration board posts and comments, blog posts,
 * private-journal access requests.
 *
 * Teachers manage the list in Command Center → Settings (or through the Site
 * Assistant); it is stored in studio_app_settings under `notification_emails`.
 * When the list is empty, the ADMIN_EMAILS sign-in list is used instead, so a
 * brand-new hub notifies its teachers before anyone has touched Settings.
 */
export const NOTIFICATION_EMAILS_KEY = 'notification_emails';
export const MAX_NOTIFICATION_EMAILS = 10;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Cleans a list of addresses: trimmed, lower-cased, de-duplicated. Returns null when any entry is not an email. */
export function parseEmailList(value: unknown): string[] | null {
  const raw = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : null;
  if (!raw) return null;
  const out: string[] = [];
  for (const item of raw) {
    if (typeof item !== 'string') return null;
    const email = item.trim().toLowerCase();
    if (!email) continue;
    if (!EMAIL_RE.test(email) || email.length > 254) return null;
    if (!out.includes(email)) out.push(email);
  }
  return out;
}

export function adminEmails(): string[] {
  return parseEmailList(process.env.ADMIN_EMAILS ?? '') ?? [];
}

export async function getNotificationEmails(): Promise<{ emails: string[]; source: 'settings' | 'admin' }> {
  try {
    const [row] = await db.select().from(studioAppSettingsTable).where(eq(studioAppSettingsTable.key, NOTIFICATION_EMAILS_KEY)).limit(1);
    if (row) {
      const list = parseEmailList(JSON.parse(row.value));
      if (list && list.length > 0) return { emails: list, source: 'settings' };
    }
  } catch (err) {
    logger.warn({ err }, 'Could not read notification emails; falling back to ADMIN_EMAILS');
  }
  return { emails: adminEmails(), source: 'admin' };
}

export async function setNotificationEmails(emails: string[]): Promise<void> {
  const value = JSON.stringify(emails);
  await db.insert(studioAppSettingsTable).values({ key: NOTIFICATION_EMAILS_KEY, value })
    .onConflictDoUpdate({ target: studioAppSettingsTable.key, set: { value, updatedAt: new Date() } });
}

/** Emails every teacher on the notification list. Returns false when nobody could be reached. */
export async function notifyTeachers(mail: Omit<OutgoingMail, 'to'>, what = 'teacher notification'): Promise<boolean> {
  const { emails } = await getNotificationEmails();
  return sendMail({ ...mail, to: emails }, what);
}

/** The site owner(s): SITE_OWNER_EMAILS, else the notification list. */
export async function ownerEmails(): Promise<string[]> {
  const owners = parseEmailList(process.env.SITE_OWNER_EMAILS ?? '') ?? [];
  if (owners.length > 0) return owners;
  return (await getNotificationEmails()).emails;
}
