import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const blogPostsTable = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  content: text("content").notNull(),
  excerpt: text("excerpt").notNull(),
  approved: boolean("approved").notNull().default(false),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
  approvedAt: timestamp("approved_at"),
});

export const insertBlogPostSchema = createInsertSchema(blogPostsTable).omit({
  id: true,
  submittedAt: true,
  approvedAt: true,
  approved: true,
});

export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type BlogPost = typeof blogPostsTable.$inferSelect;
