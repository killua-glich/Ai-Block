# 003 — Extend device data

**Depends on:** none
**Files:** `src/data/devices.js`, `src/pages/DeviceDetail.jsx`, `src/index.css`

## Goal

Make devices richer so detail pages have real content.

## Acceptance criteria

- [ ] At least 10 devices, at least 5 categories
- [ ] Each device has: `id`, `name`, `category`, `pricePerDay`, `description`, `specs` (array of strings), `available` (boolean)
- [ ] Detail page shows specs as a list and an "Available" / "Not available" badge
- [ ] `npm run build` passes

## Prompt

Paste this into the agent:

````text
Project: React 19 + Vite, plain JavaScript (.jsx). No TypeScript. No new npm packages.
Rules: only edit the files listed. Keep existing code style (function components, default exports, 2-space indent). Do not touch other tasks.

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
- Run `npm run build`. If it fails, fix the error and run it again until it passes.
- Tick every checkbox in `backlog/in-progress/003-more-device-data.md`, then `git mv backlog/in-progress/003-more-device-data.md backlog/done/003-more-device-data.md`.
- `git add -A && git commit -m "task 003: Extend device data"`
If something is unclear or the build fails 3 times in a row: add a `## Notes` section to the task file explaining the problem and stop.
````
