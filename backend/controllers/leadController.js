import { z } from "zod";
import { query } from "../config/database.js";

const leadSchema = z.object({
  institution: z.string().min(2),
  name: z.string().min(2),
  phone: z.string().min(8),
  email: z.string().email(),
  module: z.string().optional(),
  message: z.string().optional()
});

export async function createLead(req, res) {
  const payload = leadSchema.parse(req.body);
  const { rows } = await query(
    `
      INSERT INTO demo_leads (institution, name, phone, email, requested_module, message)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *
    `,
    [payload.institution, payload.name, payload.phone, payload.email, payload.module || null, payload.message || null]
  );
  res.status(201).json({ lead: rows[0] });
}
