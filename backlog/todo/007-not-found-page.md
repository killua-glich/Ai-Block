# 007 — 404 page

**Depends on:** none
**Files:** `src/pages/NotFound.jsx` (new), `src/App.jsx`

## Goal

Unknown URLs show a friendly page instead of a blank screen.

## Acceptance criteria

- [ ] Catch-all route `path="*"` renders `NotFound`
- [ ] Page says "Page not found" with a link back to `/`
- [ ] `npm run build` passes

## Prompt

Paste this into the agent:

````text
Project: React 19 + Vite, plain JavaScript (.jsx). No TypeScript. No new npm packages.
Rules: only edit the files listed. Keep existing code style (function components, default exports, 2-space indent). Do not touch other tasks.

First: `git mv backlog/todo/007-not-found-page.md backlog/in-progress/007-not-found-page.md`.

Task: show a "Page not found" page for unknown URLs.

Read first: `src/App.jsx`.
Create: `src/pages/NotFound.jsx`. Edit: `src/App.jsx`.

Steps:
1. NotFound.jsx: default-exported component returning a `<section>` with `<h1>Page not found</h1>` and `<Link to="/">Back to devices</Link>` (import Link from 'react-router-dom').
2. App.jsx: import NotFound and add `<Route path="*" element={<NotFound />} />` as the LAST route inside `<Routes>`.

When done:
- Run `npm run build`. If it fails, fix the error and run it again until it passes.
- Tick every checkbox in `backlog/in-progress/007-not-found-page.md`, then `git mv backlog/in-progress/007-not-found-page.md backlog/done/007-not-found-page.md`.
- `git add -A && git commit -m "task 007: 404 page"`
If something is unclear or the build fails 3 times in a row: add a `## Notes` section to the task file explaining the problem and stop.
````
