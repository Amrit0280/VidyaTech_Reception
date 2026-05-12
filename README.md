# VidyaTech - School Tech Business Website + Software Ecosystem

Premium React website plus Express REST API for selling and demonstrating school websites, ERP software, student management, fees, attendance, results, notices, payroll, and multi-school automation.

## Stack

- Frontend: React, Vite, Tailwind CSS, Framer Motion, Recharts, Lucide Icons
- Backend: Node.js, Express, PostgreSQL, JWT, Socket.IO
- Database: PostgreSQL schema in `database.sql`
- Deployment: Render, Hostinger static hosting, cPanel Node.js app

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env
```

3. Create a PostgreSQL database and run:

```bash
psql "postgresql://postgres:password@localhost:5432/vidyatech_ecosystem" -f database.sql
```

4. Start frontend and backend:

```bash
npm run dev
```

Frontend: `http://localhost:5173`

Backend health check: `http://localhost:5000/api/health`

## Demo Credentials

Use after importing `database.sql`.

| Role | Login | Password |
| --- | --- | --- |
| Admin | `admin@demo-school.in` | `Admin@12345` |
| Teacher | `teacher@demo-school.in` | `Teacher@12345` |
| Student | `VIDY-2026-0001` | `Student@12345` |
| Parent | `parent@demo-school.in` | `Parent@12345` |

Change all credentials before production launch.

## API Modules

- `POST /api/leads`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/students`
- `POST /api/students`
- `GET /api/fees`
- `POST /api/fees`
- `POST /api/fees/payment-order`
- `PATCH /api/fees/:id/paid`
- `GET /api/attendance`
- `POST /api/attendance`
- `GET /api/notices`
- `POST /api/notices`
- `GET /api/analytics/overview`
- `GET /api/teachers`
- `POST /api/teachers`
- `GET /api/salaries`
- `POST /api/salaries`
- `GET /api/results`
- `POST /api/results`
- `GET /api/branding`
- `PATCH /api/branding`
## Vercel Form Submissions

This project includes `api/leads.js`, a Vercel serverless function that receives the contact/demo form and stores it in PostgreSQL table `demo_leads`.

Add this environment variable in Vercel Project Settings:

```env
DATABASE_URL=postgresql://postgres:<encoded-password>@db.bwnvttxqveftbqjgbbhj.supabase.co:5432/postgres
```

Do not add the database URL with a `VITE_` prefix. `VITE_` variables are exposed to the browser.

The React frontend submits to `/api/leads`, which works on Vercel through the serverless function. During local development, Vite proxies `/api` to the Express backend on `localhost:5000`.

## Render Hosting Guide

## Vercel Hosting Guide

Vercel is the recommended deployment target for this React/Vite website and the `api/leads.js` serverless form endpoint.

1. Push the project to GitHub.
2. Go to Vercel and choose Add New Project.
3. Import the GitHub repository.
4. Use these settings:
   - Framework Preset: `Vite`
   - Install Command: `npm install`
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Add Environment Variables in Vercel Project Settings:

```env
DATABASE_URL=postgresql://postgres:<encoded-password>@db.bwnvttxqveftbqjgbbhj.supabase.co:5432/postgres
VITE_WHATSAPP_NUMBER=918318466940
VITE_GOOGLE_MAPS_EMBED=https://www.google.com/maps?q=New%20Delhi%20India&output=embed
```

6. Deploy.
7. Test:
   - Open `/contact`
   - Submit the demo form
   - Check Supabase table `demo_leads`

The included `vercel.json` sends React routes like `/about`, `/pricing`, and `/contact` to `index.html`, while `/api/leads` remains available as a serverless function.

## Windows Desktop App

The project now includes a Windows-first Electron desktop application for school reception and fee management.

### Run In Development

```bash
npm run dev:desktop
```

This opens the receptionist workspace at `/reception-app` inside Electron.

### Build Windows Installer

```bash
npm run dist
```

Output:

- Installer: `release-desktop/VidyaTech-Reception-Setup-1.0.0.exe`
- Update metadata: `release-desktop/latest.yml`
- Portable unpacked app: `release-desktop/win-unpacked/VidyaTech Reception.exe`

### Desktop Auto Updates

The desktop app uses `electron-updater` with Electron Builder, Windows NSIS, and GitHub Releases.

Update behavior:

- Checks for updates automatically shortly after app startup.
- Shows a professional VidyaTech update window when a new version is found.
- Downloads the update in the background.
- Shows download progress.
- Asks: "Update downloaded. Restart now?"
- Installs the update when the user confirms restart.

GitHub update provider:

- Owner: `Amrit0280`
- Repo: `VidyaTech_Reception`
- Provider: GitHub Releases

The GitHub repository should be public for installed customer apps. Do not ship a GitHub token inside the app.

### Automated GitHub Release Pipeline

The repository includes `.github/workflows/release.yml`.

For this review phase, the workflow is manual-only and must be started from GitHub Actions after approval. When manually approved and run, GitHub Actions will:

1. Install dependencies with `npm ci`.
2. Automatically run `npm version patch --no-git-tag-version`.
3. Commit the new `package.json` and `package-lock.json` version back to `main` with `[skip ci]`.
4. Create and push a `vX.X.X` tag.
5. Build the Windows NSIS installer with `npm run release`.
6. Create a GitHub Release.
7. Upload the installer, blockmap, and `latest.yml`.

GitHub secret required:

1. Open `https://github.com/Amrit0280/VidyaTech_Reception`.
2. Go to Settings -> Secrets and variables -> Actions.
3. Add a repository secret:
   - Name: `GH_TOKEN`
   - Value: a GitHub personal access token with `repo` permission.

