# 040 — API: cancel a rental

**Type:** feature
**Depends on:** 039
**Files:** `server/rentals.js`, `server/app.js`

## Goal

A user can cancel a rental that has not started yet. The rental stays in the list with the status `cancelled`, and its days can be booked again.

## Acceptance criteria

- [ ] `toRental` also gives `cancelledAt` (`null` while active) and `createRental` returns `cancelledAt: null` as well
- [ ] `cancelRental(db, id, user, today)` in `server/rentals.js` sets the status to `cancelled` and the cancel time and returns the rental
- [ ] It throws a `RentalError` 404 `Rental not found` for an unknown rental and for the rental of someone else (an admin may cancel any rental), 409 `This rental is already cancelled.` and 409 `A rental that has started cannot be cancelled.` (the start date is today or earlier)
- [ ] `POST /api/rentals/:id/cancel` uses `requireUser` and answers 200 with the cancelled rental
- [ ] `npm run verify -- 040` passes (tests: `tests/task-040*.test.*`)

## Hints

- Put the new route right after the `POST /api/rentals` route, and import `cancelRental` in the existing import line of `server/app.js`.
- The rental of someone else answers "not found" and not "forbidden", so that nobody can find out which rental ids exist.
- Step 034 already made the overlap check ignore cancelled rentals: nothing to do for that.

## Prompt

Run `pi` (or `opencode`) in the repo root, then paste:

````text
Context: AGENTS.md (already loaded) has the stack, the conventions, the editing rules and a project map. Use it. Do NOT list or scan the project. Open only the files named below.
Rules: only change the files listed. Do not touch tests/. Do not write files with heredocs. Write each file only once; do not write the same file again and again.

First: `git mv backlog/todo/040-cancel-rental.md backlog/in-progress/040-cancel-rental.md`. (If it says the file is not there, it is already moved: go on.)

Task: A user can cancel a rental that has not started yet. The rental stays in the list with the status `cancelled`, and its days can be booked again.

Read first: `server/rentals.js`, `server/app.js`.
Edit or create: `server/rentals.js`, `server/app.js`.

Steps:
1. Change `server/rentals.js` with 3 SEPARATE edit calls, one after the other. Each call is small. Do NOT rewrite the whole file, and do NOT merge calls: a long edit can run past the output limit.
   For each call, oldText must match the file exactly: copy it from here. If a call fails, read the file once and correct oldText from what you read. Do not guess. Do the calls in order, each one right after the last.
   Call 1. oldText:
```js
    userId: row.user_id,

```
   newText:
```js
    userId: row.user_id,
    cancelledAt: row.cancelled_at,

```
   Call 2. oldText:
```js
    userId,
  }

```
   newText:
```js
    userId,
    cancelledAt: null,
  }

```
   Call 3. oldText:
```js
  return rental
}

```
   newText:
```js
  return rental
}

// Cancels a rental that has not started yet. The owner may do it, and an admin. Anyone else gets "not found".
export function cancelRental(db, id, user, today = new Date().toISOString().slice(0, 10)) {
  const row = db.prepare('SELECT * FROM rentals WHERE id = ?').get(String(id))
  const isAllowed = row && (row.user_id === user.id || user.role === 'admin')
  if (!isAllowed) throw new RentalError(404, 'Rental not found')
  if (row.status === 'cancelled') throw new RentalError(409, 'This rental is already cancelled.')
  if (row.start_date <= today) throw new RentalError(409, 'A rental that has started cannot be cancelled.')

  db.prepare("UPDATE rentals SET status = 'cancelled', cancelled_at = ? WHERE id = ?").run(new Date().toISOString(), row.id)
  return toRental(db.prepare('SELECT * FROM rentals WHERE id = ?').get(row.id))
}

```
2. Change `server/app.js` with 2 SEPARATE edit calls, one after the other. Each call is small. Do NOT rewrite the whole file, and do NOT merge calls: a long edit can run past the output limit.
   For each call, oldText must match the file exactly: copy it from here. If a call fails, read the file once and correct oldText from what you read. Do not guess. Do the calls in order, each one right after the last.
   Call 1. oldText:
```js
import { listRentals, createRental, RentalError } from './rentals.js'
```
   newText:
```js
import { listRentals, createRental, cancelRental, RentalError } from './rentals.js'
```
   Call 2. oldText:
```js
    res.status(201).json(rental)
  })

```
   newText:
```js
    res.status(201).json(rental)
  })

  app.post('/api/rentals/:id/cancel', requireUser, (req, res) => {
    res.json(cancelRental(db, req.params.id, req.user))
  })

```

When done:
- Run `npm run verify -- 040`. If it says FAIL: read the lines under FAIL, fix the files, and run it again. Repeat until the last line is `VERIFY PASSED`.
- NEVER edit files in `tests/`, `package.json` or files the task does not list.
- Tick the checkboxes with this one command: `sed -i '' 's/- \[ \]/- [x]/' backlog/in-progress/040-cancel-rental.md`, then `git mv backlog/in-progress/040-cancel-rental.md backlog/done/040-cancel-rental.md`.
- `git add -A && git commit -m "task 040: Cancel a rental"`
If something is unclear or verify fails 3 times in a row: add a `## Notes` section to the task file explaining the problem and stop.
````
