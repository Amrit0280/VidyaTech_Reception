CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS schools (
  id SERIAL PRIMARY KEY,
  name VARCHAR(180) NOT NULL,
  slug VARCHAR(80) NOT NULL UNIQUE,
  plan VARCHAR(40) NOT NULL DEFAULT 'professional',
  status VARCHAR(30) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name VARCHAR(160) NOT NULL,
  email VARCHAR(180),
  phone VARCHAR(30),
  login_id VARCHAR(80) NOT NULL UNIQUE,
  role VARCHAR(30) NOT NULL CHECK (role IN ('admin','teacher','student','parent','finance')),
  password_hash TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_school_role ON users(school_id, role);

CREATE TABLE IF NOT EXISTS students (
  id SERIAL PRIMARY KEY,
  school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  student_code VARCHAR(80) NOT NULL UNIQUE,
  admission_number VARCHAR(80),
  name VARCHAR(160) NOT NULL,
  class_name VARCHAR(40) NOT NULL,
  section VARCHAR(20),
  roll_number VARCHAR(40),
  gender VARCHAR(30),
  dob DATE,
  guardian_name VARCHAR(160) NOT NULL,
  guardian_phone VARCHAR(30) NOT NULL,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_students_school_class ON students(school_id, class_name, section);

CREATE TABLE IF NOT EXISTS teachers (
  id SERIAL PRIMARY KEY,
  school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  employee_code VARCHAR(80) NOT NULL,
  name VARCHAR(160) NOT NULL,
  subject VARCHAR(120),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (school_id, employee_code)
);

CREATE TABLE IF NOT EXISTS fees (
  id SERIAL PRIMARY KEY,
  school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  invoice_no VARCHAR(80) NOT NULL,
  fee_type VARCHAR(100) NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  discount NUMERIC(12,2) NOT NULL DEFAULT 0,
  due_date DATE NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','overdue','cancelled')),
  paid_at TIMESTAMPTZ,
  gateway_reference VARCHAR(160),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (school_id, invoice_no)
);

CREATE INDEX IF NOT EXISTS idx_fees_school_status ON fees(school_id, status);

CREATE TABLE IF NOT EXISTS attendance (
  id SERIAL PRIMARY KEY,
  school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  marked_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  attendance_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('present','absent','late','leave')),
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (school_id, student_id, attendance_date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_school_date ON attendance(school_id, attendance_date);

CREATE TABLE IF NOT EXISTS results (
  id SERIAL PRIMARY KEY,
  school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  exam_name VARCHAR(140) NOT NULL,
  subject VARCHAR(120) NOT NULL,
  marks_obtained NUMERIC(6,2) NOT NULL,
  max_marks NUMERIC(6,2) NOT NULL,
  grade VARCHAR(20),
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS homework (
  id SERIAL PRIMARY KEY,
  school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  teacher_id INTEGER REFERENCES teachers(id) ON DELETE SET NULL,
  class_name VARCHAR(40) NOT NULL,
  section VARCHAR(20),
  subject VARCHAR(120) NOT NULL,
  title VARCHAR(180) NOT NULL,
  description TEXT NOT NULL,
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notices (
  id SERIAL PRIMARY KEY,
  school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  title VARCHAR(180) NOT NULL,
  message TEXT NOT NULL,
  audience VARCHAR(30) NOT NULL DEFAULT 'all' CHECK (audience IN ('all','students','parents','teachers','admins')),
  priority VARCHAR(20) NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal','high','urgent')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS salaries (
  id SERIAL PRIMARY KEY,
  school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  teacher_id INTEGER NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  salary_month DATE NOT NULL,
  base_amount NUMERIC(12,2) NOT NULL,
  deductions NUMERIC(12,2) NOT NULL DEFAULT 0,
  bonus NUMERIC(12,2) NOT NULL DEFAULT 0,
  status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','hold')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admissions (
  id SERIAL PRIMARY KEY,
  school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_name VARCHAR(160) NOT NULL,
  guardian_name VARCHAR(160) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  class_requested VARCHAR(40) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','approved','rejected')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS school_branding (
  id SERIAL PRIMARY KEY,
  school_id INTEGER NOT NULL UNIQUE REFERENCES schools(id) ON DELETE CASCADE,
  display_name VARCHAR(180),
  logo_url TEXT,
  primary_color VARCHAR(30) DEFAULT '#0f62fe',
  accent_color VARCHAR(30) DEFAULT '#c9962b',
  website_url TEXT,
  admission_open BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS demo_leads (
  id SERIAL PRIMARY KEY,
  institution VARCHAR(180) NOT NULL,
  name VARCHAR(160) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  email VARCHAR(180) NOT NULL,
  requested_module VARCHAR(120),
  message TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO schools (name, slug, plan)
VALUES ('VidyaTech Demo School', 'vidyatech', 'enterprise')
ON CONFLICT (slug) DO NOTHING;

WITH demo_school AS (
  SELECT id FROM schools WHERE slug = 'vidyatech'
),
admin_user AS (
  INSERT INTO users (school_id, name, email, login_id, role, password_hash)
  SELECT id, 'Demo Admin', 'admin@demo-school.in', 'admin@demo-school.in', 'admin', crypt('Admin@12345', gen_salt('bf'))
  FROM demo_school
  ON CONFLICT (login_id) DO NOTHING
  RETURNING id
),
teacher_user AS (
  INSERT INTO users (school_id, name, email, login_id, role, password_hash)
  SELECT id, 'Demo Teacher', 'teacher@demo-school.in', 'teacher@demo-school.in', 'teacher', crypt('Teacher@12345', gen_salt('bf'))
  FROM demo_school
  ON CONFLICT (login_id) DO NOTHING
  RETURNING id
),
parent_user AS (
  INSERT INTO users (school_id, name, email, login_id, role, password_hash)
  SELECT id, 'Demo Parent', 'parent@demo-school.in', 'parent@demo-school.in', 'parent', crypt('Parent@12345', gen_salt('bf'))
  FROM demo_school
  ON CONFLICT (login_id) DO NOTHING
  RETURNING id
),
student_user AS (
  INSERT INTO users (school_id, name, login_id, role, password_hash)
  SELECT id, 'Demo Student', 'VIDY-2026-0001', 'student', crypt('Student@12345', gen_salt('bf'))
  FROM demo_school
  ON CONFLICT (login_id) DO NOTHING
  RETURNING id
)
INSERT INTO teachers (school_id, user_id, employee_code, name, subject)
SELECT ds.id, COALESCE((SELECT id FROM teacher_user), (SELECT id FROM users WHERE login_id = 'teacher@demo-school.in')), 'TCH-001', 'Demo Teacher', 'Mathematics'
FROM demo_school ds
ON CONFLICT (school_id, employee_code) DO NOTHING;

INSERT INTO students (school_id, user_id, parent_user_id, student_code, admission_number, name, class_name, section, roll_number, gender, guardian_name, guardian_phone, address)
SELECT
  ds.id,
  (SELECT id FROM users WHERE login_id = 'VIDY-2026-0001'),
  (SELECT id FROM users WHERE login_id = 'parent@demo-school.in'),
  'VIDY-2026-0001',
  'ADM-001',
  'Demo Student',
  'IX',
  'A',
  '12',
  'Male',
  'Demo Parent',
  '+91 8318466940',
  'India'
FROM schools ds
WHERE ds.slug = 'vidyatech'
ON CONFLICT (student_code) DO NOTHING;

INSERT INTO fees (school_id, student_id, invoice_no, fee_type, amount, discount, due_date, status, paid_at)
SELECT ds.id, st.id, 'INV-2026-001', 'Tuition Fee', 25000, 0, CURRENT_DATE + INTERVAL '15 days', 'pending', NULL
FROM schools ds
JOIN students st ON st.school_id = ds.id AND st.student_code = 'VIDY-2026-0001'
WHERE ds.slug = 'vidyatech'
ON CONFLICT (school_id, invoice_no) DO NOTHING;

INSERT INTO notices (school_id, created_by, title, message, audience, priority)
SELECT ds.id, u.id, 'Welcome to the digital campus', 'This is your real-time notice board for school updates.', 'all', 'normal'
FROM schools ds
JOIN users u ON u.school_id = ds.id AND u.role = 'admin'
WHERE ds.slug = 'vidyatech'
ON CONFLICT DO NOTHING;

-- Reception upgrade schema: safe for existing databases.
-- Keep this section aligned with migrations/002_reception_student_documents_profiles.sql.
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

ALTER TABLE admissions
  ADD COLUMN IF NOT EXISTS admission_number VARCHAR(80),
  ADD COLUMN IF NOT EXISTS student_id INTEGER REFERENCES students(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS section VARCHAR(20),
  ADD COLUMN IF NOT EXISTS house VARCHAR(60),
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(30) NOT NULL DEFAULT 'inquiry',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE TABLE IF NOT EXISTS student_profiles (
  id SERIAL PRIMARY KEY,
  school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL UNIQUE REFERENCES students(id) ON DELETE CASCADE,
  profile_photo TEXT,
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
  file_url TEXT,
  verification_status VARCHAR(30) NOT NULL DEFAULT 'uploaded',
  uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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
