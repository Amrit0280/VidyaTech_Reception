const fs = require("fs");
const path = require("path");
const pg = require("pg");

const { Pool } = pg;
const root = path.resolve(__dirname, "..");
const migrationsDir = path.join(root, "migrations");
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL is required. Set it in your backend or local environment before running migrations.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl:
    process.env.DB_SSL === "true" ||
    process.env.NODE_ENV === "production" ||
    databaseUrl.includes("render.com")
      ? { rejectUnauthorized: false }
      : false
});

async function run() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        filename TEXT NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const files = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith(".sql"))
      .sort();

    for (const file of files) {
      const existing = await client.query("SELECT id FROM schema_migrations WHERE filename = $1", [file]);
      if (existing.rows[0]) {
        console.log(`Skipping migration ${file}`);
        continue;
      }

      console.log(`Applying migration ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (filename) VALUES ($1)", [file]);
      await client.query("COMMIT");
    }

    console.log("Database migrations complete.");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
