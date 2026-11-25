# 027 — Server: the entry point and the Vite proxy

**Type:** feature
**Depends on:** 026
**Files:** `server/index.js` (new), `vite.config.js`

## Goal

A new file `server/index.js` opens the database file, puts the devices in on the first start, and starts the API. In development the Vite server forwards `/api` requests to it.

## Acceptance criteria

- [x] `server/index.js` exports `startServer({ port = 3001, dbPath = 'data/ai-block.db' })`: it creates the database folder if needed, opens the database, seeds the devices, starts listening and returns `{ server, db }`
- [x] Run directly (`npm run server`) it starts on `process.env.PORT` or 3001, using `process.env.DB_PATH` or `data/ai-block.db`
- [x] Starting again with the same database file keeps the rentals and does not add the devices twice
- [x] `vite.config.js` has `server.proxy` sending `/api` to `http://127.0.0.1:3001`
- [x] `npm run verify -- 027` passes (tests: `tests/task-027*.test.*`)

## Hints

- The `data/` folder is already in `.gitignore`, and `npm run server` already exists in `package.json`. Do not change either.
- `import.meta.filename === process.argv[1]` is true only when the file is started directly, not when a test imports it.
- To try it by hand: `npm run server` in one terminal and `npm run dev` in another.

## Prompt

Run `pi` (or `opencode`) in the repo root, then paste:

````text
Context: AGENTS.md (already loaded) has the stack, the conventions, the editing rules and a project map. Use it. Do NOT list or scan the project. Open only the files named below.
Rules: only change the files listed. Do not touch tests/. Do not write files with heredocs. Write each file only once; do not write the same file again and again.

First: `git mv backlog/todo/027-server-entry.md backlog/in-progress/027-server-entry.md`. (If it says the file is not there, it is already moved: go on.)

Task: A new file `server/index.js` opens the database file, puts the devices in on the first start, and starts the API. In development the Vite server forwards `/api` requests to it.

Read first: `vite.config.js`.
Edit or create: `server/index.js` (new), `vite.config.js`.

Steps:
1. Write the complete file `server/index.js` with the write tool, with exactly this content:
```js
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { openDb } from './db.js'
import { seedDevices } from './seed.js'
import { createApp } from './app.js'
import devices from '../src/data/devices.js'

// Opens the database, puts the devices in when it is empty, and starts listening.
export function startServer({ port = 3001, dbPath = 'data/ai-block.db' } = {}) {
  if (dbPath !== ':memory:') mkdirSync(dirname(dbPath), { recursive: true })
  const db = openDb(dbPath)
  seedDevices(db, devices)
  const server = createApp(db).listen(port)
  return { server, db }
}

// `npm run server` runs this file directly.
if (import.meta.filename === process.argv[1]) {
  const port = Number(process.env.PORT) || 3001
  startServer({ port, dbPath: process.env.DB_PATH || 'data/ai-block.db' })
  console.log(`API on http://localhost:${port}`)
}
```
2. Change `vite.config.js` with ONE call of the edit tool (do not rewrite the file). oldText:
```js
  plugins: [react()],

```
   newText:
```js
  plugins: [react()],
  server: {
    proxy: { '/api': 'http://127.0.0.1:3001' },
  },

```

When done:
- Run `npm run verify -- 027`. If it says FAIL: read the lines under FAIL, fix the files, and run it again. Repeat until the last line is `VERIFY PASSED`.
- NEVER edit files in `tests/`, `package.json` or files the task does not list.
- Tick the checkboxes with this one command: `sed -i '' 's/- \[ \]/- [x]/' backlog/in-progress/027-server-entry.md`, then `git mv backlog/in-progress/027-server-entry.md backlog/done/027-server-entry.md`.
- `git add -A && git commit -m "task 027: Server entry point and Vite proxy"`
If something is unclear or verify fails 3 times in a row: add a `## Notes` section to the task file explaining the problem and stop.
````
