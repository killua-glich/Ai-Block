# 051 — Database: schema version 6 (a categories table, device prices in whole cents)

**Type:** feature
**Depends on:** 050
**Files:** `server/migrations.js`, `server/devices.js`, `server/seed.js`

## Goal

Migration step 6 rebuilds the `devices` table: categories move into a table of their own (no more typos or two spellings), and prices are stored as whole cents. The site and the API do not change: a device still has a `category` text and a `pricePerDay` in euros.

## Acceptance criteria

- [ ] `MIGRATIONS` gets a sixth step, version 6, with `foreignKeys: false`: it makes the table `categories` (`id`, `name` unique, letter case ignored), fills it from the categories of the devices, makes `devices_v6` with `category_id` (a category that exists) and `price_cents` (a whole number, zero or more) instead of `category` and `price_per_day`, copies the devices, drops the old table, renames the new one to `devices` and makes the two indexes again (`devices_name_unique` is unique; `devices_category_index` is on `category_id`)
- [ ] `server/devices.js` reads devices through one query that joins the category: `toDevice` gives `category` as the text and `pricePerDay` as `price_cents / 100`; it exports `categoryId(db, name)` (finds a category in any letter case, or makes it); `createDevice` and `updateDevice` use it and store `Math.round(pricePerDay * 100)`
- [ ] `server/seed.js` seeds devices with `category_id` and `price_cents` (using `categoryId`)
- [ ] A database file at version 5, and one from the very first version, are upgraded without losing a device or a rental; `listDevices` still gives exactly the devices of `src/data/devices.js`
- [ ] `npm run verify -- 051` passes (tests: `tests/task-051*.test.*`)

## Hints

- Add step 6 after step 5 at the end of `MIGRATIONS`. Do not edit the steps before it. The flag `foreignKeys: false` is what the previous ticket added: rentals point to devices, so without it the table cannot be dropped.
- Make the changes to `server/devices.js` with 6 separate edit calls (`toDevice`, the two read functions, the new `categoryId` function, `createDevice`, `updateDevice`) and to `server/seed.js` with 3 (the import, the `INSERT`, the `insert.run` line).
- `GROUP BY category COLLATE NOCASE` takes each category once, even when two devices spell it differently.

## Prompt

Run `pi` (or `opencode`) in the repo root, then paste:

````text
Context: AGENTS.md (already loaded) has the stack, the conventions, the editing rules and a project map. Use it. Do NOT list or scan the project. Open only the files named below.
Rules: only change the files listed. Do not touch tests/. Do not write files with heredocs. Write each file only once; do not write the same file again and again.

First: `git mv backlog/todo/051-schema-v6-categories.md backlog/in-progress/051-schema-v6-categories.md`. (If it says the file is not there, it is already moved: go on.)

Task: Migration step 6 rebuilds the `devices` table: categories move into a table of their own (no more typos or two spellings), and prices are stored as whole cents. The site and the API do not change: a device still has a `category` text and a `pricePerDay` in euros.

Read first: `server/migrations.js`, `server/devices.js`, `server/seed.js`.
Edit or create: `server/migrations.js`, `server/devices.js`, `server/seed.js`.

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
    version: 6,
    name: 'categories table and device prices in whole cents',
    foreignKeys: false,
    sql: `
CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE COLLATE NOCASE
);
INSERT INTO categories (name) SELECT category FROM devices GROUP BY category COLLATE NOCASE ORDER BY category;

CREATE TABLE devices_v6 (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  category_id INTEGER NOT NULL REFERENCES categories (id),
  price_cents INTEGER NOT NULL CHECK (typeof(price_cents) = 'integer' AND price_cents >= 0),
  description TEXT NOT NULL DEFAULT '',
  specs TEXT NOT NULL DEFAULT '[]',
  available INTEGER NOT NULL DEFAULT 1 CHECK (available IN (0, 1)),
  updated_at TEXT NOT NULL DEFAULT ''
);
INSERT INTO devices_v6 (id, name, category_id, price_cents, description, specs, available, updated_at)
  SELECT d.id, d.name, c.id, CAST(ROUND(d.price_per_day * 100) AS INTEGER), d.description, d.specs, d.available, d.updated_at
  FROM devices d JOIN categories c ON c.name = d.category;
DROP TABLE devices;
ALTER TABLE devices_v6 RENAME TO devices;
CREATE UNIQUE INDEX devices_name_unique ON devices (name);
CREATE INDEX devices_category_index ON devices (category_id);
`,
  },
]

