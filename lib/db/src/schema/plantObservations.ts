import { date, doublePrecision, index, integer, pgTable, serial, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./auth";

export const plantObservationsTable = pgTable("plant_observations", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  date: date("date", { mode: "string" }).notNull(),
  nickname: text("nickname").notNull(),
  heightCm: doublePrecision("height_cm"),
  leafCount: integer("leaf_count"),
  observations: text("observations").notNull().default(""),
}, (table) => [index("plant_observations_owner_date_idx").on(table.userId, table.date)]);

export const insertPlantObservationSchema = createInsertSchema(plantObservationsTable).omit({ id: true });
export type InsertPlantObservation = z.infer<typeof insertPlantObservationSchema>;
export type PlantObservation = typeof plantObservationsTable.$inferSelect;
