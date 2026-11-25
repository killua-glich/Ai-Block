# 034 — Database: schema version 2 (rental status, update time, indexes)

**Type:** feature
**Depends on:** 033
**Files:** `server/migrations.js`, `server/rentals.js`

## Goal

The first real schema improvement, made as migration step 2: rentals get a status (`active` or `cancelled`), devices get an update time, device names become unique, and the indexes fit the queries. A cancelled rental no longer blocks its dates.

## Acceptance criteria

- [ ] `MIGRATIONS` in `server/migrations.js` gets a second step, version 2, after step 1 (step 1 stays exactly as it is): it adds `devices.updated_at`, `rentals.status` (`active` or `cancelled`, default `active`) and `rentals.cancelled_at`, a unique index on the device name, an index on the device category, and replaces the old rentals index by `(device_id, status, start_date, end_date)`
- [ ] A database file at version 1 is upgraded without losing data; its rentals become `active`
- [ ] `toRental` in `server/rentals.js` also gives the `status`; a rental made by `createRental` has `status: 'active'`
- [ ] The overlap check in `createRental` only looks at active rentals: a cancelled rental no longer blocks its dates
- [ ] `npm run verify -- 034` passes (tests: `tests/task-034*.test.*`)

## Hints

- Do not change step 1: add the new step after it, at the end of the list.
- SQLite can add a column with `ALTER TABLE ... ADD COLUMN`, but only with a fixed default value. That is why `updated_at` starts as an empty text: "never edited".
- Both lists, the one from `listRentals` and the rental `createRental` returns, must have the same fields.

## Prompt

Run `pi` (or `opencode`) in the repo root, then paste:

````text
Context: AGENTS.md (already loaded) has the stack, the conventions, the editing rules and a project map. Use it. Do NOT list or scan the project. Open only the files named below.
Rules: only change the files listed. Do not touch tests/. Do not write files with heredocs. Write each file only once; do not write the same file again and again.

First: `git mv backlog/todo/034-schema-v2.md backlog/in-progress/034-schema-v2.md`. (If it says the file is not there, it is already moved: go on.)

Task: The first real schema improvement, made as migration step 2: rentals get a status (`active` or `cancelled`), devices get an update time, device names become unique, and the indexes fit the queries. A cancelled rental no longer blocks its dates.

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
    version: 2,
    name: 'rental status, device update time, indexes',
    sql: `
ALTER TABLE devices ADD COLUMN updated_at TEXT NOT NULL DEFAULT '';
ALTER TABLE rentals ADD COLUMN status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled'));
ALTER TABLE rentals ADD COLUMN cancelled_at TEXT;
CREATE UNIQUE INDEX devices_name_unique ON devices (name);
CREATE INDEX devices_category_index ON devices (category);
DROP INDEX rentals_device_dates;
CREATE INDEX rentals_device_status_dates ON rentals (device_id, status, start_date, end_date);
`,
  },
]

export function currentVersion(db) {

```
2. Change `server/rentals.js` with 3 SEPARATE edit calls, one after the other. Each call is small. Do NOT rewrite the whole file, and do NOT merge calls: a long edit can run past the output limit.
   For each call, oldText must match the file exactly: copy it from here. If a call fails, read the file once and correct oldText from what you read. Do not guess. Do the calls in order, each one right after the last.
   Call 1. oldText:
```js
    createdAt: row.created_at,

```
   newText:
```js
    createdAt: row.created_at,
    status: row.status,

```
   Call 2. oldText:
```js
.prepare('SELECT 1 FROM rentals WHERE device_id = ? AND start_date <= ? AND end_date >= ?')
```
   newText:
```js
.prepare("SELECT 1 FROM rentals WHERE device_id = ? AND status = 'active' AND start_date <= ? AND end_date >= ?")
```
   Call 3. oldText:
```js
    createdAt: new Date().toISOString(),
  }

```
   newText:
```js
    createdAt: new Date().toISOString(),
    status: 'active',
  }

```

When done:
- Run `npm run verify -- 034`. If it says FAIL: read the lines under FAIL, fix the files, and run it again. Repeat until the last line is `VERIFY PASSED`.
- NEVER edit files in `tests/`, `package.json` or files the task does not list.
- Tick the checkboxes with this one command: `sed -i '' 's/- \[ \]/- [x]/' backlog/in-progress/034-schema-v2.md`, then `git mv backlog/in-progress/034-schema-v2.md backlog/done/034-schema-v2.md`.
- `git add -A && git commit -m "task 034: Schema version 2: rental status, update time, indexes"`
If something is unclear or verify fails 3 times in a row: add a `## Notes` section to the task file explaining the problem and stop.
````
