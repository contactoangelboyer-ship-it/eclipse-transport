import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema/index.js";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  // Warn instead of throw so the module loads even without a DB configured.
  // Routes that attempt DB operations will still fail at runtime, but
  // routes that don't touch the DB (e.g. /admin/login) will work fine.
  console.warn(
    "[db] DATABASE_URL is not set — database operations will be unavailable.",
  );
}

export const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : (null as unknown as pg.Pool);

export const db = process.env.DATABASE_URL
  ? drizzle(pool, { schema })
  : (null as unknown as ReturnType<typeof drizzle<typeof schema>>);

export * from "./schema/index.js";
