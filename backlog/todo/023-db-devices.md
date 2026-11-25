# 023 — Database: seed the devices and read them back

**Type:** feature
**Depends on:** 022
**Files:** `server/seed.js` (new), `server/devices.js` (new)

## Goal

Two new files: `server/seed.js` puts the 14 built-in devices into an empty database, and `server/devices.js` reads them back in the same shape the web site already uses.

## Acceptance criteria

- [ ] `server/seed.js` exports `seedDevices(db, devices)`: it inserts every device inside one transaction (all or nothing) and returns how many it added; when the table already has devices it adds nothing and returns 0
- [ ] The `specs` list is stored as JSON text and `available` as 1 or 0
- [ ] `server/devices.js` exports `listDevices(db)` (all devices ordered by id) and `getDevice(db, id)` (one device, or `null`)
- [ ] Both give plain objects shaped `{ id, name, category, pricePerDay, description, specs, available }`: the list equals `src/data/devices.js`
- [ ] `npm run verify -- 023` passes (tests: `tests/task-023*.test.*`)

## Hints

- The database column is `price_per_day`, the object property is `pricePerDay`. `toDevice` in `server/devices.js` does that translation.
- `db.exec('BEGIN')`, `db.exec('COMMIT')` and `db.exec('ROLLBACK')` start, finish and undo a transaction.

## Prompt

Run `pi` (or `opencode`) in the repo root, then paste:

````text
Context: AGENTS.md (already loaded) has the stack, the conventions, the editing rules and a project map. Use it. Do NOT list or scan the project. Open only the files named below.
Rules: only change the files listed. Do not touch tests/. Do not write files with heredocs. Write each file only once; do not write the same file again and again.

First: `git mv backlog/todo/023-db-devices.md backlog/in-progress/023-db-devices.md`. (If it says the file is not there, it is already moved: go on.)

Task: Two new files: `server/seed.js` puts the 14 built-in devices into an empty database, and `server/devices.js` reads them back in the same shape the web site already uses.

Read first: `server/db.js`.
Edit or create: `server/seed.js` (new), `server/devices.js` (new).

Steps:
1. Write the complete file `server/seed.js` with the write tool, with exactly this content:
```js
// Puts the built-in devices into an empty database. Does nothing when there are devices already.
// Returns how many devices it added.
export function seedDevices(db, devices) {
  const existing = db.prepare('SELECT COUNT(*) AS n FROM devices').get().n
  if (existing > 0) return 0

  const insert = db.prepare(
    'INSERT INTO devices (id, name, category, price_per_day, description, specs, available) VALUES (?, ?, ?, ?, ?, ?, ?)',
  )
  db.exec('BEGIN')
  try {
    for (const d of devices) {
      insert.run(d.id, d.name, d.category, d.pricePerDay, d.description, JSON.stringify(d.specs), d.available ? 1 : 0)
    }
    db.exec('COMMIT')
  } catch (err) {
    db.exec('ROLLBACK')
    throw err
  }
  return devices.length
}
```
2. Write the complete file `server/devices.js` with the write tool, with exactly this content:
```js
// Reads devices from the database, in the same shape the web site uses.
function toDevice(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    pricePerDay: row.price_per_day,
    description: row.description,
    specs: JSON.parse(row.specs),
    available: row.available === 1,
  }
}

export function listDevices(db) {
  return db.prepare('SELECT * FROM devices ORDER BY id').all().map(toDevice)
}

export function getDevice(db, id) {
  const row = db.prepare('SELECT * FROM devices WHERE id = ?').get(id)
  return row ? toDevice(row) : null
}
```

When done:
- Run `npm run verify -- 023`. If it says FAIL: read the lines under FAIL, fix the files, and run it again. Repeat until the last line is `VERIFY PASSED`.
- NEVER edit files in `tests/`, `package.json` or files the task does not list.
- Tick the checkboxes with this one command: `sed -i '' 's/- \[ \]/- [x]/' backlog/in-progress/023-db-devices.md`, then `git mv backlog/in-progress/023-db-devices.md backlog/done/023-db-devices.md`.
- `git add -A && git commit -m "task 023: Seed devices and read them from SQLite"`
If something is unclear or verify fails 3 times in a row: add a `## Notes` section to the task file explaining the problem and stop.
````
