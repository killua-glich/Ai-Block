# 006 — "My rentals" page

**Depends on:** 005
**Files:** `src/pages/MyRentals.jsx` (new), `src/App.jsx`, `src/components/Header.jsx`
**Agent:** `gemma-dev` (Three files plus date comparison logic.) Fallback: split the task into smaller ones.

## Goal

Users see their rentals in one place.

## Acceptance criteria

- [ ] Route `/rentals` renders `MyRentals`
- [ ] Header has a "My rentals" link
- [ ] Table/list with device name, dates, total price; split into "Active" (end date >= today) and "Past"
- [ ] Empty state: "You have no rentals yet."
- [ ] `npm run verify -- 006` passes (tests: `tests/task-006*.test.jsx`)

## Prompt

Run `opencode --agent gemma-dev` in the repo root, then paste:

````text
Context: AGENTS.md (already loaded) has the stack, the conventions and a project map of every file. Use it. Do NOT list or scan the project, and do NOT call the explorer subagent. Open only the files named under "Read first", "Create" and "Edit" below.
Rules: only edit the files listed. Do not touch other tasks.

First: `git mv backlog/todo/006-my-rentals-page.md backlog/in-progress/006-my-rentals-page.md`.

Task: add a "My rentals" page that lists saved rentals.

Read first: `src/App.jsx`, `src/components/Header.jsx`, `src/data/rentals.js`, `src/data/devices.js`.
Create: `src/pages/MyRentals.jsx`. Edit: `src/App.jsx`, `src/components/Header.jsx`.

Steps:
1. MyRentals.jsx: default-exported component. `const rentals = getRentals()` (import from '../data/rentals.js'). Import `devices` too.
2. `const today = new Date().toISOString().slice(0, 10)`. Split: `active = rentals.filter((r) => r.endDate >= today)`, `past = rentals.filter((r) => r.endDate < today)`.
3. If `rentals.length === 0` render `<p>You have no rentals yet.</p>`.
4. Otherwise render `<h2>Active</h2>` and `<h2>Past</h2>`, each DIRECTLY followed by a `<table>` (no wrapper element in between) with columns Device, From, To, Total.
   Device name = `devices.find((d) => d.id === r.deviceId)?.name ?? 'Unknown device'`. Total shown as "CHF {r.totalPrice}". If a section is empty, show "None." instead of the table.
5. App.jsx: import MyRentals and add `<Route path="/rentals" element={<MyRentals />} />`.
6. Header.jsx: add `<Link to="/rentals">My rentals</Link>` after the Devices link inside `<nav>`. Add a gap between links via inline style or existing CSS.

When done:
- Run `npm run verify -- 006`. It checks scope, lint, build and the tests in `tests/task-006*.test.jsx`.
- If it says FAIL: read the lines under FAIL, fix the code in `src/`, and run it again. Repeat until the last line is `VERIFY PASSED`.
- NEVER edit files in `tests/`, `package.json` or files the task does not list. The verify step catches that and fails.
- Tick every checkbox in `backlog/in-progress/006-my-rentals-page.md`, then `git mv backlog/in-progress/006-my-rentals-page.md backlog/done/006-my-rentals-page.md`.
- `git add -A && git commit -m "task 006: My rentals page"`
If something is unclear or verify fails 3 times in a row: add a `## Notes` section to the task file explaining the problem and stop.
````
