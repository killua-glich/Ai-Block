# 005 — Save rentals in localStorage

**Depends on:** 004
**Files:** `src/data/rentals.js` (new), `src/components/RentalForm.jsx`, `src/index.css`

## Goal

Clicking Rent stores the rental so it survives a page reload (no backend yet).

## Acceptance criteria

- [ ] `src/data/rentals.js` exports `getRentals()` and `addRental(rental)` using `localStorage` key `ai-block-rentals`
- [ ] A rental is `{ id, deviceId, startDate, endDate, totalPrice, createdAt }` (`id` from `crypto.randomUUID()`)
- [ ] Clicking Rent calls `addRental` and shows "Rental confirmed!"
- [ ] `npm run verify -- 005` passes (tests: `tests/task-005*.test.jsx`)

## Prompt

Run `opencode` in the repo root (default agent `gemma-dev`), then paste:

````text
Context: AGENTS.md (already loaded) has the stack, the conventions and a project map of every file. Use it. Do NOT list or scan the project, and do NOT call the explorer subagent. Open only the files named under "Read first", "Create" and "Edit" below.
Rules: only edit the files listed. Do not touch other tasks.

First: `git mv backlog/todo/005-rentals-store.md backlog/in-progress/005-rentals-store.md`.

Task: save rentals in the browser's localStorage when the user clicks Rent.

Read first: `src/components/RentalForm.jsx`.
Create: `src/data/rentals.js`. Edit: `src/components/RentalForm.jsx`.

Steps:
1. In `src/data/rentals.js` write exactly this API:
   ```js
   const KEY = 'ai-block-rentals'
   export function getRentals() {
     try { return JSON.parse(localStorage.getItem(KEY)) || [] } catch { return [] }
   }
   export function addRental(rental) {
     const rentals = getRentals()
     rentals.push(rental)
     localStorage.setItem(KEY, JSON.stringify(rentals))
   }
   ```
2. In RentalForm.jsx import `addRental` and add state `confirmed` (boolean, initial false).
3. Rent button onClick: call `addRental({ id: crypto.randomUUID(), deviceId: device.id, startDate, endDate, totalPrice: total, createdAt: new Date().toISOString() })`, then `setConfirmed(true)`.
4. When `confirmed` is true show `<p className="success">Rental confirmed!</p>` and reset both dates to `''`.
5. Add `.success { color: #16a34a; }` to `src/index.css` (allowed).

When done:
- Run `npm run verify -- 005`. It checks scope, lint, build and the tests in `tests/task-005*.test.jsx`.
- If it says FAIL: read the lines under FAIL, fix the code in `src/`, and run it again. Repeat until the last line is `VERIFY PASSED`.
- NEVER edit files in `tests/`, `package.json` or files the task does not list. The verify step catches that and fails.
- Tick every checkbox in `backlog/in-progress/005-rentals-store.md`, then `git mv backlog/in-progress/005-rentals-store.md backlog/done/005-rentals-store.md`.
- `git add -A && git commit -m "task 005: Save rentals in localStorage"`
If something is unclear or verify fails 3 times in a row: add a `## Notes` section to the task file explaining the problem and stop.
````
