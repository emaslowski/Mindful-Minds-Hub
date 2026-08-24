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
 * A student-created request for journal/gratitude access. The request code is
 * shown to the student so they can present it to a teacher.
 */
export const anonymousAccessRequestsTable = pgTable('anonymous_access_requests', {
  id: serial('id').primaryKey(),
  requestCode: varchar('request_code', { length: 20 }).notNull().unique(),
  // Nullable only for requests created before student details were collected.
  // The API requires these fields for every new request.
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  grade: varchar('grade', { length: 20 }),
  // Nullable for requests created before email delivery was supported.
  studentEmail: varchar('student_email', { length: 254 }),
  status: anonymousRequestStatusEnum('status').notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
});

/**
 * Anonymous wellness access accounts. No Google account or roster linkage is
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