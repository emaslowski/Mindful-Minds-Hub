import { pgTable, serial, integer, text, timestamp } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { studioProjectsTable, studioJobsTable } from './studio';

export const studioVideoProductionsTable = pgTable('studio_video_productions', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull().unique().references(() => studioProjectsTable.id, { onDelete: 'cascade' }),
  producerJobId: integer('producer_job_id').notNull().references(() => studioJobsTable.id),
  status: text('status').notNull().default('assigned'),
  instructions: text('instructions').notNull().default(''),
  objectPath: text('object_path'),
  filename: text('filename'),
  mimeType: text('mime_type'),
  size: integer('size'),
  pendingObjectPath: text('pending_object_path'),
  pendingFilename: text('pending_filename'),
  pendingMimeType: text('pending_mime_type'),
  pendingSize: integer('pending_size'),
  pendingExpiresAt: timestamp('pending_expires_at', { withTimezone: true }),
  uploadedAt: timestamp('uploaded_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertStudioVideoProductionSchema = createInsertSchema(studioVideoProductionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type StudioVideoProduction = typeof studioVideoProductionsTable.$inferSelect;
