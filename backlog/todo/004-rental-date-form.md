# 004 — Rental date form on detail page

**Depends on:** 003
**Files:** `src/pages/DeviceDetail.jsx`, `src/components/RentalForm.jsx` (new), `src/index.css`
**Agent:** `gemma-dev` (Date math. Gemma was the best at it and passed all daylight-saving cases in 1 of 2 runs; Qwen Coder is off by one, Spark gets stuck in a loop.) Fallback: split the task into smaller ones.

## Goal

Users pick a start and end date and see the total price.

## Acceptance criteria

- [ ] New `RentalForm` component with two `<input type="date">` fields
- [ ] Shows number of days and total price (`days * pricePerDay`)
- [ ] Error message if end date is before start date or start date is in the past
- [ ] Rent button enabled only when dates are valid and device is `available`
- [ ] `npm run build` passes

## Hints

- Days = difference in ms / 86 400 000, inclusive of both days (+1).

## Prompt

Run `opencode --agent gemma-dev` in the repo root, then paste:

````text
Context: AGENTS.md (already loaded) has the stack, the conventions and a project map of every file. Use it. Do NOT list or scan the project, and do NOT call the explorer subagent. Open only the files named under "Read first", "Create" and "Edit" below.
Rules: only edit the files listed. Do not touch other tasks.

First: `git mv backlog/todo/004-rental-date-form.md backlog/in-progress/004-rental-date-form.md`.

Task: create a rental form where the user picks dates and sees the total price.

Read first: `src/pages/DeviceDetail.jsx`, `src/data/devices.js` (device has `pricePerDay` and `available`).
Create: `src/components/RentalForm.jsx`. Edit: `src/pages/DeviceDetail.jsx`, `src/index.css`.

Steps:
1. RentalForm is a default-exported function component with props `{ device }`.
2. State: `startDate` and `endDate`, both strings, initial `''`.
3. Two `<input type="date">` fields labelled "Start date" and "End date".
4. Compute (no extra state):
   - `today = new Date().toISOString().slice(0, 10)`
   - error: if startDate && startDate < today → "Start date cannot be in the past."; else if both set and endDate < startDate → "End date must be after start date."
   - days = both set and no error ? `Math.round((new Date(endDate) - new Date(startDate)) / 86400000) + 1` : 0
   - total = days * device.pricePerDay
5. Show the error in `<p className="error">` if any. If days > 0 show "{days} day(s) — total CHF {total}".
6. A `<button>` "Rent" that is `disabled` unless days > 0 and device.available. onClick does nothing yet (task 005).
7. If `!device.available` show "This device is currently not available."
8. In DeviceDetail.jsx remove the old disabled "Rent (coming soon)" button and render `<RentalForm device={device} />` instead.
9. In index.css add `.error { color: #dc2626; }` and simple spacing for the form (`.rental-form` with flex column, gap 0.5rem, max-width 300px).

When done:
- Run `npm run build`. If it fails, fix the error and run it again until it passes.
- Tick every checkbox in `backlog/in-progress/004-rental-date-form.md`, then `git mv backlog/in-progress/004-rental-date-form.md backlog/done/004-rental-date-form.md`.
- `git add -A && git commit -m "task 004: Rental date form on detail page"`
If something is unclear or the build fails 3 times in a row: add a `## Notes` section to the task file explaining the problem and stop.
````
