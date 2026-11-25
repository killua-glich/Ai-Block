# 025 — API: health check and device routes

**Type:** feature
**Depends on:** 024
**Files:** `server/app.js` (new)

## Goal

A new file `server/app.js` builds the Express app with three routes: a health check, the list of devices and one device. Everything under `/api` answers JSON.

## Acceptance criteria

- [ ] `server/app.js` exports `createApp(db)`: it returns an Express app that reads JSON request bodies
- [ ] `GET /api/health` answers `{ "ok": true }`
- [ ] `GET /api/devices` answers the list from `listDevices`; `GET /api/devices/:id` answers one device, or 404 with `{ "error": "Device not found" }` (also when the id is not a number)
- [ ] Any other address under `/api` answers 404 with `{ "error": "Not found" }` as JSON
- [ ] `npm run verify -- 025` passes (tests: `tests/task-025*.test.*`)

## Hints

- `tests/server-world.js` (already there) starts the app on a free port for the test. Do not change it.
- Express 5 is installed. `import express from 'express'`, then `express()` makes the app.
- `Number('abc')` is `NaN`; `getDevice` finds nothing for it and returns `null`, so the 404 comes for free.

## Prompt

Run `pi` (or `opencode`) in the repo root, then paste:

````text
Context: AGENTS.md (already loaded) has the stack, the conventions, the editing rules and a project map. Use it. Do NOT list or scan the project. Open only the files named below.
Rules: only change the files listed. Do not touch tests/. Do not write files with heredocs. Write each file only once; do not write the same file again and again.

First: `git mv backlog/todo/025-api-devices.md backlog/in-progress/025-api-devices.md`. (If it says the file is not there, it is already moved: go on.)

Task: A new file `server/app.js` builds the Express app with three routes: a health check, the list of devices and one device. Everything under `/api` answers JSON.

Read first: `server/devices.js`.
Edit or create: `server/app.js` (new).

Steps:
1. Write the complete file `server/app.js` with the write tool, with exactly this content:
```js
import express from 'express'
import { listDevices, getDevice } from './devices.js'

export function createApp(db) {
  const app = express()
  app.use(express.json())

  app.get('/api/health', (req, res) => {
    res.json({ ok: true })
  })

  app.get('/api/devices', (req, res) => {
    res.json(listDevices(db))
  })

  app.get('/api/devices/:id', (req, res) => {
    const device = getDevice(db, Number(req.params.id))
    if (!device) return res.status(404).json({ error: 'Device not found' })
    res.json(device)
  })

  app.use('/api', (req, res) => {
    res.status(404).json({ error: 'Not found' })
  })

  return app
}
```

When done:
- Run `npm run verify -- 025`. If it says FAIL: read the lines under FAIL, fix the files, and run it again. Repeat until the last line is `VERIFY PASSED`.
- NEVER edit files in `tests/`, `package.json` or files the task does not list.
- Tick the checkboxes with this one command: `sed -i '' 's/- \[ \]/- [x]/' backlog/in-progress/025-api-devices.md`, then `git mv backlog/in-progress/025-api-devices.md backlog/done/025-api-devices.md`.
- `git add -A && git commit -m "task 025: API routes for health and devices"`
If something is unclear or verify fails 3 times in a row: add a `## Notes` section to the task file explaining the problem and stop.
````
