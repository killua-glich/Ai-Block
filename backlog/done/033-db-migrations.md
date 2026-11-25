# 033 — Database: numbered migrations

**Type:** feature
**Depends on:** 032
**Files:** `server/migrations.js` (new), `server/db.js`

## Goal

The database schema moves out of `server/db.js` into numbered migration steps. A database file made earlier is upgraded step by step and keeps its data. Nothing changes for the rest of the app.

## Acceptance criteria

- [x] New `server/migrations.js` exports `MIGRATIONS` (a list of `{ version, name, sql }`; for now one step, version 1, with exactly the two tables and the index of the old schema), `currentVersion(db)` and `migrate(db, migrations = MIGRATIONS)`
- [x] `migrate` reads the version from `PRAGMA user_version`, runs only the steps above it, in order of version, each step in its own transaction (`BEGIN` … `COMMIT`), and stores the new version
- [x] When a step fails, `migrate` rolls that step back, keeps the old version and throws an error with the message `Migration N (name) failed: ...`
- [x] `openDb` in `server/db.js` turns foreign keys on and then calls `migrate(db)`; it no longer holds any SQL itself
- [x] `npm run verify -- 033` passes (tests: `tests/task-033*.test.*`)

## Hints

- This is the way every later schema change is made: add a new step at the end of `MIGRATIONS`. A step that has shipped is never edited.
- Step 1 must use `CREATE TABLE IF NOT EXISTS`, because database files made by the old code already have these tables but report version 0.
- `db.exec('PRAGMA user_version = 3')` stores the number inside the database file. Inside a transaction it is rolled back together with the rest.

## Prompt

Run `pi` (or `opencode`) in the repo root, then paste:

````text
Context: AGENTS.md (already loaded) has the stack, the conventions, the editing rules and a project map. Use it. Do NOT list or scan the project. Open only the files named below.
Rules: only change the files listed. Do not touch tests/. Do not write files with heredocs. Write each file only once; do not write the same file again and again.

First: `git mv backlog/todo/033-db-migrations.md backlog/in-progress/033-db-migrations.md`. (If it says the file is not there, it is already moved: go on.)

Task: The database schema moves out of `server/db.js` into numbered migration steps. A database file made earlier is upgraded step by step and keeps its data. Nothing changes for the rest of the app.

Read first: `server/db.js`.
Edit or create: `server/migrations.js` (new), `server/db.js`.

Steps:
1. Write the complete file `server/migrations.js` with the write tool, with exactly this content:
```js
// The database is built by numbered steps. `PRAGMA user_version` remembers how many have run,
// so an old database file is upgraded step by step and keeps its data.
//
// To change the schema: add a NEW step at the end of this list. Never edit a step that has shipped.
export const MIGRATIONS = [
  {
    version: 1,
    name: 'devices and rentals',
    sql: `
CREATE TABLE IF NOT EXISTS devices (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price_per_day REAL NOT NULL CHECK (price_per_day >= 0),
  description TEXT NOT NULL DEFAULT '',
  specs TEXT NOT NULL DEFAULT '[]',
  available INTEGER NOT NULL DEFAULT 1 CHECK (available IN (0, 1))
);

CREATE TABLE IF NOT EXISTS rentals (
  id TEXT PRIMARY KEY,
  device_id INTEGER NOT NULL REFERENCES devices (id),
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  total_price REAL NOT NULL CHECK (total_price >= 0),
  created_at TEXT NOT NULL,
  CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS rentals_device_dates ON rentals (device_id, start_date, end_date);
`,
  },
]

export function currentVersion(db) {
  return db.prepare('PRAGMA user_version').get().user_version
}

// Runs the steps that have not run yet, each one in its own transaction. Returns the new version.
export function migrate(db, migrations = MIGRATIONS) {
  const pending = migrations.filter((m) => m.version > currentVersion(db)).sort((a, b) => a.version - b.version)
  for (const step of pending) {
    db.exec('BEGIN')
    try {
      db.exec(step.sql)
      db.exec(`PRAGMA user_version = ${step.version}`)
      db.exec('COMMIT')
    } catch (err) {
      db.exec('ROLLBACK')
      throw new Error(`Migration ${step.version} (${step.name}) failed: ${err.message}`, { cause: err })
    }
  }
  return currentVersion(db)
}
```
2. Write the complete file `server/db.js` with the write tool, with exactly this content:
```js
import { DatabaseSync } from 'node:sqlite'
import { migrate } from './migrations.js'

// Opens the database (an in-memory one when no path is given) and brings its tables up to date.
export function openDb(path = ':memory:') {
  const db = new DatabaseSync(path)
  db.exec('PRAGMA foreign_keys = ON')
  migrate(db)
  return db
}
```

When done:
- Run `npm run verify -- 033`. If it says FAIL: read the lines under FAIL, fix the files, and run it again. Repeat until the last line is `VERIFY PASSED`.
- NEVER edit files in `tests/`, `package.json` or files the task does not list.
- Tick the checkboxes with this one command: `sed -i '' 's/- \[ \]/- [x]/' backlog/in-progress/033-db-migrations.md`, then `git mv backlog/in-progress/033-db-migrations.md backlog/done/033-db-migrations.md`.
- `git add -A && git commit -m "task 033: Numbered database migrations"`
If something is unclear or verify fails 3 times in a row: add a `## Notes` section to the task file explaining the problem and stop.
````
