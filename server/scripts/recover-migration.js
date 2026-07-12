import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const MIGRATION_NAME =
  "20260712174637_add_portfolio_description_project_tags_services";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("[recover] DATABASE_URL is not set");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString });

async function main() {
  let client;
  try {
    client = await pool.connect();
  } catch (err) {
    console.error("[recover] Could not connect to the database:", err.message);
    process.exit(1);
  }

  try {
    const tableCheck = await client.query(
      `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '_prisma_migrations'`
    );

    if (tableCheck.rowCount === 0) {
      console.log("[recover] _prisma_migrations table not found; nothing to recover.");
      return;
    }

    const res = await client.query(
      `SELECT "migration_name", "status" FROM "_prisma_migrations" WHERE "migration_name" = $1`,
      [MIGRATION_NAME]
    );

    if (res.rowCount === 0) {
      console.log("[recover] Migration row not present; nothing to recover.");
      return;
    }

    const status = (res.rows[0].status || "").toLowerCase();
    console.log(
      `[recover] Found migration "${MIGRATION_NAME}" with status "${status}".`
    );

    if (status !== "applied") {
      console.log(
        "[recover] Deleting failed/inconsistent migration row so it can be re-applied idempotently..."
      );
      await client.query(
        `DELETE FROM "_prisma_migrations" WHERE "migration_name" = $1`,
        [MIGRATION_NAME]
      );
      console.log(
        '[recover] Deleted. Prisma will re-apply the migration on the next "prisma migrate deploy".'
      );
    } else {
      console.log("[recover] Migration already applied; leaving it untouched.");
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("[recover] Unexpected error:", err);
  process.exit(1);
});
