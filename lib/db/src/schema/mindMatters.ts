import {
  pgTable, serial, text, boolean, timestamp, integer, date
} from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

// Journal entries (auth required)
export const journalEntriesTable = pgTable("journal_entries", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => usersTable.id),
  prompt: text("prompt").notNull().default(""),
  content: text("content").notNull(),
  flagged: boolean("flagged").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Gratitude entries (auth required)
export const gratitudeEntriesTable = pgTable("gratitude_entries", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => usersTable.id),
  content: text("content").notNull(),
  entryDate: date("entry_date").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Collaboration board posts (admin approval required)
export const collabPostsTable = pgTable("collab_posts", {
  id: serial("id").primaryKey(),
  authorName: text("author_name").notNull(),
  content: text("content").notNull(),
  approved: boolean("approved").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  approvedAt: timestamp("approved_at"),
});

// Collaboration board comments (moderator approval required)
export const collabCommentsTable = pgTable("collab_comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => collabPostsTable.id),
  authorName: text("author_name").notNull(),
  content: text("content").notNull(),
  approved: boolean("approved").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  approvedAt: timestamp("approved_at"),
});

// Reviews
export const reviewsTable = pgTable("reviews", {
  id: serial("id").primaryKey(),
  rating: integer("rating").notNull(),
  helpful: boolean("helpful").notNull().default(true),
  comment: text("comment"),
  approved: boolean("approved").notNull().default(false),
  teacherReply: text("teacher_reply"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Public content discussions. Private journals never use these threads.
export const contentCommentsTable = pgTable("content_comments", {
  id: serial("id").primaryKey(),
  section: text("section").notNull(),
  authorName: text("author_name").notNull(),
  content: text("content").notNull(),
  approved: boolean("approved").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Page view analytics
export const pageViewsTable = pgTable("page_views", {
  id: serial("id").primaryKey(),
  path: text("path").notNull(),
  section: text("section"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Community events
export const eventsTable = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  eventDate: date("event_date").notNull(),
  location: text("location"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type JournalEntry = typeof journalEntriesTable.$inferSelect;
export type GratitudeEntry = typeof gratitudeEntriesTable.$inferSelect;
export type CollabPost = typeof collabPostsTable.$inferSelect;
export type CollabComment = typeof collabCommentsTable.$inferSelect;
export type Review = typeof reviewsTable.$inferSelect;
export type PageView = typeof pageViewsTable.$inferSelect;
export type MindMattersEvent = typeof eventsTable.$inferSelect;
