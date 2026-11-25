# 035 — Accounts: password hashing

**Type:** feature
**Depends on:** 034
**Files:** `server/passwords.js` (new)

## Goal

A new file `server/passwords.js` turns passwords into safe text for the database and checks them later. It uses `scrypt` from Node itself: passwords are never stored as they are typed.

## Acceptance criteria

- [ ] `hashPassword(password)` returns `scrypt$<salt in hex>$<hash in hex>`: a new random 16-byte salt every time and a 64-byte scrypt hash
- [ ] `verifyPassword(password, stored)` is `true` only for the right password; it uses a constant-time comparison (`timingSafeEqual`)
- [ ] `verifyPassword` returns `false`, and never throws, for broken or foreign stored text and for a password that is not a string
- [ ] `npm run verify -- 035` passes (tests: `tests/task-035*.test.*`)

## Hints

- Everything comes from `node:crypto`: `randomBytes`, `scryptSync` and `timingSafeEqual`. No package.
- The hash is as long as the stored hash: read its length from the stored text, so the length can change later without breaking old passwords.
- `scryptSync` takes about 50 ms. That is on purpose: it makes guessing passwords slow.

## Prompt

Run `pi` (or `opencode`) in the repo root, then paste:

````text
Context: AGENTS.md (already loaded) has the stack, the conventions, the editing rules and a project map. Use it. Do NOT list or scan the project. Open only the files named below.
Rules: only change the files listed. Do not touch tests/. Do not write files with heredocs. Write each file only once; do not write the same file again and again.

First: `git mv backlog/todo/035-passwords.md backlog/in-progress/035-passwords.md`. (If it says the file is not there, it is already moved: go on.)

Task: A new file `server/passwords.js` turns passwords into safe text for the database and checks them later. It uses `scrypt` from Node itself: passwords are never stored as they are typed.

Read first: nothing. All the code you need is below.
Edit or create: `server/passwords.js` (new).

Steps:
1. Write the complete file `server/passwords.js` with the write tool, with exactly this content:
```js
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

const KEY_LENGTH = 64

// Turns a password into text that is safe to store: `scrypt$<salt>$<hash>`.
// A new random salt each time, so the same password never gives the same text twice.
export function hashPassword(password) {
  const salt = randomBytes(16)
  const hash = scryptSync(password, salt, KEY_LENGTH)
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`
}

// True when the password belongs to the stored text. Never throws for odd input.
export function verifyPassword(password, stored) {
  if (typeof password !== 'string') return false
  const [scheme, saltHex, hashHex] = String(stored).split('$')
  if (scheme !== 'scrypt' || !saltHex || !hashHex) return false
  const expected = Buffer.from(hashHex, 'hex')
  if (expected.length === 0) return false
  const actual = scryptSync(password, Buffer.from(saltHex, 'hex'), expected.length)
  return timingSafeEqual(actual, expected)
}
```

When done:
- Run `npm run verify -- 035`. If it says FAIL: read the lines under FAIL, fix the files, and run it again. Repeat until the last line is `VERIFY PASSED`.
- NEVER edit files in `tests/`, `package.json` or files the task does not list.
- Tick the checkboxes with this one command: `sed -i '' 's/- \[ \]/- [x]/' backlog/in-progress/035-passwords.md`, then `git mv backlog/in-progress/035-passwords.md backlog/done/035-passwords.md`.
- `git add -A && git commit -m "task 035: Password hashing with scrypt"`
If something is unclear or verify fails 3 times in a row: add a `## Notes` section to the task file explaining the problem and stop.
````
