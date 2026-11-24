# 017 — Styling: My rentals with proper tables, status chips and an empty state

**Type:** styling
**Depends on:** 016
**Files:** `src/pages/MyRentals.jsx`, `src/index.css`

## Goal

The rentals page gets a heading, tables in a raised scrollable card with an icon per device and a coloured status chip, right-aligned totals, and a friendly empty state with a link back to the catalog.

## Acceptance criteria

- [ ] The page has an `h1` "My rentals", also in the empty state; the empty state is `<div className="empty-state">` with "You have no rentals yet." and a link "Browse devices" to `/`
- [ ] Each table is `<div className="table-wrap"><table className="table">` with the columns Device, From, To, Status, Total (`className="num"` on the Total `th` and `td`)
- [ ] Each row starts with `<span className="row-icon" aria-hidden="true">` (the category icon, `📦` for an unknown device) and shows the status as `chip chip-active` ("Active") or `chip chip-past` ("Past")
- [ ] An empty section shows `<p className="muted">None.</p>`; each `h2` stays directly in front of its table or that line
- [ ] `.table-wrap` scrolls sideways (`overflow-x: auto`); headers are small caps; rows highlight on hover; the last row has no bottom border
- [ ] `npm run verify -- 017` passes (tests: `tests/task-017*.test.*`)

## Hints

- The `.empty-state` style already exists from ticket 014: reuse it, do not define it again.

## Prompt

Run `pi` (or `opencode`) in the repo root, then paste:

````text
Context: AGENTS.md (already loaded) has the stack, the conventions, the editing rules and a project map. Use it. Do NOT list or scan the project. Open only the files named below.
Rules: only change the files listed. Do not touch tests/. Never delete a CSS rule. Do not write files with heredocs.

First: `git mv backlog/todo/017-my-rentals.md backlog/in-progress/017-my-rentals.md`.

Task: The rentals page gets a heading, tables in a raised scrollable card with an icon per device and a coloured status chip, right-aligned totals, and a friendly empty state with a link back to the catalog.

Read first: `src/pages/MyRentals.jsx`, `src/index.css`.
Edit or create: `src/pages/MyRentals.jsx`, `src/index.css`.

Steps:
1. Write the complete file `src/pages/MyRentals.jsx` with the write tool, with exactly this content:
```jsx
import { Link } from 'react-router-dom'
import { getRentals } from '../data/rentals.js'
import devices from '../data/devices.js'
import { formatEuro } from '../data/money.js'
import { categoryIcon } from '../data/categories.js'

export default function MyRentals() {
  const rentals = getRentals()
  const today = new Date().toISOString().slice(0, 10)
  const active = rentals.filter((r) => r.endDate >= today)
  const past = rentals.filter((r) => r.endDate < today)

  if (rentals.length === 0) {
    return (
      <section>
        <h1>My rentals</h1>
        <div className="empty-state">
          <p>You have no rentals yet.</p>
          <Link to="/">Browse devices</Link>
        </div>
      </section>
    )
  }

  const renderTable = (list, status) => (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Device</th>
            <th>From</th>
            <th>To</th>
            <th>Status</th>
            <th className="num">Total</th>
          </tr>
        </thead>
        <tbody>
          {list.map((r, i) => {
            const device = devices.find((d) => d.id === r.deviceId)
            return (
              <tr key={r.id ?? `${r.deviceId}-${r.startDate}-${r.endDate}-${i}`}>
                <td>
                  <span className="row-icon" aria-hidden="true">{device ? categoryIcon(device.category) : '📦'}</span>
                  {device?.name ?? 'Unknown device'}
                </td>
                <td>{r.startDate}</td>
                <td>{r.endDate}</td>
                <td>
                  <span className={status === 'active' ? 'chip chip-active' : 'chip chip-past'}>
                    {status === 'active' ? 'Active' : 'Past'}
                  </span>
                </td>
                <td className="num">{formatEuro(r.totalPrice)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )

  return (
    <section>
      <h1>My rentals</h1>
      <h2>Active</h2>
      {active.length === 0 ? <p className="muted">None.</p> : renderTable(active, 'active')}
      <h2>Past</h2>
      {past.length === 0 ? <p className="muted">None.</p> : renderTable(past, 'past')}
    </section>
  )
}
```
2. Write the complete new `src/index.css` with the write tool. Keep every existing rule, in the same order.
   a) Add these new rules at the END of the file, in this order:
```css
.table-wrap {
  overflow-x: auto;
  margin-bottom: 1.75rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
}

.table {
  width: 100%;
  min-width: 34rem;
  table-layout: fixed;
  border-collapse: collapse;
}

.table th, .table td {
  padding: 0.85rem 1.1rem;
  text-align: left;
  border-bottom: 1px solid var(--color-border);
}

.table th {
  font-size: 0.75rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-muted);
}

.table tbody tr:last-child td {
  border-bottom: none;
}

.table tbody tr:hover {
  background: var(--color-bg);
}

.table .num {
  text-align: right;
  font-weight: 700;
}

.row-icon {
  margin-right: 0.4rem;
}

.chip-active {
  background: color-mix(in srgb, var(--color-success) 16%, transparent);
  color: var(--color-success);
}

.chip-past {
  background: var(--color-bg);
  color: var(--color-muted);
}

.muted {
  color: var(--color-muted);
}
```

When done:
- Run `npm run verify -- 017`. If it says FAIL: read the lines under FAIL, fix `src/`, and run it again. Repeat until the last line is `VERIFY PASSED`.
- NEVER edit files in `tests/`, `package.json` or files the task does not list.
- Tick the checkboxes with this one command: `sed -i '' 's/- \[ \]/- [x]/' backlog/in-progress/017-my-rentals.md`, then `git mv backlog/in-progress/017-my-rentals.md backlog/done/017-my-rentals.md`.
- `git add -A && git commit -m "task 017: My rentals: tables and status chips"`
If something is unclear or verify fails 3 times in a row: add a `## Notes` section to the task file explaining the problem and stop.
````
