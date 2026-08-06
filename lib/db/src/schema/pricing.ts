import { pgTable, serial, real, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const pricingConfigTable = pgTable("pricing_config", {
  id: serial("id").primaryKey(),

  // ── Base rates ──────────────────────────────────────────────
  baseRatePerMile:   real("base_rate_per_mile").notNull().default(3.5),
  minimumFare:       real("minimum_fare").notNull().default(75),
  baseFare:          real("base_fare").notNull().default(0),

  // ── Hourly service ──────────────────────────────────────────
  hourlyRate:        real("hourly_rate").notNull().default(95),
  minimumHours:      real("minimum_hours").notNull().default(2),

  // ── Airport flat rates ──────────────────────────────────────
  airportPickupFlat:  real("airport_pickup_flat").notNull().default(0),
  airportDropoffFlat: real("airport_dropoff_flat").notNull().default(0),

  // ── Surcharges (stored as %, e.g. 20 = 20%) ─────────────────
  fuelSurcharge:     real("fuel_surcharge").notNull().default(0),
  gratuityDefault:   real("gratuity_default").notNull().default(20),
  nightSurcharge:    real("night_surcharge").notNull().default(0),
  holidaySurcharge:  real("holiday_surcharge").notNull().default(0),

  // ── Wait-time billing ────────────────────────────────────────
  waitTimeRate:         real("wait_time_rate").notNull().default(25),
  waitTimeFreeMinutes:  integer("wait_time_free_minutes").notNull().default(15),

  // ── Extra stops ──────────────────────────────────────────────
  additionalStopFee: real("additional_stop_fee").notNull().default(15),

  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPricingConfigSchema = createInsertSchema(pricingConfigTable).omit({ id: true, updatedAt: true });
export type InsertPricingConfig = z.infer<typeof insertPricingConfigSchema>;
export type PricingConfig = typeof pricingConfigTable.$inferSelect;
