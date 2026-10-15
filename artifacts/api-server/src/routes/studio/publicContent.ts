import { db } from '@workspace/db';
import {
  studioPublicationsTable,
  studioProjectsTable,
  studioPublicationEditsTable,
  studioPublicationMediaTable,
} from '@workspace/db/schema';
import { and, eq, desc, sql } from 'drizzle-orm';
import { defaultPublicationAppearance } from '../../lib/publicationEditions';
import type { PublicationEdition } from '@workspace/db';
import { videoStorage, streamProjectVideo } from '../../lib/projectVideoStorage';
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
      title: sql<string>`COALESCE(${studioPublicationEditsTable.published}->>'title', ${studioProjectsTable.title})`,
      contentType: studioProjectsTable.contentType,
      content: sql<string>`COALESCE(${studioPublicationEditsTable.published}->>'content', ${studioProjectsTable.content}, '')`,
      appearance: sql<PublicationEdition['appearance']>`COALESCE(${studioPublicationEditsTable.published}->'appearance', ${JSON.stringify(defaultPublicationAppearance)}::jsonb)`,
      blocks: sql<NonNullable<PublicationEdition['blocks']>>`COALESCE(${studioPublicationEditsTable.published}->'blocks', '[]'::jsonb)`,
      pageOrder: sql<number>`COALESCE((${studioPublicationEditsTable.published}->>'pageOrder')::integer, 1000)`,
      destinationSection: studioPublicationsTable.destinationSection,
      authorDisplay: studioPublicationsTable.authorDisplay,
      publishedAt: studioPublicationsTable.publishedAt,
    })
    .from(studioPublicationsTable)
    .innerJoin(studioProjectsTable, eq(studioPublicationsTable.projectId, studioProjectsTable.id))
    .leftJoin(studioPublicationEditsTable, eq(studioPublicationEditsTable.projectId, studioProjectsTable.id))
    .where(eq(studioPublicationsTable.publicationStatus, 'active'))
    .orderBy(sql`COALESCE((${studioPublicationEditsTable.published}->>'pageOrder')::integer, 1000)`, desc(studioPublicationsTable.publishedAt));

  const filtered = section
    ? publications.filter((p) => p.destinationSection === section)
    : publications;

  res.json({ publications: filtered });
});

// Only a media reference in the active PUBLISHED snapshot grants public access.
// Merely uploading, saving a draft, or guessing an asset ID grants nothing.
router.get('/public/publications/:projectId/media/:mediaId', async (req, res) => {
  const projectId = Number(req.params.projectId), mediaId = Number(req.params.mediaId);
  if (!Number.isSafeInteger(projectId) || projectId < 1 || !Number.isSafeInteger(mediaId) || mediaId < 1) {
    res.status(404).end(); return;
  }
  const [row] = await db.select({ objectPath: studioPublicationMediaTable.objectPath })
    .from(studioPublicationMediaTable)
    .innerJoin(studioPublicationsTable, eq(studioPublicationsTable.projectId, studioPublicationMediaTable.projectId))
    .innerJoin(studioPublicationEditsTable, eq(studioPublicationEditsTable.projectId, studioPublicationMediaTable.projectId))
    .where(and(
      eq(studioPublicationMediaTable.id, mediaId), eq(studioPublicationMediaTable.projectId, projectId),
      eq(studioPublicationMediaTable.status, 'ready'), eq(studioPublicationsTable.publicationStatus, 'active'),
      sql`EXISTS (SELECT 1 FROM jsonb_array_elements(COALESCE(${studioPublicationEditsTable.published}->'blocks', '[]'::jsonb)) AS block WHERE block->>'mediaId' = ${String(mediaId)})`,
    ));
  if (!row) { res.status(404).end(); return; }
  try { await streamProjectVideo(await videoStorage.getObjectEntityFile(row.objectPath), req, res); }
  catch { if (!res.headersSent) res.status(404).end(); }
});

export default router;
