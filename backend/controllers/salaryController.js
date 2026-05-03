import { z } from "zod";
import { query } from "../config/database.js";

const salarySchema = z.object({
  teacherId: z.number().int(),
  salaryMonth: z.string(),
  baseAmount: z.number().positive(),
  deductions: z.number().min(0).optional(),
  bonus: z.number().min(0).optional()
});

export async function listSalaries(req, res) {
  const { rows } = await query(
    `
      SELECT s.*, t.name AS teacher_name, t.employee_code
      FROM salaries s
      JOIN teachers t ON t.id = s.teacher_id
      WHERE s.school_id = $1
      ORDER BY s.salary_month DESC
    `,
    [req.user.schoolId]
  );
  res.json({ salaries: rows });
}

export async function createSalary(req, res) {
  const payload = salarySchema.parse(req.body);
  const { rows } = await query(
    `
      INSERT INTO salaries (school_id, teacher_id, salary_month, base_amount, deductions, bonus)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *
    `,
    [
      req.user.schoolId,
      payload.teacherId,
      payload.salaryMonth,
      payload.baseAmount,
      payload.deductions || 0,
      payload.bonus || 0
    ]
  );
  res.status(201).json({ salary: rows[0] });
}

export async function markSalaryPaid(req, res) {
  const { rows } = await query(
    `
      UPDATE salaries
      SET status = 'paid', paid_at = NOW()
      WHERE id = $1 AND school_id = $2
      RETURNING *
    `,
    [req.params.id, req.user.schoolId]
  );

  if (!rows[0]) {
    return res.status(404).json({ message: "Salary record not found" });
  }

  res.json({ salary: rows[0] });
}
