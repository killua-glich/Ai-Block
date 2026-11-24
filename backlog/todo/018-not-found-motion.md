# 018 — Styling: a 404 page with a gradient number, page fade and reduced motion

**Type:** styling
**Depends on:** 017
**Files:** `src/pages/NotFound.jsx`, `src/index.css`

## Goal

Unknown addresses show a huge gradient 404. Pages fade in when you switch between them, and people who ask their system for less motion get none.

## Acceptance criteria

- [ ] `NotFound.jsx`: `<section className="not-found">` with `<p className="not-found-code" aria-hidden="true">404</p>`, the `h1` "Page not found", `<p className="muted">...</p>` and the link "Back to devices"
- [ ] `.not-found-code` is filled with the brand gradient (`background-clip: text`, `color: transparent`) with a fluid `clamp(...)` size
- [ ] `.container` fades in (`animation: fade`, `@keyframes fade` from opacity 0 to 1)
- [ ] `@media (prefers-reduced-motion: reduce)` sets `animation-duration` and `transition-duration` to `0.01ms` for `*, *::before, *::after`
- [ ] `npm run verify -- 018` passes (tests: `tests/task-018*.test.*`)

## Hints

- `!important` is allowed inside the reduced-motion block, nowhere else.

## Prompt

Run `pi` (or `opencode`) in the repo root, then paste:

````text
Context: AGENTS.md (already loaded) has the stack, the conventions, the editing rules and a project map. Use it. Do NOT list or scan the project. Open only the files named below.
Rules: only change the files listed. Do not touch tests/. Never delete a CSS rule. Do not write files with heredocs. Never rewrite `src/index.css` as a whole: change it with the edit tool and exact text. Write each file only once; do not write the same file again and again.

First: `git mv backlog/todo/018-not-found-motion.md backlog/in-progress/018-not-found-motion.md`.

Task: Unknown addresses show a huge gradient 404. Pages fade in when you switch between them, and people who ask their system for less motion get none.

Read first: `src/pages/NotFound.jsx`, `src/index.css`.
Edit or create: `src/pages/NotFound.jsx`, `src/index.css`.

Steps:
1. Write the complete file `src/pages/NotFound.jsx` with the write tool, with exactly this content:
```jsx
import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <section className="not-found">
      <p className="not-found-code" aria-hidden="true">404</p>
      <h1>Page not found</h1>
      <p className="muted">The page you are looking for does not exist or has moved.</p>
      <Link to="/">Back to devices</Link>
    </section>
  )
}
```
2. Change `src/index.css` with ONE call of the edit tool that holds these 2 edits. Do NOT rewrite the whole file: a long file copied again and again picks up typos.
   For each edit, oldText must match the file exactly: copy it from here. If an edit fails, read the file once and correct oldText from what you read. Do not guess.
   Edit 1: replace this rule. oldText:
```css
.container {
  flex: 1;
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  padding: 2rem;
}
```
   newText:
```css
.container {
  flex: 1;
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  padding: 2rem;
  animation: fade 0.35s ease both;
}
```
   Edit 2: append the new rules after the last rule of the file. oldText:
```css
.muted {
  color: var(--color-muted);
}
```
   newText:
```css
.muted {
  color: var(--color-muted);
}

.not-found {
  padding: 3rem 1rem;
  text-align: center;
}

.not-found-code {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(5rem, 20vw, 10rem);
  font-weight: 900;
  line-height: 1;
  background: var(--gradient-brand);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

@keyframes fade {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

When done:
- Run `npm run verify -- 018`. If it says FAIL: read the lines under FAIL, fix `src/`, and run it again. Repeat until the last line is `VERIFY PASSED`.
- NEVER edit files in `tests/`, `package.json` or files the task does not list.
- Tick the checkboxes with this one command: `sed -i '' 's/- \[ \]/- [x]/' backlog/in-progress/018-not-found-motion.md`, then `git mv backlog/in-progress/018-not-found-motion.md backlog/done/018-not-found-motion.md`.
- `git add -A && git commit -m "task 018: 404 page, page fade, reduced motion"`
If something is unclear or verify fails 3 times in a row: add a `## Notes` section to the task file explaining the problem and stop.
````
