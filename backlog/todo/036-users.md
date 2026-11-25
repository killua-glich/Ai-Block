# 036 — Accounts: the users table

**Type:** feature
**Depends on:** 035
**Files:** `server/migrations.js`, `server/users.js` (new)

## Goal

Migration step 3 adds a `users` table and lets a rental belong to a user. A new file `server/users.js` creates users (with all checks), finds them and checks logins.

## Acceptance criteria

- [ ] `MIGRATIONS` gets a third step, version 3: table `users` (`id`, `email` unique and not case sensitive, `name`, `password_hash`, `role` `user` or `admin`, `created_at`) and a column `rentals.user_id` that points to a user (the rental stays, without an owner, when the user is deleted)
- [ ] `createUser(db, { email, name, password, role = 'user' })` checks the input (status 400 with the exact messages in the code below), refuses a taken email (status 409), stores a scrypt hash of the password and returns `{ id, email, name, role }`: never the password or the hash
- [ ] `getUser(db, id)` and `findUserByEmail(db, email)` return that same shape, or `null`
- [ ] `authenticate(db, email, password)` returns the user for a right email and password, and `null` for a wrong password and for an unknown email alike
- [ ] `npm run verify -- 036` passes (tests: `tests/task-036*.test.*`)

## Hints

- Add step 3 after step 2 at the end of `MIGRATIONS`. Do not edit the steps before it.
- `UserError` has a `status` like `RentalError` has: the API error handler already uses `err.status`.
- `DUMMY_HASH` is there so that a login with an unknown email costs the same time as one with a wrong password.

## Prompt

Run `pi` (or `opencode`) in the repo root, then paste:

````text
Context: AGENTS.md (already loaded) has the stack, the conventions, the editing rules and a project map. Use it. Do NOT list or scan the project. Open only the files named below.
Rules: only change the files listed. Do not touch tests/. Do not write files with heredocs. Write each file only once; do not write the same file again and again.

First: `git mv backlog/todo/036-users.md backlog/in-progress/036-users.md`. (If it says the file is not there, it is already moved: go on.)

Task: Migration step 3 adds a `users` table and lets a rental belong to a user. A new file `server/users.js` creates users (with all checks), finds them and checks logins.

Read first: `server/migrations.js`.
Edit or create: `server/migrations.js`, `server/users.js` (new).

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
    version: 3,
    name: 'users',
    sql: `
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TEXT NOT NULL
);
ALTER TABLE rentals ADD COLUMN user_id INTEGER REFERENCES users (id) ON DELETE SET NULL;
CREATE INDEX rentals_user_index ON rentals (user_id);
`,
  },
]

export function currentVersion(db) {

```
2. Write the complete file `server/users.js` with the write tool, with exactly this content:
```js
import { hashPassword, verifyPassword } from './passwords.js'

// An error with the HTTP status the API should answer with.
export class UserError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Looks like the stored text of a real password, so a login with an unknown email takes as long as a real one.
const DUMMY_HASH = hashPassword('not a real password')

// The user as the rest of the app may see it: never the password.
function toUser(row) {
  return { id: row.id, email: row.email, name: row.name, role: row.role }
}

export function createUser(db, { email, name, password, role = 'user' }, now = new Date().toISOString()) {
  if (typeof email !== 'string' || !EMAIL.test(email.trim())) throw new UserError(400, 'Please enter a valid email address.')
  const cleanName = typeof name === 'string' ? name.trim() : ''
  if (cleanName.length < 1 || cleanName.length > 80) throw new UserError(400, 'Please enter your name (up to 80 characters).')
  if (typeof password !== 'string' || password.length < 8) throw new UserError(400, 'The password must have at least 8 characters.')
  if (password.length > 200) throw new UserError(400, 'The password is too long.')
  if (role !== 'user' && role !== 'admin') throw new UserError(400, 'The role must be user or admin.')

  try {
    const result = db
      .prepare('INSERT INTO users (email, name, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)')
      .run(email.trim(), cleanName, hashPassword(password), role, now)
    return getUser(db, Number(result.lastInsertRowid))
  } catch (err) {
    if (/UNIQUE/.test(err.message)) throw new UserError(409, 'That email is already registered.')
    throw err
  }
}

export function getUser(db, id) {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id)
  return row ? toUser(row) : null
}

export function findUserByEmail(db, email) {
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(String(email ?? '').trim())
  return row ? toUser(row) : null
}

// The user when the email and password are right, otherwise null (the same answer for both mistakes).
export function authenticate(db, email, password) {
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(String(email ?? '').trim())
  const isRight = verifyPassword(password, row ? row.password_hash : DUMMY_HASH)
  return row && isRight ? toUser(row) : null
}
```

When done:
- Run `npm run verify -- 036`. If it says FAIL: read the lines under FAIL, fix the files, and run it again. Repeat until the last line is `VERIFY PASSED`.
- NEVER edit files in `tests/`, `package.json` or files the task does not list.
- Tick the checkboxes with this one command: `sed -i '' 's/- \[ \]/- [x]/' backlog/in-progress/036-users.md`, then `git mv backlog/in-progress/036-users.md backlog/done/036-users.md`.
- `git add -A && git commit -m "task 036: Users table and user functions"`
If something is unclear or verify fails 3 times in a row: add a `## Notes` section to the task file explaining the problem and stop.
````
