# Architecture: Public Infrastructure Issue Reporting

## Overview

A three-tier web application (React SPA + Node.js/Express API + PostgreSQL) serving citizens of Bar, Montenegro. Citizens submit infrastructure issues anonymously; municipality staff review and resolve them via a protected dashboard.

---

## System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser (Citizen / Staff / Admin)                              │
│                                                                 │
│  ┌──────────────────┐   ┌────────────────────────────────────┐ │
│  │  Public UI        │   │  Staff / Admin Dashboard           │ │
│  │  - Issue form     │   │  - Issue list & filters            │ │
│  │  - Public map     │   │  - Issue detail & actions          │ │
│  │  (React + TS)     │   │  - Account management (admin)      │ │
│  └────────┬─────────┘   └───────────────┬────────────────────┘ │
└───────────┼─────────────────────────────┼──────────────────────┘
            │ HTTPS / REST                │ HTTPS / REST + JWT
            ▼                             ▼
┌───────────────────────────────────────────────────────────────┐
│  Node.js / Express API                                        │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐ │
│  │  Public       │  │  Staff       │  │  Admin              │ │
│  │  Routes       │  │  Routes      │  │  Routes             │ │
│  │  /api/issues  │  │  /api/staff/ │  │  /api/admin/        │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬──────────────┘ │
│         │                 │                  │                 │
│  ┌──────▼─────────────────▼──────────────────▼──────────────┐ │
│  │              Business Logic / Services                    │ │
│  │  IssueService  |  NotificationService  |  AuthService     │ │
│  └──────┬─────────────────────────────────────┬─────────────┘ │
│         │                                     │               │
│  ┌──────▼──────────────┐          ┌───────────▼─────────────┐ │
│  │  File Storage        │          │  SMS Gateway            │ │
│  │  (local / S3-compat) │          │  (e.g. Twilio / D7)     │ │
│  └─────────────────────┘          └─────────────────────────┘ │
└───────────────────────────────┬───────────────────────────────┘
                                │
                    ┌───────────▼──────────┐
                    │    PostgreSQL         │
                    └──────────────────────┘
```

---

## Frontend

**Stack:** React 18 + TypeScript, Vite, React Router, Leaflet.js + OpenStreetMap

### Pages / Views

| Route | Component | Access |
|---|---|---|
| `/` | Public map | Public |
| `/report` | Issue submission form | Public |
| `/staff/login` | Staff login | Public |
| `/staff/issues` | Issue list & filters | Staff / Admin |
| `/staff/issues/:id` | Issue detail & actions | Staff / Admin |
| `/admin/users` | Staff account management | Admin only |

### Key Frontend Concerns

- **Mobile-first** layout; camera capture via `<input type="file" accept="image/*" capture="environment">`.
- **Leaflet.js** for the public map (OpenStreetMap tiles) and the location picker in the submission form.
- **GPS** location obtained via the browser Geolocation API with map picker fallback.
- **i18n** — `react-i18next` with `me` (Montenegrin) as default locale and `en` as secondary.
- **Auth** — JWT stored in an `httpOnly` cookie (staff/admin only); public routes require no auth.
- **Accessibility** — ARIA landmarks, keyboard navigation, sufficient colour contrast (WCAG 2.1 AA).

---

## Backend

**Stack:** Node.js 20 LTS, Express 5, TypeScript, Zod (validation), Multer (file upload), jsonwebtoken, bcrypt

### Route Groups

#### Public (`/api`)
| Method | Path | Description |
|---|---|---|
| `POST` | `/issues` | Submit a new issue report |
| `GET` | `/issues` | List all open issues (map data — no PII) |
| `GET` | `/issues/:trackingCode` | Get status of a single issue by tracking code |

#### Staff (`/api/staff`) — requires valid JWT
| Method | Path | Description |
|---|---|---|
| `POST` | `/auth/login` | Authenticate and receive JWT |
| `GET` | `/issues` | List all issues with filters |
| `GET` | `/issues/:id` | Get full issue detail |
| `PATCH` | `/issues/:id/status` | Change status |
| `PATCH` | `/issues/:id/category` | Set category |
| `POST` | `/issues/:id/notes` | Add private or public note |
| `PATCH` | `/issues/:id/assignment` | Assign to department/individual |
| `POST` | `/issues/:id/close` | Close as Resolved or Rejected |

#### Admin (`/api/admin`) — requires JWT with `role = admin`
| Method | Path | Description |
|---|---|---|
| `GET` | `/users` | List staff accounts |
| `POST` | `/users` | Create a staff account |
| `PUT` | `/users/:id` | Update a staff account |
| `DELETE` | `/users/:id` | Deactivate a staff account |

### Services

- **IssueService** — CRUD for issues, tracking code generation (UUID v4 prefix, 8-char alphanumeric), photo storage.
- **AuthService** — JWT sign/verify, bcrypt password hashing, admin credential check from env vars.
- **NotificationService** — triggers SMS via the configured SMS gateway when issue status changes or a public note is added.

### File Uploads

Photos (JPEG/PNG, max 5 MB) are received by Multer, validated, and written to a local `/uploads` directory (configurable to an S3-compatible bucket via env var). Served under `/static/uploads/` with a random UUID filename to prevent enumeration.

---

## Database

**Engine:** PostgreSQL 16

### Schema (key tables)

```sql
-- Issue categories (seeded)
CREATE TABLE categories (
  ...
);

