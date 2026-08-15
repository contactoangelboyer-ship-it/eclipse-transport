import app from "./app";
import { logger } from "./lib/logger";
import { pool } from "@workspace/db";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

/* ── Auto-migrate pricing_config table if it doesn't exist yet ── */
async function ensurePricingTable() {
  if (!pool) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pricing_config (
        id                    SERIAL PRIMARY KEY,
        base_rate_per_mile    REAL    NOT NULL DEFAULT 3.5,
        minimum_fare          REAL    NOT NULL DEFAULT 75,
        base_fare             REAL    NOT NULL DEFAULT 0,
        hourly_rate           REAL    NOT NULL DEFAULT 95,
        minimum_hours         REAL    NOT NULL DEFAULT 2,
        airport_pickup_flat   REAL    NOT NULL DEFAULT 0,
        airport_dropoff_flat  REAL    NOT NULL DEFAULT 0,
        fuel_surcharge        REAL    NOT NULL DEFAULT 0,
        gratuity_default      REAL    NOT NULL DEFAULT 20,
        night_surcharge       REAL    NOT NULL DEFAULT 0,
        holiday_surcharge     REAL    NOT NULL DEFAULT 0,
        wait_time_rate        REAL    NOT NULL DEFAULT 25,
        wait_time_free_minutes INTEGER NOT NULL DEFAULT 15,
        additional_stop_fee   REAL    NOT NULL DEFAULT 15,
        updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    // Add rate_per_mile to fleet table if it doesn't exist yet (backward compat)
    await pool.query(`
      ALTER TABLE fleet ADD COLUMN IF NOT EXISTS rate_per_mile REAL NOT NULL DEFAULT 0
    `);
    logger.info("pricing_config table ready");
  } catch (err) {
    logger.warn({ err }, "Could not ensure pricing_config table — pricing routes may fail");
  }
}

ensurePricingTable().then(() => {
  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }
    logger.info({ port }, "Server listening");
  });
});

// Trigger deploy
