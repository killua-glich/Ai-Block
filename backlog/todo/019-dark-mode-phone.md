# 019 — Styling: dark mode and a layout that fits a phone

**Type:** styling
**Depends on:** 018
**Files:** `src/index.css`

## Goal

The site follows the system's dark mode with its own deep violet palette, and the header, hero, numbers and footer fit comfortably on a small screen.

## Acceptance criteria

- [ ] `:root` gets `color-scheme: light dark`
- [ ] `@media (prefers-color-scheme: dark)` overrides the background, surface, text, muted, border, disabled, primary and primary-hover colours and the three shadows, and nothing else (the status colours, the gradient and the radius stay)
- [ ] In the existing `@media (max-width: 600px)` block `.header`, `.nav a`, `.hero`, `.stats` and `.footer` get tighter spacing; there is still only one block with that query
- [ ] `npm run verify -- 019` passes (tests: `tests/task-019*.test.*`)

## Hints

- Add the new rules inside the existing phone block. Do not create a second block with the same query.

## Prompt

Run `pi` (or `opencode`) in the repo root, then paste:

````text
Context: AGENTS.md (already loaded) has the stack, the conventions, the editing rules and a project map. Use it. Do NOT list or scan the project. Open only the files named below.
Rules: only change the files listed. Do not touch tests/. Never delete a CSS rule. Do not write files with heredocs. Never rewrite `src/index.css` as a whole: change it with the edit tool and exact text. Write each file only once; do not write the same file again and again.

First: `git mv backlog/todo/019-dark-mode-phone.md backlog/in-progress/019-dark-mode-phone.md`.

Task: The site follows the system's dark mode with its own deep violet palette, and the header, hero, numbers and footer fit comfortably on a small screen.

Read first: `src/index.css`.
Edit or create: `src/index.css`.

Steps:
1. Change `src/index.css` with ONE call of the edit tool that holds these 3 edits. Do NOT rewrite the whole file: a long file copied again and again picks up typos.
   For each edit, oldText must match the file exactly: copy it from here. If an edit fails, read the file once and correct oldText from what you read. Do not guess.
   Edit 1: replace this rule. oldText:
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
```
   newText:
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
  color-scheme: light dark;
  --font-display: ui-rounded, "SF Pro Rounded", "Avenir Next", system-ui, sans-serif;
}
```
   Edit 2: replace this rule. oldText:
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
  .header {
    padding: 0.75rem 1rem;
  }
  .nav a {
    padding: 0.35rem 0.7rem;
  }
  .hero {
    padding: 1.5rem 1.25rem;
  }
  .stats {
    gap: 1.25rem;
  }
  .footer {
    padding: 1.25rem 1rem;
  }
}
```
   Edit 3: append the new rules after the last rule of the file. oldText:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```
   newText:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: #0d0b1f;
    --color-surface: #17142e;
    --color-text: #f0eeff;
    --color-muted: #a29fc8;
    --color-border: #2b2750;
    --color-disabled: #4a4670;
    --color-primary: #8b5cf6;
    --color-primary-hover: #7c3aed;
    --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.4);
    --shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
    --shadow-lg: 0 20px 40px rgba(0, 0, 0, 0.55);
  }
}
```

When done:
- Run `npm run verify -- 019`. If it says FAIL: read the lines under FAIL, fix `src/`, and run it again. Repeat until the last line is `VERIFY PASSED`.
- NEVER edit files in `tests/`, `package.json` or files the task does not list.
- Tick the checkboxes with this one command: `sed -i '' 's/- \[ \]/- [x]/' backlog/in-progress/019-dark-mode-phone.md`, then `git mv backlog/in-progress/019-dark-mode-phone.md backlog/done/019-dark-mode-phone.md`.
- `git add -A && git commit -m "task 019: Dark mode and phone layout"`
If something is unclear or verify fails 3 times in a row: add a `## Notes` section to the task file explaining the problem and stop.
````
