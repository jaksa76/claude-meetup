# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Server (backend)

```bash
cd server
npm run dev        # Start with hot reload (tsx watch)
npm run build      # Compile TypeScript to dist/
npm test           # Run all tests (Jest, sequential with --runInBand)
```

Run a single test file:
```bash
cd server && npx jest tests/issues.test.ts
```

### Client (frontend)

The client scaffold is defined in the architecture but not yet generated. When it exists:
```bash
cd client
npm run dev        # Vite dev server (default port 5173)
npm run build
```

### Infrastructure

```bash
docker-compose up -d   # Start PostgreSQL for local dev
```

## Architecture

This is a **feature-sliced monorepo**: `client/` (React SPA) and `server/` (Express API), backed by PostgreSQL.

### Backend structure

`server/src/` is organized by feature, each owning its own router and service:

- `features/issues/` — public issue CRUD; tracking code generation (8-char alphanumeric from UUID v4)
- `features/staff/` — staff-protected routes for status changes, notes, assignment, close
- `features/admin/` — admin-protected staff account management
- `features/auth/` — JWT sign/verify, bcrypt hashing, env-var admin bootstrap
- `features/notifications/` — SMS dispatch via swappable adapters (`sms.adapter.ts` interface → `twilio`, `d7`)
- `_shared/middleware/` — `requireAuth` (JWT cookie or Bearer header), `requireAdmin` (role check), `errorHandler`

Route mounting in `app.ts`:
```
/api/issues          → issues router (public)
/api/staff/auth      → auth router (public)
/api/staff           → staff router (requireAuth)
/api/admin           → admin router (requireAdmin)
```

### Auth flow

JWT is stored in an `httpOnly` cookie. `requireAuth` accepts it from `req.cookies.token` or the `Authorization: Bearer` header. `JwtPayload` carries `{ sub, role: 'staff' | 'admin' }`. Admin credentials come from `ADMIN_USERNAME` / `ADMIN_PASSWORD` env vars.

### Current data layer

`issues.service.ts` uses an **in-memory Map** (placeholder until PostgreSQL is wired up). The `_clearStore()` export exists solely for test isolation (`beforeEach(() => _clearStore())`). Future stories will replace this with `pg` queries.

### Notifications

`NotificationService` triggers SMS on: issue submission (confirmation + tracking code), status change, public note added. The SMS provider is selected by `SMS_PROVIDER` env var; the adapter interface is `send(to: string, body: string): Promise<void>`.

### Key env vars

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | JWT signing secret (defaults to `dev-secret` in dev) |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | Bootstrap admin account |
| `UPLOAD_DIR` | Photo storage directory (default `./uploads`) |
| `PHONE_ENCRYPTION_KEY` | AES-256-GCM key (hex) for encrypting contact phones at rest |
| `SMS_PROVIDER` / `SMS_API_KEY` / `SMS_FROM` | SMS gateway config |
| `CORS_ORIGIN` | Allowed CORS origin (default `http://localhost:5173`) |

## Domain context

The app serves citizens of Bar, Montenegro. UI must support **Montenegrin** (`me`) as the primary locale and English as secondary (`react-i18next`). The public map uses **Leaflet.js + OpenStreetMap**. Contact phone numbers are **never** returned in public API responses and are encrypted at rest (AES-256-GCM) before database storage.

## User stories

Unimplemented stories live in `docs/TODO.md` (format: `NNNN - As a … I want to …`). The `implement` skill reads this file to pick the next story.
