import { pgTable, serial, text, integer, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const artworkTable = pgTable("artwork_submissions", {
  id: serial("id").primaryKey(),
  ownerId: text("owner_id").notNull(),
  artistName: text("artist_name").notNull(),
  title: text("title").notNull(),
  objectPath: text("object_path").notNull(),
  filename: text("filename").notNull(),
  contentType: text("content_type").notNull(),
  size: integer("size").notNull(),
  status: text("status").$type<"uploading" | "pending" | "approved" | "rejected">().notNull().default("uploading"),
  featuredMonth: text("featured_month"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, table => [uniqueIndex("artwork_one_winner_per_month").on(table.featuredMonth)]);

export const insertArtworkSchema = createInsertSchema(artworkTable).omit({ id: true, createdAt: true });
export type InsertArtwork = z.infer<typeof insertArtworkSchema>;
export type Artwork = typeof artworkTable.$inferSelect;
