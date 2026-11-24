# 016 — Styling: gradient buttons, a price summary, date fields, focus ring and a success alert

**Type:** styling
**Depends on:** 015
**Files:** `src/components/RentalForm.jsx`, `src/index.css`

## Goal

Buttons get the brand gradient and react to hover and press. The rental form shows a summary box with the days and a big total, date fields look like the selects, keyboard focus gets a soft ring, and the confirmation is a green alert.

## Acceptance criteria

- [x] Once both dates are valid, `<div className="summary">` shows `<p className="summary-days">5 day(s)</p>` and `<p className="summary-total">total €125</p>` (replacing the old one-line text)
- [x] The confirmation is `<p className="success" role="status">Rental confirmed!</p>`
- [x] `button` has the gradient as `background-image`; hover lifts it with a shadow; `button:active:not(:disabled)` moves it down; disabled buttons have `background-image: none`; `.button-ghost` stays flat
- [x] `:focus-visible` has a soft outline in the primary colour; `input[type="date"]` looks like `select`; `.rental-form label` is small caps; `.rental-form button` stretches
- [x] `.success` is a tinted alert; `.summary` has a dashed border and a large total in the display font
- [x] `npm run verify -- 016` passes (tests: `tests/task-016*.test.*`)

## Hints

- Keep the texts "Rent", "Rental confirmed!" and "This device is currently not available." exactly: older tests read them.

## Prompt

Run `pi` (or `opencode`) in the repo root, then paste:

````text
Context: AGENTS.md (already loaded) has the stack, the conventions, the editing rules and a project map. Use it. Do NOT list or scan the project. Open only the files named below.
Rules: only change the files listed. Do not touch tests/. Never delete a CSS rule. Do not write files with heredocs. Never rewrite `src/index.css` as a whole: change it with the edit tool and exact text. Write each file only once; do not write the same file again and again.

First: `git mv backlog/todo/016-forms-buttons.md backlog/in-progress/016-forms-buttons.md`.

Task: Buttons get the brand gradient and react to hover and press. The rental form shows a summary box with the days and a big total, date fields look like the selects, keyboard focus gets a soft ring, and the confirmation is a green alert.

Read first: `src/components/RentalForm.jsx`, `src/index.css`.
Edit or create: `src/components/RentalForm.jsx`, `src/index.css`.

Steps:
1. Write the complete file `src/components/RentalForm.jsx` with the write tool, with exactly this content:
```jsx
import { useState } from 'react'
import { addRental } from '../data/rentals.js'
import { formatEuro } from '../data/money.js'

export default function RentalForm({ device }) {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [confirmed, setConfirmed] = useState(false)

  const today = new Date().toISOString().slice(0, 10)

  let error = ''
  if (startDate && startDate < today) {
    error = 'Start date cannot be in the past.'
  } else if (startDate && endDate && endDate < startDate) {
    error = 'End date must be after start date.'
  }

  const days = startDate && endDate && !error ? Math.round((new Date(endDate) - new Date(startDate)) / 86400000) + 1 : 0
  const total = days * device.pricePerDay

  function handleRent() {
    addRental({ id: crypto.randomUUID(), deviceId: device.id, startDate, endDate, totalPrice: total, createdAt: new Date().toISOString() })
    setConfirmed(true)
    setStartDate('')
    setEndDate('')
  }

  return (
    <div className="rental-form">
      <label>
        Start date{' '}
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
      </label>
      <label>
        End date{' '}
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
      </label>
      {error && <p className="error">{error}</p>}
      {days > 0 && (
        <div className="summary">
          <p className="summary-days">{days} day(s)</p>
          <p className="summary-total">total {formatEuro(total)}</p>
        </div>
      )}
      <button type="button" disabled={!(days > 0 && device.available)} onClick={handleRent}>
        Rent
      </button>
      {!device.available && <p>This device is currently not available.</p>}
      {confirmed && <p className="success" role="status">Rental confirmed!</p>}
    </div>
  )
}
```
2. Change `src/index.css` with 9 SEPARATE edit calls, one after the other. Each call is small. Do NOT rewrite the whole file, and do NOT merge calls: a long edit can run past the output limit.
   For each call, oldText must match the file exactly: copy it from here. If a call fails, read the file once and correct oldText from what you read. Do not guess. Do the calls in order, each one right after the last.
   Call 1. oldText:
