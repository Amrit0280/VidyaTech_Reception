import { query } from "../config/database.js";

export async function writeAuditLog(req, action, entityType, entityId, metadata = {}) {
  await query(
    `
      INSERT INTO audit_logs (school_id, actor_user_id, action, entity_type, entity_id, metadata, ip_address)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `,
    [
      req.user?.schoolId || null,
      req.user?.id || null,
      action,
      entityType || null,
      entityId ? String(entityId) : null,
      JSON.stringify(metadata),
      req.ip || null
    ]
  );
}
