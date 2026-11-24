# 015 — Styling: detail page with a big image area, a price tag and a sticky booking card

**Type:** styling
**Depends on:** 014
**Files:** `src/pages/DeviceDetail.jsx`, `src/index.css`

## Goal

The detail page shows a large gradient image area with the category icon, a gradient price tag, the specs as chips, and a booking card on the right that stays in view while you scroll.

## Acceptance criteria

- [ ] `.detail-media` (`aria-hidden`, `--hue`, holds `.detail-icon`) sits above the title inside `.detail-info`
- [ ] The price is `<p className="price price-tag">€25 / day</p>`, the specs `<ul className="specs">`
- [ ] `.detail-booking` holds the heading "Book this device" and the rental form; it is `position: sticky` on a wide screen
- [ ] Two columns (`2fr 1fr`); at `@media (max-width: 800px)` one column and the card is no longer sticky
- [ ] `.rental-form` fills its card (`width: 100%`, no `max-width`)
- [ ] `npm run verify -- 015` passes (tests: `tests/task-015*.test.*`)

## Hints

- The `h1` with the device name stays the only `h1` on the page.

## Prompt

Run `pi` (or `opencode`) in the repo root, then paste:

````text
Context: AGENTS.md (already loaded) has the stack, the conventions, the editing rules and a project map. Use it. Do NOT list or scan the project. Open only the files named below.
Rules: only change the files listed. Do not touch tests/. Never delete a CSS rule. Do not write files with heredocs. Never rewrite `src/index.css` as a whole: change it with the edit tool and exact text. Write each file only once; do not write the same file again and again.

First: `git mv backlog/todo/015-detail-page.md backlog/in-progress/015-detail-page.md`.

Task: The detail page shows a large gradient image area with the category icon, a gradient price tag, the specs as chips, and a booking card on the right that stays in view while you scroll.

Read first: `src/pages/DeviceDetail.jsx`, `src/index.css`.
Edit or create: `src/pages/DeviceDetail.jsx`, `src/index.css`.

Steps:
1. Write the complete file `src/pages/DeviceDetail.jsx` with the write tool, with exactly this content:
```jsx
import { useParams, Link } from 'react-router-dom'
import devices from '../data/devices.js'
import RentalForm from '../components/RentalForm.jsx'
import { formatEuro } from '../data/money.js'
import { categoryIcon, categoryHue } from '../data/categories.js'

export default function DeviceDetail() {
  const { id } = useParams()
  const device = devices.find((d) => d.id === Number(id))

  if (!device) {
    return <p>Device not found. <Link to="/">Back to catalog</Link></p>
  }

  return (
    <section>
      <Link to="/" className="back-link">← Back</Link>
      <div className="detail">
        <div className="detail-info">
          <div className="detail-media" style={{ '--hue': categoryHue(device.category) }} aria-hidden="true">
            <span className="detail-icon">{categoryIcon(device.category)}</span>
          </div>
          <h1>{device.name}</h1>
          <p className="category">
            {device.category}{' '}
            <span className={device.available ? 'badge badge-ok' : 'badge badge-no'}>
              {device.available ? 'Available' : 'Not available'}
            </span>
          </p>
          <p>{device.description}</p>
          <ul className="specs">
            {device.specs.map((spec) => (
              <li key={spec}>{spec}</li>
            ))}
          </ul>
          <p className="price price-tag">{formatEuro(device.pricePerDay)} / day</p>
        </div>
        <div className="detail-booking">
          <h2>Book this device</h2>
          <RentalForm device={device} />
        </div>
      </div>
    </section>
  )
}
```
2. Change `src/index.css` with ONE call of the edit tool that holds these 2 edits. Do NOT rewrite the whole file: a long file copied again and again picks up typos.
   For each edit, oldText must match the file exactly: copy it from here. If an edit fails, read the file once and correct oldText from what you read. Do not guess.
   Edit 1: replace this rule. oldText:
```css
.rental-form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: 300px;
}
```
   newText:
```css
.rental-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
}
```
   Edit 2: append the new rules after the last rule of the file. oldText:
```css
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
   newText:
```css
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

.back-link {
  display: inline-block;
  margin-bottom: 1.25rem;
  color: var(--color-muted);
  font-weight: 600;
}

.back-link:hover {
  color: var(--color-primary);
}

.detail {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2.5rem;
  align-items: start;
}

.detail-media {
  display: grid;
  place-items: center;
  aspect-ratio: 21 / 9;
  margin-bottom: 1.5rem;
  border-radius: var(--radius);
  background: linear-gradient(135deg, hsl(var(--hue) 85% 62%), hsl(calc(var(--hue) + 45) 85% 55%));
  box-shadow: var(--shadow);
}

.detail-icon {
  font-size: 5rem;
  filter: drop-shadow(0 10px 16px rgba(0, 0, 0, 0.25));
}

.price-tag {
  display: inline-block;
  padding: 0.4rem 1rem;
  border-radius: 999px;
  background: var(--gradient-brand);
  color: var(--color-on-primary);
  font-size: 1.1rem;
}

.detail-booking {
  position: sticky;
  top: 5.5rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 1.5rem;
}

.detail-booking h2 {
  margin: 0 0 1rem;
  font-size: 1.25rem;
}

.specs {
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  padding: 0;
  margin: 1.25rem 0;
}

.specs li {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 0.4rem 0.9rem;
  font-size: 0.9rem;
  box-shadow: var(--shadow-sm);
}

@media (max-width: 800px) {
  .detail {
    grid-template-columns: 1fr;
  }
  .detail-booking {
    position: static;
  }
}
```

When done:
- Run `npm run verify -- 015`. If it says FAIL: read the lines under FAIL, fix `src/`, and run it again. Repeat until the last line is `VERIFY PASSED`.
- NEVER edit files in `tests/`, `package.json` or files the task does not list.
- Tick the checkboxes with this one command: `sed -i '' 's/- \[ \]/- [x]/' backlog/in-progress/015-detail-page.md`, then `git mv backlog/in-progress/015-detail-page.md backlog/done/015-detail-page.md`.
- `git add -A && git commit -m "task 015: Detail page: media, price tag, sticky card"`
If something is unclear or verify fails 3 times in a row: add a `## Notes` section to the task file explaining the problem and stop.
````
