# 014 — Styling and feature: a toolbar with labelled filters, a result count and a reset button

**Type:** styling
**Depends on:** 013
**Files:** `src/pages/Catalog.jsx`, `src/index.css`

## Goal

The filters live in a raised toolbar with small-caps labels. The page says how many devices match, and a Reset button clears search, category and sorting in one click.

## Acceptance criteria

- [ ] The two selects are inside `<label>`s ("Category", "Sort by") in `<div className="toolbar">`
- [ ] `<p className="result-count">` shows "N devices" ("1 device" for one) and follows the filters
- [ ] A "Reset filters" button (`className="button-ghost"`) is shown only while the search, the category or the sorting is changed; clicking it resets all three
- [ ] The empty result is `<div className="empty-state"><p>No devices found.</p></div>` with a dashed border
- [ ] On a phone (`@media (max-width: 600px)`) the toolbar and the filters stack in a column
- [ ] `npm run verify -- 014` passes (tests: `tests/task-014*.test.*`)

## Hints

- Keep the order of the two selects and their options. Older tests find them by position.

## Prompt

Run `pi` (or `opencode`) in the repo root, then paste:

````text
Context: AGENTS.md (already loaded) has the stack, the conventions, the editing rules and a project map. Use it. Do NOT list or scan the project. Open only the files named below.
Rules: only change the files listed. Do not touch tests/. Never delete a CSS rule. Do not write files with heredocs. Never rewrite `src/index.css` as a whole: change it with the edit tool and exact text. Write each file only once; do not write the same file again and again.

First: `git mv backlog/todo/014-catalog-toolbar.md backlog/in-progress/014-catalog-toolbar.md`.

Task: The filters live in a raised toolbar with small-caps labels. The page says how many devices match, and a Reset button clears search, category and sorting in one click.

Read first: `src/pages/Catalog.jsx`, `src/index.css`.
Edit or create: `src/pages/Catalog.jsx`, `src/index.css`.

Steps:
1. Write the complete file `src/pages/Catalog.jsx` with the write tool, with exactly this content:
```jsx
import { useState } from 'react'
import devices from '../data/devices.js'
import DeviceCard from '../components/DeviceCard.jsx'

export default function Catalog() {
  const categories = ['All', ...new Set(devices.map((d) => d.category))]
  const [category, setCategory] = useState('All')
  const [sort, setSort] = useState('default')
  const [query, setQuery] = useState('')

  const needle = query.trim().toLowerCase()
  const visible = devices
    .filter((d) => category === 'All' || d.category === category)
    .filter((d) => d.name.toLowerCase().includes(needle))

  const sorted = [...visible].sort((a, b) => {
    if (sort === 'asc') return a.pricePerDay - b.pricePerDay
    if (sort === 'desc') return b.pricePerDay - a.pricePerDay
    return 0
  })
  const hasFilters = category !== 'All' || sort !== 'default' || query !== ''

  function resetFilters() {
    setCategory('All')
    setSort('default')
    setQuery('')
  }

  return (
    <>
      <section className="hero">
        <p className="eyebrow">Rent by the day</p>
        <h1>Tech you need, <span className="accent">without buying it</span></h1>
        <p className="lead">Laptops, cameras, drones and more. Pick a device, pick your dates, done.</p>
        <label className="search">
          <span className="visually-hidden">Search devices</span>
          <input
            type="search"
            placeholder="Search devices, e.g. MacBook"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <ul className="stats">
          <li><strong>{devices.length}</strong> devices</li>
          <li><strong>{categories.length - 1}</strong> categories</li>
        </ul>
      </section>
      <section>
        <div className="toolbar">
          <div className="filters">
            <label>
              Category
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </label>
            <label>
              Sort by
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="default">Default</option>
                <option value="asc">Price: low to high</option>
                <option value="desc">Price: high to low</option>
              </select>
            </label>
          </div>
          <div className="toolbar-end">
            <p className="result-count">{sorted.length === 1 ? '1 device' : `${sorted.length} devices`}</p>
            {hasFilters && (
              <button type="button" className="button-ghost" onClick={resetFilters}>Reset filters</button>
            )}
          </div>
        </div>
        {visible.length === 0 ? (
          <div className="empty-state">
            <p>No devices found.</p>
          </div>
        ) : (
          <div className="grid">
            {sorted.map((device) => (
              <DeviceCard key={device.id} device={device} />
            ))}
          </div>
        )}
      </section>
    </>
  )
}
```
2. Change `src/index.css` with ONE call of the edit tool that holds these 2 edits. Do NOT rewrite the whole file: a long file copied again and again picks up typos.
   For each edit, oldText must match the file exactly: copy it from here. If an edit fails, read the file once and correct oldText from what you read. Do not guess.
   Edit 1: replace this rule. oldText:
```css
.filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}
```
   newText:
```css
.filters {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 1rem;
}
```
   Edit 2: append the new rules after the last rule of the file. oldText:
```css
@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```
   newText:
```css
@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-end;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1rem 1.25rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
}

.toolbar-end {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.filters label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-muted);
}

select {
  font: inherit;
  text-transform: none;
  letter-spacing: normal;
  padding: 0.55rem 0.9rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-text);
}

.result-count {
  margin: 0;
  font-weight: 600;
  color: var(--color-muted);
}

.button-ghost {
  background: transparent;
  color: var(--color-primary);
  border: 1px solid var(--color-border);
}

.button-ghost:hover:not(:disabled) {
  background: var(--color-bg);
}

.empty-state {
  padding: 2.5rem 1.5rem;
  text-align: center;
  background: var(--color-surface);
  border: 2px dashed var(--color-border);
  border-radius: var(--radius);
  color: var(--color-muted);
}

@media (max-width: 600px) {
  .container {
    padding: 1rem;
  }
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  .filters {
    flex-direction: column;
    align-items: stretch;
  }
}
```

When done:
- Run `npm run verify -- 014`. If it says FAIL: read the lines under FAIL, fix `src/`, and run it again. Repeat until the last line is `VERIFY PASSED`.
- NEVER edit files in `tests/`, `package.json` or files the task does not list.
- Tick the checkboxes with this one command: `sed -i '' 's/- \[ \]/- [x]/' backlog/in-progress/014-catalog-toolbar.md`, then `git mv backlog/in-progress/014-catalog-toolbar.md backlog/done/014-catalog-toolbar.md`.
- `git add -A && git commit -m "task 014: Catalog toolbar and reset button"`
If something is unclear or verify fails 3 times in a row: add a `## Notes` section to the task file explaining the problem and stop.
````
