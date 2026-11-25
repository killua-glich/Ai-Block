# 042 — Admin: the first admin comes from the environment

**Type:** feature
**Depends on:** 041
**Files:** `server/seed.js`, `server/index.js`, `docker-compose.yml`

## Goal

Nobody can make themselves an admin on the site, so the first admin comes from the environment: when the server starts with `ADMIN_EMAIL` and `ADMIN_PASSWORD` set, and no user with that email exists, it makes an admin.

## Acceptance criteria

- [ ] `seedAdmin(db, { email, password } = {})` in `server/seed.js` makes a user with the role `admin` and the name `Administrator` and returns `true`; it returns `false` and does nothing when the email or the password is missing or empty, or when a user with that email exists already (that user is not changed); a password that is too short throws the error of `createUser`
- [ ] `startServer` in `server/index.js` takes an `admin` option that defaults to `{ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD }` and calls `seedAdmin(db, admin)` after `seedDevices`
- [ ] In `docker-compose.yml` the `api` service gets `ADMIN_EMAIL: ${ADMIN_EMAIL:-}` and `ADMIN_PASSWORD: ${ADMIN_PASSWORD:-}` under `environment`
- [ ] `npm run verify -- 042` passes (tests: `tests/task-042*.test.*`)

## Hints

- The `${ADMIN_EMAIL:-}` form means: take it from the environment or from a `.env` file next to the compose file, and use nothing when it is not set. `.env` is not committed (it is in `.gitignore`).
- Start it by hand: `ADMIN_EMAIL=me@example.com ADMIN_PASSWORD=a-long-password npm run server`.
- `seed.js` needs an import of `createUser` and `findUserByEmail` from `./users.js` at the top.

## Prompt

Run `pi` (or `opencode`) in the repo root, then paste:

````text
Context: AGENTS.md (already loaded) has the stack, the conventions, the editing rules and a project map. Use it. Do NOT list or scan the project. Open only the files named below.
Rules: only change the files listed. Do not touch tests/. Do not write files with heredocs. Write each file only once; do not write the same file again and again.

First: `git mv backlog/todo/042-admin-seed.md backlog/in-progress/042-admin-seed.md`. (If it says the file is not there, it is already moved: go on.)

Task: Nobody can make themselves an admin on the site, so the first admin comes from the environment: when the server starts with `ADMIN_EMAIL` and `ADMIN_PASSWORD` set, and no user with that email exists, it makes an admin.

Read first: `server/seed.js`, `server/index.js`, `docker-compose.yml`.
Edit or create: `server/seed.js`, `server/index.js`, `docker-compose.yml`.

Steps:
1. Change `server/seed.js` with 2 SEPARATE edit calls, one after the other. Each call is small. Do NOT rewrite the whole file, and do NOT merge calls: a long edit can run past the output limit.
   For each call, oldText must match the file exactly: copy it from here. If a call fails, read the file once and correct oldText from what you read. Do not guess. Do the calls in order, each one right after the last.
   Call 1. oldText:
```js
// Puts the built-in devices into an empty database.
```
   newText:
```js
import { createUser, findUserByEmail } from './users.js'

// Puts the built-in devices into an empty database.
```
   Call 2. oldText:
```js
  return devices.length
}

```
   newText:
```js
  return devices.length
}

// Makes the first admin from an email and a password (they come from the environment).
// Does nothing when one of them is missing or when a user with that email exists already.
// Returns true when it made the admin.
export function seedAdmin(db, { email, password } = {}) {
  if (!email || !password) return false
  if (findUserByEmail(db, email)) return false
  createUser(db, { email, name: 'Administrator', password, role: 'admin' })
  return true
}

```
2. Change `server/index.js` with 3 SEPARATE edit calls, one after the other. Each call is small. Do NOT rewrite the whole file, and do NOT merge calls: a long edit can run past the output limit.
   For each call, oldText must match the file exactly: copy it from here. If a call fails, read the file once and correct oldText from what you read. Do not guess. Do the calls in order, each one right after the last.
   Call 1. oldText:
```js
import { seedDevices } from './seed.js'
```
   newText:
```js
import { seedDevices, seedAdmin } from './seed.js'
```
   Call 2. oldText:
```js
export function startServer({ port = 3001, dbPath = 'data/ai-block.db' } = {}) {
```
   newText:
```js
export function startServer({
  port = 3001,
  dbPath = 'data/ai-block.db',
  admin = { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD },
} = {}) {
```
   Call 3. oldText:
```js
  seedDevices(db, devices)

```
   newText:
```js
  seedDevices(db, devices)
  seedAdmin(db, admin)

```
3. Change `docker-compose.yml` with ONE call of the edit tool (do not rewrite the file). oldText:
```yaml
    volumes:
      - db-data:/data

```
   newText:
```yaml
    environment:
      ADMIN_EMAIL: ${ADMIN_EMAIL:-}
      ADMIN_PASSWORD: ${ADMIN_PASSWORD:-}
    volumes:
      - db-data:/data

```

When done:
- Run `npm run verify -- 042`. If it says FAIL: read the lines under FAIL, fix the files, and run it again. Repeat until the last line is `VERIFY PASSED`.
- NEVER edit files in `tests/`, `package.json` or files the task does not list.
- Tick the checkboxes with this one command: `sed -i '' 's/- \[ \]/- [x]/' backlog/in-progress/042-admin-seed.md`, then `git mv backlog/in-progress/042-admin-seed.md backlog/done/042-admin-seed.md`.
- `git add -A && git commit -m "task 042: First admin from the environment"`
If something is unclear or verify fails 3 times in a row: add a `## Notes` section to the task file explaining the problem and stop.
````
