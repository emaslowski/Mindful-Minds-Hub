/**
 * Teacher-created website sections.
 *
 *   GET    /public/sections            visible to everyone (for navigation and /s/:slug pages)
 *   POST   /teacher/sections           { slug?, title, intro?, emoji?, showInNav?, navOrder? }
 *   PATCH  /teacher/sections/:slug
 *   DELETE /teacher/sections/:slug     refused while pages are still published there
 */
import { db } from '@workspace/db';
import { siteSectionsTable, studioPublicationsTable } from '@workspace/db/schema';
import { and, eq, sql } from 'drizzle-orm';
import { Router, type Request, type Response } from 'express';
import { requireStudioRole } from '../middlewares/studioAuthMiddleware';
import { BUILT_IN_SECTIONS } from '../lib/sections';

const router = Router();

// Paths that already exist on the main site, so a custom section can never shadow them.
const RESERVED_SLUGS = new Set([
  ...BUILT_IN_SECTIONS, 'home', 'about', 'contact', 'events', 'resources', 'games', 'gardening', 'language-corner',
  'listen', 'connect', 'create', 'grow', 'move', 'learn', 'review', 'checkin', 'anonymous-access', 'studio', 'api', 's', 'admin', 'login',
]);
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function slugify(value: string): string {
  return value.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40).replace(/-+$/g, '');
}

function serialize(s: typeof siteSectionsTable.$inferSelect) {
  return {
    id: s.id, slug: s.slug, title: s.title, intro: s.intro, emoji: s.emoji,
    showInNav: s.showInNav, navOrder: s.navOrder, path: `/s/${s.slug}`,
    createdAt: s.createdAt.toISOString(), updatedAt: s.updatedAt.toISOString(),
  };
}

interface SectionInput { slug?: unknown; title?: unknown; intro?: unknown; emoji?: unknown; showInNav?: unknown; navOrder?: unknown }

function parseSection(body: SectionInput, partial: boolean): { error: string } | { values: Partial<typeof siteSectionsTable.$inferInsert> } {
  const values: Partial<typeof siteSectionsTable.$inferInsert> = {};
  if (body.title !== undefined) {
    if (typeof body.title !== 'string' || !body.title.trim() || body.title.trim().length > 60) return { error: 'Give the section a title of up to 60 characters.' };
    values.title = body.title.trim();
  } else if (!partial) return { error: 'Give the section a title.' };
  if (body.slug !== undefined) {
    if (typeof body.slug !== 'string') return { error: 'slug must be text.' };
    const slug = slugify(body.slug);
    if (!SLUG_PATTERN.test(slug) || slug.length < 2) return { error: 'The web address part must be 2-40 letters, numbers or hyphens.' };
    if (RESERVED_SLUGS.has(slug)) return { error: `"${slug}" is already used by a built-in page. Choose another name.` };
    values.slug = slug;
  }
  if (body.intro !== undefined) {
    if (typeof body.intro !== 'string' || body.intro.length > 2000) return { error: 'intro must be text of up to 2000 characters.' };
    values.intro = body.intro.trim();
  }
  if (body.emoji !== undefined) {
    if (body.emoji !== null && (typeof body.emoji !== 'string' || [...body.emoji].length > 2)) return { error: 'emoji must be a single emoji or null.' };
    values.emoji = body.emoji === null ? null : (body.emoji as string).trim() || null;
  }
  if (body.showInNav !== undefined) {
    if (typeof body.showInNav !== 'boolean') return { error: 'showInNav must be true or false.' };
    values.showInNav = body.showInNav;
  }
  if (body.navOrder !== undefined) {
    if (!Number.isSafeInteger(body.navOrder)) return { error: 'navOrder must be a whole number.' };
    values.navOrder = body.navOrder as number;
  }
  return { values };
}

router.get('/public/sections', async (_req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=30');
  const rows = await db.select().from(siteSectionsTable).orderBy(siteSectionsTable.navOrder, siteSectionsTable.title);
  res.json({ sections: rows.map(serialize) });
});

router.post('/teacher/sections', requireStudioRole('teacher'), async (req: Request, res: Response) => {
  const body = (req.body ?? {}) as SectionInput;
  const parsed = parseSection({ ...body, slug: body.slug ?? body.title }, false);
  if ('error' in parsed) { res.status(400).json({ error: parsed.error }); return; }
  const values = parsed.values as typeof siteSectionsTable.$inferInsert;
  const [existing] = await db.select({ id: siteSectionsTable.id }).from(siteSectionsTable).where(eq(siteSectionsTable.slug, values.slug));
  if (existing) { res.status(409).json({ error: `A section at /s/${values.slug} already exists.` }); return; }
  const [section] = await db.insert(siteSectionsTable).values({ ...values, createdBy: req.studioUser!.id }).returning();
  res.status(201).json({ section: serialize(section!) });
});

router.patch('/teacher/sections/:slug', requireStudioRole('teacher'), async (req: Request, res: Response) => {
  const slug = String(req.params.slug);
  const parsed = parseSection((req.body ?? {}) as SectionInput, true);
  if ('error' in parsed) { res.status(400).json({ error: parsed.error }); return; }
  if (Object.keys(parsed.values).length === 0) { res.status(400).json({ error: 'Nothing to change.' }); return; }
  if (parsed.values.slug && parsed.values.slug !== slug) {
    const [clash] = await db.select({ id: siteSectionsTable.id }).from(siteSectionsTable).where(eq(siteSectionsTable.slug, parsed.values.slug));
    if (clash) { res.status(409).json({ error: `A section at /s/${parsed.values.slug} already exists.` }); return; }
  }
  const [section] = await db.transaction(async (tx) => {
    const updated = await tx.update(siteSectionsTable).set({ ...parsed.values, updatedAt: new Date() })
      .where(eq(siteSectionsTable.slug, slug)).returning();
    if (updated[0] && parsed.values.slug && parsed.values.slug !== slug) {
      // Keep published pages attached to the renamed section.
      await tx.update(studioPublicationsTable).set({ destinationSection: parsed.values.slug })
        .where(eq(studioPublicationsTable.destinationSection, slug));
    }
    return updated;
  });
  if (!section) { res.status(404).json({ error: 'Section not found' }); return; }
  res.json({ section: serialize(section) });
});

router.delete('/teacher/sections/:slug', requireStudioRole('teacher'), async (req: Request, res: Response) => {
  const slug = String(req.params.slug);
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(studioPublicationsTable)
    .where(and(eq(studioPublicationsTable.destinationSection, slug), eq(studioPublicationsTable.publicationStatus, 'active')));
  if (n > 0) { res.status(409).json({ error: `${n} page${n === 1 ? ' is' : 's are'} still published in this section. Archive or move them first.` }); return; }
  const deleted = await db.delete(siteSectionsTable).where(eq(siteSectionsTable.slug, slug)).returning({ id: siteSectionsTable.id });
  if (deleted.length === 0) { res.status(404).json({ error: 'Section not found' }); return; }
  res.json({ success: true, slug });
});

export default router;
