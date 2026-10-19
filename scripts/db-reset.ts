import "@/db/load-env";
import { Pool } from "pg";

/**
 * Drops and recreates the public schema of DATABASE_URL, then exits.
 * Development only. Follow with `npm run db:migrate && npm run db:seed`.
 */
async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to reset a production database");
  }
  const url = process.env.DATABASE_URL ?? "";
  if (!/localhost|127\.0\.0\.1/.test(url)) {
    throw new Error("db:reset only runs against a local database");
  }
  const pool = new Pool({ connectionString: url });
  await pool.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
  await pool.query("DROP SCHEMA IF EXISTS drizzle CASCADE;");
  await pool.end();
  console.log("database reset");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
