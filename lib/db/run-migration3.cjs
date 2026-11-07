const pg = require('pg');

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error("Missing DATABASE_URL");
  
  // Clean quotes if any
  const cleanUrl = dbUrl.replace(/^['"](.*)['"]$/, '$1');

  const client = new pg.Client({ connectionString: cleanUrl });
  await client.connect();

  await client.query("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'pending';");
  await client.query("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text;");

  console.log("Migration successful");
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
