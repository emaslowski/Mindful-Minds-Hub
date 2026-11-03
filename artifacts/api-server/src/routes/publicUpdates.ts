import { Router } from 'express';
import { and, desc, eq, sql } from 'drizzle-orm';
import {
  db, studioPublicationsTable, studioPublicationEditsTable,
  blogPostsTable, collabPostsTable,
} from '@workspace/db';
import { isExampleBlogPost } from '../lib/exampleBlogPosts';
import { newestUpdates, UPDATE_DESTINATIONS, type HomepageUpdate } from '../lib/publicUpdates';

const router = Router();

router.get('/public/updates', async (_req, res): Promise<void> => {
  res.setHeader('Cache-Control', 'no-store');
  const [publications, blogs, advice] = await Promise.all([
    db.select({
      id: studioPublicationsTable.id,
      title: sql<string | null>`${studioPublicationEditsTable.published}->>'title'`,
      destination: studioPublicationsTable.destinationSection,
      publishedAt: studioPublicationsTable.publishedAt,
    }).from(studioPublicationsTable)
      .innerJoin(studioPublicationEditsTable,
        eq(studioPublicationEditsTable.projectId, studioPublicationsTable.projectId))
      .where(and(
        eq(studioPublicationsTable.publicationStatus, 'active'),
        sql`${studioPublicationEditsTable.published} IS NOT NULL`,
      )).orderBy(desc(studioPublicationsTable.publishedAt)).limit(30),
    db.select().from(blogPostsTable).where(eq(blogPostsTable.approved, true))
      .orderBy(desc(blogPostsTable.approvedAt)).limit(30),
    db.select({
      id: collabPostsTable.id, content: collabPostsTable.content,
      publishedAt: collabPostsTable.approvedAt,
    }).from(collabPostsTable).where(eq(collabPostsTable.approved, true))
      .orderBy(desc(collabPostsTable.approvedAt)).limit(6),
  ]);
  const items: HomepageUpdate[] = [];
  for (const post of publications) {
    const destination = UPDATE_DESTINATIONS[post.destination];
    if (!destination) continue;
    items.push({
      id: `publication-${post.id}`, title: post.title?.trim() || 'New student post',
      section: destination.label, href: destination.href,
      publishedAt: post.publishedAt.toISOString(),
    });
  }
  for (const post of blogs) {
    if (isExampleBlogPost(post) || !post.approvedAt) continue;
    items.push({
      id: `blog-${post.id}`, title: post.title, section: 'From Our Community',
      href: `/connect/blog/${post.id}`, publishedAt: post.approvedAt.toISOString(),
    });
  }
  for (const post of advice) {
    if (!post.publishedAt) continue;
    const title = post.content.replace(/\s+/g, ' ').trim();
    items.push({
      id: `advice-${post.id}`, title: title.length > 90 ? `${title.slice(0, 87)}…` : title,
      section: 'Brightside Advice Column', href: '/grow/collab',
      publishedAt: post.publishedAt.toISOString(),
    });
  }
  res.json(newestUpdates(items));
});

export default router;
