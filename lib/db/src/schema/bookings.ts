import { pgTable, serial, text, integer, real, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const bookingsTable = pgTable("bookings", {
  id: serial("id").primaryKey(),
  confirmationCode: text("confirmation_code").notNull().unique(),
  tripType: text("trip_type").notNull(),
  vehicleId: text("vehicle_id").notNull(),
  pickupLocation: text("pickup_location").notNull(),
  dropoffLocation: text("dropoff_location"),
  pickupDate: text("pickup_date").notNull(),
  pickupTime: text("pickup_time").notNull(),
  passengers: integer("passengers").notNull(),
  luggage: integer("luggage").notNull(),
  duration: integer("duration"),
  extraStops: integer("extra_stops"),
  passengerName: text("passenger_name").notNull(),
  passengerEmail: text("passenger_email").notNull(),
  passengerPhone: text("passenger_phone").notNull(),
  addonMeetGreet: boolean("addon_meet_greet"),
  addonChildSeat: boolean("addon_child_seat"),
  addonFlowers: boolean("addon_flowers"),
  addonFlightMonitor: boolean("addon_flight_monitor"),
  specialInstructions: text("special_instructions"),
  estimatedTotal: real("estimated_total"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertBookingSchema = createInsertSchema(bookingsTable).omit({ id: true, createdAt: true });
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookingsTable.$inferSelect;
