# 005 — Save rentals in localStorage

**Depends on:** 004
**Files:** `src/data/rentals.js` (new), `src/components/RentalForm.jsx`, `src/index.css`

## Goal

Clicking Rent stores the rental so it survives a page reload (no backend yet).

## Acceptance criteria

- [ ] `src/data/rentals.js` exports `getRentals()` and `addRental(rental)` using `localStorage` key `ai-block-rentals`
- [ ] A rental is `{ id, deviceId, startDate, endDate, totalPrice, createdAt }` (`id` from `crypto.randomUUID()`)
- [ ] Clicking Rent calls `addRental` and shows "Rental confirmed!"
- [ ] `npm run build` passes

## Prompt

Paste this into the agent:

````text
Project: React 19 + Vite, plain JavaScript (.jsx). No TypeScript. No new npm packages.
Rules: only edit the files listed. Keep existing code style (function components, default exports, 2-space indent). Do not touch other tasks.

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
- Run `npm run build`. If it fails, fix the error and run it again until it passes.
- Tick every checkbox in `backlog/in-progress/005-rentals-store.md`, then `git mv backlog/in-progress/005-rentals-store.md backlog/done/005-rentals-store.md`.
- `git add -A && git commit -m "task 005: Save rentals in localStorage"`
If something is unclear or the build fails 3 times in a row: add a `## Notes` section to the task file explaining the problem and stop.
````
