import bcrypt from "bcryptjs";
import { z } from "zod";
import { query, transaction } from "../config/database.js";
import { STUDENT_FIELDS } from "../models/Student.js";
import { generatePassword } from "../utils/passwordGenerator.js";
import { generateStudentCode } from "../utils/idGenerator.js";

const studentSchema = z.object({
  name: z.string().min(2),
  admissionNumber: z.string().optional(),
  className: z.string().min(1),
  section: z.string().optional(),
  rollNumber: z.string().optional(),
  gender: z.string().optional(),
  dob: z.string().optional(),
  guardianName: z.string().min(2),
  guardianPhone: z.string().min(8),
  address: z.string().optional()
});

export async function listStudents(req, res) {
  const { rows } = await query(
    `
      SELECT ${STUDENT_FIELDS}
      FROM students st
      WHERE st.school_id = $1
      ORDER BY st.created_at DESC
    `,
    [req.user.schoolId]
  );
  res.json({ students: rows });
}

export async function createStudent(req, res) {
  const payload = studentSchema.parse(req.body);
  const result = await transaction(async (client) => {
    const school = await client.query("SELECT slug FROM schools WHERE id = $1", [req.user.schoolId]);
    const studentCode = await generateStudentCode(client, req.user.schoolId, school.rows[0]?.slug);
    const password = generatePassword();
    const passwordHash = await bcrypt.hash(password, 12);

    const userInsert = await client.query(
      `
        INSERT INTO users (school_id, name, phone, login_id, role, password_hash)
        VALUES ($1, $2, $3, $4, 'student', $5)
        RETURNING id, login_id
      `,
      [req.user.schoolId, payload.name, payload.guardianPhone, studentCode, passwordHash]
    );

    const studentInsert = await client.query(
      `
        INSERT INTO students (
          school_id, user_id, student_code, admission_number, name, class_name, section,
          roll_number, gender, dob, guardian_name, guardian_phone, address
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
        RETURNING *
      `,
      [
        req.user.schoolId,
        userInsert.rows[0].id,
        studentCode,
        payload.admissionNumber || null,
        payload.name,
        payload.className,
        payload.section || null,
        payload.rollNumber || null,
        payload.gender || null,
        payload.dob || null,
        payload.guardianName,
        payload.guardianPhone,
        payload.address || null
      ]
    );

    return {
      student: studentInsert.rows[0],
      credentials: {
        login: studentCode,
        password
      }
    };
  });

  req.app.get("io").to(`school:${req.user.schoolId}`).emit("notification", {
    type: "student.created",
    title: "New student added",
    message: `${result.student.name} has been added.`
  });

  res.status(201).json(result);
}

export async function updateStudent(req, res) {
  const payload = studentSchema.partial().parse(req.body);
  const fields = [];
  const values = [];
  const map = {
    name: "name",
    admissionNumber: "admission_number",
    className: "class_name",
    section: "section",
    rollNumber: "roll_number",
    gender: "gender",
    dob: "dob",
    guardianName: "guardian_name",
    guardianPhone: "guardian_phone",
    address: "address"
  };

  Object.entries(payload).forEach(([key, value]) => {
    fields.push(`${map[key]} = $${fields.length + 1}`);
    values.push(value);
  });

  if (!fields.length) {
    return res.status(400).json({ message: "No valid fields provided" });
  }

  values.push(req.params.id, req.user.schoolId);
  const { rows } = await query(
    `
      UPDATE students
      SET ${fields.join(", ")}
      WHERE id = $${values.length - 1} AND school_id = $${values.length}
      RETURNING *
    `,
    values
  );

  if (!rows[0]) {
    return res.status(404).json({ message: "Student not found" });
  }

  res.json({ student: rows[0] });
}

export async function deleteStudent(req, res) {
  const { rows } = await query(
    "DELETE FROM students WHERE id = $1 AND school_id = $2 RETURNING id",
    [req.params.id, req.user.schoolId]
  );

  if (!rows[0]) {
    return res.status(404).json({ message: "Student not found" });
  }

  res.json({ message: "Student deleted successfully" });
}
