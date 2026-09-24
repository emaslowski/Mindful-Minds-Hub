import { pgTable, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

// A row exists only while the student is opted in. Deleting it withdraws consent.
export const friendshipProfilesTable = pgTable("friendship_profiles", {
  userId: varchar("user_id").primaryKey().references(() => usersTable.id, { onDelete: "cascade" }),
  firstName: varchar("first_name", { length: 30 }),
  lastInitial: varchar("last_initial", { length: 2 }),
  interests: text("interests").array().notNull(),
  qualities: text("qualities").array().notNull(),
  approvalStatus: text("approval_status").notNull().default("pending"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type FriendshipProfile = typeof friendshipProfilesTable.$inferSelect;