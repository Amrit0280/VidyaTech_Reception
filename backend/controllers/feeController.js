import { z } from "zod";
import { query } from "../config/database.js";
import { FEE_FIELDS } from "../models/Fee.js";

const feeSchema = z.object({
  studentId: z.number().int(),
  invoiceNo: z.string().min(3),
  feeType: z.string().min(2),
  amount: z.number().positive(),
  discount: z.number().min(0).optional(),
  dueDate: z.string()
});

export async function listFees(req, res) {
  const { rows } = await query(
    `
      SELECT ${FEE_FIELDS}, st.name AS student_name, st.student_code
      FROM fees f
      JOIN students st ON st.id = f.student_id
      WHERE f.school_id = $1
      ORDER BY f.due_date DESC
    `,
    [req.user.schoolId]
  );
  res.json({ fees: rows });
}

export async function createFee(req, res) {
  const payload = feeSchema.parse(req.body);
  const { rows } = await query(
    `
      INSERT INTO fees (school_id, student_id, invoice_no, fee_type, amount, discount, due_date)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *
    `,
    [
      req.user.schoolId,
      payload.studentId,
      payload.invoiceNo,
      payload.feeType,
      payload.amount,
      payload.discount || 0,
      payload.dueDate
    ]
  );
  res.status(201).json({ fee: rows[0] });
}

export async function markFeePaid(req, res) {
  const { gatewayReference } = z.object({ gatewayReference: z.string().optional() }).parse(req.body);
  const { rows } = await query(
    `
      UPDATE fees
      SET status = 'paid', paid_at = NOW(), gateway_reference = COALESCE($1, gateway_reference)
      WHERE id = $2 AND school_id = $3
      RETURNING *
    `,
    [gatewayReference || null, req.params.id, req.user.schoolId]
  );

  if (!rows[0]) {
    return res.status(404).json({ message: "Fee record not found" });
  }

  req.app.get("io").to(`school:${req.user.schoolId}`).emit("notification", {
    type: "fee.paid",
    title: "Fee payment updated",
    message: `Invoice ${rows[0].invoice_no} marked as paid.`
  });

  res.json({ fee: rows[0] });
}

export async function createPaymentOrder(req, res) {
  const { feeId } = z.object({ feeId: z.number().int() }).parse(req.body);
  const { rows } = await query(
    "SELECT id, invoice_no, amount, discount FROM fees WHERE id = $1 AND school_id = $2",
    [feeId, req.user.schoolId]
  );

  if (!rows[0]) {
    return res.status(404).json({ message: "Fee record not found" });
  }

  const payable = Number(rows[0].amount) - Number(rows[0].discount || 0);
  res.json({
    gateway: "razorpay-ready",
    keyId: process.env.RAZORPAY_KEY_ID || "rzp_test_replace_me",
    order: {
      receipt: rows[0].invoice_no,
      amountPaise: Math.round(payable * 100),
      currency: "INR"
    }
  });
}
