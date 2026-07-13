import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const MIGRATION_NAME =
  "20260712174637_add_portfolio_description_project_tags_services";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("[fixFailedMigration] DATABASE_URL is not set");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString });

async function main() {
  let client;
  try {
    client = await pool.connect();
  } catch (err) {
    console.error("[fixFailedMigration] Could not connect to the database:", err.message);
    process.exit(1);
  }

  try {
    const tableCheck = await client.query(
      `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '_prisma_migrations'`
    );

    if (tableCheck.rowCount === 0) {
      console.log("[fixFailedMigration] _prisma_migrations table not found; nothing to fix.");
      return;
    }

    const res = await client.query(
      `SELECT "migration_name", "finished_at", "rolled_back_at" FROM "_prisma_migrations" WHERE "migration_name" = $1`,
      [MIGRATION_NAME]
    );

    if (res.rowCount === 0) {
      console.log("[fixFailedMigration] Migration row not present; nothing to fix.");
      return;
    }

    const row = res.rows[0];
    if (row.finished_at) {
      console.log(
        `[fixFailedMigration] Migration "${MIGRATION_NAME}" is already marked as finished.`
      );
      return;
    }

    await client.query(
      `UPDATE "_prisma_migrations"
       SET finished_at = NOW(),
           rolled_back_at = NULL,
           logs = NULL
       WHERE migration_name = $1`,
      [MIGRATION_NAME]
    );

    console.log(
      `[fixFailedMigration] Migration "${MIGRATION_NAME}" marked as resolved successfully.`
    );
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("[fixFailedMigration] Unexpected error:", err);
  process.exit(1);
});
