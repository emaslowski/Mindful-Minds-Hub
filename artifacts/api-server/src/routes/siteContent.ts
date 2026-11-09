/**
 * Editable site content.
 *
 *   GET    /public/site-content            overrides only, for the main site
 *   GET    /teacher/site-content           every entry with default, current value, and whether it is overridden
 *   PUT    /teacher/site-content/:key      { value }  — must match the default's shape
 *   DELETE /teacher/site-content/:key      back to the default
 */
import { db } from '@workspace/db';
import { siteContentTable } from '@workspace/db/schema';
import { SITE_CONTENT, SITE_CONTENT_KEYS, isSiteContentKey, validateSiteContent } from '@workspace/site-content';
import { Router, type Request, type Response } from 'express';
import { requireStudioRole } from '../middlewares/studioAuthMiddleware';
import { getSiteContentOverrides, resetSiteContent, setSiteContent } from '../lib/siteContent';

const router = Router();

router.get('/public/site-content', async (_req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=30');
  res.json({ values: await getSiteContentOverrides() });
});

router.get('/teacher/site-content', requireStudioRole('teacher'), async (_req: Request, res: Response) => {
  const rows = await db.select().from(siteContentTable);
  const byKey = new Map(rows.map((r) => [r.key, r]));
  res.json({
    entries: SITE_CONTENT_KEYS.map((key) => {
      const row = byKey.get(key);
      const entry = SITE_CONTENT[key];
      return {
        key, label: entry.label, page: entry.page, description: entry.description,
        default: entry.default,
        value: row?.value ?? entry.default,
        overridden: Boolean(row),
        updatedAt: row?.updatedAt.toISOString() ?? null,
        updatedBy: row?.updatedBy ?? null,
      };
    }),
  });
});

router.put('/teacher/site-content/:key', requireStudioRole('teacher'), async (req: Request, res: Response) => {
  const key = String(req.params.key);
  if (!isSiteContentKey(key)) { res.status(404).json({ error: 'Unknown content key' }); return; }
  const { value } = (req.body ?? {}) as { value?: unknown };
  if (value === undefined) { res.status(400).json({ error: 'value is required' }); return; }
  const problem = validateSiteContent(key, value);
  if (problem) { res.status(400).json({ error: `Content does not match the expected shape: ${problem}` }); return; }
  await setSiteContent(key, value, req.studioUser!.id);
  res.json({ key, value, overridden: true });
});

router.delete('/teacher/site-content/:key', requireStudioRole('teacher'), async (req: Request, res: Response) => {
  const key = String(req.params.key);
  if (!isSiteContentKey(key)) { res.status(404).json({ error: 'Unknown content key' }); return; }
  await resetSiteContent(key);
  res.json({ key, value: SITE_CONTENT[key].default, overridden: false });
});

export default router;
