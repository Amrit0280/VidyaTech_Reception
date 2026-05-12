import bcrypt from "bcryptjs";
import { z } from "zod";
import { query, transaction } from "../config/database.js";
import { generatePassword } from "../utils/passwordGenerator.js";
import { generateStudentCode } from "../utils/idGenerator.js";
import { writeAuditLog } from "../utils/audit.js";

const admissionStatuses = ["inquiry", "pending", "approved", "enrolled"];
const paymentModes = ["Cash", "UPI", "Card", "Bank Transfer", "Cheque"];

const studentSchema = z.object({
  name: z.string().min(2),
  fatherName: z.string().optional(),
  motherName: z.string().optional(),
  dob: z.string().optional(),
  gender: z.string().optional(),
  mobile: z.string().min(8),
  address: z.string().optional(),
  previousSchool: z.string().optional(),
  aadhaarId: z.string().optional(),
  profilePhoto: z.string().optional(),
  house: z.string().optional(),
  admissionNumber: z.string().optional(),
  className: z.string().min(1),
  section: z.string().optional(),
  rollNumber: z.string().optional(),
  session: z.string().optional(),
  parentName: z.string().min(2),
  parentMobile: z.string().optional(),
  alternateMobile: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  occupation: z.string().optional(),
  feePlan: z.string().optional(),
  dueBalance: z.coerce.number().min(0).optional(),
  documents: z.array(z.any()).optional()
});

const documentSchema = z.object({
  type: z.string().min(2),
  label: z.string().min(2),
  fileName: z.string().min(1),
  fileType: z.string().optional(),
  fileSize: z.coerce.number().min(0).optional(),
  dataUrl: z.string().optional(),
  status: z.string().optional()
});

const paymentSchema = z.object({
  studentId: z.coerce.number().int(),
  feeType: z.string().min(2),
  amount: z.coerce.number().min(0),
  discount: z.coerce.number().min(0).optional(),
  concession: z.coerce.number().min(0).optional(),
  lateFee: z.coerce.number().min(0).optional(),
  mode: z.enum(paymentModes),
  remarks: z.string().optional()
});

const notificationSchema = z.object({
  audience: z.string().min(2),
  title: z.string().min(2),
  message: z.string().min(2),
  channel: z.string().min(2),
  priority: z.string().optional()
});

const admissionSchema = z.object({
  studentName: z.string().min(2),
  guardianName: z.string().min(2),
  phone: z.string().min(8),
  classRequested: z.string().min(1),
  status: z.enum(admissionStatuses).optional(),
  notes: z.string().optional()
});

const certificateSchema = z.object({
  studentId: z.coerce.number().int(),
  type: z.string().min(2)
});

const idCardSchema = z.object({
  studentId: z.coerce.number().int()
});

const deleteStudentSchema = z.object({
  mode: z.enum(["soft", "permanent"]).optional()
});

function isoDate(value) {
  if (!value) return null;
  return new Date(value).toISOString().slice(0, 10);
}

function mapStudent(row, documents = []) {
  return {
    id: String(row.id),
    databaseId: row.id,
    admissionNumber: row.admission_number,
    rollNumber: row.roll_number || "",
    name: row.name,
    fatherName: row.father_name || "",
    motherName: row.mother_name || "",
    dob: isoDate(row.dob) || "",
    gender: row.gender || "",
    className: row.class_name,
    section: row.section || "",
    parentName: row.guardian_name,
    mobile: row.guardian_phone,
    address: row.address || "",
    previousSchool: row.previous_school || "",
    aadhaarId: row.aadhaar_id || "",
    house: row.house || "",
    email: row.parent_email || "",
    feePlan: row.fee_plan || "Monthly",
    dueBalance: Number(row.due_balance || 0),
    attendance: Number(row.attendance || 100),
    status: row.is_deleted ? "Inactive" : row.admission_status === "enrolled" ? "Active" : row.admission_status,
    isDeleted: Boolean(row.is_deleted),
    deletedAt: row.deleted_at || null,
    deletedBy: row.deleted_by || "",
    profilePhoto: row.profile_photo || row.photo_url || "/vidyatech-icon.svg",
    documents,
    portalId: row.student_code,
    password: "Stored encrypted",
    session: row.session || ""
  };
}

