# 010 — Styling: a bold design system (colours, gradient, radius, shadows, fonts)

**Type:** styling
**Depends on:** 009
**Files:** `src/index.css`

## Goal

Put the whole look into CSS variables: a violet to pink brand gradient, softer colours, bigger rounded corners, layered shadows and a rounded display font for headings. Every existing rule uses them. All later styling tickets build on this.

## Acceptance criteria

- [ ] `:root` defines the colours (`--color-bg` ... `--color-danger`, plus `--color-accent` and `--color-highlight`), `--gradient-brand` (three colour stops), `--radius`, `--radius-sm`, three shadows and two fonts
- [ ] Every existing rule uses `var(...)` instead of a hex colour (only `:root` may contain hex colours)
- [ ] Headings (`h1, h2, h3`) use the display font with `letter-spacing: -0.02em`; `h1` has a fluid `clamp(...)` size
- [ ] `body` has `line-height: 1.5` and a soft glow in the background; `.card` uses the small shadow
- [ ] `npm run verify -- 010` passes (tests: `tests/task-010*.test.*`)

## Hints

- Every rule keeps its selector. The css check of `npm run verify` fails if a rule is deleted or defined twice.

## Prompt

Run `pi` (or `opencode`) in the repo root, then paste:

````text
Context: AGENTS.md (already loaded) has the stack, the conventions, the editing rules and a project map. Use it. Do NOT list or scan the project. Open only the files named below.
Rules: only change the files listed. Do not touch tests/. Never delete a CSS rule. Do not write files with heredocs.

First: `git mv backlog/todo/010-design-system.md backlog/in-progress/010-design-system.md`.

Task: Put the whole look into CSS variables: a violet to pink brand gradient, softer colours, bigger rounded corners, layered shadows and a rounded display font for headings. Every existing rule uses them. All later styling tickets build on this.

Read first: `src/index.css`.
Edit or create: `src/index.css`.

Steps:
1. Write the complete new `src/index.css` with the write tool, with exactly this content:
```css
:root {
  --color-bg: #f6f5ff;
  --color-surface: #fff;
  --color-text: #14122b;
  --color-muted: #6b6a8a;
  --color-border: #e4e2f5;
  --color-primary: #6d28d9;
  --color-primary-hover: #5b21b6;
  --color-accent: #ec4899;
  --color-highlight: #fde68a;
  --color-on-primary: #fff;
  --color-disabled: #b9b6d6;
  --color-success: #059669;
  --color-danger: #e11d48;
  --gradient-brand: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%);
  --radius: 16px;
  --radius-sm: 10px;
  --shadow-sm: 0 1px 2px rgba(20, 18, 43, 0.06);
  --shadow: 0 8px 24px rgba(76, 29, 149, 0.1);
  --shadow-lg: 0 20px 40px rgba(76, 29, 149, 0.18);
  --font-body: system-ui, -apple-system, "Segoe UI", sans-serif;
  --font-display: ui-rounded, "SF Pro Rounded", "Avenir Next", system-ui, sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: var(--font-body);
  line-height: 1.5;
  color: var(--color-text);
  background: radial-gradient(1000px 420px at 85% -80px, rgba(139, 92, 246, 0.16), transparent 70%), var(--color-bg);
}

h1, h2, h3 {
  font-family: var(--font-display);
  letter-spacing: -0.02em;
  line-height: 1.15;
}

h1 {
  margin: 0 0 0.5rem;
  font-size: clamp(2rem, 5vw, 3.25rem);
}

a {
  color: var(--color-primary);
  text-decoration: none;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.logo {
  font-weight: 800;
  font-size: 1.25rem;
  color: var(--color-text);
}

.container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 2rem;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1.5rem;
}

.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  padding: 1rem;
}

.category {
  color: var(--color-muted);
  font-size: 0.9rem;
}

.price {
  font-weight: 700;
}

button {
  padding: 0.6rem 1.2rem;
  border-radius: var(--radius-sm);
  border: none;
  background: var(--color-primary);
  color: var(--color-on-primary);
  cursor: pointer;
}

button:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

button:disabled {
  background: var(--color-disabled);
  cursor: not-allowed;
}

.filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.badge {
  display: inline-block;
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-on-primary);
  vertical-align: middle;
}

.badge-ok {
  background: var(--color-success);
}

.badge-no {
  background: var(--color-danger);
}

.error {
  color: var(--color-danger);
}

.rental-form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: 300px;
}

.success {
  color: var(--color-success);
}
```

When done:
- Run `npm run verify -- 010`. If it says FAIL: read the lines under FAIL, fix `src/`, and run it again. Repeat until the last line is `VERIFY PASSED`.
- NEVER edit files in `tests/`, `package.json` or files the task does not list.
- Tick the checkboxes with this one command: `sed -i '' 's/- \[ \]/- [x]/' backlog/in-progress/010-design-system.md`, then `git mv backlog/in-progress/010-design-system.md backlog/done/010-design-system.md`.
- `git add -A && git commit -m "task 010: Design system (CSS variables)"`
If something is unclear or verify fails 3 times in a row: add a `## Notes` section to the task file explaining the problem and stop.
````
