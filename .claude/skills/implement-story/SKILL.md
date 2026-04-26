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

If the user gave you a story number (e.g. `0003`) or a description, find it in `docs/TODO.md`. Read the full file to understand neighbouring stories and avoid duplicate work. Otherwise take the first unimplemented story in the `docs/TODO.md` backlog.

### Read the codebase

Before writing a single line, understand what already exists. Read:
- `CLAUDE.md` for architecture and conventions
- `server/src/app.ts` and any relevant feature routers/services
- `client/src/App.tsx` and related components
- Existing tests in `server/src/` (Jest, supertest) and `e2e/` (Playwright)

### Write the plan

Make a plan before touching any code. The plan should cover:

1. **What changes on the server** — new table columns, new endpoints, changes to existing endpoints
2. **What changes on the client** — new components, modified views, new fetch calls
3. **Unit tests** — what Jest tests will cover
4. **E2e tests** — what Playwright scenarios will exercise the feature end to end
5. **Anything you're unsure about** — ask the user to clarify before continuing

---

## Phase 2 — Implement and Test

Follow the architecture in `CLAUDE.md`:
- Features live in `server/src/features/<feature-name>/` with a `*.router.ts` and `*.service.ts`
- Mount new routers in `server/src/app.ts`
- Schema changes go via `db.exec(CREATE TABLE IF NOT EXISTS …)` in the service's init function, called from `app.ts`
- DB calls use `db.run / db.get / db.all` from `shared/db.ts` with `$1, $2` placeholders
- Client components live in `client/src/`; follow existing import and styling patterns
- Phone numbers must be encrypted at rest (AES-256-GCM); never returned in public API responses

Write the minimum code that satisfies the story. No speculative features.

Write tests as you write the implementation so you know exactly what the code does. Tests should exercise real behaviour, not mock the database.

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

---

## Phase 3 — E2e tests (Playwright)

Place test files in `e2e/<feature-name>.spec.ts`.

Cover:
- The core user journey described in the story
- At least one screenshot saved to `e2e/screenshots/`
- Any error or empty-state scenario that a citizen or staff member would encounter
- use the e2e tests to take screenshots
- look at the screenshot of the happy path test and ask yourself: does this look good? If not, improve the implementation and re-run the tests until it does

Run after writing:
```bash
npx playwright test e2e/<feature-name>.spec.ts
```

Fix any failures before continuing.

---

## Phase 4 — Refactor

Once all tests are green, look at everything you just wrote with fresh eyes (use subagent). Ask:

- Is any file doing too much or some functionality spread across too many files? Could the router and service be split more cleanly?
- Are there any dead imports or unused variables?
- Could any complex mechanism be simplified?
- Is there any other technical debt in the touched files that you can fix while you're here?
- Are there any security flaws?

Make the improvements. Re-run both test suites after refactoring to confirm nothing broke:
```bash
cd server && npm test
npx playwright test e2e/<feature-name>.spec.ts
```

---

## Phase 5 - Document

- update `docs/TODO.md` to mark the story as implemented (append `✓` to the line)
- update `docs/ARCHITECTURE.md` if you added any new architectural patterns or conventions
- update `CLAUDE.md` if you added any useul tips or reminders for future implementers

---

## Phase 6 - Commit and Push

- Commit with a short message like `user profile page` and push to the main branch.

---

## Finishing up

Report back to the user with:
- A one-sentence summary of what was built
- The files that were created or modified
- Test results (pass counts for both Jest and Playwright)
