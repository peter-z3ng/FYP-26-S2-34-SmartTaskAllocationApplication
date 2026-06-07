# TaskNova Smart Work Allocation Platform

TaskNova is a Next.js and Supabase web application for SME task allocation. It supports role-based workspaces for Platform Admin, User Admin, Manager, Employee, and Guest users.

## Core Features

- Authentication and role-based routing
- User account, role, organization, and Free/Paid plan management
- Manager task CRUD, manual assignment, automatic assignment, eligibility checks, and allocation history
- Employee assigned tasks, available tasks, task requests, availability, clock in/out, and feedback
- Platform Admin homepage content, subscription plans, feedback analysis, contact inquiries, and activity logs
- Public marketing website, feedback page, pricing, and support contact flow
- Local demo mode when Supabase environment variables are not configured

## Environment

Create `.env.local` for real Supabase mode:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_google_recaptcha_v2_site_key
RECAPTCHA_SECRET_KEY=your_google_recaptcha_v2_secret_key
```

If the Supabase variables are missing, the app uses local demo data so pages can still be tested.

The login page uses Google reCAPTCHA v2 checkbox when `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`
and `RECAPTCHA_SECRET_KEY` are configured. Register keys in the Google reCAPTCHA admin
console and include `localhost` for local testing. If the reCAPTCHA keys are missing,
the login page falls back to the local demo verification code.

For real Supabase mode, run `database/20260528_add_subscription_tier.sql` once to
enable Free/Paid account badges and plan management on `user_account`.

## Demo Accounts

All demo passwords are `Test@123456`.

| Role | Email |
| --- | --- |
| Platform Admin | `platformadmin@workflow.test` |
| User Admin | `useradmin@workflow.test` |
| Manager | `manager@workflow.test` |
| Employee | `employee@workflow.test` |

## Local Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

For production verification:

```bash
npm run build
npm run start
```
