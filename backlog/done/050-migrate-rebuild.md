# 050 — Database: migrations that can rebuild a table other tables point to

**Type:** feature
**Depends on:** 049
**Files:** `server/migrations.js`

## Goal

`migrate` learns one more thing: a step marked `foreignKeys: false` runs with foreign keys switched off, so that a table which other tables point to can be rebuilt. The next ticket needs this for the `devices` table.

## Acceptance criteria

- [x] A step with `foreignKeys: false` runs with `PRAGMA foreign_keys = OFF` (set before `BEGIN`, because it does nothing inside a transaction)
- [x] Before such a step is committed, `PRAGMA foreign_key_check` must find nothing; when it finds a row that points nowhere, the step is undone and `migrate` throws the usual `Migration N (name) failed: ...` error
- [x] Whatever happens, foreign keys are switched on again at the end of such a step (`finally`)
- [x] Steps without the flag behave exactly as before
- [x] `npm run verify -- 050` passes (tests: `tests/task-050*.test.*`)

## Hints

- Make the change with 3 separate edit calls in the `for` loop of `migrate`: the lines at the start of the loop, the line after `db.exec(step.sql)`, and the end of the `catch` block.
- `PRAGMA foreign_key_check` gives one row for each broken reference: an empty list means everything is fine.
- The rule of SQLite: with foreign keys on, dropping a table that other tables point to fails while rows point to it. The official way to rebuild is to switch them off, rebuild and check.

## Prompt

Run `pi` (or `opencode`) in the repo root, then paste:

````text
Context: AGENTS.md (already loaded) has the stack, the conventions, the editing rules and a project map. Use it. Do NOT list or scan the project. Open only the files named below.
Rules: only change the files listed. Do not touch tests/. Do not write files with heredocs. Write each file only once; do not write the same file again and again.

First: `git mv backlog/todo/050-migrate-rebuild.md backlog/in-progress/050-migrate-rebuild.md`. (If it says the file is not there, it is already moved: go on.)

Task: `migrate` learns one more thing: a step marked `foreignKeys: false` runs with foreign keys switched off, so that a table which other tables point to can be rebuilt. The next ticket needs this for the `devices` table.

Read first: `server/migrations.js`.
Edit or create: `server/migrations.js`.

Steps:
1. Change `server/migrations.js` with 3 SEPARATE edit calls, one after the other. Each call is small. Do NOT rewrite the whole file, and do NOT merge calls: a long edit can run past the output limit.
   For each call, oldText must match the file exactly: copy it from here. If a call fails, read the file once and correct oldText from what you read. Do not guess. Do the calls in order, each one right after the last.
   Call 1. oldText:
```js
  for (const step of pending) {
    db.exec('BEGIN')
    try {

```
   newText:
```js
  for (const step of pending) {
    // A step that rebuilds a table other tables point to needs foreign keys off while it runs (`foreignKeys: false`).
    const isRebuild = step.foreignKeys === false
    if (isRebuild) db.exec('PRAGMA foreign_keys = OFF')
    db.exec('BEGIN')
    try {

```
   Call 2. oldText:
```js
      db.exec(step.sql)

```
   newText:
```js
      db.exec(step.sql)
      if (isRebuild && db.prepare('PRAGMA foreign_key_check').all().length > 0) {
        throw new Error('some rows point to rows that do not exist')
      }

```
   Call 3. oldText:
```js
      throw new Error(`Migration ${step.version} (${step.name}) failed: ${err.message}`, { cause: err })
    }
  }

```
   newText:
```js
      throw new Error(`Migration ${step.version} (${step.name}) failed: ${err.message}`, { cause: err })
    } finally {
      if (isRebuild) db.exec('PRAGMA foreign_keys = ON')
    }
  }

```

When done:
- Run `npm run verify -- 050`. If it says FAIL: read the lines under FAIL, fix the files, and run it again. Repeat until the last line is `VERIFY PASSED`.
- NEVER edit files in `tests/`, `package.json` or files the task does not list.
- Tick the checkboxes with this one command: `sed -i '' 's/- \[ \]/- [x]/' backlog/in-progress/050-migrate-rebuild.md`, then `git mv backlog/in-progress/050-migrate-rebuild.md backlog/done/050-migrate-rebuild.md`.
- `git add -A && git commit -m "task 050: Migrations that rebuild tables with foreign keys off"`
If something is unclear or verify fails 3 times in a row: add a `## Notes` section to the task file explaining the problem and stop.
````
