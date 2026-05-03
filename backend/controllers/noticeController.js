import { z } from "zod";
import { query } from "../config/database.js";
import { NOTICE_FIELDS } from "../models/Notice.js";

const noticeSchema = z.object({
  title: z.string().min(3),
  message: z.string().min(5),
  audience: z.enum(["all", "students", "parents", "teachers", "admins"]).default("all"),
  priority: z.enum(["normal", "high", "urgent"]).default("normal")
});

export async function listNotices(req, res) {
  const { rows } = await query(
    `
      SELECT ${NOTICE_FIELDS}, u.name AS created_by_name
      FROM notices n
      LEFT JOIN users u ON u.id = n.created_by
      WHERE n.school_id = $1
      ORDER BY n.created_at DESC
      LIMIT 50
    `,
    [req.user.schoolId]
  );
  res.json({ notices: rows });
}

export async function createNotice(req, res) {
  const payload = noticeSchema.parse(req.body);
  const { rows } = await query(
    `
      INSERT INTO notices (school_id, created_by, title, message, audience, priority)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *
    `,
    [req.user.schoolId, req.user.id, payload.title, payload.message, payload.audience, payload.priority]
  );

  req.app.get("io").to(`school:${req.user.schoolId}`).emit("notification", {
    type: "notice.created",
    title: payload.title,
    message: payload.message,
    audience: payload.audience,
    priority: payload.priority
  });

  res.status(201).json({ notice: rows[0] });
}
