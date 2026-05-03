import { z } from "zod";
import { query } from "../config/database.js";

const brandingSchema = z.object({
  displayName: z.string().optional(),
  logoUrl: z.string().url().optional(),
  primaryColor: z.string().optional(),
  accentColor: z.string().optional(),
  websiteUrl: z.string().url().optional(),
  admissionOpen: z.boolean().optional()
});

export async function getBranding(req, res) {
  const { rows } = await query(
    "SELECT * FROM school_branding WHERE school_id = $1",
    [req.user.schoolId]
  );
  res.json({ branding: rows[0] || null });
}

export async function updateBranding(req, res) {
  const payload = brandingSchema.parse(req.body);
  const { rows } = await query(
    `
      INSERT INTO school_branding (school_id, display_name, logo_url, primary_color, accent_color, website_url, admission_open)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      ON CONFLICT (school_id)
      DO UPDATE SET
        display_name = COALESCE(EXCLUDED.display_name, school_branding.display_name),
        logo_url = COALESCE(EXCLUDED.logo_url, school_branding.logo_url),
        primary_color = COALESCE(EXCLUDED.primary_color, school_branding.primary_color),
        accent_color = COALESCE(EXCLUDED.accent_color, school_branding.accent_color),
        website_url = COALESCE(EXCLUDED.website_url, school_branding.website_url),
        admission_open = COALESCE(EXCLUDED.admission_open, school_branding.admission_open),
        updated_at = NOW()
      RETURNING *
    `,
    [
      req.user.schoolId,
      payload.displayName || null,
      payload.logoUrl || null,
      payload.primaryColor || null,
      payload.accentColor || null,
      payload.websiteUrl || null,
      payload.admissionOpen ?? null
    ]
  );

  res.json({ branding: rows[0] });
}
