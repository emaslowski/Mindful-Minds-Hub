import { boolean, integer, pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core';

// Craft Corner: teacher-posted craft ideas shown on the hub homepage and at
// /crafts. Materials and steps are plain text, one item per line. A craft can
// have one photo, uploaded straight to storage and verified on completion.
export const craftsTable = pgTable('crafts', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull().default(''),
  materials: text('materials').notNull().default(''),
  steps: text('steps').notNull().default(''),
  link: text('link'),
  published: boolean('published').notNull().default(true),
  imageObjectPath: text('image_object_path'),
  imageContentType: text('image_content_type'),
  imageSize: integer('image_size'),
  imageReady: boolean('image_ready').notNull().default(false),
  createdBy: varchar('created_by'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type Craft = typeof craftsTable.$inferSelect;
