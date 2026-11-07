import pg from 'pg';

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
client.connect().then(() => {
  return client.query(`
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'pending';
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text;
  `);
}).then(() => {
  console.log('Columns added successfully');
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
