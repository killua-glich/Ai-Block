# 007 — 404 page

**Depends on:** none
**Files:** `src/pages/NotFound.jsx` (new), `src/App.jsx`

## Goal

Unknown URLs show a friendly page instead of a blank screen.

## Acceptance criteria

- [ ] Catch-all route `path="*"` renders `NotFound`
- [ ] Page says "Page not found" with a link back to `/`
- [ ] `npm run verify -- 007` passes (tests: `tests/task-007*.test.jsx`)

## Prompt

Run `opencode` in the repo root (default agent `gemma-dev`), then paste:

````text
Context: AGENTS.md (already loaded) has the stack, the conventions and a project map of every file. Use it. Do NOT list or scan the project, and do NOT call the explorer subagent. Open only the files named under "Read first", "Create" and "Edit" below.
Rules: only edit the files listed. Do not touch other tasks.

First: `git mv backlog/todo/007-not-found-page.md backlog/in-progress/007-not-found-page.md`.

Task: show a "Page not found" page for unknown URLs.

Read first: `src/App.jsx`.
Create: `src/pages/NotFound.jsx`. Edit: `src/App.jsx`.

Steps:
1. NotFound.jsx: default-exported component returning a `<section>` with `<h1>Page not found</h1>` and `<Link to="/">Back to devices</Link>` (import Link from 'react-router-dom').
2. App.jsx: import NotFound and add `<Route path="*" element={<NotFound />} />` as the LAST route inside `<Routes>`.

When done:
- Run `npm run verify -- 007`. It checks scope, lint, build and the tests in `tests/task-007*.test.jsx`.
- If it says FAIL: read the lines under FAIL, fix the code in `src/`, and run it again. Repeat until the last line is `VERIFY PASSED`.
- NEVER edit files in `tests/`, `package.json` or files the task does not list. The verify step catches that and fails.
- Tick every checkbox in `backlog/in-progress/007-not-found-page.md`, then `git mv backlog/in-progress/007-not-found-page.md backlog/done/007-not-found-page.md`.
- `git add -A && git commit -m "task 007: 404 page"`
If something is unclear or verify fails 3 times in a row: add a `## Notes` section to the task file explaining the problem and stop.
````
