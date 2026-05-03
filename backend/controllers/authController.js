import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { query } from "../config/database.js";

const loginSchema = z.object({
  login: z.string().min(3),
  password: z.string().min(6),
  schoolSlug: z.string().optional()
});

function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      schoolId: user.school_id,
      role: user.role,
      name: user.name,
      loginId: user.login_id
    },
    process.env.JWT_SECRET || "development-secret-change-me",
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

export async function login(req, res) {
  const payload = loginSchema.parse(req.body);
  const { rows } = await query(
    `
      SELECT u.*, s.name AS school_name, s.slug AS school_slug
      FROM users u
      JOIN schools s ON s.id = u.school_id
      WHERE (LOWER(u.email) = LOWER($1) OR LOWER(u.login_id) = LOWER($1))
        AND ($2::text IS NULL OR s.slug = $2)
        AND u.is_active = true
      LIMIT 1
    `,
    [payload.login, payload.schoolSlug || null]
  );

  const user = rows[0];
  if (!user || !(await bcrypt.compare(payload.password, user.password_hash))) {
    return res.status(401).json({ message: "Invalid login credentials" });
  }

  const token = signToken(user);
  return res.json({
    token,
    user: {
      id: user.id,
      schoolId: user.school_id,
      schoolName: user.school_name,
      schoolSlug: user.school_slug,
      name: user.name,
      email: user.email,
      loginId: user.login_id,
      role: user.role
    }
  });
}

export async function me(req, res) {
  const { rows } = await query(
    `
      SELECT u.id, u.school_id, u.name, u.email, u.phone, u.login_id, u.role, s.name AS school_name, s.slug AS school_slug
      FROM users u
      JOIN schools s ON s.id = u.school_id
      WHERE u.id = $1
    `,
    [req.user.id]
  );
  return res.json({ user: rows[0] });
}

export function demoCredentials(_req, res) {
  return res.json({
    credentials: [
      { role: "admin", login: "admin@demo-school.in", password: "Admin@12345" },
      { role: "teacher", login: "teacher@demo-school.in", password: "Teacher@12345" },
      { role: "student", login: "VIDY-2026-0001", password: "Student@12345" },
      { role: "parent", login: "parent@demo-school.in", password: "Parent@12345" }
    ]
  });
}
