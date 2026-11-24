# 020 — Styling: a photo behind the catalog hero

**Type:** styling
**Depends on:** 019
**Files:** `src/pages/Catalog.jsx`, `src/index.css`

## Goal

The hero banner on the catalog page shows a product photo behind the headline. A dark violet overlay keeps the white text readable, and the brand gradient stays as a fallback if the photo is missing.

## Acceptance criteria

- [x] `Catalog.jsx`: the first child of `<section className="hero">` is `<img className="hero-image" src="/hero.png" alt="" aria-hidden="true" />`; everything else in the hero stays as it is
- [x] `.hero` gets `position: relative`, `overflow: hidden` and `isolation: isolate` and keeps its `background: var(--gradient-brand)`
- [x] `.hero-image` fills the hero behind the text: `position: absolute`, `inset: 0`, `z-index: -1`, `width: 100%`, `height: 100%`, `object-fit: cover`
- [x] `.hero::after` is a dark overlay: `content: ""`, `position: absolute`, `inset: 0`, `z-index: -1`, `pointer-events: none` and a `linear-gradient(...)` background
- [x] `npm run verify -- 020` passes (tests: `tests/task-020*.test.*`)

## Hints

- The file `public/hero.png` already exists (made with Qwen-Image). Do not create, move or change it. In the page it is addressed as `/hero.png`.
- Do not use `#` hex colours outside `:root`: write the overlay colour as `rgba(...)`.

## Prompt

Run `pi` (or `opencode`) in the repo root, then paste:

````text
Context: AGENTS.md (already loaded) has the stack, the conventions, the editing rules and a project map. Use it. Do NOT list or scan the project. Open only the files named below.
Rules: only change the files listed. Do not touch tests/. Never delete a CSS rule. Do not write files with heredocs. Never rewrite `src/index.css` as a whole: change it with the edit tool and exact text. Write each file only once; do not write the same file again and again.

First: `git mv backlog/todo/020-hero-photo.md backlog/in-progress/020-hero-photo.md`.

Task: The hero banner on the catalog page shows a product photo behind the headline. A dark violet overlay keeps the white text readable, and the brand gradient stays as a fallback if the photo is missing. The file `public/hero.png` already exists: do not touch it.

Read first: `src/pages/Catalog.jsx`, `src/index.css`.
Edit or create: `src/pages/Catalog.jsx`, `src/index.css`.

Steps:
1. Change `src/pages/Catalog.jsx` with ONE call of the edit tool (do not rewrite the file). oldText:
```jsx
      <section className="hero">
        <p className="eyebrow">Rent by the day</p>
```
   newText:
```jsx
      <section className="hero">
        <img className="hero-image" src="/hero.png" alt="" aria-hidden="true" />
        <p className="eyebrow">Rent by the day</p>
```
2. Change `src/index.css` with 2 SEPARATE edit calls, one after the other. Each call is small. Do NOT rewrite the whole file, and do NOT merge calls: a long edit can run past the output limit.
   For each call, oldText must match the file exactly: copy it from here. If a call fails, read the file once and correct oldText from what you read. Do not guess. Do the calls in order, each one right after the last.
   Call 1. oldText:
```css
.hero {
  margin-bottom: 2.5rem;
  padding: clamp(1.75rem, 5vw, 3.5rem);
  border-radius: var(--radius);
  background: var(--gradient-brand);
  color: var(--color-on-primary);
  box-shadow: var(--shadow-lg);
}
```
   newText:
```css
.hero {
  position: relative;
  overflow: hidden;
  isolation: isolate;
  margin-bottom: 2.5rem;
  padding: clamp(1.75rem, 5vw, 3.5rem);
  border-radius: var(--radius);
  background: var(--gradient-brand);
  color: var(--color-on-primary);
  box-shadow: var(--shadow-lg);
}
```
   Call 2. oldText:
```css
.hero .accent {
```
   newText:
```css
.hero-image {
  position: absolute;
  inset: 0;
  z-index: -1;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: right center;
}

.hero::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background: linear-gradient(90deg, rgba(24, 12, 64, 0.88) 0%, rgba(24, 12, 64, 0.55) 55%, rgba(24, 12, 64, 0.1) 100%);
}

.hero .accent {
```

When done:
- Run `npm run verify -- 020`. If it says FAIL: read the lines under FAIL, fix `src/`, and run it again. Repeat until the last line is `VERIFY PASSED`.
- NEVER edit files in `tests/`, `package.json` or files the task does not list.
- Tick the checkboxes with this one command: `sed -i '' 's/- \[ \]/- [x]/' backlog/in-progress/020-hero-photo.md`, then `git mv backlog/in-progress/020-hero-photo.md backlog/done/020-hero-photo.md`.
- `git add -A && git commit -m "task 020: Hero photo with overlay"`
If something is unclear or verify fails 3 times in a row: add a `## Notes` section to the task file explaining the problem and stop.
````
