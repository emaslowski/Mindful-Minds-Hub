import { boolean, integer, jsonb, pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core';

// Teacher-created website sections (e.g. "Jokes"). Each one is a page at
// /s/<slug> on the main site that lists the student pages published to it,
// and a publishing destination in the Studio.
export const siteSectionsTable = pgTable('site_sections', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  intro: text('intro').notNull().default(''),
  emoji: text('emoji'),
  showInNav: boolean('show_in_nav').notNull().default(true),
  navOrder: integer('nav_order').notNull().default(100),
  createdBy: varchar('created_by'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type SiteSection = typeof siteSectionsTable.$inferSelect;

// Teacher overrides of the main site's editable text and lists. Keys and
// default values are defined in @workspace/site-content; a missing row means
// the page shows its default.
export const siteContentTable = pgTable('site_content', {
  key: text('key').primaryKey(),
  value: jsonb('value').$type<unknown>().notNull(),
  updatedBy: varchar('updated_by'),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type SiteContentRow = typeof siteContentTable.$inferSelect;
