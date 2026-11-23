# 003 — Extend device data

**Depends on:** none
**Files:** `src/data/devices.js`, `src/pages/DeviceDetail.jsx`, `src/index.css`
**Agent:** `spark-dev` (Schema-bound data plus simple JSX, scored 1.00 on the data test.) Fallback: `gemma-dev`.

## Goal

Make devices richer so detail pages have real content.

## Acceptance criteria

- [ ] At least 10 devices, at least 5 categories
- [ ] Each device has: `id`, `name`, `category`, `pricePerDay`, `description`, `specs` (array of strings), `available` (boolean)
- [ ] Detail page shows specs as a list and an "Available" / "Not available" badge
- [ ] `npm run verify -- 003` passes (tests: `tests/task-003*.test.jsx`)

## Prompt

Run `opencode --agent spark-dev` in the repo root, then paste:

````text
Context: AGENTS.md (already loaded) has the stack, the conventions and a project map of every file. Use it. Do NOT list or scan the project, and do NOT call the explorer subagent. Open only the files named under "Read first", "Create" and "Edit" below.
Rules: only edit the files listed. Do not touch other tasks.

First: `git mv backlog/todo/003-more-device-data.md backlog/in-progress/003-more-device-data.md`.

Task: make the mock device data richer and show it on the detail page.

Read first: `src/data/devices.js`, `src/pages/DeviceDetail.jsx`.
Edit: `src/data/devices.js`, `src/pages/DeviceDetail.jsx`.

Steps:
1. In devices.js keep the 4 existing devices (same ids and names) and add more, so there are at least 10 devices in at least 5 categories (e.g. Laptop, Tablet, Phone, Camera, Audio, Gaming, Drone).
2. Every device object must have exactly these fields:
   `{ id: number, name: string, category: string, pricePerDay: number, description: string, specs: string[], available: boolean }`
   ids are 1, 2, 3, ... with no gaps. Give each device 3–5 short specs. Make at least 2 devices `available: false`.
3. In DeviceDetail.jsx, below the description, render the specs as `<ul>` with one `<li>` per spec (key = the spec string).
4. Next to the category, render `<span className={device.available ? 'badge badge-ok' : 'badge badge-no'}>` with text "Available" or "Not available".
5. Add `.badge`, `.badge-ok` (green), `.badge-no` (red) styles to `src/index.css` (small rounded pill, white text). This one extra file is allowed.

When done:
- Run `npm run verify -- 003`. It checks scope, lint, build and the tests in `tests/task-003*.test.jsx`.
- If it says FAIL: read the lines under FAIL, fix the code in `src/`, and run it again. Repeat until the last line is `VERIFY PASSED`.
- NEVER edit files in `tests/`, `package.json` or files the task does not list. The verify step catches that and fails.
- Tick every checkbox in `backlog/in-progress/003-more-device-data.md`, then `git mv backlog/in-progress/003-more-device-data.md backlog/done/003-more-device-data.md`.
- `git add -A && git commit -m "task 003: Extend device data"`
If something is unclear or verify fails 3 times in a row: add a `## Notes` section to the task file explaining the problem and stop.
````
