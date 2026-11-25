# 026 — API: list and create rentals

**Type:** feature
**Depends on:** 025
**Files:** `server/app.js`

## Goal

Add the rental routes to `server/app.js`: `GET /api/rentals` lists the rentals, `POST /api/rentals` creates one. Errors answer with the right status and a JSON message.

## Acceptance criteria

- [x] `GET /api/rentals` answers the list from `listRentals`
- [x] `POST /api/rentals` takes `{ deviceId, startDate, endDate }`, calls `createRental` and answers status 201 with the saved rental; the client cannot choose the price, the id or the time stamp
- [x] A `RentalError` answers with its own status and `{ "error": message }`: 400, 404 or 409
- [x] Broken JSON in the request answers 400 with an `{ "error": ... }` body; any other unexpected error answers 500 with `{ "error": "Something went wrong" }`
- [x] `npm run verify -- 026` passes (tests: `tests/task-026*.test.*`)

## Hints

- Express 5 passes an error thrown inside a route to the error handler for you: no try/catch needed in the routes.
- An error handler is a function with four arguments `(err, req, res, next)`, added with `app.use` after the routes.
- The broken-JSON error from `express.json()` already carries `err.status` 400.

## Prompt

Run `pi` (or `opencode`) in the repo root, then paste:

````text
Context: AGENTS.md (already loaded) has the stack, the conventions, the editing rules and a project map. Use it. Do NOT list or scan the project. Open only the files named below.
Rules: only change the files listed. Do not touch tests/. Do not write files with heredocs. Write each file only once; do not write the same file again and again.

First: `git mv backlog/todo/026-api-rentals.md backlog/in-progress/026-api-rentals.md`. (If it says the file is not there, it is already moved: go on.)

Task: Add the rental routes to `server/app.js`: `GET /api/rentals` lists the rentals, `POST /api/rentals` creates one. Errors answer with the right status and a JSON message.

Read first: `server/app.js`, `server/rentals.js`.
Edit or create: `server/app.js`.

Steps:
1. Change `server/app.js` with 3 SEPARATE edit calls, one after the other. Each call is small. Do NOT rewrite the whole file, and do NOT merge calls: a long edit can run past the output limit.
   For each call, oldText must match the file exactly: copy it from here. If a call fails, read the file once and correct oldText from what you read. Do not guess. Do the calls in order, each one right after the last.
   Call 1. oldText:
```js
import { listDevices, getDevice } from './devices.js'

```
   newText:
```js
import { listDevices, getDevice } from './devices.js'
import { listRentals, createRental, RentalError } from './rentals.js'

```
   Call 2. oldText:
```js
  app.use('/api', (req, res) => {

```
   newText:
```js
  app.get('/api/rentals', (req, res) => {
    res.json(listRentals(db))
  })

  app.post('/api/rentals', (req, res) => {
    const rental = createRental(db, req.body)
    res.status(201).json(rental)
  })

  app.use('/api', (req, res) => {

```
   Call 3. oldText:
```js
  return app

```
   newText:
```js
  app.use((err, req, res, next) => {
    if (err instanceof RentalError || err.status) {
      return res.status(err.status).json({ error: err.message })
    }
    console.error(err)
    res.status(500).json({ error: 'Something went wrong' })
  })

  return app

```

When done:
- Run `npm run verify -- 026`. If it says FAIL: read the lines under FAIL, fix the files, and run it again. Repeat until the last line is `VERIFY PASSED`.
- NEVER edit files in `tests/`, `package.json` or files the task does not list.
- Tick the checkboxes with this one command: `sed -i '' 's/- \[ \]/- [x]/' backlog/in-progress/026-api-rentals.md`, then `git mv backlog/in-progress/026-api-rentals.md backlog/done/026-api-rentals.md`.
- `git add -A && git commit -m "task 026: API routes for rentals"`
If something is unclear or verify fails 3 times in a row: add a `## Notes` section to the task file explaining the problem and stop.
````
