import { db } from '@workspace/db';
import {
  blogPostsTable,
  collabCommentsTable,
  collabPostsTable,
  contentCommentsTable,
  reviewsTable,
} from '@workspace/db/schema';
import { and, desc, eq, sql } from 'drizzle-orm';
import { Router, type Request, type Response } from 'express';
import { requireStudioRole } from '../../../middlewares/studioAuthMiddleware';

const router = Router();

router.get(
  '/teacher/moderation',
  requireStudioRole('teacher'),
  async (_req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-store');
    const [blogPosts, collabPosts, approvedCollabPosts, comments, contentComments, reviews] = await Promise.all([
      db
        .select({
          id: blogPostsTable.id,
          title: blogPostsTable.title,
          author: blogPostsTable.author,
          content: blogPostsTable.content,
          createdAt: blogPostsTable.submittedAt,
        })
        .from(blogPostsTable)
        .where(eq(blogPostsTable.approved, false))
        .orderBy(desc(blogPostsTable.submittedAt)),
      db
        .select({
          id: collabPostsTable.id,
          author: collabPostsTable.authorName,
          content: collabPostsTable.content,
          createdAt: collabPostsTable.createdAt,
        })
        .from(collabPostsTable)
        .where(eq(collabPostsTable.approved, false))
        .orderBy(desc(collabPostsTable.createdAt)),
      db
        .select({
          id: collabPostsTable.id,
          author: collabPostsTable.authorName,
          content: collabPostsTable.content,
          createdAt: collabPostsTable.createdAt,
        })
        .from(collabPostsTable)
        .where(eq(collabPostsTable.approved, true))
        .orderBy(desc(collabPostsTable.createdAt)),
      db
        .select({
          id: collabCommentsTable.id,
          postId: collabCommentsTable.postId,
          author: collabCommentsTable.authorName,
          content: collabCommentsTable.content,
          createdAt: collabCommentsTable.createdAt,
          postTitle: collabPostsTable.content,
        })
        .from(collabCommentsTable)
        .innerJoin(
          collabPostsTable,
          eq(collabCommentsTable.postId, collabPostsTable.id),
        )
        .where(eq(collabCommentsTable.approved, false))
        .orderBy(desc(collabCommentsTable.createdAt)),
      db.select().from(contentCommentsTable)
        .where(eq(contentCommentsTable.approved, false))
        .orderBy(desc(contentCommentsTable.createdAt)),
      db.select().from(reviewsTable)
        .orderBy(reviewsTable.approved, desc(reviewsTable.createdAt)),
    ]);

    res.json({
      contentComments: contentComments.map(row => ({
        ...row, type: 'content-comment', createdAt: row.createdAt.toISOString(),
      })),
      reviews: reviews.map(row => ({
        ...row, type: 'review', createdAt: row.createdAt.toISOString(),
      })),
      blogPosts: blogPosts.map((post) => ({
        ...post,
        type: 'blog' as const,
        createdAt: post.createdAt.toISOString(),
      })),
      collabPosts: collabPosts.map((post) => ({
        ...post,
        type: 'collab-post' as const,
        createdAt: post.createdAt.toISOString(),
      })),
      approvedCollabPosts: approvedCollabPosts.map((post) => ({
        ...post,
        type: 'collab-post' as const,
        createdAt: post.createdAt.toISOString(),
      })),
      comments: comments.map((comment) => ({
        ...comment,
        type: 'comment' as const,
        createdAt: comment.createdAt.toISOString(),
      })),
    });
  },
);

