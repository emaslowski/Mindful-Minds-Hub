import { Router } from "express";
import { db, blogPostsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { SubmitBlogPostBody } from "@workspace/api-zod";
import { isExampleBlogPost } from "../lib/exampleBlogPosts";
import { notifyTeachers } from "../lib/notifications";

const router = Router();

// GET /api/blog-posts — return approved posts
router.get("/blog-posts", async (req, res) => {
  try {
    const posts = await db
      .select()
      .from(blogPostsTable)
      .where(eq(blogPostsTable.approved, true))
      .orderBy(desc(blogPostsTable.approvedAt));

    const result = posts.filter((p) => !isExampleBlogPost(p)).map((p) => ({
      id: p.id,
      title: p.title,
      author: p.author,
      content: p.content,
      excerpt: p.excerpt,
      submittedAt: p.submittedAt.toISOString(),
      approvedAt: p.approvedAt ? p.approvedAt.toISOString() : null,
    }));

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch blog posts");
    res.status(500).json({ error: "Failed to fetch blog posts" });
  }
});

// GET /api/blog-posts/:id — return a single approved post
router.get("/blog-posts/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  try {
    const [post] = await db
      .select()
      .from(blogPostsTable)
      .where(eq(blogPostsTable.id, id));

    if (!post || !post.approved || isExampleBlogPost(post)) {
      res.status(404).json({ error: "Post not found" });
      return;
    }

    res.json({
      id: post.id,
      title: post.title,
      author: post.author,
      content: post.content,
      excerpt: post.excerpt,
      submittedAt: post.submittedAt.toISOString(),
      approvedAt: post.approvedAt ? post.approvedAt.toISOString() : null,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch blog post");
    res.status(500).json({ error: "Failed to fetch blog post" });
  }
});

// POST /api/blog-submissions — submit a post, email admin
router.post("/blog-submissions", async (req, res) => {
  const parsed = SubmitBlogPostBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid submission" });
    return;
  }

  const { title, author, content } = parsed.data;
  const excerpt = content.slice(0, 150) + (content.length > 150 ? "..." : "");

  try {
    // Save to DB (unapproved)
    await db.insert(blogPostsTable).values({
      title,
      author,
      content,
      excerpt,
      approved: false,
    });

    // Tell the teachers on the notification list (Command Center → Settings).
    {
      {
        await notifyTeachers({
          subject: `[The Brightside Wellness Project] New Blog Post Submission: "${title}"`,
          text: `New blog post submission.\n\nTitle: ${title}\nAuthor: ${author}\n\n${content}\n\nLog into The Brightside Wellness Project Command Center to authorize or leave this post pending.`,
          html: `
            <h2>New Blog Post Submission</h2>
            <p><strong>Title:</strong> ${title}</p>
            <p><strong>Author:</strong> ${author}</p>
            <hr />
            <p>${content.replace(/\n/g, "<br />")}</p>
            <hr />
            <p><em>Log into The Brightside Wellness Project Command Center to authorize or leave this post pending.</em></p>
          `,
        }, "blog submission notification");
      }
    }

    res.status(201).json({
      success: true,
      message:
        "Your post has been submitted! It will appear on the blog once it is reviewed and approved.",
    });
  } catch (err) {
    req.log.error({ err }, "Failed to save blog submission");
    res.status(500).json({ error: "Failed to submit post" });
  }
});

export default router;
