import { db } from '@workspace/db';
import {
  studioPublicationsTable,
  studioProjectsTable,
} from '@workspace/db/schema';
import { eq, desc } from 'drizzle-orm';
import { Router } from 'express';

const router = Router();

// GET /api/public/published — all active published content (no auth required)
// Never includes student names, ids, or private data
router.get('/public/published', async (req, res) => {
  const { section } = req.query as { section?: string };

  const publications = await db
    .select({
      id: studioPublicationsTable.id,
      projectId: studioPublicationsTable.projectId,
      title: studioProjectsTable.title,
      contentType: studioProjectsTable.contentType,
      content: studioProjectsTable.content,
      destinationSection: studioPublicationsTable.destinationSection,
      authorDisplay: studioPublicationsTable.authorDisplay,
      publishedAt: studioPublicationsTable.publishedAt,
    })
    .from(studioPublicationsTable)
    .innerJoin(studioProjectsTable, eq(studioPublicationsTable.projectId, studioProjectsTable.id))
    .where(eq(studioPublicationsTable.publicationStatus, 'active'))
    .orderBy(desc(studioPublicationsTable.publishedAt));

  const filtered = section
    ? publications.filter((p) => p.destinationSection === section)
    : publications;

  res.json({ publications: filtered });
});

export default router;
