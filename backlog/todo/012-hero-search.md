# 012 — Styling and feature: a gradient hero with a live search

**Type:** styling
**Depends on:** 011
**Files:** `src/pages/Catalog.jsx`, `src/index.css`

## Goal

The catalog opens with a big gradient hero: a headline, a short text, a search box that filters devices by name while you type, and two numbers (devices and categories).

## Acceptance criteria

- [ ] The hero has an eyebrow line, an `h1` "Tech you need, without buying it" (the last words in `<span className="accent">`), a `.lead` text and `<ul className="stats">` with two items: the number of devices and the number of categories (each number in `<strong>`)
- [ ] A search box (`<input type="search">`) with a visually hidden label "Search devices" filters the devices by name, ignoring case, together with the category filter
- [ ] "No devices found." appears when nothing matches; clearing the box shows everything again
- [ ] `.hero` is a gradient banner (`var(--gradient-brand)`, white text, large shadow); the search input is a 100% wide pill; `.visually-hidden` hides the label but keeps it readable
- [ ] `npm run verify -- 012` passes (tests: `tests/task-012*.test.*`)

## Hints

- The category select must stay the first `<select>` and the sort select the second: older tests find them by position.

## Prompt

Run `pi` (or `opencode`) in the repo root, then paste:

````text
Context: AGENTS.md (already loaded) has the stack, the conventions, the editing rules and a project map. Use it. Do NOT list or scan the project. Open only the files named below.
Rules: only change the files listed. Do not touch tests/. Never delete a CSS rule. Do not write files with heredocs.

First: `git mv backlog/todo/012-hero-search.md backlog/in-progress/012-hero-search.md`.

Task: The catalog opens with a big gradient hero: a headline, a short text, a search box that filters devices by name while you type, and two numbers (devices and categories).

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
        <div className="filters">
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="default">Default</option>
            <option value="asc">Price: low to high</option>
            <option value="desc">Price: high to low</option>
          </select>
        </div>
        {visible.length === 0 ? (
          <p>No devices found.</p>
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
2. Write the complete new `src/index.css` with the write tool. Keep every existing rule, in the same order.
   a) Add these new rules at the END of the file, in this order:
```css
.hero {
  margin-bottom: 2.5rem;
  padding: clamp(1.75rem, 5vw, 3.5rem);
  border-radius: var(--radius);
  background: var(--gradient-brand);
  color: var(--color-on-primary);
  box-shadow: var(--shadow-lg);
}

.hero .accent {
  color: var(--color-highlight);
}

.eyebrow {
  margin: 0 0 0.75rem;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  opacity: 0.85;
}

.lead {
  max-width: 36rem;
  margin: 0 0 1.5rem;
  font-size: 1.1rem;
  opacity: 0.92;
}

.search {
  display: block;
  max-width: 32rem;
}

.search input {
  width: 100%;
  padding: 0.9rem 1.25rem;
  border: none;
  border-radius: 999px;
  font: inherit;
  color: var(--color-text);
  background: var(--color-surface);
  box-shadow: var(--shadow);
}

.stats {
  display: flex;
  gap: 2rem;
  margin: 1.75rem 0 0;
  padding: 0;
  list-style: none;
}

.stats li {
  font-size: 0.95rem;
  opacity: 0.9;
}

.stats strong {
  display: block;
  font-family: var(--font-display);
  font-size: 1.75rem;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

When done:
- Run `npm run verify -- 012`. If it says FAIL: read the lines under FAIL, fix `src/`, and run it again. Repeat until the last line is `VERIFY PASSED`.
- NEVER edit files in `tests/`, `package.json` or files the task does not list.
- Tick the checkboxes with this one command: `sed -i '' 's/- \[ \]/- [x]/' backlog/in-progress/012-hero-search.md`, then `git mv backlog/in-progress/012-hero-search.md backlog/done/012-hero-search.md`.
- `git add -A && git commit -m "task 012: Hero banner with live search"`
If something is unclear or verify fails 3 times in a row: add a `## Notes` section to the task file explaining the problem and stop.
````
