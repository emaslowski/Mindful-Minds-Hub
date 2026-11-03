import { Router } from 'express';
import { and, desc, eq } from 'drizzle-orm';
import { db, contentCommentsTable } from '@workspace/db';
import { SubmitContentCommentBody } from '@workspace/api-zod';
import { publicContentSection } from '../lib/publicContentSections';
import { publicSubmissionLimit } from '../middlewares/publicSubmissionLimit';

const router = Router();

router.get('/content-comments', async (req, res): Promise<void> => {
  const section = publicContentSection(req.query.section);
  if (!section) {
    res.status(400).json({ error: 'Choose a public content page' });
    return;
  }
  res.setHeader('Cache-Control', 'no-store');
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
  const [row] = await db.insert(contentCommentsTable).values({
    section,
    authorName: parsed.data.authorName?.trim() || 'Anonymous',
    content: parsed.data.content.trim(),
    approved: false,
  }).returning({ id: contentCommentsTable.id });
  res.status(201).json({ id: row.id, pending: true });
});

export default router;
