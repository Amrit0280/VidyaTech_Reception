import { query } from "../config/database.js";

export async function overview(req, res) {
  const schoolId = req.user.schoolId;
  const [students, teachers, fees, attendance, monthly] = await Promise.all([
    query("SELECT COUNT(*)::int AS total FROM students WHERE school_id = $1", [schoolId]),
    query("SELECT COUNT(*)::int AS total FROM teachers WHERE school_id = $1", [schoolId]),
    query(
      `
        SELECT
          COALESCE(SUM(CASE WHEN status = 'paid' THEN amount - discount ELSE 0 END), 0)::numeric AS collected,
          COALESCE(SUM(CASE WHEN status <> 'paid' THEN amount - discount ELSE 0 END), 0)::numeric AS outstanding
        FROM fees
        WHERE school_id = $1
      `,
      [schoolId]
    ),
    query(
      `
        SELECT
          COALESCE(ROUND(100.0 * SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0), 2), 0)::numeric AS present_rate
        FROM attendance
        WHERE school_id = $1 AND attendance_date >= CURRENT_DATE - INTERVAL '30 days'
      `,
      [schoolId]
    ),
    query(
      `
        SELECT TO_CHAR(paid_at, 'Mon') AS month, SUM(amount - discount)::numeric AS collection
        FROM fees
        WHERE school_id = $1 AND status = 'paid' AND paid_at >= CURRENT_DATE - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', paid_at), TO_CHAR(paid_at, 'Mon')
        ORDER BY DATE_TRUNC('month', paid_at)
      `,
      [schoolId]
    )
  ]);

  res.json({
    totals: {
      students: students.rows[0].total,
      teachers: teachers.rows[0].total,
      collected: fees.rows[0].collected,
      outstanding: fees.rows[0].outstanding,
      attendanceRate: attendance.rows[0].present_rate
    },
    monthlyCollections: monthly.rows
  });
}
