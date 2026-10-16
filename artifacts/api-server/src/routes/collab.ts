import { Router } from "express";
import { db } from "@workspace/db";
import { collabPostsTable, collabCommentsTable } from "@workspace/db/schema";
import { eq, and, sql } from "drizzle-orm";
import nodemailer from "nodemailer";
import { logger } from "../lib/logger";

const router = Router();
const MODERATOR_EMAIL = "mindmatters0526@gmail.com";

function createModeratorTransport() {
  const smtpHost = process.env.SMTP_HOST ?? "smtp.gmail.com";
  const smtpPort = Number(process.env.SMTP_PORT ?? 587);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpUser || !smtpPass) {
    logger.error(
      { recipient: MODERATOR_EMAIL },
      "Collaboration moderation email was not sent because SMTP credentials are missing",
    );
    return null;
  }

  return {
    smtpUser,
    transporter: nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      requireTLS: smtpPort === 587,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    }),
  };
}

async function sendModeratorEmail({
  subject,
  text,
  html,
  notificationType,
}: {
  subject: string;
  text: string;
  html: string;
  notificationType: "post" | "comment";
}) {
  const mailer = createModeratorTransport();
  if (!mailer) return;

  try {
    const info = await mailer.transporter.sendMail({
      from: { name: "The Brightside Project", address: mailer.smtpUser },
      replyTo: mailer.smtpUser,
      to: MODERATOR_EMAIL,
      subject,
      text,
      html,
    });

    if (info.rejected.includes(MODERATOR_EMAIL)) {
      logger.error(
        {
          accepted: info.accepted,
          rejected: info.rejected,
          response: info.response,
          recipient: MODERATOR_EMAIL,
        },
        `Collaboration ${notificationType} approval email was rejected`,
      );
      return;
    }

    logger.info(
      {
        accepted: info.accepted,
        messageId: info.messageId,
        recipient: MODERATOR_EMAIL,
        response: info.response,
      },
      `Collaboration ${notificationType} approval email accepted by SMTP`,
    );
  } catch (error) {
    logger.error(
      { err: error, recipient: MODERATOR_EMAIL },
      `Failed to send collaboration ${notificationType} approval email`,
    );
  }
}

async function notifyAdminNewPost(authorName: string, content: string) {
  await sendModeratorEmail({
    notificationType: "post",
    subject: "New Collaboration Board Post — Awaiting Approval",
    text: `A student submitted a new collaboration board post.\n\nAuthor: ${authorName}\n\nPost:\n${content}\n\nLog into The Brightside Project Command Center to authorize or leave this post pending.`,
    html: `<h2>New Collaboration Board Post</h2>
        <p>A student submitted a post for the collaboration board. Please review it.</p>
        <p><strong>Author:</strong> ${authorName}</p>
        <p><strong>Post:</strong></p>
        <blockquote style="background:#f5f5f5;padding:12px;border-left:4px solid #688A52">${content.replace(/\n/g, "<br>")}</blockquote>
        <p>Log into The Brightside Project Command Center to authorize or leave this post pending.</p>`,
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
      commentCount: sql<number>`COUNT(${collabCommentsTable.id})::int`,
    })
    .from(collabPostsTable)
    .leftJoin(
      collabCommentsTable,
      eq(collabCommentsTable.postId, collabPostsTable.id),
    )
    .where(eq(collabPostsTable.approved, true))
    .groupBy(
      collabPostsTable.id,
      collabPostsTable.authorName,
      collabPostsTable.content,
      collabPostsTable.createdAt,
    )
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

  await notifyAdminNewPost(authorName, content);

  res.status(201).json({
    success: true,
    message: "Your post has been submitted for review. It will appear on the board once approved!",
  });
});

// GET /api/collab-posts/:id/comments
router.get("/collab-posts/:id/comments", async (req, res) => {
  const postId = Number(req.params.id);
  const [post] = await db
    .select({ id: collabPostsTable.id })
    .from(collabPostsTable)
    .where(and(eq(collabPostsTable.id, postId), eq(collabPostsTable.approved, true)));

  if (!post) {
    res.status(404).json({ error: "Post not found" });
    return;
  }

  const comments = await db
    .select()
    .from(collabCommentsTable)
    .where(and(eq(collabCommentsTable.postId, postId), eq(collabCommentsTable.approved, true)))
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

  const [post] = await db
    .select({ id: collabPostsTable.id })
    .from(collabPostsTable)
    .where(and(eq(collabPostsTable.id, postId), eq(collabPostsTable.approved, true)));

  if (!post) {
    res.status(404).json({ error: "Post not found" });
    return;
  }

  const [comment] = await db
    .insert(collabCommentsTable)
    .values({
      postId,
      authorName: authorName.trim(),
      content: content.trim(),
      approved: false,
    })
    .returning();

  await notifyAdminNewComment(authorName, content, postId);

  res.status(201).json({
    id: comment.id,
    authorName: comment.authorName,
    content: comment.content,
    createdAt: comment.createdAt.toISOString(),
    message: "Your comment was sent for moderator approval.",
  });
});

async function notifyAdminNewComment(authorName: string, content: string, postId: number) {
  await sendModeratorEmail({
    notificationType: "comment",
    subject: "New Collaboration Board Comment — Awaiting Approval",
    text: `A student submitted a new collaboration board comment for post #${postId}.\n\nAuthor: ${authorName}\n\nComment:\n${content}\n\nLog into The Brightside Project Command Center to authorize it.`,
    html: `<h2>New Collaboration Board Comment</h2>
        <p>A student submitted a comment for the collaboration board. Please review it.</p>
        <p><strong>Author:</strong> ${authorName}</p>
        <p><strong>Comment:</strong></p>
        <blockquote style="background:#f5f5f5;padding:12px;border-left:4px solid #688A52">${content.replace(/\n/g, "<br>")}</blockquote>
        <p>Log into The Brightside Project Command Center to authorize or leave this comment pending.</p>`,
  });
}

export default router;
