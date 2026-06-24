# Mezzo Maths Ltd Administrative App

A professional React + Vite administrative dashboard for Mezzo Maths Ltd, now upgraded with Supabase login and cloud database storage.

## What This Version Includes

- Supabase email/password login
- Supabase cloud data storage through the `app_data` table
- Admin roles: Super Admin, Finance Admin and Viewer
- Schools/clients onboarded
- Student numbers per school
- Per-student or flat-rate billing
- Term 1 books bought and book pricing
- Payment entry and receipt generation
- Payment mode: MoMo, cheque, cash and bank transfer
- Dashboard showing owing schools and amount owed
- Expenditure tracking
- Bank position summary
- Staff payroll, SSNIT, tax, deductions and payslip generation
- JSON export backup

## Supabase Setup

### 1. Create the database table

In Supabase:

1. Open your Supabase project.
2. Go to **SQL Editor**.
3. Create a new query.
4. Copy everything inside:

```bash
supabase/schema.sql
```

5. Run it.

This creates the `public.app_data` table, enables Row Level Security and seeds the first app data.

### 2. Create the first users in Supabase Authentication

In Supabase:

1. Go to **Authentication → Users**.
2. Click **Add user**.
3. Create these users:

| Role | Email | Password |
|---|---|---|
| Super Admin | admin@mezzomaths.org | Mezzo@2026 |
| Finance Admin | finance@mezzomaths.org | Finance@2026 |

Use **Auto Confirm User** if Supabase shows that option.

Important: The app role list is stored inside the app data, but the actual password login is handled by Supabase Authentication.

### 3. Add your environment variables locally

Create a `.env.local` file from `.env.example`:

```bash
cp .env.example .env.local
```

Add your Supabase details:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-or-publishable-key
```

You can find these in Supabase under:

```text
Project Settings → API
```

Use the Project URL and the public anon/publishable key. Do not put the service-role key in this frontend app.

### 4. Run locally

```bash
npm install
npm run dev
```

Open the local URL shown in your terminal, usually:

```bash
http://localhost:5173
```

### 5. Deploy to Vercel

After pushing the project to GitHub:

1. Open the project in Vercel.
2. Go to **Settings → Environment Variables**.
3. Add:

```env
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

4. Redeploy the project.

For Vite apps on Vercel, environment variables exposed to browser code must use the `VITE_` prefix.

## How Admin Users Work

For security, passwords are no longer stored inside the browser or app data when Supabase is connected.

To add a new admin:

1. In Supabase, go to **Authentication → Users** and create the user's email and password.
2. In the app, login as Super Admin.
3. Go to **Admin Users**.
4. Add the same email and choose the role.

The app then matches the Supabase login email to the app's Admin Users list.

## Important Security Note

This Supabase version is much better than browser-only storage because records are shared across admins and stored in your cloud database. For a full production finance system, the next professional upgrade should be separate relational tables for schools, payments, receipts, expenses, payroll and audit logs.

## Build

```bash
npm run build
```

The production files will be generated in the `dist` folder.