export function currentVersion(db) {

```
2. Change `server/devices.js` with 6 SEPARATE edit calls, one after the other. Each call is small. Do NOT rewrite the whole file, and do NOT merge calls: a long edit can run past the output limit.
   For each call, oldText must match the file exactly: copy it from here. If a call fails, read the file once and correct oldText from what you read. Do not guess. Do the calls in order, each one right after the last.
   Call 1. oldText:
```js
    pricePerDay: row.price_per_day,

```
   newText:
```js
    pricePerDay: row.price_cents / 100,

```
   Call 2. oldText:
```js
export function listDevices(db) {
  return db.prepare('SELECT * FROM devices ORDER BY id').all().map(toDevice)
}

```
   newText:
```js
// Every query that reads devices starts like this: the category name comes from its own table.
const SELECT_DEVICE =
  'SELECT d.id, d.name, c.name AS category, d.price_cents, d.description, d.specs, d.available FROM devices d JOIN categories c ON c.id = d.category_id'

export function listDevices(db) {
  return db.prepare(`${SELECT_DEVICE} ORDER BY d.id`).all().map(toDevice)
}

```
   Call 3. oldText:
```js
  const row = db.prepare('SELECT * FROM devices WHERE id = ?').get(id)

```
   newText:
```js
  const row = db.prepare(`${SELECT_DEVICE} WHERE d.id = ?`).get(id)

```
   Call 4. oldText:
```js
// A second device with the same name breaks the unique index: say so in plain words.

```
   newText:
```js
// The id of a category. A new one is made when there is none yet. Letter case does not matter:
// "camera" finds "Camera", and the first spelling stays.
export function categoryId(db, name) {
  db.prepare('INSERT OR IGNORE INTO categories (name) VALUES (?)').run(name)
  return db.prepare('SELECT id FROM categories WHERE name = ?').get(name).id
}

// A second device with the same name breaks the unique index: say so in plain words.

```
   Call 5. oldText:
```js
      .prepare('INSERT INTO devices (name, category, price_per_day, description, specs, available, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(d.name, d.category, d.pricePerDay, d.description, JSON.stringify(d.specs), d.available ? 1 : 0, now)

```
   newText:
```js
      .prepare('INSERT INTO devices (name, category_id, price_cents, description, specs, available, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(d.name, categoryId(db, d.category), Math.round(d.pricePerDay * 100), d.description, JSON.stringify(d.specs), d.available ? 1 : 0, now)

```
   Call 6. oldText:
```js
      'UPDATE devices SET name = ?, category = ?, price_per_day = ?, description = ?, specs = ?, available = ?, updated_at = ? WHERE id = ?',
    ).run(d.name, d.category, d.pricePerDay, d.description, JSON.stringify(d.specs), d.available ? 1 : 0, now, id)

```
   newText:
```js
      'UPDATE devices SET name = ?, category_id = ?, price_cents = ?, description = ?, specs = ?, available = ?, updated_at = ? WHERE id = ?',
    ).run(d.name, categoryId(db, d.category), Math.round(d.pricePerDay * 100), d.description, JSON.stringify(d.specs), d.available ? 1 : 0, now, id)

```
3. Change `server/seed.js` with 3 SEPARATE edit calls, one after the other. Each call is small. Do NOT rewrite the whole file, and do NOT merge calls: a long edit can run past the output limit.
   For each call, oldText must match the file exactly: copy it from here. If a call fails, read the file once and correct oldText from what you read. Do not guess. Do the calls in order, each one right after the last.
   Call 1. oldText:
```js
import { createUser, findUserByEmail } from './users.js'

```
   newText:
```js
import { createUser, findUserByEmail } from './users.js'
import { categoryId } from './devices.js'

```
   Call 2. oldText:
```js
    'INSERT INTO devices (id, name, category, price_per_day, description, specs, available) VALUES (?, ?, ?, ?, ?, ?, ?)',

```
   newText:
```js
    'INSERT INTO devices (id, name, category_id, price_cents, description, specs, available) VALUES (?, ?, ?, ?, ?, ?, ?)',

```
   Call 3. oldText:
```js
      insert.run(d.id, d.name, d.category, d.pricePerDay, d.description, JSON.stringify(d.specs), d.available ? 1 : 0)

```
   newText:
```js
      insert.run(d.id, d.name, categoryId(db, d.category), Math.round(d.pricePerDay * 100), d.description, JSON.stringify(d.specs), d.available ? 1 : 0)

```

When done:
- Run `npm run verify -- 051`. If it says FAIL: read the lines under FAIL, fix the files, and run it again. Repeat until the last line is `VERIFY PASSED`.
- NEVER edit files in `tests/`, `package.json` or files the task does not list.
- Tick the checkboxes with this one command: `sed -i '' 's/- \[ \]/- [x]/' backlog/in-progress/051-schema-v6-categories.md`, then `git mv backlog/in-progress/051-schema-v6-categories.md backlog/done/051-schema-v6-categories.md`.
- `git add -A && git commit -m "task 051: Schema version 6: categories table and device prices in cents"`
If something is unclear or verify fails 3 times in a row: add a `## Notes` section to the task file explaining the problem and stop.
````
