# 037 — Accounts: sessions

**Type:** feature
**Depends on:** 036
**Files:** `server/migrations.js`, `server/sessions.js` (new)

## Goal

Migration step 4 adds a `sessions` table. A new file `server/sessions.js` makes, finds and deletes sessions: the memory behind the login cookie. Only a hash of the secret token is stored.

## Acceptance criteria

- [x] `MIGRATIONS` gets a fourth step, version 4: table `sessions` (`token_hash` primary key, `user_id` of an existing user, deleted with the user, `created_at`, `expires_at`) and an index on `user_id`
- [x] `createSession(db, userId, now = Date.now())` makes a random token of 64 hex characters, stores its SHA-256 hash with an expiry `SESSION_DAYS` (7) days later, and returns the token
- [x] `findSessionUser(db, token, now = Date.now())` returns `{ id, email, name, role }` of a valid session; it returns `null` for an unknown, empty or non-text token, and for an expired session, which it deletes at once
- [x] `deleteSession(db, token)` ends one session; `deleteExpiredSessions(db, now)` ends all the expired ones
- [x] `npm run verify -- 037` passes (tests: `tests/task-037*.test.*`)

## Hints

- Add step 4 after step 3 at the end of `MIGRATIONS`. Do not edit the steps before it.
- `now` is a parameter, in milliseconds, so that tests can pick the time.
- The token goes into the cookie; only its hash goes into the database. Never store the token itself.

## Prompt

Run `pi` (or `opencode`) in the repo root, then paste:

````text
Context: AGENTS.md (already loaded) has the stack, the conventions, the editing rules and a project map. Use it. Do NOT list or scan the project. Open only the files named below.
Rules: only change the files listed. Do not touch tests/. Do not write files with heredocs. Write each file only once; do not write the same file again and again.

First: `git mv backlog/todo/037-sessions.md backlog/in-progress/037-sessions.md`. (If it says the file is not there, it is already moved: go on.)

Task: Migration step 4 adds a `sessions` table. A new file `server/sessions.js` makes, finds and deletes sessions: the memory behind the login cookie. Only a hash of the secret token is stored.

Read first: `server/migrations.js`.
Edit or create: `server/migrations.js`, `server/sessions.js` (new).

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
    version: 4,
    name: 'sessions',
    sql: `
CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
CREATE INDEX sessions_user_index ON sessions (user_id);
`,
  },
]

export function currentVersion(db) {

```
2. Write the complete file `server/sessions.js` with the write tool, with exactly this content:
```js
import { createHash, randomBytes } from 'node:crypto'

export const SESSION_DAYS = 7

// Only a hash of the token is stored, so a copy of the database cannot be used to log in.
const hashToken = (token) => createHash('sha256').update(token).digest('hex')

// Makes a session for the user and returns the secret token (64 hex characters) for the cookie.
export function createSession(db, userId, now = Date.now()) {
  const token = randomBytes(32).toString('hex')
  const expires = new Date(now + SESSION_DAYS * 86400000).toISOString()
  db.prepare('INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)').run(
    hashToken(token),
    userId,
    new Date(now).toISOString(),
    expires,
  )
  return token
}

// The user of a valid session, or null. An expired session is deleted on the spot.
export function findSessionUser(db, token, now = Date.now()) {
  if (typeof token !== 'string' || token === '') return null
  const row = db
    .prepare('SELECT s.expires_at, u.id, u.email, u.name, u.role FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ?')
    .get(hashToken(token))
  if (!row) return null
  if (row.expires_at <= new Date(now).toISOString()) {
    deleteSession(db, token)
    return null
  }
  return { id: row.id, email: row.email, name: row.name, role: row.role }
}

export function deleteSession(db, token) {
  db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(hashToken(String(token)))
}

export function deleteExpiredSessions(db, now = Date.now()) {
  db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(new Date(now).toISOString())
}
```

When done:
- Run `npm run verify -- 037`. If it says FAIL: read the lines under FAIL, fix the files, and run it again. Repeat until the last line is `VERIFY PASSED`.
- NEVER edit files in `tests/`, `package.json` or files the task does not list.
- Tick the checkboxes with this one command: `sed -i '' 's/- \[ \]/- [x]/' backlog/in-progress/037-sessions.md`, then `git mv backlog/in-progress/037-sessions.md backlog/done/037-sessions.md`.
- `git add -A && git commit -m "task 037: Sessions table and session functions"`
If something is unclear or verify fails 3 times in a row: add a `## Notes` section to the task file explaining the problem and stop.
````
