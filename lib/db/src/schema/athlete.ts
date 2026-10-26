import { pgTable, serial, text, integer, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const athleteTable = pgTable("athlete_submissions", {
  id: serial("id").primaryKey(),
  ownerId: text("owner_id").notNull(),
  athleteName: text("athlete_name").notNull(),
  title: text("title").notNull(),
  objectPath: text("object_path").notNull(),
  filename: text("filename").notNull(),
  contentType: text("content_type").notNull(),
  size: integer("size").notNull(),
  status: text("status").$type<"uploading" | "pending" | "approved" | "rejected">().notNull().default("uploading"),
  featuredMonth: text("featured_month"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, table => [uniqueIndex("athlete_one_winner_per_month").on(table.featuredMonth)]);

export type Athlete = typeof athleteTable.$inferSelect;
