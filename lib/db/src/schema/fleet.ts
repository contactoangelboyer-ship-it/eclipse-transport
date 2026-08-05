import { pgTable, text, serial, integer, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const fleetTable = pgTable("fleet", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  model: text("model").notNull(),
  year: integer("year").notNull(),
  capacity: integer("capacity").notNull(),
  imageUrl: text("image_url").notNull(),
  description: text("description").notNull().default(""),
  amenities: text("amenities").array().notNull().default([]),
  vehicleType: text("vehicle_type").notNull().default(""),
  luggageCapacity: integer("luggage_capacity").notNull().default(0),
  flatRate: real("flat_rate").notNull().default(0),
  hourlyRate: real("hourly_rate").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertFleetSchema = createInsertSchema(fleetTable).omit({ id: true, createdAt: true });
export type InsertFleet = z.infer<typeof insertFleetSchema>;
export type FleetVehicle = typeof fleetTable.$inferSelect;
