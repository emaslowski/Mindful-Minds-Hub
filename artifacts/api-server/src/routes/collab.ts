import { Router } from "express";
import { db } from "@workspace/db";
import { collabPostsTable, collabCommentsTable } from "@workspace/db/schema";
import { eq, and, sql } from "drizzle-orm";
import nodemailer from "nodemailer";

const router = Router();

async function notifyAdminNewPost(authorName: string, content: string) {
  const smtpHost = process.env.SMTP_HOST;
  if (!smtpHost) return;

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: "elittle9514@gmail.com",
    subject: "📌 New Collaboration Board Post — Awaiting Approval",
    text: `A student submitted a new collaboration board post.\n\nAuthor: ${authorName}\n\nPost:\n${content}\n\nLog into Mind Matters admin to approve or reject.`,
    html: `<h2>📌 New Collaboration Board Post</h2>
      <p>A student submitted a post for the collaboration board. Please review it.</p>
      <p><strong>Author:</strong> ${authorName}</p>
      <p><strong>Post:</strong></p>
      <blockquote style="background:#f5f5f5;padding:12px;border-left:4px solid #688A52">${content.replace(/\n/g, "<br>")}</blockquote>
      <p>To approve: run <code>UPDATE collab_posts SET approved=true WHERE id=&lt;id&gt;</code> in the database, or use your admin panel.</p>`,
  });
}

// GET /api/collab-posts
router.get("/collab-posts", async (_req, res) => {
  const posts = await db
    .select({
      id: collabPostsTable.id,
      authorName: collabPostsTable.authorName,
      content: collabPostsTable.content,
      createdAt: collabPostsTable.createdAt,
      commentCount: sql<number>`(SELECT COUNT(*) FROM collab_comments WHERE post_id = ${collabPostsTable.id})::int`,
    })
    .from(collabPostsTable)
    .where(eq(collabPostsTable.approved, true))
    .orderBy(collabPostsTable.createdAt);

  res.json(
    posts.map((p) => ({
      id: p.id,
      authorName: p.authorName,
      content: p.content,
      commentCount: p.commentCount,
      createdAt: p.createdAt.toISOString(),
    })),
  );
});

// POST /api/collab-posts
router.post("/collab-posts", async (req, res) => {
  const { authorName, content } = req.body;
  if (!authorName || !content) {
    res.status(400).json({ error: "authorName and content are required" });
    return;
  }
  await db.insert(collabPostsTable).values({
    authorName: authorName.trim(),
    content: content.trim(),
    approved: false,
  });

  notifyAdminNewPost(authorName, content).catch(() => {});

  res.status(201).json({
    success: true,
    message: "Your post has been submitted for review. It will appear on the board once approved!",
  });
});

// GET /api/collab-posts/:id/comments
router.get("/collab-posts/:id/comments", async (req, res) => {
  const postId = Number(req.params.id);
  const comments = await db
    .select()
    .from(collabCommentsTable)
    .where(eq(collabCommentsTable.postId, postId))
    .orderBy(collabCommentsTable.createdAt);

  res.json(
    comments.map((c) => ({
      id: c.id,
      authorName: c.authorName,
      content: c.content,
      createdAt: c.createdAt.toISOString(),
    })),
  );
});

// POST /api/collab-posts/:id/comments
router.post("/collab-posts/:id/comments", async (req, res) => {
  const postId = Number(req.params.id);
  const { authorName, content } = req.body;
  if (!authorName || !content) {
    res.status(400).json({ error: "authorName and content are required" });
    return;
  }

  const [comment] = await db
    .insert(collabCommentsTable)
    .values({
      postId,
      authorName: authorName.trim(),
      content: content.trim(),
    })
    .returning();

  res.status(201).json({
    id: comment.id,
    authorName: comment.authorName,
    content: comment.content,
    createdAt: comment.createdAt.toISOString(),
  });
});

export default router;