function mapDocument(row) {
  return {
    id: String(row.id),
    type: row.document_type,
    label: row.document_label || row.document_type,
    fileName: row.file_name || "Document",
    fileType: row.file_type || "",
    fileSize: Number(row.file_size || 0),
    dataUrl: row.file_url || "",
    uploadedAt: row.created_at,
    status: row.verification_status || "Uploaded"
  };
}

async function getNextAdmissionNumber(client, schoolId) {
  const year = new Date().getFullYear();
  const { rows } = await client.query(
    `
      SELECT COALESCE(MAX(substring(admission_number from $2)::int), 0) AS max_no
      FROM students
      WHERE school_id = $1
        AND admission_number ~ $3
    `,
    [schoolId, `^ADM-${year}-(\\d+)$`, `^ADM-${year}-\\d+$`]
  );
  return `ADM-${year}-${String(Number(rows[0]?.max_no || 0) + 1).padStart(4, "0")}`;
}

function mapPayment(row) {
  return {
    id: String(row.id),
    receiptNo: row.receipt_no,
    studentId: String(row.student_id),
    studentName: row.student_name,
    feeType: row.category,
    amount: Number(row.gross_amount || 0),
    discount: Number(row.discount_amount || 0),
    concession: Number(row.concession_amount || 0),
    lateFee: Number(row.fine_amount || 0),
    total: Number(row.net_amount || 0),
    mode: row.payment_mode,
    date: isoDate(row.paid_at),
    remarks: row.remarks || ""
  };
}

async function getSchool(req) {
  const { rows } = await query(
    `
      SELECT s.name, s.slug, COALESCE(sb.logo_url, '/vidyatech-icon.svg') AS logo,
             COALESCE(sb.primary_color, '#0f62fe') AS primary_color
      FROM schools s
      LEFT JOIN school_branding sb ON sb.school_id = s.id
      WHERE s.id = $1
    `,
    [req.user.schoolId]
  );
  return rows[0];
}

async function getSnapshotData(req) {
  const school = await getSchool(req);
  const [studentsResult, documentsResult, paymentsResult, notificationsResult, admissionsResult, certificateResult] =
    await Promise.all([
      query(
        `
          SELECT st.*, p.email AS parent_email, p.occupation AS parent_occupation
          FROM students st
          LEFT JOIN parents p ON p.student_id = st.id AND p.school_id = st.school_id
          WHERE st.school_id = $1
          ORDER BY st.created_at DESC
        `,
        [req.user.schoolId]
      ),
      query(
        `
          SELECT *
          FROM student_documents
          WHERE school_id = $1
          ORDER BY created_at DESC
        `,
        [req.user.schoolId]
      ),
      query(
        `
          SELECT fp.*, r.receipt_no, st.name AS student_name
          FROM fee_payments fp
          JOIN receipts r ON r.payment_id = fp.id
          JOIN students st ON st.id = fp.student_id
          WHERE fp.school_id = $1
          ORDER BY fp.paid_at DESC
          LIMIT 250
        `,
        [req.user.schoolId]
      ),
      query(
        `
          SELECT id, audience_type, audience_value, title, message, channel, created_at
          FROM notifications
          WHERE school_id = $1
          ORDER BY created_at DESC
          LIMIT 100
        `,
        [req.user.schoolId]
      ),
      query(
        `
          SELECT id, student_name, guardian_name, phone, class_requested, workflow_status, status, created_at
          FROM admissions
          WHERE school_id = $1
          ORDER BY created_at DESC
          LIMIT 150
        `,
        [req.user.schoolId]
      ),
      query("SELECT COUNT(*)::int AS count FROM certificates WHERE school_id = $1", [req.user.schoolId])
    ]);

  const documentsByStudent = documentsResult.rows.reduce((groups, document) => {
    const key = String(document.student_id || "");
    groups[key] = groups[key] || [];
    groups[key].push(mapDocument(document));
    return groups;
  }, {});
  const students = studentsResult.rows.map((student) => mapStudent(student, documentsByStudent[String(student.id)] || []));
  const payments = paymentsResult.rows.map(mapPayment);
  const todayText = new Date().toISOString().slice(0, 10);
  const todayCollection = payments
    .filter((payment) => payment.date === todayText)
    .reduce((total, payment) => total + Number(payment.total || 0), 0);

  return {
    school: {
      name: school?.name || "VidyaTech School",
      session: students[0]?.session || "2026-27",
      logo: school?.logo || "/vidyatech-icon.svg",
      primaryColor: school?.primary_color || "#0f62fe"
    },
    students,
    payments,
    notifications: notificationsResult.rows.map((notification) => ({
      id: String(notification.id),
      audience: notification.audience_value || notification.audience_type,
      title: notification.title,
      message: notification.message,
      channel: notification.channel,
      date: isoDate(notification.created_at)
    })),
    admissions: admissionsResult.rows.map((admission) => ({
      id: String(admission.id),
      studentName: admission.student_name,
      guardianName: admission.guardian_name,
      phone: admission.phone,
      classRequested: admission.class_requested,
      status: admission.workflow_status || admission.status,
      date: isoDate(admission.created_at)
    })),
    feeStructures: [],
    certificates: [],
    idCards: [],
    activityLog: [
      {
        id: "cloud-sync",
        title: "Cloud database connected",
        detail: "Reception data loaded from PostgreSQL through the secure API",
        date: todayText
      }
    ],
    dashboard: {
      todayAdmissions: admissionsResult.rows.filter((admission) => isoDate(admission.created_at) === todayText).length,
      todayCollection,
      certificatesIssued: certificateResult.rows[0]?.count || 0,
      pendingDocuments: students.filter((student) => (student.documents || []).length < 4).length
    },
    settings: {
      role: req.user.role,
      offlineMode: false,
      autoLateFee: 150,
      syncStatus: "Cloud connected"
    }
  };
}

