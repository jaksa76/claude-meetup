---
name: implement-story
description: Implement a user story from docs/TODO.md end-to-end: planning, backend + frontend code, unit tests (Jest/supertest), Playwright e2e tests, and a refactor pass. Use this skill whenever the user asks to implement a story, work on a feature, or says something like "implement story NNNN" or "build the X feature".
---

# Implement Story

A skill for taking a user story from `docs/TODO.md` to working, tested, refactored code.

The process has four phases: **Plan → Implement → Test → Refactor**. Work through them in order. Don't skip ahead.

---

## Phase 1 — Plan

### Identify the story

If the user gave you a story number (e.g. `0003`) or a description, find it in `docs/TODO.md`. Read the full file to understand neighbouring stories and avoid duplicate work.

### Read the codebase

Before writing a single line, understand what already exists. Read:
- `CLAUDE.md` for architecture and conventions
- `server/src/app.ts` and any relevant feature routers/services
- `client/src/App.tsx` and related components
- Existing tests in `server/src/` (Jest, supertest) and `e2e/` (Playwright)

Look for patterns — how routes are registered, how the DB is accessed, how the client fetches data — and follow them exactly.

### Write the plan

Present a short plan to the user before touching any code. The plan should cover:

1. **What changes on the server** — new table columns, new endpoints, changes to existing endpoints
2. **What changes on the client** — new components, modified views, new fetch calls
3. **Unit tests** — what Jest tests will cover
4. **E2e tests** — what Playwright scenarios will exercise the feature end to end
5. **Anything you're unsure about** — ask the user to clarify before continuing

Wait for the user to confirm the plan or ask for changes before moving to Phase 2.

---

## Phase 2 — Implement

Follow the architecture in `CLAUDE.md`:
- Features live in `server/src/features/<feature-name>/` with a `*.router.ts` and `*.service.ts`
- Mount new routers in `server/src/app.ts`
- Schema changes go via `db.exec(CREATE TABLE IF NOT EXISTS …)` in the service's init function, called from `app.ts`
- DB calls use `db.run / db.get / db.all` from `shared/db.ts` with `$1, $2` placeholders
- Client components live in `client/src/`; follow existing import and styling patterns
- Phone numbers must be encrypted at rest (AES-256-GCM); never returned in public API responses

Write the minimum code that satisfies the story. No speculative features.

---

## Phase 3 — Test

Write tests **after** implementation so you know exactly what the code does. Tests should exercise real behaviour, not mock the database.

### Unit tests (Jest + supertest)

Place test files alongside the feature code: `server/src/features/<feature-name>/<feature>.test.ts`

Cover:
- Happy path — the normal case works
- Validation — bad input is rejected with the right status code
- Edge cases that the story implies (e.g. empty state, not found, auth required)

Run after writing:
```bash
cd server && npm test
```

Fix any failures before continuing.

### E2e tests (Playwright)

Place test files in `e2e/<feature-name>.spec.ts`.

Cover:
- The core user journey described in the story
- At least one screenshot saved to `e2e/screenshots/`
- Any error or empty-state scenario that a citizen or staff member would encounter

Run after writing:
```bash
npx playwright test e2e/<feature-name>.spec.ts
```

Fix any failures before continuing.

---

## Phase 4 — Refactor

Once all tests are green, look at everything you just wrote with fresh eyes. Ask:

- Is there any duplication that can be extracted into a shared helper?
- Are there any names (variables, functions, routes) that are unclear?
- Is any file doing too much? Could the router and service be split more cleanly?
- Are there any dead imports or unused variables?
- Could any complex conditional be simplified?

Make the improvements. Re-run both test suites after refactoring to confirm nothing broke:
```bash
cd server && npm test
npx playwright test e2e/<feature-name>.spec.ts
```

---

## Finishing up

Report back to the user with:
- A one-sentence summary of what was built
- The files that were created or modified
- Test results (pass counts for both Jest and Playwright)
- Any follow-on stories that this implementation unlocks or relates to

Mark the story as done by appending ` ✓` to its line in `docs/TODO.md`.
