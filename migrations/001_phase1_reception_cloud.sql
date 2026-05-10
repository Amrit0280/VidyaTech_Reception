CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_role_check'
      AND conrelid = 'users'::regclass
  ) THEN
    ALTER TABLE users DROP CONSTRAINT users_role_check;
  END IF;
END $$;

ALTER TABLE users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('admin','teacher','student','parent','finance','receptionist','accountant'));

ALTER TABLE students
  ADD COLUMN IF NOT EXISTS father_name VARCHAR(160),
  ADD COLUMN IF NOT EXISTS mother_name VARCHAR(160),
  ADD COLUMN IF NOT EXISTS previous_school VARCHAR(180),
  ADD COLUMN IF NOT EXISTS aadhaar_id VARCHAR(40),
  ADD COLUMN IF NOT EXISTS photo_url TEXT,
  ADD COLUMN IF NOT EXISTS session VARCHAR(20),
  ADD COLUMN IF NOT EXISTS parent_mobile VARCHAR(30),
  ADD COLUMN IF NOT EXISTS alternate_mobile VARCHAR(30),
  ADD COLUMN IF NOT EXISTS parent_email VARCHAR(180),
  ADD COLUMN IF NOT EXISTS parent_occupation VARCHAR(140),
  ADD COLUMN IF NOT EXISTS admission_status VARCHAR(30) NOT NULL DEFAULT 'enrolled',
  ADD COLUMN IF NOT EXISTS due_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_students_school_search
  ON students USING gin (
    to_tsvector(
      'simple',
      coalesce(name, '') || ' ' ||
      coalesce(admission_number, '') || ' ' ||
      coalesce(student_code, '') || ' ' ||
      coalesce(guardian_name, '') || ' ' ||
      coalesce(guardian_phone, '')
    )
  );

ALTER TABLE admissions
  ADD COLUMN IF NOT EXISTS student_id INTEGER REFERENCES students(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS father_name VARCHAR(160),
  ADD COLUMN IF NOT EXISTS mother_name VARCHAR(160),
  ADD COLUMN IF NOT EXISTS dob DATE,
  ADD COLUMN IF NOT EXISTS gender VARCHAR(30),
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS previous_school VARCHAR(180),
  ADD COLUMN IF NOT EXISTS aadhaar_id VARCHAR(40),
  ADD COLUMN IF NOT EXISTS session VARCHAR(20),
  ADD COLUMN IF NOT EXISTS section VARCHAR(20),
  ADD COLUMN IF NOT EXISTS email VARCHAR(180),
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(30) NOT NULL DEFAULT 'inquiry',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE TABLE IF NOT EXISTS parents (
  id SERIAL PRIMARY KEY,
  school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
  name VARCHAR(160) NOT NULL,
  relation VARCHAR(40) NOT NULL DEFAULT 'guardian',
  mobile VARCHAR(30) NOT NULL,
  alternate_mobile VARCHAR(30),
  email VARCHAR(180),
  occupation VARCHAR(140),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_parents_school_mobile ON parents(school_id, mobile);

CREATE TABLE IF NOT EXISTS student_documents (
  id SERIAL PRIMARY KEY,
  school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
  admission_id INTEGER REFERENCES admissions(id) ON DELETE CASCADE,
  document_type VARCHAR(60) NOT NULL,
  file_url TEXT,
  verification_status VARCHAR(30) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fee_structures (
  id SERIAL PRIMARY KEY,
  school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  class_name VARCHAR(40) NOT NULL,
  session VARCHAR(20) NOT NULL,
  category VARCHAR(60) NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  installment_count INTEGER NOT NULL DEFAULT 1,
  fine_per_day NUMERIC(12,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (school_id, class_name, session, category)
);

CREATE TABLE IF NOT EXISTS dues (
  id SERIAL PRIMARY KEY,
  school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  category VARCHAR(60) NOT NULL,
  session VARCHAR(20),
  amount NUMERIC(12,2) NOT NULL,
  paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  fine_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  due_date DATE,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dues_school_student_status ON dues(school_id, student_id, status);

CREATE TABLE IF NOT EXISTS fee_payments (
  id SERIAL PRIMARY KEY,
  school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  collected_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  category VARCHAR(60) NOT NULL,
  gross_amount NUMERIC(12,2) NOT NULL,
  discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  concession_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  fine_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  net_amount NUMERIC(12,2) NOT NULL,
  payment_mode VARCHAR(40) NOT NULL,
  reference_no VARCHAR(120),
  remarks TEXT,
  paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fee_payments_school_paid_at ON fee_payments(school_id, paid_at DESC);

CREATE TABLE IF NOT EXISTS receipts (
  id SERIAL PRIMARY KEY,
  school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  payment_id INTEGER NOT NULL REFERENCES fee_payments(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  receipt_no VARCHAR(80) NOT NULL,
  receipt_type VARCHAR(40) NOT NULL DEFAULT 'fee',
  qr_payload TEXT,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (school_id, receipt_no)
);

CREATE INDEX IF NOT EXISTS idx_receipts_school_receipt_no ON receipts(school_id, receipt_no);

CREATE TABLE IF NOT EXISTS credentials (
  id SERIAL PRIMARY KEY,
  school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
  credential_type VARCHAR(40) NOT NULL,
  login_id VARCHAR(80) NOT NULL,
  temporary_password_hash TEXT,
  last_reset_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (school_id, login_id, credential_type)
);

CREATE TABLE IF NOT EXISTS certificates (
  id SERIAL PRIMARY KEY,
  school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id INTEGER REFERENCES students(id) ON DELETE SET NULL,
  certificate_type VARCHAR(80) NOT NULL,
  certificate_no VARCHAR(80) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'issued',
  qr_payload TEXT,
  issued_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (school_id, certificate_no)
);

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  audience_type VARCHAR(40) NOT NULL DEFAULT 'school',
  audience_value VARCHAR(120),
  title VARCHAR(180) NOT NULL,
  message TEXT NOT NULL,
  channel VARCHAR(40) NOT NULL DEFAULT 'internal',
  priority VARCHAR(20) NOT NULL DEFAULT 'normal',
  status VARCHAR(30) NOT NULL DEFAULT 'queued',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_school_created ON notifications(school_id, created_at DESC);

CREATE TABLE IF NOT EXISTS reports (
  id SERIAL PRIMARY KEY,
  school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  report_type VARCHAR(80) NOT NULL,
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  generated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS id_cards (
  id SERIAL PRIMARY KEY,
  school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  card_no VARCHAR(80) NOT NULL,
  qr_payload TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'active',
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reissued_at TIMESTAMPTZ,
  UNIQUE (school_id, card_no)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
  actor_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(120) NOT NULL,
  entity_type VARCHAR(80),
  entity_id VARCHAR(80),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_school_created ON audit_logs(school_id, created_at DESC);

INSERT INTO schools (name, slug, plan)
VALUES ('SKP Sainik Public School', 'skp-sainik-public-school', 'professional')
ON CONFLICT (slug) DO NOTHING;
