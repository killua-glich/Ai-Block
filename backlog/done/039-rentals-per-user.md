# 039 — API: rentals belong to the logged-in user

**Type:** feature
**Depends on:** 038
**Files:** `server/rentals.js`, `server/app.js`

## Goal

Renting needs a login, and a rental belongs to the user who made it. The list of rentals shows only your own.

## Acceptance criteria

- [x] `toRental` also gives `userId`; `createRental(db, input, today, userId = null)` saves the owner and the rental it returns has `userId` too
- [x] `listRentals(db, { userId } = {})` gives only the rentals of that user when `userId` is given, and all of them when it is not
- [x] `GET /api/rentals` and `POST /api/rentals` use `requireUser` (401 without a login); `GET` answers only the rentals of the logged-in user; `POST` saves the logged-in user as the owner
- [x] Booking rules do not change: two users still cannot book the same device on the same days
- [x] `npm run verify -- 039` passes (tests: `tests/task-039*.test.*`)

## Hints

- In the route, pass `undefined` as the `today` argument so that the default (the real date) is used: `createRental(db, req.body, undefined, req.user.id)`.
- Import `requireUser` from `./auth.js`: add it to the import line that already exists in `server/app.js`.
- Both the rental that `createRental` returns and the ones from `listRentals` must have the same fields.

## Prompt

Run `pi` (or `opencode`) in the repo root, then paste:

````text
Context: AGENTS.md (already loaded) has the stack, the conventions, the editing rules and a project map. Use it. Do NOT list or scan the project. Open only the files named below.
Rules: only change the files listed. Do not touch tests/. Do not write files with heredocs. Write each file only once; do not write the same file again and again.

First: `git mv backlog/todo/039-rentals-per-user.md backlog/in-progress/039-rentals-per-user.md`. (If it says the file is not there, it is already moved: go on.)

Task: Renting needs a login, and a rental belongs to the user who made it. The list of rentals shows only your own.

Read first: `server/rentals.js`, `server/app.js`.
Edit or create: `server/rentals.js`, `server/app.js`.

Steps:
1. Change `server/rentals.js` with 5 SEPARATE edit calls, one after the other. Each call is small. Do NOT rewrite the whole file, and do NOT merge calls: a long edit can run past the output limit.
   For each call, oldText must match the file exactly: copy it from here. If a call fails, read the file once and correct oldText from what you read. Do not guess. Do the calls in order, each one right after the last.
   Call 1. oldText:
```js
    createdAt: row.created_at,
    status: row.status,

```
   newText:
```js
    createdAt: row.created_at,
    status: row.status,
    userId: row.user_id,

```
   Call 2. oldText:
```js
export function listRentals(db) {
  return db.prepare('SELECT * FROM rentals ORDER BY created_at, id').all().map(toRental)
}

```
   newText:
```js
export function listRentals(db, { userId } = {}) {
  const rows =
    userId === undefined
      ? db.prepare('SELECT * FROM rentals ORDER BY created_at, id').all()
      : db.prepare('SELECT * FROM rentals WHERE user_id = ? ORDER BY created_at, id').all(userId)
  return rows.map(toRental)
}

```
   Call 3. oldText:
```js
export function createRental(db, input, today = new Date().toISOString().slice(0, 10)) {

```
   newText:
```js
export function createRental(db, input, today = new Date().toISOString().slice(0, 10), userId = null) {

```
   Call 4. oldText:
```js
    status: 'active',
  }

```
   newText:
```js
    status: 'active',
    userId,
  }

```
   Call 5. oldText:
```js
  db.prepare(
    'INSERT INTO rentals (id, device_id, start_date, end_date, total_price, created_at) VALUES (?, ?, ?, ?, ?, ?)',
  ).run(rental.id, rental.deviceId, rental.startDate, rental.endDate, rental.totalPrice, rental.createdAt)

```
   newText:
```js
  db.prepare(
    'INSERT INTO rentals (id, device_id, start_date, end_date, total_price, created_at, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
  ).run(rental.id, rental.deviceId, rental.startDate, rental.endDate, rental.totalPrice, rental.createdAt, userId)

```
2. Change `server/app.js` with 3 SEPARATE edit calls, one after the other. Each call is small. Do NOT rewrite the whole file, and do NOT merge calls: a long edit can run past the output limit.
   For each call, oldText must match the file exactly: copy it from here. If a call fails, read the file once and correct oldText from what you read. Do not guess. Do the calls in order, each one right after the last.
   Call 1. oldText:
```js
import { attachUser, readCookie,
```
   newText:
```js
import { attachUser, requireUser, readCookie,
```
   Call 2. oldText:
```js
  app.get('/api/rentals', (req, res) => {
    res.json(listRentals(db))
  })

```
   newText:
```js
  app.get('/api/rentals', requireUser, (req, res) => {
    res.json(listRentals(db, { userId: req.user.id }))
  })

```
   Call 3. oldText:
```js
  app.post('/api/rentals', (req, res) => {
    const rental = createRental(db, req.body)

```
   newText:
```js
  app.post('/api/rentals', requireUser, (req, res) => {
    const rental = createRental(db, req.body, undefined, req.user.id)

```

When done:
- Run `npm run verify -- 039`. If it says FAIL: read the lines under FAIL, fix the files, and run it again. Repeat until the last line is `VERIFY PASSED`.
- NEVER edit files in `tests/`, `package.json` or files the task does not list.
- Tick the checkboxes with this one command: `sed -i '' 's/- \[ \]/- [x]/' backlog/in-progress/039-rentals-per-user.md`, then `git mv backlog/in-progress/039-rentals-per-user.md backlog/done/039-rentals-per-user.md`.
- `git add -A && git commit -m "task 039: Rentals belong to the logged-in user"`
If something is unclear or verify fails 3 times in a row: add a `## Notes` section to the task file explaining the problem and stop.
````