The workflow has `patch`, `minor`, `major`, or `none` version bump choices. Re-enable push-triggered releases only after a production rollout policy is approved.

### Manual Release Build

For a local manual release, create a GitHub token with repository contents read/write access, then set it only in your terminal:

```powershell
$env:GH_TOKEN="your_github_token_here"
```

Bump the version before each customer release:

```powershell
npm.cmd version patch
```

Use `minor` for releases like `1.0.0` to `1.1.0`, and `major` for breaking releases.

Build and upload the release artifacts:

```powershell
npm.cmd run release
```

The release command uploads these GitHub Release assets:

- `VidyaTech-Reception-Setup-<version>.exe`
- `VidyaTech-Reception-Setup-<version>.exe.blockmap`
- `latest.yml`

`latest.yml` is required by `electron-updater`. Do not rename or remove it from the GitHub Release.

### Auto Update Testing

First install test:

1. Set package version to `1.0.0`.
2. Run the release workflow manually, or run `npm.cmd run release` manually after approval.
3. Install `VidyaTech-Reception-Setup-1.0.0.exe`.
4. Confirm the app opens normally.

Update test:

1. Keep the installed `1.0.0` app on the computer.
2. Bump/release a new version after approval.
3. Wait for the GitHub Actions release workflow or manual release command to finish.
4. Open the installed `1.0.0` app.
5. The app should find the new GitHub Release, download it, and ask to restart.
6. After restart, confirm the app is on the new version.

For production, code signing is strongly recommended so Windows SmartScreen trusts the installer more quickly.

### Phase 1 Cloud Reception Backend

VidyaTech Reception now supports an API-first cloud mode:

- Electron desktop app -> secure Express API -> PostgreSQL.
- The desktop app never connects directly to PostgreSQL.
- PostgreSQL credentials must live only in backend environment variables.
- JWT authentication protects reception APIs.
- bcrypt hashes staff, student, and parent credentials.

Backend environment variables for Render:

```bash
NODE_ENV=production
PORT=5000
DATABASE_URL=<your Render PostgreSQL internal/external connection string>
DB_SSL=true
JWT_SECRET=<long random production secret>
JWT_EXPIRES_IN=7d
CLIENT_URL=<your deployed frontend origin, or localhost for development>
```

Desktop/frontend environment variable:

```bash
VITE_API_URL=https://your-render-api-service.onrender.com
```

Apply the Phase 1 database schema:

```bash
npm.cmd run db:migrate
```

Create the first school admin without committing credentials:

```powershell
$env:ADMIN_EMAIL="admin@school-domain.in"
$env:ADMIN_PASSWORD="choose-a-strong-password"
$env:ADMIN_NAME="School Admin"
$env:ADMIN_SCHOOL_SLUG="skp-sainik-public-school"
npm.cmd run db:create-admin
```

The migration creates or extends the production tables for:

- `students`, `admissions`, `parents`, `student_documents`
- `fee_structures`, `fee_payments`, `dues`, `receipts`
- `users`, `credentials`, `certificates`, `notifications`
- `reports`, `id_cards`, `audit_logs`

Reception cloud endpoints:

- `POST /api/auth/login`
- `GET /api/reception/snapshot`
- `GET /api/reception/search?q=...`
- `POST /api/reception/students`
- `POST /api/reception/payments`
- `POST /api/reception/credentials/reset`
- `POST /api/reception/notifications`
- `POST /api/reception/admissions`

Security note: if a real database URL was pasted into any chat or document, rotate that Render database password before production rollout.

### Phase 1 Cloud Test Plan

1. Set `DATABASE_URL`, `DB_SSL=true`, and `JWT_SECRET` on the backend service.
2. Run `npm.cmd run db:migrate`.
3. Create or confirm an `admin`, `receptionist`, or `accountant` user with `npm.cmd run db:create-admin`.
4. Set `VITE_API_URL` to the deployed backend URL and build the desktop release.
5. Install the app, open Backup & Settings, and sign in to cloud mode.
6. Create a student admission record.
7. Record a fee payment and confirm a receipt appears.
8. Reset a student password and verify the audit log row is written.
9. Queue a notification and confirm it appears in the notification log.
10. After approval, publish a versioned release to GitHub and confirm existing users receive the auto-update.

