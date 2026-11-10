/**
 * School login lookup for the Brightside kits site.
 *
 *   GET /kits/schools/:code  → { name, hubUrl, studioUrl, note } or 404
 *
 * The list of schools lives in editable site content (`kits.schools`), so the
 * owner can add a school from the Teacher Command Center or the Site Assistant
 * without a deploy. Only the matching school is returned, never the whole list.
 */
import { Router, type IRouter } from 'express';
import { getSiteContent } from '../lib/siteContent';

const router: IRouter = Router();

export function normalizeCode(raw: unknown): string {
  return String(raw ?? '').trim().toUpperCase().replace(/\s+/g, '').slice(0, 40);
}

export function studioUrlFor(hubUrl: string): string {
  return `${hubUrl.replace(/\/+$/, '')}/studio/`;
}

router.get('/kits/schools/:code', async (req, res) => {
  const code = normalizeCode(req.params.code);
  if (!code) { res.status(400).json({ error: 'Enter your school access code.' }); return; }
  const schools = await getSiteContent('kits.schools');
  const school = schools.find((s) => normalizeCode(s.code) === code);
  res.setHeader('Cache-Control', 'no-store');
  if (!school) {
    res.status(404).json({ error: 'We could not find a school with that code. Check your welcome email, or contact us and we will look it up.' });
    return;
  }
  res.json({ name: school.name, hubUrl: school.hubUrl, studioUrl: studioUrlFor(school.hubUrl), note: school.note ?? '' });
});

export default router;
