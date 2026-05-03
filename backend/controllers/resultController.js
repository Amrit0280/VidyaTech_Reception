import { z } from "zod";
import { query } from "../config/database.js";

const resultSchema = z.object({
  studentId: z.number().int(),
  examName: z.string().min(2),
  subject: z.string().min(2),
  marksObtained: z.number().min(0),
  maxMarks: z.number().positive(),
  grade: z.string().optional(),
  remarks: z.string().optional()
});

export async function listResults(req, res) {
  const { rows } = await query(
    `
      SELECT r.*, st.name AS student_name, st.student_code, st.class_name
      FROM results r
      JOIN students st ON st.id = r.student_id
      WHERE r.school_id = $1
      ORDER BY r.created_at DESC
    `,
    [req.user.schoolId]
  );
  res.json({ results: rows });
}

export async function uploadResult(req, res) {
  const payload = resultSchema.parse(req.body);
  const { rows } = await query(
    `
      INSERT INTO results (school_id, student_id, uploaded_by, exam_name, subject, marks_obtained, max_marks, grade, remarks)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *
    `,
    [
      req.user.schoolId,
      payload.studentId,
      req.user.id,
      payload.examName,
      payload.subject,
      payload.marksObtained,
      payload.maxMarks,
      payload.grade || null,
      payload.remarks || null
    ]
  );

  req.app.get("io").to(`school:${req.user.schoolId}`).emit("notification", {
    type: "result.uploaded",
    title: "Result uploaded",
    message: `${payload.examName} ${payload.subject} marks uploaded.`
  });

  res.status(201).json({ result: rows[0] });
}