router.post(
  '/teacher/moderation/:type/:id/approve',
  requireStudioRole('teacher'),
  async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const type = req.params.type;
    if (!Number.isSafeInteger(id) || id <= 0) {
      res.status(400).json({ error: 'Invalid moderation item' });
      return;
    }

    let updated: { id: number }[] = [];
    if (type === 'content-comment') {
      updated = await db.update(contentCommentsTable).set({ approved: true })
        .where(and(eq(contentCommentsTable.id, id), eq(contentCommentsTable.approved, false)))
        .returning({ id: contentCommentsTable.id });
    } else if (type === 'review') {
      updated = await db.update(reviewsTable).set({ approved: true })
        .where(and(eq(reviewsTable.id, id), eq(reviewsTable.approved, false)))
        .returning({ id: reviewsTable.id });
    } else if (type === 'blog') {
      updated = await db
        .update(blogPostsTable)
        .set({ approved: true, approvedAt: new Date() })
        .where(and(eq(blogPostsTable.id, id), eq(blogPostsTable.approved, false)))
        .returning({ id: blogPostsTable.id });
    } else if (type === 'collab-post') {
      updated = await db.transaction(async (tx) => {
        // Keep approval mutually exclusive with deletion so a delete can never
        // remove comments from a post that was approved at the same time.
        await tx.execute(sql`SELECT pg_advisory_xact_lock(${id})`);
        return tx
          .update(collabPostsTable)
          .set({ approved: true, approvedAt: new Date() })
          .where(and(eq(collabPostsTable.id, id), eq(collabPostsTable.approved, false)))
          .returning({ id: collabPostsTable.id });
      });
    } else if (type === 'comment') {
      updated = await db
        .update(collabCommentsTable)
        .set({ approved: true, approvedAt: new Date() })
        .where(and(eq(collabCommentsTable.id, id), eq(collabCommentsTable.approved, false)))
        .returning({ id: collabCommentsTable.id });
    } else {
      res.status(400).json({ error: 'Unknown moderation item type' });
      return;
    }

    if (updated.length === 0) {
      res.status(404).json({ error: 'Moderation item not found or already approved' });
      return;
    }

    res.json({ success: true, type, id });
  },
);

router.delete(
  '/teacher/moderation/:type/:id',
  requireStudioRole('teacher'),
  async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const type = req.params.type;
    if (!Number.isSafeInteger(id) || id <= 0) {
      res.status(400).json({ error: 'Invalid moderation item' });
      return;
    }

    if (type === 'content-comment' || type === 'review') {
      const table = type === 'review' ? reviewsTable : contentCommentsTable;
      const deleted = await db.delete(table).where(eq(table.id, id)).returning({ id: table.id });
      if (!deleted.length) {
        res.status(404).json({ error: 'Moderation item not found' });
        return;
      }
    } else if (type === 'blog') {
      const deleted = await db
        .delete(blogPostsTable)
        .where(and(eq(blogPostsTable.id, id), eq(blogPostsTable.approved, false)))
        .returning({ id: blogPostsTable.id });

      if (deleted.length === 0) {
        res.status(404).json({ error: 'Pending blog post not found' });
        return;
      }
    } else if (type === 'comment') {
      const deleted = await db
        .delete(collabCommentsTable)
        .where(and(eq(collabCommentsTable.id, id), eq(collabCommentsTable.approved, false)))
        .returning({ id: collabCommentsTable.id });

      if (deleted.length === 0) {
        res.status(404).json({ error: 'Pending comment not found' });
        return;
      }
    } else if (type === 'collab-post') {
      const deleted = await db.transaction(async (tx) => {
        // The approval route holds the same lock. Once it is acquired, this
        // transaction sees a stable post state before touching any child
        // comments, whether the post is pending or already approved.
        await tx.execute(sql`SELECT pg_advisory_xact_lock(${id})`);

        const [post] = await tx
          .select({ id: collabPostsTable.id })
          .from(collabPostsTable)
          .where(eq(collabPostsTable.id, id));

        if (!post) return [];

        await tx
          .delete(collabCommentsTable)
          .where(eq(collabCommentsTable.postId, id));

        return tx
          .delete(collabPostsTable)
          .where(eq(collabPostsTable.id, id))
          .returning({ id: collabPostsTable.id });
      });

      if (deleted.length === 0) {
        res.status(404).json({ error: 'Board post not found' });
        return;
      }
    } else {
      res.status(400).json({ error: 'Unknown moderation item type' });
      return;
    }

    res.json({ success: true, type, id });
  },
);

export default router;