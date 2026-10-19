import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

/**
 * Single shared connection pool. Works against local Postgres and Neon
 * (use Neon's pooled connection string in production).
 *
 * Every query goes through Drizzle, which binds parameters; never build SQL
 * from strings. The ESLint config bans `sql.raw` for this reason.
 */
const globalForDb = globalThis as unknown as { pool?: Pool };

export const pool =
  globalForDb.pool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: process.env.NODE_ENV === "production" ? 5 : 10,
    ssl: process.env.DATABASE_URL?.includes("neon.tech")
      ? { rejectUnauthorized: true }
      : undefined,
  });

if (process.env.NODE_ENV !== "production") globalForDb.pool = pool;

export const db = drizzle(pool, { schema });

export type Db = typeof db;
export { schema };
