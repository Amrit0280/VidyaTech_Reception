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
  CHECK (role IN ('admin','super_admin','principal','teacher','student','parent','finance','receptionist','accountant'));

ALTER TABLE students
  ADD COLUMN IF NOT EXISTS house VARCHAR(60),
  ADD COLUMN IF NOT EXISTS profile_photo TEXT,
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(80),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS admission_status VARCHAR(30) NOT NULL DEFAULT 'enrolled',
  ADD COLUMN IF NOT EXISTS due_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS session VARCHAR(20),
  ADD COLUMN IF NOT EXISTS father_name VARCHAR(160),
  ADD COLUMN IF NOT EXISTS mother_name VARCHAR(160),
  ADD COLUMN IF NOT EXISTS previous_school VARCHAR(180),
  ADD COLUMN IF NOT EXISTS aadhaar_id VARCHAR(40),
  ADD COLUMN IF NOT EXISTS photo_url TEXT,
  ADD COLUMN IF NOT EXISTS parent_mobile VARCHAR(30),
  ADD COLUMN IF NOT EXISTS alternate_mobile VARCHAR(30),
  ADD COLUMN IF NOT EXISTS parent_email VARCHAR(180),
  ADD COLUMN IF NOT EXISTS parent_occupation VARCHAR(140);

CREATE UNIQUE INDEX IF NOT EXISTS idx_students_school_admission_unique
  ON students(school_id, admission_number)
  WHERE admission_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_students_school_active_class
  ON students(school_id, is_deleted, class_name, section, house);

ALTER TABLE admissions
  ADD COLUMN IF NOT EXISTS admission_number VARCHAR(80),
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
  ADD COLUMN IF NOT EXISTS house VARCHAR(60),
  ADD COLUMN IF NOT EXISTS email VARCHAR(180),
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(30) NOT NULL DEFAULT 'inquiry',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE TABLE IF NOT EXISTS student_profiles (
  id SERIAL PRIMARY KEY,
  school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL UNIQUE REFERENCES students(id) ON DELETE CASCADE,
  profile_photo TEXT,
  emergency_contact VARCHAR(30),
  medical_notes TEXT,
  document_status JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documents (
  id SERIAL PRIMARY KEY,
  school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
  admission_id INTEGER REFERENCES admissions(id) ON DELETE CASCADE,
  document_type VARCHAR(80) NOT NULL,
  document_label VARCHAR(140),
  file_name VARCHAR(220),
  file_type VARCHAR(120),
  file_size BIGINT NOT NULL DEFAULT 0,
  storage_provider VARCHAR(60) NOT NULL DEFAULT 'local-or-cloud',
  file_url TEXT,
  checksum TEXT,
  verification_status VARCHAR(30) NOT NULL DEFAULT 'uploaded',
  uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_school_student_type
  ON documents(school_id, student_id, document_type);

CREATE TABLE IF NOT EXISTS student_documents (
  id SERIAL PRIMARY KEY,
  school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
  admission_id INTEGER REFERENCES admissions(id) ON DELETE CASCADE,
  document_type VARCHAR(80) NOT NULL,
  document_label VARCHAR(140),
  file_name VARCHAR(220),
  file_type VARCHAR(120),
  file_size BIGINT NOT NULL DEFAULT 0,
  file_url TEXT,
  verification_status VARCHAR(30) NOT NULL DEFAULT 'uploaded',
  uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE student_documents
  ADD COLUMN IF NOT EXISTS document_label VARCHAR(140),
  ADD COLUMN IF NOT EXISTS file_name VARCHAR(220),
  ADD COLUMN IF NOT EXISTS file_type VARCHAR(120),
  ADD COLUMN IF NOT EXISTS file_size BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE UNIQUE INDEX IF NOT EXISTS idx_student_documents_unique_type
  ON student_documents(school_id, student_id, document_type);

CREATE TABLE IF NOT EXISTS pending_documents (
  id SERIAL PRIMARY KEY,
  school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  document_type VARCHAR(80) NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT true,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  resolved_document_id INTEGER REFERENCES student_documents(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (school_id, student_id, document_type)
);

CREATE TABLE IF NOT EXISTS report_generation_logs (
  id SERIAL PRIMARY KEY,
  school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  report_type VARCHAR(80) NOT NULL,
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  generated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  output_format VARCHAR(20) NOT NULL DEFAULT 'png',
  row_count INTEGER NOT NULL DEFAULT 0,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_report_generation_logs_school
  ON report_generation_logs(school_id, generated_at DESC);
