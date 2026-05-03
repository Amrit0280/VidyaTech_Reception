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
