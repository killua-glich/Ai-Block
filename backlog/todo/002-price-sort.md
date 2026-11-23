# 002 — Sort catalog by price

**Depends on:** 001
**Files:** `src/pages/Catalog.jsx`

## Goal

Let users sort devices by price per day.

## Acceptance criteria

- [ ] A second `<select>` next to the category filter: "Default", "Price: low to high", "Price: high to low"
- [ ] Sorting works together with the category filter
- [ ] The original `devices` array is not mutated (copy before sorting)
- [ ] `npm run build` passes

## Prompt

Paste this into the agent:

````text
Project: React 19 + Vite, plain JavaScript (.jsx). No TypeScript. No new npm packages.
Rules: only edit the files listed. Keep existing code style (function components, default exports, 2-space indent). Do not touch other tasks.

First: `git mv backlog/todo/002-price-sort.md backlog/in-progress/002-price-sort.md`.

Task: add price sorting to the device catalog. Task 001 (category filter) is already done.

Read first: `src/pages/Catalog.jsx`.
Edit: `src/pages/Catalog.jsx` only.

Steps:
1. Add state `const [sort, setSort] = useState('default')`.
2. Inside the existing `.filters` div, after the category select, add a second `<select>` with options:
   value "default" → "Default", value "asc" → "Price: low to high", value "desc" → "Price: high to low".
3. After the category filtering, sort a COPY: `const sorted = [...visible]`.
   If sort is 'asc': `sorted.sort((a, b) => a.pricePerDay - b.pricePerDay)`; if 'desc': `b.pricePerDay - a.pricePerDay`.
4. Render `sorted` in the grid. Keep the "No devices found." case working.
5. Never call `.sort()` directly on `devices` or `visible`.

When done:
- Run `npm run build`. If it fails, fix the error and run it again until it passes.
- Tick every checkbox in `backlog/in-progress/002-price-sort.md`, then `git mv backlog/in-progress/002-price-sort.md backlog/done/002-price-sort.md`.
- `git add -A && git commit -m "task 002: Sort catalog by price"`
If something is unclear or the build fails 3 times in a row: add a `## Notes` section to the task file explaining the problem and stop.
````
