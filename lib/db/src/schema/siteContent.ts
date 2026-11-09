import { jsonb, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';

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
