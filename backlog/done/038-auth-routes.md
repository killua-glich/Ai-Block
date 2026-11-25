# 038 — API: register, log in, log out and who am I

**Type:** feature
**Depends on:** 037
**Files:** `server/auth.js` (new), `server/app.js`

## Goal

Accounts work in the API. Four routes under `/api/auth` register, log in, log out and tell who is logged in. The login is a session cookie that the browser sends by itself.

## Acceptance criteria

- [x] `server/auth.js` (new) exports `COOKIE` (`sid`), `readCookie(req, name)`, `setSessionCookie(res, token)` and `clearSessionCookie(res)` (cookie `HttpOnly; SameSite=Lax; Path=/`, 7 days, `Max-Age=0` to clear), the middleware `attachUser(db)` (puts the user of the cookie, or `null`, on `req.user`) and the guards `requireUser` (401 `Please log in.`) and `requireAdmin` (401, or 403 `Admins only.`)
- [x] `POST /api/auth/register` takes `{ email, name, password }` only (a `role` in the body is ignored), makes the user and a session, sets the cookie and answers 201 with `{ user }`
- [x] `POST /api/auth/login` answers 200 with `{ user }` and a new cookie; a wrong password and an unknown email both answer 401 `Wrong email or password.` with no cookie
- [x] `POST /api/auth/logout` ends the session of the cookie, clears the cookie and answers 204 (also when nobody is logged in); other sessions of the same user stay
- [x] `GET /api/auth/me` answers `{ user }`, or 401 `Not logged in.`
- [x] `createApp` uses `attachUser(db)` right after `express.json()`
- [x] `npm run verify -- 038` passes (tests: `tests/task-038*.test.*`)

## Hints

- The routes go right before the `GET /api/rentals` route. The errors from `createUser` (400, 409) already reach the error handler with their `status`.
- Never put the password or the hash in an answer: `createUser` and `authenticate` already return only `{ id, email, name, role }`.
- `requireUser` and `requireAdmin` are used by later tickets: write them now exactly as shown.

## Prompt

Run `pi` (or `opencode`) in the repo root, then paste:

````text
Context: AGENTS.md (already loaded) has the stack, the conventions, the editing rules and a project map. Use it. Do NOT list or scan the project. Open only the files named below.
Rules: only change the files listed. Do not touch tests/. Do not write files with heredocs. Write each file only once; do not write the same file again and again.

First: `git mv backlog/todo/038-auth-routes.md backlog/in-progress/038-auth-routes.md`. (If it says the file is not there, it is already moved: go on.)

Task: Accounts work in the API. Four routes under `/api/auth` register, log in, log out and tell who is logged in. The login is a session cookie that the browser sends by itself.

Read first: `server/app.js`.
Edit or create: `server/auth.js` (new), `server/app.js`.

Steps:
1. Write the complete file `server/auth.js` with the write tool, with exactly this content:
```js
import { findSessionUser, SESSION_DAYS } from './sessions.js'

export const COOKIE = 'sid'

// The value of one cookie from the request, or null.
export function readCookie(req, name) {
  for (const part of String(req.headers.cookie ?? '').split(';')) {
    const [key, ...rest] = part.trim().split('=')
    if (key === name) return rest.join('=')
  }
  return null
}

// HttpOnly: the page's JavaScript cannot read it. SameSite=Lax: other sites cannot send it along with a form post.
export function setSessionCookie(res, token) {
  res.setHeader('Set-Cookie', `${COOKIE}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_DAYS * 86400}`)
}

export function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', `${COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`)
}

// Puts the logged-in user (or null) on every request as `req.user`.
export function attachUser(db) {
  return (req, res, next) => {
    req.user = findSessionUser(db, readCookie(req, COOKIE))
    next()
  }
}

export function requireUser(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Please log in.' })
  next()
}

export function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Please log in.' })
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admins only.' })
  next()
}
```
2. Change `server/app.js` with 3 SEPARATE edit calls, one after the other. Each call is small. Do NOT rewrite the whole file, and do NOT merge calls: a long edit can run past the output limit.
   For each call, oldText must match the file exactly: copy it from here. If a call fails, read the file once and correct oldText from what you read. Do not guess. Do the calls in order, each one right after the last.
   Call 1. oldText:
```js
import { listRentals, createRental, RentalError } from './rentals.js'

```
   newText:
```js
import { listRentals, createRental, RentalError } from './rentals.js'
import { attachUser, readCookie, setSessionCookie, clearSessionCookie, COOKIE } from './auth.js'
import { createUser, authenticate } from './users.js'
import { createSession, deleteSession } from './sessions.js'

```
   Call 2. oldText:
```js
  app.use(express.json())

```
   newText:
```js
  app.use(express.json())
  app.use(attachUser(db))

```
   Call 3. oldText:
```js
  app.get('/api/rentals', (req, res) => {

```
   newText:
```js
  app.post('/api/auth/register', (req, res) => {
    const user = createUser(db, { email: req.body?.email, name: req.body?.name, password: req.body?.password })
    setSessionCookie(res, createSession(db, user.id))
    res.status(201).json({ user })
  })

  app.post('/api/auth/login', (req, res) => {
    const user = authenticate(db, req.body?.email, req.body?.password)
    if (!user) return res.status(401).json({ error: 'Wrong email or password.' })
    setSessionCookie(res, createSession(db, user.id))
    res.json({ user })
  })

  app.post('/api/auth/logout', (req, res) => {
    const token = readCookie(req, COOKIE)
    if (token) deleteSession(db, token)
    clearSessionCookie(res)
    res.status(204).end()
  })

  app.get('/api/auth/me', (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'Not logged in.' })
    res.json({ user: req.user })
  })

  app.get('/api/rentals', (req, res) => {

```

When done:
- Run `npm run verify -- 038`. If it says FAIL: read the lines under FAIL, fix the files, and run it again. Repeat until the last line is `VERIFY PASSED`.
- NEVER edit files in `tests/`, `package.json` or files the task does not list.
- Tick the checkboxes with this one command: `sed -i '' 's/- \[ \]/- [x]/' backlog/in-progress/038-auth-routes.md`, then `git mv backlog/in-progress/038-auth-routes.md backlog/done/038-auth-routes.md`.
- `git add -A && git commit -m "task 038: Register, login, logout and me with a session cookie"`
If something is unclear or verify fails 3 times in a row: add a `## Notes` section to the task file explaining the problem and stop.
````
