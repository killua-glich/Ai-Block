# 024 — Database: create and list rentals

**Type:** feature
**Depends on:** 023
**Files:** `server/rentals.js` (new)

## Goal

A new file `server/rentals.js` saves rentals in the database and lists them. It checks every rule: valid dates, not in the past, device exists, device available, and no two rentals of one device on the same days.

## Acceptance criteria

- [x] `listRentals(db)` returns all rentals as `{ id, deviceId, startDate, endDate, totalPrice, createdAt }`, ordered by creation time
- [x] `createRental(db, input, today)` takes `{ deviceId, startDate, endDate }`, makes a UUID `id`, works out `totalPrice` (days counted from the first to the last day, both included, times the daily price), saves the rental and returns it
- [x] It throws a `RentalError` (which has a `status` and a `message`) for: a `deviceId` that is not a whole number or dates not written `YYYY-MM-DD` (400); an end date before the start date, message `End date must be after start date.` (400); a start date before `today`, message `Start date cannot be in the past.` (400); an unknown device, message `Device not found` (404); an unavailable device, message `This device is currently not available.` (409); dates that overlap another rental of the same device, message `Those dates are already booked.` (409)
- [x] A refused rental is not saved. `today` defaults to the real date as `YYYY-MM-DD`
- [x] `npm run verify -- 024` passes (tests: `tests/task-024*.test.*`)

## Hints

- The messages are exactly the texts the rental form shows: keep them as they are.
- Two stays overlap when one starts on or before the day the other ends and ends on or after the day the other starts. The SQL line in the code below does that check.
- `export class RentalError extends Error` is also used later by the API to pick the HTTP status.

## Prompt

Run `pi` (or `opencode`) in the repo root, then paste:

````text
Context: AGENTS.md (already loaded) has the stack, the conventions, the editing rules and a project map. Use it. Do NOT list or scan the project. Open only the files named below.
Rules: only change the files listed. Do not touch tests/. Do not write files with heredocs. Write each file only once; do not write the same file again and again.

First: `git mv backlog/todo/024-db-rentals.md backlog/in-progress/024-db-rentals.md`. (If it says the file is not there, it is already moved: go on.)

Task: A new file `server/rentals.js` saves rentals in the database and lists them. It checks every rule: valid dates, not in the past, device exists, device available, and no two rentals of one device on the same days.

Read first: `server/devices.js`.
Edit or create: `server/rentals.js` (new).

Steps:
1. Write the complete file `server/rentals.js` with the write tool, with exactly this content:
```js
import { randomUUID } from 'node:crypto'
import { getDevice } from './devices.js'

const DATE = /^\d{4}-\d{2}-\d{2}$/

// An error with the HTTP status the API should answer with.
export class RentalError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

function toRental(row) {
  return {
    id: row.id,
    deviceId: row.device_id,
    startDate: row.start_date,
    endDate: row.end_date,
    totalPrice: row.total_price,
    createdAt: row.created_at,
  }
}

export function listRentals(db) {
  return db.prepare('SELECT * FROM rentals ORDER BY created_at, id').all().map(toRental)
}

// Checks the request, works out the price and saves the rental.
// `today` is a parameter so tests can pick the day.
export function createRental(db, input, today = new Date().toISOString().slice(0, 10)) {
  const { deviceId, startDate, endDate } = input ?? {}
  if (!Number.isInteger(deviceId)) throw new RentalError(400, 'deviceId must be a whole number')
  if (!DATE.test(startDate ?? '') || !DATE.test(endDate ?? '')) throw new RentalError(400, 'Dates must look like YYYY-MM-DD')
  if (endDate < startDate) throw new RentalError(400, 'End date must be after start date.')
  if (startDate < today) throw new RentalError(400, 'Start date cannot be in the past.')

  const device = getDevice(db, deviceId)
  if (!device) throw new RentalError(404, 'Device not found')
  if (!device.available) throw new RentalError(409, 'This device is currently not available.')

  const clash = db
    .prepare('SELECT 1 FROM rentals WHERE device_id = ? AND start_date <= ? AND end_date >= ?')
    .get(deviceId, endDate, startDate)
  if (clash) throw new RentalError(409, 'Those dates are already booked.')

  const days = Math.round((Date.parse(endDate) - Date.parse(startDate)) / 86400000) + 1
  const rental = {
    id: randomUUID(),
    deviceId,
    startDate,
    endDate,
    totalPrice: days * device.pricePerDay,
    createdAt: new Date().toISOString(),
  }
  db.prepare(
    'INSERT INTO rentals (id, device_id, start_date, end_date, total_price, created_at) VALUES (?, ?, ?, ?, ?, ?)',
  ).run(rental.id, rental.deviceId, rental.startDate, rental.endDate, rental.totalPrice, rental.createdAt)
  return rental
}
```

When done:
- Run `npm run verify -- 024`. If it says FAIL: read the lines under FAIL, fix the files, and run it again. Repeat until the last line is `VERIFY PASSED`.
- NEVER edit files in `tests/`, `package.json` or files the task does not list.
- Tick the checkboxes with this one command: `sed -i '' 's/- \[ \]/- [x]/' backlog/in-progress/024-db-rentals.md`, then `git mv backlog/in-progress/024-db-rentals.md backlog/done/024-db-rentals.md`.
- `git add -A && git commit -m "task 024: Create and list rentals in SQLite"`
If something is unclear or verify fails 3 times in a row: add a `## Notes` section to the task file explaining the problem and stop.
````
