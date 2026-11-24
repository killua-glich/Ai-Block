# 009 — Bug: prices are in CHF, they must be in euros

**Type:** bug
**Depends on:** none
**Files:** `src/data/money.js` (new), `src/components/DeviceCard.jsx`, `src/pages/DeviceDetail.jsx`, `src/components/RentalForm.jsx`, `src/pages/MyRentals.jsx`, `AGENTS.md`

## Bug

Every price is shown as `CHF 25`. The shop is in euros. Prices appear in four places: the catalog cards, the device detail page, the total in the rental form and the "My rentals" table. The rule in `AGENTS.md` ("Prices in CHF") is wrong too, so future tasks would repeat the mistake.

## Acceptance criteria

- [ ] New `src/data/money.js` exports `formatEuro(amount)`: whole amounts as `€25`, other amounts with two decimals as `€12.50`
- [ ] Catalog cards and the detail page show `€25 / day`
- [ ] The rental form shows `{days} day(s) — total €125`
- [ ] "My rentals" shows the total as `€111`
- [ ] No `CHF` is left in `src/` or in `AGENTS.md`, and `AGENTS.md` says "Prices in euros"
- [ ] `npm run verify -- 009` passes (tests: `tests/task-009*.test.jsx`)

## Hints

- One helper for the format, so changing the currency later is a one-line change.
- The amount is a number. Do not format it as text before calling `formatEuro`.

## Prompt

Run `pi` (or `opencode`) in the repo root, then paste:

````text
Context: AGENTS.md (already loaded) has the stack, the conventions, the editing rules and a project map of every file. Use it. Do NOT list or scan the project. Open only the files named below.
Rules: only change the files listed. Do not touch tests/.

First: `git mv backlog/todo/009-euro-currency.md backlog/in-progress/009-euro-currency.md`.

Task: show every price in euros instead of Swiss francs (CHF).

Read first: `src/components/DeviceCard.jsx`, `src/pages/DeviceDetail.jsx`, `src/components/RentalForm.jsx`, `src/pages/MyRentals.jsx`.
Create: `src/data/money.js`. Edit: those four files and `AGENTS.md`.

Steps:
1. Create `src/data/money.js` with the write tool, with exactly this content:
export function formatEuro(amount) {
  return Number.isInteger(amount) ? `€${amount}` : `€${amount.toFixed(2)}`
}
2. In each of the four files, add this import line at the top, after the other imports: `import { formatEuro } from '../data/money.js'`
3. Make these one-line replacements (use the edit tool with the exact old text):
   - `src/components/DeviceCard.jsx`: `CHF {device.pricePerDay} / day` becomes `{formatEuro(device.pricePerDay)} / day`
   - `src/pages/DeviceDetail.jsx`: `CHF {device.pricePerDay} / day` becomes `{formatEuro(device.pricePerDay)} / day`
   - `src/components/RentalForm.jsx`: `total CHF {total}` becomes `total {formatEuro(total)}`
   - `src/pages/MyRentals.jsx`: `CHF {r.totalPrice}` becomes `{formatEuro(r.totalPrice)}`
4. In `AGENTS.md` change the line `- Prices in CHF, dates as ...` so it starts with `- Prices in euros (always use formatEuro from src/data/money.js), dates as ...` and keep the rest of the line.

When done:
- Run `npm run verify -- 009`. If it says FAIL: read the lines under FAIL, fix `src/`, and run it again. Repeat until the last line is `VERIFY PASSED`.
- NEVER edit files in `tests/`, `package.json` or files the task does not list.
- Tick the checkboxes with this one command: `sed -i '' 's/- \[ \]/- [x]/' backlog/in-progress/009-euro-currency.md`, then `git mv backlog/in-progress/009-euro-currency.md backlog/done/009-euro-currency.md`.
- `git add -A && git commit -m "task 009: Show prices in euros"`
If something is unclear or verify fails 3 times in a row: add a `## Notes` section to the task file explaining the problem and stop.
````
