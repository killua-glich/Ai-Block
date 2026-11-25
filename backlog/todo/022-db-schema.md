# 022 — Database: the SQLite schema for devices and rentals

**Type:** feature
**Depends on:** 021
**Files:** `server/db.js` (new)

## Goal

A new file `server/db.js` opens a SQLite database and creates two tables: `devices` and `rentals`. Wrong data is refused by the database itself.

## Acceptance criteria

- [ ] `server/db.js` exports `openDb(path = ':memory:')`: it opens a `DatabaseSync` from `node:sqlite`, turns foreign keys on, creates the tables if they do not exist, and returns the database
- [ ] Table `devices`: `id`, `name`, `category`, `price_per_day`, `description` (default `''`), `specs` (JSON text, default `'[]'`), `available` (0 or 1, default 1)
- [ ] Table `rentals`: `id` (text), `device_id` (must be an existing device), `start_date`, `end_date`, `total_price`, `created_at`; the end date cannot be before the start date
- [ ] Opening a database file that already exists keeps its data
- [ ] `npm run verify -- 022` passes (tests: `tests/task-022*.test.*`)

## Hints

- Use `import { DatabaseSync } from 'node:sqlite'`. It is built into Node 24: no package to install. An "ExperimentalWarning" in the console is normal.
- This is the first file in `server/`. The folder does not exist yet: the write tool creates it.

## Prompt

Run `pi` (or `opencode`) in the repo root, then paste:

````text
Context: AGENTS.md (already loaded) has the stack, the conventions, the editing rules and a project map. Use it. Do NOT list or scan the project. Open only the files named below.
Rules: only change the files listed. Do not touch tests/. Do not write files with heredocs. Write each file only once; do not write the same file again and again.

First: `git mv backlog/todo/022-db-schema.md backlog/in-progress/022-db-schema.md`. (If it says the file is not there, it is already moved: go on.)

Task: A new file `server/db.js` opens a SQLite database and creates two tables: `devices` and `rentals`. Wrong data is refused by the database itself.

Read first: nothing. All the code you need is below.
Edit or create: `server/db.js` (new).

Steps:
1. Write the complete file `server/db.js` with the write tool, with exactly this content:
```js
import { DatabaseSync } from 'node:sqlite'

const SCHEMA = `
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
`

// Opens the database (an in-memory one when no path is given) and makes sure the tables exist.
export function openDb(path = ':memory:') {
  const db = new DatabaseSync(path)
  db.exec('PRAGMA foreign_keys = ON')
  db.exec(SCHEMA)
  return db
}
```

When done:
- Run `npm run verify -- 022`. If it says FAIL: read the lines under FAIL, fix the files, and run it again. Repeat until the last line is `VERIFY PASSED`.
- NEVER edit files in `tests/`, `package.json` or files the task does not list.
- Tick the checkboxes with this one command: `sed -i '' 's/- \[ \]/- [x]/' backlog/in-progress/022-db-schema.md`, then `git mv backlog/in-progress/022-db-schema.md backlog/done/022-db-schema.md`.
- `git add -A && git commit -m "task 022: SQLite schema for devices and rentals"`
If something is unclear or verify fails 3 times in a row: add a `## Notes` section to the task file explaining the problem and stop.
````
