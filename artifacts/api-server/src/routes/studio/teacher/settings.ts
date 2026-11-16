import { Router, type Request, type Response } from 'express';
import { requireStudioRole } from '../../../middlewares/studioAuthMiddleware';
import { db } from '@workspace/db';
import { studioAppSettingsTable } from '@workspace/db/schema';
import { eq } from 'drizzle-orm';
import { MAX_NOTIFICATION_EMAILS, getNotificationEmails, parseEmailList, setNotificationEmails } from '../../../lib/notifications';

const router = Router();

const SETTINGS_KEY_AUTHOR_OPTIONS = 'author_display_options';

const DEFAULT_AUTHOR_OPTIONS = [
  'The Brightside Wellness Project Team',
  'The Brightside Wellness Project Blog Team',
  'Student Wellness Team',
  'Grades 3-6 Brightside Wellness Project Team',
  'Anonymous Student Contributor',
];

const LEGACY_AUTHOR_LABELS: Record<string, string> = {
  'The Brightside Project Team': 'The Brightside Wellness Project Team',
  'The Brightside Project Blog Team': 'The Brightside Wellness Project Blog Team',
  'The Brightside Project Student Team': 'The Brightside Wellness Project Student Team',
  'Grade 5 Brightside Project Team': 'Grades 3-6 Brightside Wellness Project Team',
  'Grade 5 Brightside Wellness Project Team': 'Grades 3-6 Brightside Wellness Project Team',
  'Mind Matter Team': 'The Brightside Wellness Project Team',
  'Mind Matters Team': 'The Brightside Wellness Project Team',
  'Mind Matters Student Team': 'The Brightside Wellness Project Team',
  'Mind Matters Blog Team': 'The Brightside Wellness Project Blog Team',
  'Grade 5 Mind Matters Team': 'Grades 3-6 Brightside Wellness Project Team',
  'Middle School Matters Team': 'The Brightside Wellness Project Team',
  'Middle School Matters Student Team': 'The Brightside Wellness Project Team',
  'Middle School Matters Blog Team': 'The Brightside Wellness Project Blog Team',
  'Grade 5 Middle School Matters Team': 'Grades 3-6 Brightside Wellness Project Team',
};

async function getAuthorDisplayOptions(): Promise<string[]> {
  const row = await db
    .select()
    .from(studioAppSettingsTable)
    .where(eq(studioAppSettingsTable.key, SETTINGS_KEY_AUTHOR_OPTIONS))
    .limit(1)
    .then((r) => r[0]);

  if (!row) return DEFAULT_AUTHOR_OPTIONS;
  try {
    const parsed = JSON.parse(row.value);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return (parsed as string[]).map(option => LEGACY_AUTHOR_LABELS[option] ?? option);
    }
  } catch {
    // fall through to default
  }
  return DEFAULT_AUTHOR_OPTIONS;
}

router.get(
  '/teacher/settings',
  requireStudioRole('teacher'),
  async (_req: Request, res: Response) => {
    // ADMIN_EMAILS is a comma-separated list of teacher email addresses
    const rawEmails = process.env.ADMIN_EMAILS ?? '';
    const emailList = rawEmails
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean);

    // Mask each email for safe display (show first char + *** + @domain)
    const maskedEmails = emailList.map((email) => {
      if (!email.includes('@')) return email;
      const [local, domain] = email.split('@');
      const masked = `${local[0] ?? ''}${'*'.repeat(Math.max((local.length - 1), 2))}@${domain}`;
      return masked;
    });

    const authorDisplayOptions = await getAuthorDisplayOptions();
    const notifications = await getNotificationEmails();

    res.json({
      adminEmails: maskedEmails.length > 0 ? maskedEmails : ['(not configured — set ADMIN_EMAILS env var)'],
      authorDisplayOptions,
      // Who receives red-flag alerts, submissions waiting for review, board posts and comments,
      // blog posts and private-journal access requests. Falls back to the sign-in list.
      notificationEmails: notifications.emails,
      notificationEmailsSource: notifications.source,
    });
  },
);

router.patch(
  '/teacher/settings',
  requireStudioRole('teacher'),
  async (req: Request, res: Response) => {
    const { authorDisplayOptions: newOptions, notificationEmails } = req.body as {
      authorDisplayOptions?: string[];
      notificationEmails?: unknown;
    };

    if (notificationEmails !== undefined) {
      const cleaned = parseEmailList(notificationEmails);
      if (!cleaned) {
        res.status(400).json({ error: 'Enter valid email addresses, one per entry.' });
        return;
      }
      if (cleaned.length > MAX_NOTIFICATION_EMAILS) {
        res.status(400).json({ error: `Keep the notification list to ${MAX_NOTIFICATION_EMAILS} addresses or fewer.` });
        return;
      }
      await setNotificationEmails(cleaned);
      const notifications = await getNotificationEmails();
      res.json({ notificationEmails: notifications.emails, notificationEmailsSource: notifications.source });
      return;
    }

    if (newOptions !== undefined) {
      if (
        !Array.isArray(newOptions) ||
        newOptions.length === 0 ||
        newOptions.some((o) => typeof o !== 'string' || !o.trim())
      ) {
        res.status(400).json({ error: 'authorDisplayOptions must be a non-empty array of strings' });
        return;
      }

      const cleaned = newOptions.map((o) => o.trim()).filter(Boolean);
      const value = JSON.stringify(cleaned);

      await db
        .insert(studioAppSettingsTable)
        .values({ key: SETTINGS_KEY_AUTHOR_OPTIONS, value })
        .onConflictDoUpdate({
          target: studioAppSettingsTable.key,
          set: { value, updatedAt: new Date() },
        });

      res.json({ authorDisplayOptions: cleaned });
      return;
    }

    res.status(400).json({ error: 'No updatable settings provided' });
  },
);

// Internal helper used by the review route to get live author display options
router.get(
  '/teacher/settings/author-display-options',
  requireStudioRole('teacher'),
  async (_req: Request, res: Response) => {
    const options = await getAuthorDisplayOptions();
    res.json({ authorDisplayOptions: options });
  },
);

export { getAuthorDisplayOptions };
export default router;