```css
button {
  padding: 0.6rem 1.2rem;
  border-radius: var(--radius-sm);
  border: none;
  background: var(--color-primary);
  color: var(--color-on-primary);
  cursor: pointer;
}
```
   newText:
```css
button {
  padding: 0.7rem 1.4rem;
  border-radius: var(--radius-sm);
  border: none;
  background: var(--color-primary);
  background-image: var(--gradient-brand);
  color: var(--color-on-primary);
  font: inherit;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s, filter 0.15s;
}
```
   Call 2. oldText:
```css
button:hover:not(:disabled) {
  background: var(--color-primary-hover);
}
```
   newText:
```css
button:hover:not(:disabled) {
  background: var(--color-primary-hover);
  box-shadow: var(--shadow);
  filter: brightness(1.06);
  transform: translateY(-1px);
}
```
   Call 3. oldText:
```css
button:disabled {
  background: var(--color-disabled);
  cursor: not-allowed;
}
```
   newText:
```css
button:disabled {
  background: var(--color-disabled);
  background-image: none;
  cursor: not-allowed;
}
```
   Call 4. oldText:
```css
.button-ghost {
  background: transparent;
  color: var(--color-primary);
  border: 1px solid var(--color-border);
}
```
   newText:
```css
.button-ghost {
  background: transparent;
  background-image: none;
  color: var(--color-primary);
  border: 1px solid var(--color-border);
}
```
   Call 5. oldText:
```css
.error {
  color: var(--color-danger);
}
```
   newText:
```css
.error {
  color: var(--color-danger);
  font-weight: 600;
}
```
   Call 6. oldText:
```css
.success {
  color: var(--color-success);
}
```
   newText:
```css
.success {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--color-success) 14%, transparent);
  color: var(--color-success);
  font-weight: 700;
}
```
   Call 7. oldText:
```css
@media (max-width: 800px) {
  .detail {
    grid-template-columns: 1fr;
  }
  .detail-booking {
    position: static;
  }
}
```
   newText:
```css
@media (max-width: 800px) {
  .detail {
    grid-template-columns: 1fr;
  }
  .detail-booking {
    position: static;
  }
}

button:active:not(:disabled) {
  transform: translateY(1px);
}

:focus-visible {
  outline: 3px solid color-mix(in srgb, var(--color-primary) 45%, transparent);
  outline-offset: 2px;
}

input[type="date"] {
  font: inherit;
  padding: 0.6rem 0.9rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-text);
}
```
   Call 8. oldText:
```css
input[type="date"] {
  font: inherit;
  padding: 0.6rem 0.9rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-text);
}
```
   newText:
```css
input[type="date"] {
  font: inherit;
  padding: 0.6rem 0.9rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-text);
}

.rental-form label {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-muted);
}

.rental-form button {
  align-self: stretch;
}
```
   Call 9. oldText:
```css
.rental-form button {
  align-self: stretch;
}
```
   newText:
```css
.rental-form button {
  align-self: stretch;
}

.summary {
  padding: 1rem 1.25rem;
  border-radius: var(--radius-sm);
  background: var(--color-bg);
  border: 1px dashed var(--color-border);
}

.summary-days {
  margin: 0;
  color: var(--color-muted);
}

.summary-total {
  margin: 0.25rem 0 0;
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 800;
}
```

When done:
- Run `npm run verify -- 016`. If it says FAIL: read the lines under FAIL, fix `src/`, and run it again. Repeat until the last line is `VERIFY PASSED`.
- NEVER edit files in `tests/`, `package.json` or files the task does not list.
- Tick the checkboxes with this one command: `sed -i '' 's/- \[ \]/- [x]/' backlog/in-progress/016-forms-buttons.md`, then `git mv backlog/in-progress/016-forms-buttons.md backlog/done/016-forms-buttons.md`.
- `git add -A && git commit -m "task 016: Buttons, summary, forms, focus"`
If something is unclear or verify fails 3 times in a row: add a `## Notes` section to the task file explaining the problem and stop.
````
