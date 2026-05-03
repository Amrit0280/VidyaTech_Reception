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