-- Issue reports
CREATE TABLE issues (
  ...
);

-- Notes on issues
CREATE TABLE issue_notes (
  ...
);

-- Staff and admin accounts
CREATE TABLE staff_users (
  ...
);
```

**Notes:**
- Contact phone numbers are encrypted at the application layer (AES-256-GCM) before being stored.
- A `pgcrypto`-based index is not used on the phone column to avoid leaking data; lookups are by tracking code only.
- Data retention: a scheduled job (or `pg_cron`) hard-deletes issues and associated data older than 5 years.

---

## Authentication & Authorization

| Actor | Mechanism |
|---|---|
| Citizen | No auth — anonymous |
| Staff | Username + password → JWT (1-day expiry, `httpOnly` cookie) |
| Admin | Same flow; admin credentials bootstrapped from `ADMIN_USERNAME` / `ADMIN_PASSWORD` env vars; `role = admin` in JWT payload |

Route middleware checks:
1. `requireAuth` — validates JWT signature and expiry.
2. `requireAdmin` — additionally checks `role === 'admin'`.

---

## Notifications (SMS)

The **NotificationService** sends SMS messages when:
- A new issue is submitted (confirmation + tracking code).
- Issue status changes.
- A public note is added.

The gateway provider is configured via `SMS_PROVIDER` (e.g. `twilio`, `d7networks`) and its credentials via env vars. The service is implemented as a thin adapter interface so the provider can be swapped without touching business logic.

---

## Configuration (Environment Variables)

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for signing JWTs |
| `ADMIN_USERNAME` | Bootstrap admin username |
| `ADMIN_PASSWORD` | Bootstrap admin password |
| `UPLOAD_DIR` | Local directory for photo uploads (default: `./uploads`) |
| `MAX_UPLOAD_BYTES` | Max photo size in bytes (default: `5242880`) |
| `SMS_PROVIDER` | SMS gateway adapter name |
| `SMS_API_KEY` | API key for the SMS provider |
| `SMS_FROM` | Sender ID or number |
| `PHONE_ENCRYPTION_KEY` | AES-256 key (hex) for phone number encryption |
| `CORS_ORIGIN` | Allowed origin for CORS (production frontend URL) |

---

## Project Structure

Feature-sliced: each feature owns its routes, service, components, and API client. Shared infrastructure lives in `_shared/`.

```
issue-reporting/
├── client/                        # React frontend
│   ├── public/
│   ├── src/
│   │   ├── features/
│   │   │   ├── issue-submission/  # Citizen report form
│   │   │   │   ├── IssueForm.tsx          # Multi-step submission form
│   │   │   │   ├── PhotoUpload.tsx         # Camera / file picker input
│   │   │   │   ├── LocationPicker.tsx      # Leaflet map + GPS button
│   │   │   │   ├── TrackingCodeBanner.tsx  # Success screen with code
│   │   │   │   ├── useGeolocation.ts       # Browser Geolocation hook
│   │   │   │   └── api.ts                  # POST /api/issues
│   │   │   │
│   │   │   ├── public-map/        # Citizen-facing issue map
│   │   │   │   ├── PublicMap.tsx           # Leaflet map with issue pins
│   │   │   │   ├── IssuePin.tsx            # Colour-coded map marker
│   │   │   │   ├── IssuePinPopup.tsx       # Popup on pin click
│   │   │   │   └── api.ts                  # GET /api/issues
│   │   │   │
│   │   │   ├── staff-auth/        # Staff / admin login
│   │   │   │   ├── LoginPage.tsx
│   │   │   │   ├── useAuth.ts              # JWT cookie state + refresh
│   │   │   │   └── api.ts                  # POST /api/staff/auth/login
│   │   │   │
│   │   │   ├── issue-list/        # Staff issue list & filters
│   │   │   │   ├── IssueListPage.tsx
│   │   │   │   ├── IssueTable.tsx
│   │   │   │   ├── IssueFilters.tsx        # Status + date-range filter bar
│   │   │   │   └── api.ts                  # GET /api/staff/issues
│   │   │   │
│   │   │   ├── issue-detail/      # Staff issue detail & actions
│   │   │   │   ├── IssueDetailPage.tsx
│   │   │   │   ├── IssueHeader.tsx         # Meta: date, status, category
│   │   │   │   ├── NoteThread.tsx          # Public + private notes
│   │   │   │   ├── AddNoteForm.tsx
│   │   │   │   ├── StatusControl.tsx       # Status change dropdown
│   │   │   │   ├── AssignmentControl.tsx   # Department / individual picker
│   │   │   │   ├── CloseIssueModal.tsx     # Resolve / Reject + comment
│   │   │   │   └── api.ts                  # PATCH & POST /api/staff/issues/:id/*
│   │   │   │
│   │   │   └── admin-users/       # Admin staff account management
│   │   │       ├── UserListPage.tsx
│   │   │       ├── UserTable.tsx
│   │   │       ├── UserFormModal.tsx       # Create / edit staff account
│   │   │       └── api.ts                  # GET/POST/PUT/DELETE /api/admin/users
│   │   │
│   │   ├── _shared/
│   │   │   ├── ui/                # Generic, reusable UI primitives
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Modal.tsx
│   │   │   │   ├── StatusBadge.tsx         # Coloured status pill
│   │   │   │   └── Spinner.tsx
│   │   │   ├── i18n/              # Locale files (me, en) + i18next setup
│   │   │   ├── http.ts            # Base fetch wrapper (auth headers, errors)
│   │   │   └── router.tsx         # React Router route definitions
│   │   │
│   │   └── main.tsx
│   └── vite.config.ts
│
├── server/                        # Express backend
│   ├── src/
│   │   ├── features/
│   │   │   ├── issues/
│   │   │   │   ├── issues.router.ts        # Public issue routes
│   │   │   │   └── issues.service.ts       # Submit, list, tracking code gen
│   │   │   │
│   │   │   ├── staff/
│   │   │   │   ├── staff.router.ts         # Staff-protected routes
│   │   │   │   └── staff.service.ts        # Status, notes, assignment, close
│   │   │   │
│   │   │   ├── admin/
│   │   │   │   ├── admin.router.ts         # Admin-protected routes
│   │   │   │   └── admin.service.ts        # Staff account CRUD
│   │   │   │
│   │   │   ├── auth/
│   │   │   │   ├── auth.router.ts          # POST /api/staff/auth/login
│   │   │   │   └── auth.service.ts         # JWT sign/verify, bcrypt, env-admin
│   │   │   │
│   │   │   └── notifications/
│   │   │       ├── notifications.service.ts # Trigger SMS on status change / note
│   │   │       └── adapters/
│   │   │           ├── sms.adapter.ts      # Interface: send(to, body)
│   │   │           ├── twilio.adapter.ts
│   │   │           └── d7.adapter.ts
│   │   │
│   │   ├── _shared/
│   │   │   ├── db/                # pg client + migration runner
│   │   │   ├── middleware/        # requireAuth | requireAdmin | errorHandler
│   │   │   └── upload.ts          # Multer config, UUID rename, size guard
│   │   │
│   │   └── index.ts               # App entry point, route mounting
│   └── tsconfig.json
│
├── docs/
│   ├── REQUIREMENTS.md
│   ├── TODO.md
│   └── ARCHITECTURE.md            # this file
│
└── docker-compose.yml             # PostgreSQL for local dev
```

---

## Non-Functional Architecture Decisions

| Concern | Decision |
|---|---|
| **Performance** | Vite + code splitting keeps initial load small. Public map issues are a lightweight GeoJSON payload (no PII). |
| **GDPR** | Contact phones encrypted at rest; never returned in public API responses; purged after 5 years. |
| **WCAG 2.1 AA** | Semantic HTML, ARIA, focus management, colour-contrast checked at design level. |
| **Scalability** | Single-instance for the demo; stateless API allows horizontal scaling behind a reverse proxy (nginx). |
| **Security** | Parameterised queries (no raw SQL), rate limiting on `/api/issues` POST, Helmet.js HTTP headers, CSP. |
