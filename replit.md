# Campus Complaint Desk

## Overview

AI-Powered Hostel/Campus Complaint Desk System — a full-stack application where students report issues, staff resolves them, and admins oversee everything. AI automatically categorizes and prioritizes complaints using OpenAI.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (Wouter routing, TanStack Query, shadcn/ui)
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **Auth**: JWT (jsonwebtoken) + bcryptjs
- **AI Analysis**: OpenAI (Replit AI Integration) for complaint categorization
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Role System

- **student** (default) — submit complaints, track status, provide feedback
- **staff** — view assigned complaints, update status
- **admin** — full access, assign staff, manage users, view analytics

## Admin Creation

Set `ADMIN_SECRET` env var. During registration, if `adminCode` matches `ADMIN_SECRET`, the user is created as admin. Otherwise, defaults to student.

**Test accounts:**
- Admin: admin@campus.edu / admin123
- Staff: staff@campus.edu / staff123
- Student: student@campus.edu / student123

## Key Routes

- `/` or `/role` — Role selection (first screen)
- `/login` — Login
- `/register` — Student registration (with optional admin code)
- `/dashboard` — Student dashboard
- `/admin` — Admin dashboard (complaints, users, analytics)
- `/staff` — Staff dashboard

## API Endpoints

- `POST /api/auth/register` — Register (adminCode optional)
- `POST /api/auth/login` — Login
- `GET /api/auth/me` — Get current user
- `GET /api/complaints` — Get complaints (role-filtered)
- `POST /api/complaints` — Submit complaint (student only)
- `PUT /api/complaints/:id` — Update status/feedback
- `GET /api/complaints/stats` — Analytics stats
- `GET /api/admin/users` — All users (admin)
- `PUT /api/admin/users/:userId/role` — Change role (admin)
- `PUT /api/admin/complaints/:id/assign` — Assign to staff (admin)
- `GET /api/staff/list` — Staff members list (admin)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas
- `pnpm --filter @workspace/db run push` — push DB schema changes

## Environment Variables

- `ADMIN_SECRET` — Secret code for admin account creation
- `JWT_SECRET` — JWT signing secret
- `DATABASE_URL` — PostgreSQL connection string
- `AI_INTEGRATIONS_OPENAI_BASE_URL` — Replit AI proxy URL
- `AI_INTEGRATIONS_OPENAI_API_KEY` — Replit AI proxy key
