import { Router } from "express";
import { db } from "@workspace/db";
import { reviewsTable } from "@workspace/db/schema";

const router = Router();

// GET /api/reviews
router.get("/reviews", async (_req, res) => {
  const reviews = await db
    .select()
    .from(reviewsTable)
    .orderBy(reviewsTable.createdAt);
  res.json(
    reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      helpful: r.helpful,
      comment: r.comment,
      createdAt: r.createdAt.toISOString(),
    })),
  );
});

// POST /api/reviews
router.post("/reviews", async (req, res) => {
  const { rating, helpful, comment } = req.body;
  if (rating === undefined || helpful === undefined) {
    res.status(400).json({ error: "rating and helpful are required" });
    return;
  }
  if (rating < 1 || rating > 5) {
    res.status(400).json({ error: "rating must be between 1 and 5" });
    return;
  }
  const [review] = await db
    .insert(reviewsTable)
    .values({ rating, helpful, comment: comment ?? null })
    .returning();
  res.status(201).json({
    id: review.id,
    rating: review.rating,
    helpful: review.helpful,
    comment: review.comment,
    createdAt: review.createdAt.toISOString(),
  });
});

export default router;
