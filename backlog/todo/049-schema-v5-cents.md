# 049 — Database: schema version 5 (rentals in whole cents, a consistent cancel)

**Type:** feature
**Depends on:** 048
**Files:** `server/migrations.js`, `server/rentals.js`

## Goal

Migration step 5 rebuilds the `rentals` table. Totals are stored as whole cents (no rounding errors), and the database itself guarantees that a rental has a cancel time exactly when it is cancelled. The site and the API do not change: they still talk in euros.

## Acceptance criteria

- [ ] `MIGRATIONS` gets a fifth step, version 5, after step 4: it makes a new table `rentals_v5` with the columns `id`, `device_id`, `user_id`, `start_date`, `end_date`, `total_cents` (a whole number, zero or more), `status`, `created_at`, `cancelled_at`, with the checks for the end date, for the status and for the pair status and cancel time; copies every rental into it (cents = euros times 100, rounded; a rental that is cancelled by its status or by its cancel time becomes `cancelled` and gets a cancel time); drops the old table, renames the new one to `rentals` and makes the two indexes again
- [ ] A rental is `cancelled` exactly when `cancelled_at` is set: the database refuses any other row
- [ ] `toRental` in `server/rentals.js` gives `totalPrice` as `total_cents / 100`; `createRental` works out `totalCents` as `Math.round(days * device.pricePerDay * 100)`, saves it in `total_cents` and returns `totalPrice: totalCents / 100`
- [ ] A version 4 database file is upgraded without losing a rental, its owner or its foreign keys
- [ ] `npm run verify -- 049` passes (tests: `tests/task-049*.test.*`)

## Hints

- Add step 5 after step 4 at the end of `MIGRATIONS`. Do not edit the steps before it.
- SQLite cannot change a column or add a check to an existing table. The way is: make a new table, copy, drop the old one, rename the new one. Nothing points to `rentals`, so this is safe here.
- Make the changes to `server/rentals.js` with 3 separate edit calls: `toRental`, the line before `const rental = {` together with `totalPrice`, and the `INSERT`.

## Prompt

Run `pi` (or `opencode`) in the repo root, then paste:

````text
Context: AGENTS.md (already loaded) has the stack, the conventions, the editing rules and a project map. Use it. Do NOT list or scan the project. Open only the files named below.
Rules: only change the files listed. Do not touch tests/. Do not write files with heredocs. Write each file only once; do not write the same file again and again.

First: `git mv backlog/todo/049-schema-v5-cents.md backlog/in-progress/049-schema-v5-cents.md`. (If it says the file is not there, it is already moved: go on.)

Task: Migration step 5 rebuilds the `rentals` table. Totals are stored as whole cents (no rounding errors), and the database itself guarantees that a rental has a cancel time exactly when it is cancelled. The site and the API do not change: they still talk in euros.

Read first: `server/migrations.js`, `server/rentals.js`.
Edit or create: `server/migrations.js`, `server/rentals.js`.

Steps:
1. Change `server/migrations.js` with ONE call of the edit tool (do not rewrite the file). oldText:
```js
  },
]

export function currentVersion(db) {

```
   newText:
```js
  },
  {
    version: 5,
    name: 'rentals in whole cents, cancelled rentals always have a cancel time',
    sql: `
CREATE TABLE rentals_v5 (
  id TEXT PRIMARY KEY,
  device_id INTEGER NOT NULL REFERENCES devices (id),
  user_id INTEGER REFERENCES users (id) ON DELETE SET NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  total_cents INTEGER NOT NULL CHECK (typeof(total_cents) = 'integer' AND total_cents >= 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled')),
  created_at TEXT NOT NULL,
  cancelled_at TEXT,
  CHECK (end_date >= start_date),
  CHECK ((status = 'cancelled') = (cancelled_at IS NOT NULL))
);
INSERT INTO rentals_v5 (id, device_id, user_id, start_date, end_date, total_cents, status, created_at, cancelled_at)
  SELECT id, device_id, user_id, start_date, end_date, CAST(ROUND(total_price * 100) AS INTEGER),
    CASE WHEN status = 'cancelled' OR cancelled_at IS NOT NULL THEN 'cancelled' ELSE 'active' END,
    created_at,
    CASE WHEN status = 'cancelled' OR cancelled_at IS NOT NULL THEN COALESCE(cancelled_at, created_at) END
  FROM rentals;
DROP TABLE rentals;
ALTER TABLE rentals_v5 RENAME TO rentals;
CREATE INDEX rentals_device_status_dates ON rentals (device_id, status, start_date, end_date);
CREATE INDEX rentals_user_index ON rentals (user_id);
`,
  },
]

export function currentVersion(db) {

```
2. Change `server/rentals.js` with 4 SEPARATE edit calls, one after the other. Each call is small. Do NOT rewrite the whole file, and do NOT merge calls: a long edit can run past the output limit.
   For each call, oldText must match the file exactly: copy it from here. If a call fails, read the file once and correct oldText from what you read. Do not guess. Do the calls in order, each one right after the last.
   Call 1. oldText:
```js
    totalPrice: row.total_price,

```
   newText:
```js
    totalPrice: row.total_cents / 100,

```
   Call 2. oldText:
```js
  const rental = {
    id: randomUUID(),
```
   newText:
```js
  const totalCents = Math.round(days * device.pricePerDay * 100)
  const rental = {
    id: randomUUID(),
```
   Call 3. oldText:
```js
    totalPrice: days * device.pricePerDay,

```
   newText:
```js
    totalPrice: totalCents / 100,

```
   Call 4. oldText:
```js
'INSERT INTO rentals (id, device_id, start_date, end_date, total_price, created_at, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
  ).run(rental.id, rental.deviceId, rental.startDate, rental.endDate, rental.totalPrice, rental.createdAt, userId)
```
   newText:
```js
'INSERT INTO rentals (id, device_id, start_date, end_date, total_cents, created_at, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
  ).run(rental.id, rental.deviceId, rental.startDate, rental.endDate, totalCents, rental.createdAt, userId)
```

When done:
- Run `npm run verify -- 049`. If it says FAIL: read the lines under FAIL, fix the files, and run it again. Repeat until the last line is `VERIFY PASSED`.
- NEVER edit files in `tests/`, `package.json` or files the task does not list.
- Tick the checkboxes with this one command: `sed -i '' 's/- \[ \]/- [x]/' backlog/in-progress/049-schema-v5-cents.md`, then `git mv backlog/in-progress/049-schema-v5-cents.md backlog/done/049-schema-v5-cents.md`.
- `git add -A && git commit -m "task 049: Schema version 5: rentals in whole cents"`
If something is unclear or verify fails 3 times in a row: add a `## Notes` section to the task file explaining the problem and stop.
````
