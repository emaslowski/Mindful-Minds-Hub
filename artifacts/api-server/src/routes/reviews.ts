import { Router } from "express";
import { db } from "@workspace/db";
import { reviewsTable } from "@workspace/db/schema";
import { desc, eq } from "drizzle-orm";
import { SaveTeacherReviewReplyBody, SubmitReviewBody } from "@workspace/api-zod";
import { requireStudioRole } from "../middlewares/studioAuthMiddleware";
import { publicSubmissionLimit } from "../middlewares/publicSubmissionLimit";

const router = Router();

// GET /api/reviews
router.get("/reviews", async (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const reviews = await db
    .select()
    .from(reviewsTable)
    .where(eq(reviewsTable.approved, true))
    .orderBy(desc(reviewsTable.createdAt)).limit(200);
  res.json(
    reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      helpful: r.helpful,
      comment: r.comment,
      approved: r.approved,
      teacherReply: r.teacherReply,
      createdAt: r.createdAt.toISOString(),
    })),
  );
});

// POST /api/reviews
router.post("/reviews", publicSubmissionLimit, async (req, res) => {
  const parsed = SubmitReviewBody.safeParse(req.body);
  if (!parsed.success || !Number.isInteger(parsed.data.rating) ||
      parsed.data.rating < 1 || parsed.data.rating > 5 ||
      (parsed.data.comment?.length ?? 0) > 2000) {
    res.status(400).json({ error: "Use a rating from 1 to 5, a yes/no answer, and at most 2000 comment characters" });
    return;
  }
  const { rating, helpful, comment } = parsed.data;
  const [review] = await db
    .insert(reviewsTable)
    .values({ rating, helpful, comment: comment?.trim() || null, approved: false })
    .returning();
  res.status(201).json({
    id: review.id,
    rating: review.rating,
    helpful: review.helpful,
    comment: review.comment,
    approved: review.approved,
    teacherReply: review.teacherReply,
    createdAt: review.createdAt.toISOString(),
  });
});

router.put('/teacher/reviews/:id/reply', requireStudioRole('teacher'), async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const parsed = SaveTeacherReviewReplyBody.safeParse(req.body);
  if (!Number.isSafeInteger(id) || id <= 0 || !parsed.success) {
    res.status(400).json({ error: 'Use a valid review and a reply of at most 2000 characters' });
    return;
  }
  const [review] = await db.update(reviewsTable)
    .set({ teacherReply: parsed.data.reply.trim() || null })
    .where(eq(reviewsTable.id, id)).returning();
  if (!review) {
    res.status(404).json({ error: 'Review not found' });
    return;
  }
  res.json({ ...review, createdAt: review.createdAt.toISOString() });
});

export default router;
