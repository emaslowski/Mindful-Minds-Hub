import { db } from '@workspace/db';
import {
  blogPostsTable,
  collabCommentsTable,
  collabPostsTable,
} from '@workspace/db/schema';
import { and, desc, eq } from 'drizzle-orm';
import { Router, type Request, type Response } from 'express';
import { requireStudioRole } from '../../../middlewares/studioAuthMiddleware';

const router = Router();

router.get(
  '/teacher/moderation',
  requireStudioRole('teacher'),
  async (_req: Request, res: Response) => {
    const [blogPosts, collabPosts, comments] = await Promise.all([
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
    ]);

    res.json({
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
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: 'Invalid moderation item' });
      return;
    }

    let updated: { id: number }[] = [];
    if (type === 'blog') {
      updated = await db
        .update(blogPostsTable)
        .set({ approved: true, approvedAt: new Date() })
        .where(and(eq(blogPostsTable.id, id), eq(blogPostsTable.approved, false)))
        .returning({ id: blogPostsTable.id });
    } else if (type === 'collab-post') {
      updated = await db
        .update(collabPostsTable)
        .set({ approved: true, approvedAt: new Date() })
        .where(and(eq(collabPostsTable.id, id), eq(collabPostsTable.approved, false)))
        .returning({ id: collabPostsTable.id });
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

export default router;