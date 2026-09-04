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
    luggage INTEGER NOT NULL DEFAULT 0,
    vehicle_type TEXT NOT NULL DEFAULT '',
    special_requests TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    payment_status TEXT NOT NULL DEFAULT 'pending',
    stripe_payment_intent_id TEXT,
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

  // Ensure the bookings table has all columns the Drizzle schema expects.
  // Older deployments created the table without payment_status / stripe /
  // vehicle_type / luggage, which caused every SELECT to fail with a
  // "column does not exist" error — so the admin could never see reservations.
  await pool.query(`
    ALTER TABLE bookings
      ADD COLUMN IF NOT EXISTS luggage INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS vehicle_type TEXT NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT
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
      ('Suburban', 'Chevrolet Suburban', 2025, 7, '/assets/fleet-suburban.jpg', 'The pinnacle of understated luxury. Exceptionally spacious with onboard Wi-Fi, privacy glass, and capacity for 7 passengers and 6 large bags.', ARRAY['Wi-Fi', 'Privacy glass', 'Leather seating', 'USB charging', 'Climate control']::TEXT[], 'SUV', 6, 2.95::REAL, 140::REAL, 80::REAL),
      ('Escalade', 'Cadillac Escalade ESV', 2024, 7, '/assets/fleet-escalade.jpg', 'Commanding presence with panoramic sunroof, studio sound system, executive captain seating, and maximum legroom for high-profile clients.', ARRAY['Panoramic sunroof', 'Studio audio', 'Wi-Fi', 'Executive seating', 'Rear entertainment']::TEXT[], 'SUV', 6, 3.40::REAL, 140::REAL, 95::REAL),
      ('Lincoln Continental', 'Lincoln Continental', 2024, 3, '/assets/fleet-lincoln.jpg', 'Classic executive elegance. Whisper-quiet cabin, massaging rear seats, and smooth ride perfect for airport and corporate transfers.', ARRAY['Executive seating', 'Massaging seats', 'Quiet cabin', 'Wi-Fi', 'USB charging']::TEXT[], 'Sedan', 3, 2.40::REAL, 100::REAL, 75::REAL),
      ('Mercedes S-Class', 'Mercedes-Benz S-Class', 2024, 3, '/assets/fleet-mercedes.jpg', 'The ultimate standard in luxury sedans. State-of-the-art safety, exquisite craftsmanship, and an extraordinarily smooth ride.', ARRAY['Ambient lighting', 'Massaging seats', 'Burmester audio', 'Rear screens', 'Wi-Fi']::TEXT[], 'Sedan', 3, 2.40::REAL, 100::REAL, 75::REAL)
    ) AS seed(name, model, year, capacity, image_url, description, amenities, vehicle_type, luggage_capacity, rate_per_mile, flat_rate, hourly_rate)
    WHERE NOT EXISTS (SELECT 1 FROM fleet)
  `);

  // ── Self-heal: ensure existing fleet rows have the correct catalog pricing.
  //    (Earlier seeds / migrations may have left rate_per_mile = 0 or stale values.)
  await pool.query(`
    UPDATE fleet SET
      rate_per_mile = CASE
        WHEN name ILIKE '%suburban%' THEN 2.95
        WHEN name ILIKE '%escalade%' THEN 3.40
        WHEN name ILIKE '%lincoln%' OR name ILIKE '%sedan%' OR name ILIKE '%mercedes%' THEN 2.40
        ELSE rate_per_mile
      END,
      flat_rate = CASE
        WHEN name ILIKE '%suburban%' OR name ILIKE '%escalade%' THEN 140
        WHEN name ILIKE '%lincoln%' OR name ILIKE '%sedan%' OR name ILIKE '%mercedes%' THEN 100
        ELSE flat_rate
      END,
      hourly_rate = CASE
        WHEN name ILIKE '%suburban%' THEN 80
        WHEN name ILIKE '%escalade%' THEN 95
        WHEN name ILIKE '%lincoln%' OR name ILIKE '%sedan%' OR name ILIKE '%mercedes%' THEN 75
        ELSE hourly_rate
      END
    WHERE rate_per_mile = 0 OR flat_rate = 0 OR hourly_rate = 0
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