### Desktop Features

- Reception dashboard with quick actions
- Student fee billing and school-standard receipt generation
- Receipt-only print workflow through the system print dialog
- Pending dues and overdue tracking
- Student search by name, class, roll, admission number, or mobile
- Student portal ID and password generation/reset
- Admission workflow with automatic admission numbers
- Student profiles with uploaded document library and profile photo
- Management filters for class, section, dues, documents, house, and status
- WhatsApp-ready PNG report generation
- Notification queue and history
- Admission enquiry overview
- Financial reports and CSV export
- Encrypted local desktop data store
- Backup and restore workflow
- Offline-first design with future online sync hooks
- Role-ready structure for Receptionist, Accountant, Admin, and Principal

The Electron shell uses `contextIsolation`, disables Node access in the browser window, and exposes only a small secure preload API for local data, backup, restore, sync, and PDF export.

### Reception Upgrade Review Notes

This workspace includes an unreleased operational upgrade for admissions, profiles, documents, dues reporting, and professional receipts.

Local review rules:

- Do not push until manually approved.
- Do not run `npm.cmd version ...` until manually approved.
- Do not run `npm.cmd run release` until manually approved.
- Do not publish a GitHub Release until manually approved.

Database migration:

```bash
node scripts/migrate.cjs
```

Main upgrade areas:

- Admission tab is now the single source for new registrations.
- Admission numbers are generated as `ADM-YYYY-0001`.
- Student deletion is soft-delete by default and Admin-only.
- Document uploads support PDF, JPG, and PNG metadata/files.
- Student Profile tab shows full profile, credentials, fee status, and documents.
- Management tab filters class, section, dues, document status, document type, house, and status.
- Shareable PNG report export is available for WhatsApp/parent communication.
- Fee receipt printing uses an external print action and prints only the receipt design.

### Backend on Render

1. Push this project to GitHub.
2. Create a new PostgreSQL database on Render.
3. Create a new Web Service.
4. Build command: `npm install`
5. Start command: `npm run start:backend`
6. Add environment variables:
   - `NODE_ENV=production`
   - `PORT=10000`
   - `DATABASE_URL=<Render PostgreSQL internal URL>`
   - `JWT_SECRET=<long random secret>`
   - `CLIENT_URL=https://your-frontend-domain.com`
   - `RAZORPAY_KEY_ID=<key>`
   - `RAZORPAY_KEY_SECRET=<secret>`
7. Run `database.sql` in the Render PostgreSQL console.

### Frontend on Render

1. Create a Static Site.
2. Build command: `npm install && npm run build`
3. Publish directory: `dist`
4. Add `VITE_API_URL=https://your-api.onrender.com/api`

## Hostinger Static Hosting Guide

1. Set `VITE_API_URL` in `.env`.
2. Run:

```bash
npm run build
```

3. Upload the contents of `dist/` to Hostinger `public_html`.
4. For React routes, add this `.htaccess` inside `public_html`:

```apache
<IfModule mod_rewrite.c>
RewriteEngine On
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
</IfModule>
```

## cPanel Hosting Guide

### Frontend

1. Run `npm run build`.
2. Upload `dist/` contents to `public_html`.
3. Add the React route `.htaccess` above.

### Backend Node.js App

1. In cPanel, open Setup Node.js App.
2. App root: project folder containing `backend/server.js`.
3. Startup file: `backend/server.js`.
4. Add environment variables from `.env.example`.
5. Install dependencies from the cPanel terminal:

```bash
npm install --omit=dev
```

6. Start or restart the Node app.

## Domain Connection

1. Buy or connect a domain from your registrar.
2. Point frontend domain DNS to your hosting provider.
3. Point API subdomain such as `api.vidyatech.in` to Render or cPanel backend.
4. Update:
   - Frontend `VITE_API_URL=https://api.vidyatech.in/api`
   - Backend `CLIENT_URL=https://vidyatech.in`
5. Enable SSL on both frontend and backend.

## Payment Gateway Ready

The backend includes `POST /api/fees/payment-order`, returning a Razorpay-ready order payload. Replace the placeholder logic with real Razorpay order creation using `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`.

## Production Checklist

- Confirm VidyaTech logo files, email, phone, WhatsApp number, and map URL.
- Replace demo credentials.
- Set a strong `JWT_SECRET`.
- Enable SSL.
- Configure production database backups.
- Add real payment gateway order creation.
- Connect the contact form to `/api/leads`.
- Add legal pages: Privacy Policy, Terms, Refund Policy.
