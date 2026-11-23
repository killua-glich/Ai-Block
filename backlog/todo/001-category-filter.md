# 001 — Category filter on catalog

**Depends on:** none
**Files:** `src/pages/Catalog.jsx`, `src/index.css`
**Agent:** `qwen-dev` (React component edit, scored 1.00 on the component test.) Fallback: `gemma-dev`.

## Goal

Let users filter the device list by category.

## Acceptance criteria

- [ ] A `<select>` above the grid with "All" plus every category found in `src/data/devices.js` (derived from data, not hard-coded)
- [ ] Choosing a category shows only devices of that category; "All" shows everything
- [ ] If no device matches, show "No devices found."
- [ ] `npm run build` passes

## Hints

- Use `useState` for the selected category.

## Prompt

Run `opencode --agent qwen-dev` in the repo root, then paste:

````text
Context: AGENTS.md (already loaded) has the stack, the conventions and a project map of every file. Use it. Do NOT list or scan the project, and do NOT call the explorer subagent. Open only the files named under "Read first", "Create" and "Edit" below.
Rules: only edit the files listed. Do not touch other tasks.

First: `git mv backlog/todo/001-category-filter.md backlog/in-progress/001-category-filter.md`.

Task: add a category filter to the device catalog.

Read first: `src/pages/Catalog.jsx`, `src/data/devices.js`.
Edit: `src/pages/Catalog.jsx`, `src/index.css`.

Steps:
1. In Catalog.jsx import `useState` from 'react'.
2. Build the category list from data: `const categories = ['All', ...new Set(devices.map((d) => d.category))]`.
3. Add state `const [category, setCategory] = useState('All')`.
4. Above the `.grid` div render a `<select>` with one `<option>` per category, value bound to `category`, onChange calls `setCategory(e.target.value)`.
5. Compute `const visible = category === 'All' ? devices : devices.filter((d) => d.category === category)` and map over `visible` instead of `devices`.
6. If `visible.length === 0` render `<p>No devices found.</p>` instead of the grid.
7. In index.css add a `.filters` class (flex, gap 1rem, margin-bottom 1rem) and wrap the select in `<div className="filters">`.

When done:
- Run `npm run build`. If it fails, fix the error and run it again until it passes.
- Tick every checkbox in `backlog/in-progress/001-category-filter.md`, then `git mv backlog/in-progress/001-category-filter.md backlog/done/001-category-filter.md`.
- `git add -A && git commit -m "task 001: Category filter on catalog"`
If something is unclear or the build fails 3 times in a row: add a `## Notes` section to the task file explaining the problem and stop.
````
