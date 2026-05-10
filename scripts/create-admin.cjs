const bcrypt = require("bcryptjs");
const pg = require("pg");

const { Pool } = pg;
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}

const schoolSlug = process.env.ADMIN_SCHOOL_SLUG || process.env.DEFAULT_SCHOOL_SLUG || "skp-sainik-public-school";
const name = process.env.ADMIN_NAME || "School Admin";
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

if (!email || !password) {
  console.error("ADMIN_EMAIL and ADMIN_PASSWORD are required.");
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
  const passwordHash = await bcrypt.hash(password, 12);
  const { rows: schools } = await pool.query("SELECT id FROM schools WHERE slug = $1", [schoolSlug]);
  if (!schools[0]) {
    throw new Error(`School not found for slug ${schoolSlug}. Run migrations first.`);
  }

  await pool.query(
    `
      INSERT INTO users (school_id, name, email, login_id, role, password_hash)
      VALUES ($1, $2, $3, $3, 'admin', $4)
      ON CONFLICT (login_id) DO UPDATE
      SET name = EXCLUDED.name,
          email = EXCLUDED.email,
          role = 'admin',
          password_hash = EXCLUDED.password_hash,
          is_active = true
    `,
    [schools[0].id, name, email, passwordHash]
  );

  console.log(`Admin user ready for ${schoolSlug}: ${email}`);
}

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
