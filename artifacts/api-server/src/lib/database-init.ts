import { pool } from "@workspace/db";
import { logger } from "./logger";

let schemaPromise: Promise<void> | null = null;

const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    price_from REAL NOT NULL,
    features TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS fleet (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER NOT NULL,
    capacity INTEGER NOT NULL,
    image_url TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    amenities TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    vehicle_type TEXT NOT NULL DEFAULT '',
    luggage_capacity INTEGER NOT NULL DEFAULT 0,
    rate_per_mile REAL NOT NULL DEFAULT 0,
    flat_rate REAL NOT NULL DEFAULT 0,
    hourly_rate REAL NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    passenger_name TEXT NOT NULL,
    passenger_email TEXT NOT NULL,
    passenger_phone TEXT NOT NULL,
    pickup_location TEXT NOT NULL,
    dropoff_location TEXT NOT NULL,
    pickup_date DATE NOT NULL,
    pickup_time TEXT NOT NULL,
    service_type TEXT NOT NULL,
    passengers INTEGER NOT NULL DEFAULT 1,
    special_requests TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    total_price REAL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS contacts (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    subject TEXT,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS zones (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    surcharge REAL NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS pricing_config (
    id SERIAL PRIMARY KEY,
    base_rate_per_mile REAL NOT NULL DEFAULT 3.5,
    minimum_fare REAL NOT NULL DEFAULT 75,
    base_fare REAL NOT NULL DEFAULT 0,
    hourly_rate REAL NOT NULL DEFAULT 95,
    minimum_hours REAL NOT NULL DEFAULT 2,
    airport_pickup_flat REAL NOT NULL DEFAULT 0,
    airport_dropoff_flat REAL NOT NULL DEFAULT 0,
    fuel_surcharge REAL NOT NULL DEFAULT 0,
    gratuity_default REAL NOT NULL DEFAULT 20,
    night_surcharge REAL NOT NULL DEFAULT 0,
    holiday_surcharge REAL NOT NULL DEFAULT 0,
    wait_time_rate REAL NOT NULL DEFAULT 25,
    wait_time_free_minutes INTEGER NOT NULL DEFAULT 15,
    additional_stop_fee REAL NOT NULL DEFAULT 15,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
];

async function initializeDatabase(): Promise<void> {
  if (!process.env.DATABASE_URL) return;

  for (const statement of schemaStatements) {
    await pool.query(statement);
  }

  await pool.query(`
    ALTER TABLE fleet
      ADD COLUMN IF NOT EXISTS rate_per_mile REAL NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS flat_rate REAL NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS hourly_rate REAL NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS luggage_capacity INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS vehicle_type TEXT NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS amenities TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
      ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT ''
  `);

  await pool.query(`
    INSERT INTO services (name, description, icon, price_from, features)
    SELECT * FROM (VALUES
      ('Airport Transfer', 'Private airport pickup and drop-off across greater Los Angeles.', 'plane', 90::REAL, ARRAY['Meet and greet', 'Flight monitoring']::TEXT[]),
      ('Corporate Travel', 'Quiet, punctual executive transportation for business travel.', 'briefcase', 90::REAL, ARRAY['Professional chauffeur', 'Wi-Fi']::TEXT[]),
      ('Around Town', 'Point-to-point private transportation throughout Los Angeles.', 'map-pin', 90::REAL, ARRAY['Door-to-door service']::TEXT[])
    ) AS seed(name, description, icon, price_from, features)
    WHERE NOT EXISTS (SELECT 1 FROM services)
  `);

  await pool.query(`
    INSERT INTO fleet (name, model, year, capacity, image_url, description, amenities, vehicle_type, luggage_capacity, rate_per_mile, flat_rate, hourly_rate)
    SELECT * FROM (VALUES
      ('Chevrolet Suburban', '2025 Suburban S', 2025, 7, '/assets/fleet-suburban.jpg', 'Spacious luxury SUV for groups and airport transfers.', ARRAY['Wi-Fi', 'Privacy glass', 'Climate control']::TEXT[], 'SUV', 6, 6.2::REAL, 0::REAL, 80::REAL),
      ('Cadillac Escalade ESV', '2024 Escalade ESV', 2024, 7, '/assets/fleet-escalade.jpg', 'Premium SUV with generous space and a refined cabin.', ARRAY['Panoramic sunroof', 'Premium audio', 'Heated seats']::TEXT[], 'SUV', 6, 7.15::REAL, 0::REAL, 95::REAL),
      ('Lincoln Continental', '2024 Continental', 2024, 3, '/assets/fleet-lincoln.jpg', 'Executive sedan for discreet and comfortable travel.', ARRAY['Executive rear seating', 'Noise cancellation']::TEXT[], 'Sedan', 3, 5.6::REAL, 0::REAL, 65::REAL),
      ('Mercedes-Benz S-Class', '2024 S-Class', 2024, 3, '/assets/fleet-mercedes.jpg', 'Flagship sedan with a smooth, private ride.', ARRAY['Ambient lighting', 'Massaging seats', 'Burmester audio']::TEXT[], 'Sedan', 3, 5.6::REAL, 0::REAL, 75::REAL)
    ) AS seed(name, model, year, capacity, image_url, description, amenities, vehicle_type, luggage_capacity, rate_per_mile, flat_rate, hourly_rate)
    WHERE NOT EXISTS (SELECT 1 FROM fleet)
  `);

  await pool.query(`
    INSERT INTO pricing_config (id)
    SELECT 1
    WHERE NOT EXISTS (SELECT 1 FROM pricing_config)
  `);

  logger.info("Database schema and booking catalog are ready");
}

export function ensureDatabaseSchema(): Promise<void> {
  if (!schemaPromise) {
    schemaPromise = initializeDatabase().catch((error: unknown) => {
      schemaPromise = null;
      throw error;
    });
  }
  return schemaPromise;
}
