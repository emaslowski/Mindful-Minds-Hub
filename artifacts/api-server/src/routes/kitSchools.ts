/**
 * School login lookup for the Brightside kits site.
 *
 *   GET /kits/schools/:code                           → { name, hubUrl, studioUrl, note } or 404
 *   GET /kits/schools/:code/resources                 → lesson printables library for that school
 *   GET /kits/schools/:code/resources/:folder/:name   → one printable (PDF, PowerPoint…); ?download=1 saves it
 *
 * The list of schools lives in editable site content (`kits.schools`), so the
 * owner can add a school from the Teacher Command Center or the Site Assistant
 * without a deploy. Only the matching school is returned, never the whole list.
 * The printables are the files under lesson-resources/ in the storage bucket
 * (see lib/lessonResources.ts); every school with a valid code sees the same set.
 */
import { Router, type IRouter, type Request, type Response } from 'express';
import { getSiteContent } from '../lib/siteContent';
import { parseFilename, parseFolder } from '../lib/lessonResources';
import { listLibrary, streamLibraryFile } from '../lib/lessonResourceStore';

const router: IRouter = Router();

export function normalizeCode(raw: unknown): string {
  return String(raw ?? '').trim().toUpperCase().replace(/\s+/g, '').slice(0, 40);
}

export function studioUrlFor(hubUrl: string): string {
  return `${hubUrl.replace(/\/+$/, '')}/studio/`;
}

async function findSchool(rawCode: unknown, res: Response) {
  const code = normalizeCode(rawCode);
  res.setHeader('Cache-Control', 'no-store');
  if (!code) { res.status(400).json({ error: 'Enter your school access code.' }); return null; }
  const schools = await getSiteContent('kits.schools');
  const school = schools.find((s) => normalizeCode(s.code) === code);
  if (!school) {
    res.status(404).json({ error: 'We could not find a school with that code. Check your welcome email, or contact us and we will look it up.' });
    return null;
  }
  return { code, school };
}

router.get('/kits/schools/:code', async (req: Request, res: Response) => {
  const found = await findSchool(req.params.code, res);
  if (!found) return;
  const { school } = found;
  res.json({ name: school.name, hubUrl: school.hubUrl, studioUrl: studioUrlFor(school.hubUrl), note: school.note ?? '' });
});

router.get('/kits/schools/:code/resources', async (req: Request, res: Response) => {
  const found = await findSchool(req.params.code, res);
  if (!found) return;
  const sections = await listLibrary();
  res.json({
    sections: sections.map((section) => ({
      ...section,
      files: section.files.map((file) => ({
        ...file,
        url: `/api/kits/schools/${encodeURIComponent(found.code)}/resources/${file.folder}/${encodeURIComponent(file.name)}`,
      })),
    })),
  });
});

router.get('/kits/schools/:code/resources/:folder/:name', async (req: Request, res: Response) => {
  const found = await findSchool(req.params.code, res);
  if (!found) return;
  const folder = parseFolder(req.params.folder);
  const name = parseFilename(req.params.name);
  if (!folder || !name) { res.status(404).json({ error: 'File not found' }); return; }
  await streamLibraryFile(folder, name, req, res);
});

export default router;
