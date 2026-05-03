import bcrypt from "bcryptjs";
import { z } from "zod";
import { query } from "../config/database.js";
import { generatePassword } from "../utils/passwordGenerator.js";

const teacherSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  subject: z.string().optional(),
  employeeCode: z.string().min(2)
});

export async function listTeachers(req, res) {
  const { rows } = await query(
    `
      SELECT t.*, u.email, u.phone
      FROM teachers t
      JOIN users u ON u.id = t.user_id
      WHERE t.school_id = $1
      ORDER BY t.created_at DESC
    `,
    [req.user.schoolId]
  );
  res.json({ teachers: rows });
}

export async function createTeacher(req, res) {
  const payload = teacherSchema.parse(req.body);
  const password = generatePassword();
  const passwordHash = await bcrypt.hash(password, 12);

  const { rows } = await query(
    `
      WITH new_user AS (
        INSERT INTO users (school_id, name, email, phone, login_id, role, password_hash)
        VALUES ($1,$2,$3,$4,$5,'teacher',$6)
        RETURNING id
      )
      INSERT INTO teachers (school_id, user_id, employee_code, name, subject)
      SELECT $1, id, $5, $2, $7 FROM new_user
      RETURNING *
    `,
    [req.user.schoolId, payload.name, payload.email, payload.phone || null, payload.employeeCode, passwordHash, payload.subject || null]
  );

  res.status(201).json({
    teacher: rows[0],
    credentials: {
      login: payload.email,
      password
    }
  });
}