export async function getReceptionSnapshot(req, res) {
  const data = await getSnapshotData(req);
  res.json({ data });
}

export async function createReceptionStudent(req, res) {
  const payload = studentSchema.parse(req.body);
  const result = await transaction(async (client) => {
    const school = await client.query("SELECT slug FROM schools WHERE id = $1", [req.user.schoolId]);
    const studentCode = await generateStudentCode(client, req.user.schoolId, school.rows[0]?.slug);
    const admissionNumber = payload.admissionNumber || await getNextAdmissionNumber(client, req.user.schoolId);
    const password = generatePassword();
    const passwordHash = await bcrypt.hash(password, 12);

    const user = await client.query(
      `
        INSERT INTO users (school_id, name, email, phone, login_id, role, password_hash)
        VALUES ($1, $2, $3, $4, $5, 'student', $6)
        RETURNING id, login_id
      `,
      [req.user.schoolId, payload.name, payload.email || null, payload.mobile, studentCode, passwordHash]
    );

    const student = await client.query(
      `
        INSERT INTO students (
          school_id, user_id, student_code, admission_number, name, class_name, section, roll_number,
          gender, dob, guardian_name, guardian_phone, address, father_name, mother_name,
          previous_school, aadhaar_id, profile_photo, photo_url, house, session, parent_mobile, alternate_mobile,
          parent_email, parent_occupation, admission_status, due_balance
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,'enrolled',$26)
        RETURNING *
      `,
      [
        req.user.schoolId,
        user.rows[0].id,
        studentCode,
        admissionNumber,
        payload.name,
        payload.className,
        payload.section || null,
        payload.rollNumber || null,
        payload.gender || null,
        payload.dob || null,
        payload.parentName,
        payload.parentMobile || payload.mobile,
        payload.address || null,
        payload.fatherName || null,
        payload.motherName || null,
        payload.previousSchool || null,
        payload.aadhaarId || null,
        payload.profilePhoto || null,
        payload.profilePhoto || null,
        payload.house || null,
        payload.session || null,
        payload.parentMobile || payload.mobile,
        payload.alternateMobile || null,
        payload.email || null,
        payload.occupation || null,
        payload.dueBalance || 0
      ]
    );

    await client.query(
      `
        INSERT INTO parents (school_id, student_id, name, mobile, alternate_mobile, email, occupation)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      [
        req.user.schoolId,
        student.rows[0].id,
        payload.parentName,
        payload.parentMobile || payload.mobile,
        payload.alternateMobile || null,
        payload.email || null,
        payload.occupation || null
      ]
    );

    await client.query(
      `
        INSERT INTO credentials (school_id, user_id, student_id, credential_type, login_id, temporary_password_hash, last_reset_at)
        VALUES ($1, $2, $3, 'student', $4, $5, NOW())
      `,
      [req.user.schoolId, user.rows[0].id, student.rows[0].id, studentCode, passwordHash]
    );

    for (const rawDocument of payload.documents || []) {
      const document = documentSchema.partial({ label: true, fileName: true }).parse(rawDocument);
      await client.query(
        `
          INSERT INTO student_documents (
            school_id, student_id, document_type, document_label, file_name, file_type,
            file_size, file_url, verification_status, uploaded_by
          )
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        `,
        [
          req.user.schoolId,
          student.rows[0].id,
          document.type,
          document.label || document.type,
          document.fileName || "Uploaded document",
          document.fileType || null,
          document.fileSize || 0,
          document.dataUrl || null,
          document.status || "uploaded",
          req.user.id
        ]
      );
    }

    return { student: student.rows[0], credentials: { login: studentCode, password } };
  });

  await writeAuditLog(req, "student.created", "students", result.student.id, { studentCode: result.student.student_code });
  res.status(201).json({ student: mapStudent(result.student), credentials: result.credentials });
}

export async function createReceptionPayment(req, res) {
  const payload = paymentSchema.parse(req.body);
  const result = await transaction(async (client) => {
    const studentResult = await client.query(
      "SELECT id, name, due_balance FROM students WHERE id = $1 AND school_id = $2",
      [payload.studentId, req.user.schoolId]
    );
    const student = studentResult.rows[0];
    if (!student) {
      const error = new Error("Student not found");
      error.statusCode = 404;
      throw error;
    }

    const netAmount = Math.max(
      0,
      Number(payload.amount || 0) +
        Number(payload.lateFee || 0) -
        Number(payload.discount || 0) -
        Number(payload.concession || 0)
    );

    const payment = await client.query(
      `
        INSERT INTO fee_payments (
          school_id, student_id, collected_by, category, gross_amount, discount_amount,
          concession_amount, fine_amount, net_amount, payment_mode, remarks
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        RETURNING *
      `,
      [
        req.user.schoolId,
        student.id,
        req.user.id,
        payload.feeType,
        payload.amount,
        payload.discount || 0,
        payload.concession || 0,
        payload.lateFee || 0,
        netAmount,
        payload.mode,
        payload.remarks || null
      ]
    );

    const receiptNo = `VT-${new Date().getFullYear()}-${String(payment.rows[0].id).padStart(5, "0")}`;
    const receipt = await client.query(
      `
        INSERT INTO receipts (school_id, payment_id, student_id, receipt_no, qr_payload)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `,
      [
        req.user.schoolId,
        payment.rows[0].id,
        student.id,
        receiptNo,
        JSON.stringify({ receiptNo, studentId: student.id, amount: netAmount })
      ]
    );

    await client.query(
      `
        UPDATE students
        SET due_balance = GREATEST(0, due_balance - $1), updated_at = NOW()
        WHERE id = $2 AND school_id = $3
      `,
      [netAmount, student.id, req.user.schoolId]
    );

    return { payment: { ...payment.rows[0], receipt_no: receipt.rows[0].receipt_no, student_name: student.name } };
  });

  await writeAuditLog(req, "fee.payment.created", "fee_payments", result.payment.id, {
    receiptNo: result.payment.receipt_no,
    amount: result.payment.net_amount
  });

  res.status(201).json({ payment: mapPayment(result.payment) });
}

export async function resetReceptionPassword(req, res) {
  const { studentId } = z.object({ studentId: z.coerce.number().int() }).parse(req.body);
  const password = generatePassword();
  const passwordHash = await bcrypt.hash(password, 12);

  const { rows } = await query(
    `
      UPDATE users u
      SET password_hash = $1
      FROM students st
      WHERE st.user_id = u.id
        AND st.id = $2
        AND st.school_id = $3
      RETURNING u.id, u.login_id
    `,
    [passwordHash, studentId, req.user.schoolId]
  );

  if (!rows[0]) {
    return res.status(404).json({ message: "Student credential not found" });
  }

  await query(
    `
      UPDATE credentials
      SET temporary_password_hash = $1, last_reset_at = NOW()
      WHERE school_id = $2 AND login_id = $3
    `,
    [passwordHash, req.user.schoolId, rows[0].login_id]
  );

  await writeAuditLog(req, "credential.reset", "students", studentId, { loginId: rows[0].login_id });
  res.json({ login: rows[0].login_id, password });
}

export async function createReceptionNotification(req, res) {
  const payload = notificationSchema.parse(req.body);
  const { rows } = await query(
    `
      INSERT INTO notifications (school_id, created_by, audience_type, audience_value, title, message, channel, priority)
      VALUES ($1, $2, 'custom', $3, $4, $5, $6, $7)
      RETURNING *
    `,
    [
      req.user.schoolId,
      req.user.id,
      payload.audience,
      payload.title,
      payload.message,
      payload.channel,
      payload.priority || "normal"
    ]
  );

  await writeAuditLog(req, "notification.queued", "notifications", rows[0].id, { channel: rows[0].channel });
  res.status(201).json({
    notification: {
      id: String(rows[0].id),
      audience: rows[0].audience_value,
      title: rows[0].title,
      message: rows[0].message,
      channel: rows[0].channel,
      date: isoDate(rows[0].created_at)
    }
  });
}

export async function createReceptionAdmission(req, res) {
  const payload = admissionSchema.parse(req.body);
  const { rows } = await query(
    `
      INSERT INTO admissions (school_id, student_name, guardian_name, phone, class_requested, status, workflow_status, notes)
      VALUES ($1, $2, $3, $4, $5, 'new', $6, $7)
      RETURNING *
    `,
    [
      req.user.schoolId,
      payload.studentName,
      payload.guardianName,
      payload.phone,
      payload.classRequested,
      payload.status || "inquiry",
      payload.notes || null
    ]
  );

  await writeAuditLog(req, "admission.created", "admissions", rows[0].id);
  res.status(201).json({
    admission: {
      id: String(rows[0].id),
      studentName: rows[0].student_name,
      guardianName: rows[0].guardian_name,
      phone: rows[0].phone,
      classRequested: rows[0].class_requested,
      status: rows[0].workflow_status
    }
  });
}

export async function createReceptionCertificate(req, res) {
  const payload = certificateSchema.parse(req.body);
  const { rows: students } = await query(
    "SELECT id, name, student_code FROM students WHERE id = $1 AND school_id = $2",
    [payload.studentId, req.user.schoolId]
  );

  if (!students[0]) {
    return res.status(404).json({ message: "Student not found" });
  }

  const certificateNo = `CERT-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
  const { rows } = await query(
    `
      INSERT INTO certificates (school_id, student_id, certificate_type, certificate_no, qr_payload, issued_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `,
    [
      req.user.schoolId,
      students[0].id,
      payload.type,
      certificateNo,
      JSON.stringify({ certificateNo, studentCode: students[0].student_code }),
      req.user.id
    ]
  );

  await writeAuditLog(req, "certificate.issued", "certificates", rows[0].id, { certificateNo });
  res.status(201).json({
    certificate: {
      id: String(rows[0].id),
      certificateNo: rows[0].certificate_no,
      studentId: String(students[0].id),
      studentName: students[0].name,
      type: rows[0].certificate_type,
      date: isoDate(rows[0].issued_at),
      status: rows[0].status
    }
  });
}

export async function createReceptionIdCard(req, res) {
  const payload = idCardSchema.parse(req.body);
  const { rows: students } = await query(
    "SELECT id, name, student_code FROM students WHERE id = $1 AND school_id = $2",
    [payload.studentId, req.user.schoolId]
  );

  if (!students[0]) {
    return res.status(404).json({ message: "Student not found" });
  }

  const cardNo = `ID-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
  const { rows } = await query(
    `
      INSERT INTO id_cards (school_id, student_id, card_no, qr_payload)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `,
    [
      req.user.schoolId,
      students[0].id,
      cardNo,
      JSON.stringify({ cardNo, studentCode: students[0].student_code })
    ]
  );

  await writeAuditLog(req, "id_card.issued", "id_cards", rows[0].id, { cardNo });
  res.status(201).json({
    card: {
      id: String(rows[0].id),
      cardNo: rows[0].card_no,
      studentId: String(students[0].id),
      studentName: students[0].name,
      status: rows[0].status,
      issuedAt: isoDate(rows[0].issued_at)
    }
  });
}

export async function deleteReceptionStudent(req, res) {
  const { studentId } = z.object({ studentId: z.coerce.number().int() }).parse(req.params);
  const payload = deleteStudentSchema.parse(req.body || {});

  if (payload.mode === "permanent" && req.user.role !== "super_admin") {
    return res.status(403).json({ message: "Permanent delete is restricted to super admin users." });
  }

  if (payload.mode === "permanent") {
    const { rows } = await query(
      "DELETE FROM students WHERE id = $1 AND school_id = $2 RETURNING id, name, admission_number",
      [studentId, req.user.schoolId]
    );
    if (!rows[0]) {
      return res.status(404).json({ message: "Student not found" });
    }
    await writeAuditLog(req, "student.permanent_deleted", "students", studentId, rows[0]);
    return res.json({ ok: true, mode: "permanent" });
  }

  const { rows } = await query(
    `
      UPDATE students
      SET is_deleted = true,
          admission_status = 'inactive',
          deleted_at = NOW(),
          deleted_by = $3,
          updated_at = NOW()
      WHERE id = $1 AND school_id = $2
      RETURNING id, name, admission_number
    `,
    [studentId, req.user.schoolId, req.user.role]
  );

  if (!rows[0]) {
    return res.status(404).json({ message: "Student not found" });
  }

  await writeAuditLog(req, "student.soft_deleted", "students", studentId, rows[0]);
  res.json({ ok: true, mode: "soft" });
}

export async function upsertReceptionStudentDocument(req, res) {
  const { studentId } = z.object({ studentId: z.coerce.number().int() }).parse(req.params);
  const payload = documentSchema.parse(req.body);

  const { rows } = await query(
    `
      INSERT INTO student_documents (
        school_id, student_id, document_type, document_label, file_name, file_type,
        file_size, file_url, verification_status, uploaded_by
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      ON CONFLICT (school_id, student_id, document_type)
      DO UPDATE SET
        document_label = EXCLUDED.document_label,
        file_name = EXCLUDED.file_name,
        file_type = EXCLUDED.file_type,
        file_size = EXCLUDED.file_size,
        file_url = EXCLUDED.file_url,
        verification_status = EXCLUDED.verification_status,
        uploaded_by = EXCLUDED.uploaded_by,
        updated_at = NOW()
      RETURNING *
    `,
    [
      req.user.schoolId,
      studentId,
      payload.type,
      payload.label,
      payload.fileName,
      payload.fileType || null,
      payload.fileSize || 0,
      payload.dataUrl || null,
      payload.status || "uploaded",
      req.user.id
    ]
  );

  if (payload.type === "passportPhoto" && payload.dataUrl) {
    await query(
      "UPDATE students SET profile_photo = $1, photo_url = $1, updated_at = NOW() WHERE id = $2 AND school_id = $3",
      [payload.dataUrl, studentId, req.user.schoolId]
    );
  }

  await writeAuditLog(req, "student.document.upserted", "student_documents", rows[0].id, {
    studentId,
    documentType: payload.type
  });
  res.status(201).json({ document: mapDocument(rows[0]) });
}

export async function searchReception(req, res) {
  const term = String(req.query.q || "").trim();
  if (!term) {
    return res.json({ students: [] });
  }

  const { rows } = await query(
    `
      SELECT *
      FROM students
      WHERE school_id = $1
        AND (
          name ILIKE $2 OR admission_number ILIKE $2 OR student_code ILIKE $2
          OR guardian_name ILIKE $2 OR guardian_phone ILIKE $2
          OR class_name ILIKE $2
        )
      ORDER BY created_at DESC
      LIMIT 30
    `,
    [req.user.schoolId, `%${term}%`]
  );

  res.json({ students: rows.map(mapStudent) });
}
