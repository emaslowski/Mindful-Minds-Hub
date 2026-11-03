import { Router } from 'express';
import { and, desc, eq, sql } from 'drizzle-orm';
import { db, contentCommentsTable, studioPublicationsTable, studioPublicationEditsTable } from '@workspace/db';
import { SubmitContentCommentBody } from '@workspace/api-zod';
import { publicContentSection } from '../lib/publicContentSections';
import { publicSubmissionLimit } from '../middlewares/publicSubmissionLimit';

const router = Router();

async function isPublishedThread(section: string): Promise<boolean> {
  const match = /^\/content\/publication\/([1-9][0-9]*)$/.exec(section);
  if (!match) return true;
  const projectId = Number(match[1]);
  if (!Number.isSafeInteger(projectId)) return false;
  const [publication] = await db.select({ id: studioPublicationsTable.id })
    .from(studioPublicationsTable)
    .innerJoin(studioPublicationEditsTable,
      eq(studioPublicationEditsTable.projectId, studioPublicationsTable.projectId))
    .where(and(
      eq(studioPublicationsTable.projectId, projectId),
      eq(studioPublicationsTable.publicationStatus, 'active'),
      sql`${studioPublicationEditsTable.published} IS NOT NULL`,
    )).limit(1);
  return Boolean(publication);
}

router.get('/content-comments', async (req, res): Promise<void> => {
  res.setHeader('Cache-Control', 'no-store');
  const section = publicContentSection(req.query.section);
  if (!section) {
    res.status(400).json({ error: 'Choose a public content page' });
    return;
  }
  if (!await isPublishedThread(section)) {
    res.status(404).json({ error: 'Published content not found' });
    return;
  }
  const comments = await db.select({
    id: contentCommentsTable.id,
    section: contentCommentsTable.section,
    authorName: contentCommentsTable.authorName,
    content: contentCommentsTable.content,
    createdAt: contentCommentsTable.createdAt,
  }).from(contentCommentsTable)
    .where(and(eq(contentCommentsTable.section, section), eq(contentCommentsTable.approved, true)))
    .orderBy(desc(contentCommentsTable.createdAt)).limit(200);
  res.json(comments.map(row => ({ ...row, createdAt: row.createdAt.toISOString() })));
});

router.post('/content-comments', publicSubmissionLimit, async (req, res): Promise<void> => {
  const parsed = SubmitContentCommentBody.safeParse(req.body);
  const section = publicContentSection(req.body?.section);
  if (!parsed.success || !section || !parsed.data.content.trim()) {
    res.status(400).json({ error: 'Enter a comment (1–2000 characters) on a public content page' });
    return;
  }
  if (!await isPublishedThread(section)) {
    res.status(404).json({ error: 'Published content not found' });
    return;
  }
  const [row] = await db.insert(contentCommentsTable).values({
    section,
    authorName: parsed.data.authorName?.trim() || 'Anonymous',
    content: parsed.data.content.trim(),
    approved: false,
  }).returning({ id: contentCommentsTable.id });
  res.status(201).json({ id: row.id, pending: true });
});

export default router;
