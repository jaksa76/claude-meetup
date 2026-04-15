---
name: implement
description: Implements the next user story from docs/TODO.md — plans, codes, tests, refactors, documents, marks the story done, and commits. Invoke as /implement or /implement <story-id> to target a specific story.
argument-hint: <story-id>
---

# Implement Next User Story

This skill picks the **first unchecked user story** from `docs/TODO.md`, implements it end-to-end, marks it done, and commits via Trunk Based Development.

If `$ARGUMENTS` is provided it is treated as a story ID (e.g. `0003`) and that specific story is targeted instead of the first one.

---

## Phase 0 — Pick the Story

1. Read `docs/TODO.md`.
2. If `$ARGUMENTS` is non-empty, find the line whose ID matches; otherwise take the topmost line that is **not** prefixed with `~~` (struck-through = done).
3. Print the selected story.
4. Also read `docs/ARCHITECTURE.md` and `docs/REQUIREMENTS.md` to build context.

---

## Phase 1 — Plan

1. Explore the codebase to understand what already exists that is relevant to this story:
   - Use Glob / Grep to find files related to the story's domain.
   - Read the most relevant files (routes, services, components, tests).
2. Produce a concise implementation plan:
   - What files will be created or modified?
   - What are the acceptance criteria?
   - Are there any risks or dependencies?

---

## Phase 2 — Implement

when ready, proceed with the implementation.

1. Implement backend changes first (routes → service → DB migration if needed), then frontend.
2. Follow the conventions already present in the codebase (TypeScript, file naming, folder structure, error handling patterns).
3. Keep changes minimal and focused on the story — do not refactor unrelated code.
4. Use TaskCreate/TaskUpdate to track sub-steps as you go.

---

## Phase 3 — Test

1. Write or update tests that cover the new behaviour:
   - Unit tests for service logic.
   - Integration / API tests for new routes.
   - Component / UI tests where the story touches the frontend.
2. Run the test suite (`npm test` or equivalent) and confirm all tests pass.
3. If tests fail, fix the implementation (not the tests) and re-run.

---

## Phase 4 — Refactor

1. Review your own changes with fresh eyes:
   - Remove dead code, magic strings, and unnecessary duplication.
   - Ensure naming is clear and consistent with the rest of the codebase.
   - Check for obvious security issues (SQL injection, missing auth guards, unvalidated input).
2. Run linting / type-checking (`npm run lint`, `tsc --noEmit`) and fix any issues.

---

## Phase 5 — Documentation

Update documentation only where it adds real value:
- Add or update inline comments for non-obvious logic.
- Update `docs/ARCHITECTURE.md` if the story introduced a new route, service, or significant pattern.
- Do **not** create new documentation files unless explicitly required by the story.

---

## Phase 6 — Mark Done & Commit

1. In `docs/TODO.md`, wrap the completed story line with strikethrough: `~~0001 - As a ...~~`.
2. Stage all changed files inlcudeing `docs/TODO.md` (be specific — avoid `git add .` if sensitive files might be present).
3. Commit with a concise message
4. Push the changes if there is a remote repository.

---

## Guardrails

- Never commit without passing tests and lint.