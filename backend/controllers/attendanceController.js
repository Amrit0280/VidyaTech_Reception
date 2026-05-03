import { z } from "zod";
import { query } from "../config/database.js";

const attendanceSchema = z.object({
  records: z.array(
    z.object({
      studentId: z.number().int(),
      attendanceDate: z.string(),
      status: z.enum(["present", "absent", "late", "leave"]),
      remarks: z.string().optional()
    })
  ).min(1)
});

export async function listAttendance(req, res) {
  const { date, className } = req.query;
  const { rows } = await query(
    `
      SELECT a.*, st.name AS student_name, st.student_code, st.class_name, st.section
      FROM attendance a
      JOIN students st ON st.id = a.student_id
      WHERE a.school_id = $1
        AND ($2::date IS NULL OR a.attendance_date = $2::date)
        AND ($3::text IS NULL OR st.class_name = $3)
      ORDER BY a.attendance_date DESC, st.name ASC
    `,
    [req.user.schoolId, date || null, className || null]
  );
  res.json({ attendance: rows });
}

export async function uploadAttendance(req, res) {
  const payload = attendanceSchema.parse(req.body);
  const values = [];
  const placeholders = payload.records.map((record, index) => {
    const offset = index * 6;
    values.push(req.user.schoolId, record.studentId, req.user.id, record.attendanceDate, record.status, record.remarks || null);
    return `($${offset + 1},$${offset + 2},$${offset + 3},$${offset + 4},$${offset + 5},$${offset + 6})`;
  });

  const { rows } = await query(
    `
      INSERT INTO attendance (school_id, student_id, marked_by, attendance_date, status, remarks)
      VALUES ${placeholders.join(",")}
      ON CONFLICT (school_id, student_id, attendance_date)
      DO UPDATE SET status = EXCLUDED.status, remarks = EXCLUDED.remarks, marked_by = EXCLUDED.marked_by
      RETURNING *
    `,
    values
  );

  req.app.get("io").to(`school:${req.user.schoolId}`).emit("notification", {
    type: "attendance.uploaded",
    title: "Attendance uploaded",
    message: `${rows.length} attendance records updated.`
  });

  res.status(201).json({ attendance: rows });
}
