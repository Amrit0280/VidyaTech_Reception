import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function ensureLeadsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS demo_leads (
      id SERIAL PRIMARY KEY,
      institution VARCHAR(180) NOT NULL,
      name VARCHAR(160) NOT NULL,
      phone VARCHAR(30) NOT NULL,
      email VARCHAR(180) NOT NULL,
      requested_module VARCHAR(120),
      message TEXT,
      status VARCHAR(30) NOT NULL DEFAULT 'new',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { institution, name, phone, email, module, message } = req.body || {};

    if (!institution || !name || !phone || !email) {
      return res.status(400).json({ message: "Institution, name, phone, and email are required" });
    }

    await ensureLeadsTable();

    const { rows } = await pool.query(
      `
        INSERT INTO demo_leads (institution, name, phone, email, requested_module, message)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, institution, name, phone, email, requested_module, message, status, created_at
      `,
      [institution, name, phone, email, module || null, message || null]
    );

    return res.status(201).json({ success: true, lead: rows[0] });
  } catch (error) {
    console.error("Lead submission failed", error);
    return res.status(500).json({ message: "Could not submit lead" });
  }
}
