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

Dev uses **SQLite** (no setup needed — `dev.db` is created automatically on first run).

Production uses PostgreSQL via `DATABASE_URL`. To run a local Postgres instance:
```bash
docker-compose up -d
```

## Architecture

This is a **feature-sliced monorepo**: `client/` (React SPA) and `server/` (Express API), backed by SQLite in dev and PostgreSQL in production.

### Backend structure

`server/src/` is organized by feature, each owning its own router and service:

- `features/admin/` — admin-protected staff account management
- `features/auth/` — JWT sign/verify, bcrypt hashing, env-var admin bootstrap
- `features/notifications/` — SMS dispatch via swappable adapters (`sms.adapter.ts` interface → `twilio`, `d7`)
- `shared/db.ts` — database access (`db.run`, `db.get`, `db.all`, `db.exec`); SQLite in dev, swap for pg pool in production
- `shared/middleware/` — `requireAuth` (JWT cookie or Bearer header), `requireAdmin` (role check), `errorHandler`


### Key env vars

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (production only; dev uses SQLite) |
| `JWT_SECRET` | JWT signing secret (defaults to `dev-secret` in dev) |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | Bootstrap admin account |
| `CORS_ORIGIN` | Allowed CORS origin (default `http://localhost:5173`) |

## Domain context

The app serves citizens of Bar, Montenegro. UI must support **Montenegrin** (`me`) as the primary locale and English as secondary (`react-i18next`). The public map uses **Leaflet.js + OpenStreetMap**. Contact phone numbers are **never** returned in public API responses and are encrypted at rest (AES-256-GCM) before database storage.

## User stories

Unimplemented stories live in `docs/TODO.md` (format: `NNNN - As a … I want to …`).

## Skills

Place new skills in `.claude/skills/<skill-name>/SKILL.md`.