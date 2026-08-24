import {
  pgEnum,
  pgTable,
  serial,
  integer,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { usersTable } from './auth';

export const anonymousRequestStatusEnum = pgEnum('anonymous_request_status', [
  'pending',
  'approved',
  'cancelled',
]);

export const anonymousAccessStatusEnum = pgEnum('anonymous_access_status', [
  'active',
  'disabled',
]);

/**
 * A student-created request that deliberately contains no identifying details.
 * The request code is shown to the student so they can present it to a teacher.
 */
export const anonymousAccessRequestsTable = pgTable('anonymous_access_requests', {
  id: serial('id').primaryKey(),
  requestCode: varchar('request_code', { length: 20 }).notNull().unique(),
  status: anonymousRequestStatusEnum('status').notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
});

/**
 * Anonymous wellness access accounts. No student name, email, or roster data is
 * stored here. userId is a generated internal owner ID for existing journal FKs.
 */
export const anonymousAccessAccountsTable = pgTable('anonymous_access_accounts', {
  id: serial('id').primaryKey(),
  requestId: integer('request_id')
    .notNull()
    .unique()
    .references(() => anonymousAccessRequestsTable.id),
  userId: varchar('user_id')
    .notNull()
    .unique()
    .references(() => usersTable.id),
  accessCode: varchar('access_code', { length: 32 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  status: anonymousAccessStatusEnum('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type AnonymousAccessRequest = typeof anonymousAccessRequestsTable.$inferSelect;
export type AnonymousAccessAccount = typeof anonymousAccessAccountsTable.$inferSelect;