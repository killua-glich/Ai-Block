# 013 — Styling: cards with a coloured image area, a category icon, hover lift and entrance animation

**Type:** styling
**Depends on:** 012
**Files:** `src/data/categories.js` (new), `src/components/DeviceCard.jsx`, `src/index.css`

## Goal

Each device card gets an image area with a gradient in its category's colour and a big icon. Cards lift when you hover and fade in when the page loads.

## Acceptance criteria

- [ ] New `src/data/categories.js` exports `categoryIcon(category)` (a different emoji for each of the 7 categories, `📦` for unknown ones) and `categoryHue(category)` (a stable number from 0 to 359)
- [ ] A card is an `<article>` with `.card-media` (`aria-hidden`, custom property `--hue`, holds `.card-icon`) and `.card-body` (chip, name, price, badge, link)
- [ ] The card keeps: category in `.chip`, name in `h3`, price as one text `€25 / day`, the `badge`, a "View details" link; unavailable devices get `card-unavailable`
- [ ] `.card:hover` lifts the card (`translateY`) with the large shadow, and the icon tilts; `.card` fades in with `animation: rise` (`@keyframes rise` from opacity 0 to 1)
- [ ] `npm run verify -- 013` passes (tests: `tests/task-013*.test.*`)

## Hints

- The price line stays a single text node group like `{formatEuro(device.pricePerDay)} / day`: other tests read it.

## Prompt

Run `pi` (or `opencode`) in the repo root, then paste:

````text
Context: AGENTS.md (already loaded) has the stack, the conventions, the editing rules and a project map. Use it. Do NOT list or scan the project. Open only the files named below.
Rules: only change the files listed. Do not touch tests/. Never delete a CSS rule. Do not write files with heredocs. Never rewrite `src/index.css` as a whole: change it with the edit tool and exact text. Write each file only once; do not write the same file again and again.

First: `git mv backlog/todo/013-category-cards.md backlog/in-progress/013-category-cards.md`.

Task: Each device card gets an image area with a gradient in its category's colour and a big icon. Cards lift when you hover and fade in when the page loads.

Read first: `src/components/DeviceCard.jsx`, `src/index.css`.
Edit or create: `src/data/categories.js` (new), `src/components/DeviceCard.jsx`, `src/index.css`.

Steps:
1. Write the complete file `src/data/categories.js` with the write tool, with exactly this content:
```js
const ICONS = {
  Laptop: '💻',
  Tablet: '📲',
  Camera: '📷',
  Phone: '📱',
  Audio: '🎧',
  Gaming: '🎮',
  Drone: '🚁',
}

export function categoryIcon(category) {
  return ICONS[category] ?? '📦'
}

// A stable colour per category: the same name always gives the same hue.
// Only hues from 200 to 359 (blue to pink), so every card matches the violet brand.
export function categoryHue(category) {
  let sum = 0
  for (const ch of category) sum = (sum * 31 + ch.charCodeAt(0)) % 160
  return 200 + sum
}
```
2. Write the complete file `src/components/DeviceCard.jsx` with the write tool, with exactly this content:
```jsx
import { Link } from 'react-router-dom'
import { formatEuro } from '../data/money.js'
import { categoryIcon, categoryHue } from '../data/categories.js'

export default function DeviceCard({ device }) {
  return (
    <article className={device.available ? 'card' : 'card card-unavailable'}>
      <div className="card-media" style={{ '--hue': categoryHue(device.category) }} aria-hidden="true">
        <span className="card-icon">{categoryIcon(device.category)}</span>
      </div>
      <div className="card-body">
        <span className="chip">{device.category}</span>
        <h3>{device.name}</h3>
        <p className="price">{formatEuro(device.pricePerDay)} / day</p>
        <span className={device.available ? 'badge badge-ok' : 'badge badge-no'}>
          {device.available ? 'Available' : 'Not available'}
        </span>
        <Link to={`/devices/${device.id}`} className="view-link">View details</Link>
      </div>
    </article>
  )
}
```
3. Change `src/index.css` with FOUR separate edit calls, one after the other. Each call is small. Do NOT rewrite the whole file.
   Call 1. oldText:
```css
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  padding: 1rem;
}
```
   newText:
```css
.card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  transition: box-shadow 0.2s, transform 0.2s;
  animation: rise 0.45s ease both;
}
```
   Calls 2, 3 and 4 insert new rules BEFORE the `.visually-hidden` rule. The oldText is always the single line `.visually-hidden {` and the newText is the new rules, then an empty line, then `.visually-hidden {` again.
   Call 2. oldText:
```css
.visually-hidden {
```
   newText:
```css
.card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-4px);
}

.card-media {
  display: grid;
  place-items: center;
  aspect-ratio: 16 / 10;
  background: linear-gradient(135deg, hsl(var(--hue) 85% 62%), hsl(calc(var(--hue) + 45) 85% 55%));
}

.card-icon {
  font-size: 3.25rem;
  filter: drop-shadow(0 6px 10px rgba(0, 0, 0, 0.25));
  transition: transform 0.25s;
}

.card:hover .card-icon {
  transform: scale(1.12) rotate(-6deg);
}

.visually-hidden {
```
   Call 3. oldText:
```css
.visually-hidden {
```
   newText:
```css
.card-body {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  flex: 1;
  gap: 0.5rem;
  padding: 1.1rem 1.25rem 1.25rem;
}

.card h3 {
  margin: 0;
  font-size: 1.15rem;
}

.card-unavailable {
  opacity: 0.72;
}

.visually-hidden {
```
   Call 4. oldText:
```css
.visually-hidden {
```
   newText:
```css
.chip {
  display: inline-block;
  padding: 0.15rem 0.7rem;
  border-radius: 999px;
  background: var(--color-bg);
  color: var(--color-primary);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.view-link {
  margin-top: auto;
  font-weight: 700;
}

@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.visually-hidden {
```
   Do the calls in order, each one right after the last. If a call fails, read the file ONCE and fix oldText from what you read.

When done:
- Run `npm run verify -- 013`. If it says FAIL: read the lines under FAIL, fix `src/`, and run it again. Repeat until the last line is `VERIFY PASSED`.
- NEVER edit files in `tests/`, `package.json` or files the task does not list.
- Tick the checkboxes with this one command: `sed -i '' 's/- \[ \]/- [x]/' backlog/in-progress/013-category-cards.md`, then `git mv backlog/in-progress/013-category-cards.md backlog/done/013-category-cards.md`.
- `git add -A && git commit -m "task 013: Cards with icon media and animation"`
If something is unclear or verify fails 3 times in a row: add a `## Notes` section to the task file explaining the problem and stop.
````
