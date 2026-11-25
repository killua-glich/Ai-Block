# 041 — API: admins add, change and delete devices

**Type:** feature
**Depends on:** 040
**Files:** `server/devices.js`, `server/app.js`

## Goal

Admins can add, change and delete devices through the API. Everyone else gets 401 or 403.

## Acceptance criteria

- [x] `server/devices.js` exports `DeviceError` (with a `status`) and the functions `createDevice(db, input, now)`, `updateDevice(db, id, input, now)` and `deleteDevice(db, id)`; `createDevice` and `updateDevice` check the input with the exact messages in the code below (status 400), clean up the text, and `updateDevice` stores the update time
- [x] A name that exists already answers 409 `A device with that name already exists.`; an unknown device answers 404 `Device not found`; a device that has rentals cannot be deleted (409)
- [x] `POST /api/devices` (201 with the device), `PUT /api/devices/:id` (200 with the device) and `DELETE /api/devices/:id` (204) use `requireAdmin`: 401 without a login, 403 for a normal user
- [x] `npm run verify -- 041` passes (tests: `tests/task-041*.test.*`)

## Hints

- Add the new code at the end of `server/devices.js`, in two steps. Import `requireAdmin` in the existing `./auth.js` import line of `server/app.js` and the new functions in the existing `./devices.js` import line.
- Put the three routes right before the `GET /api/rentals` route.
- The error handler in `server/app.js` already turns any error with a `status` into the right answer.

## Prompt

Run `pi` (or `opencode`) in the repo root, then paste:

````text
Context: AGENTS.md (already loaded) has the stack, the conventions, the editing rules and a project map. Use it. Do NOT list or scan the project. Open only the files named below.
Rules: only change the files listed. Do not touch tests/. Do not write files with heredocs. Write each file only once; do not write the same file again and again.

First: `git mv backlog/todo/041-device-admin-api.md backlog/in-progress/041-device-admin-api.md`. (If it says the file is not there, it is already moved: go on.)

Task: Admins can add, change and delete devices through the API. Everyone else gets 401 or 403.

Read first: `server/devices.js`, `server/app.js`.
Edit or create: `server/devices.js`, `server/app.js`.

Steps:
1. Change `server/devices.js` with 2 SEPARATE edit calls, one after the other. Each call is small. Do NOT rewrite the whole file, and do NOT merge calls: a long edit can run past the output limit.
   For each call, oldText must match the file exactly: copy it from here. If a call fails, read the file once and correct oldText from what you read. Do not guess. Do the calls in order, each one right after the last.
   Call 1. oldText:
```js
  return row ? toDevice(row) : null
}

```
   newText:
```js
  return row ? toDevice(row) : null
}

// An error with the HTTP status the API should answer with.
export class DeviceError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

// Checks the fields of a device from the admin form and returns them cleaned up.
function readDevice(input) {
  const { name, category, pricePerDay, description = '', specs = [], available = true } = input ?? {}
  const cleanName = typeof name === 'string' ? name.trim() : ''
  if (cleanName.length < 1 || cleanName.length > 120) throw new DeviceError(400, 'Please enter a name (up to 120 characters).')
  const cleanCategory = typeof category === 'string' ? category.trim() : ''
  if (cleanCategory.length < 1 || cleanCategory.length > 40) throw new DeviceError(400, 'Please enter a category (up to 40 characters).')
  if (typeof pricePerDay !== 'number' || !Number.isFinite(pricePerDay) || pricePerDay < 0) {
    throw new DeviceError(400, 'The price per day must be a number, zero or more.')
  }
  if (typeof description !== 'string' || description.length > 1000) {
    throw new DeviceError(400, 'The description must be text of up to 1000 characters.')
  }
  if (!Array.isArray(specs) || specs.length > 20 || specs.some((s) => typeof s !== 'string' || s.trim() === '')) {
    throw new DeviceError(400, 'The specs must be a list of up to 20 texts.')
  }
  if (typeof available !== 'boolean') throw new DeviceError(400, 'Available must be true or false.')
  return { name: cleanName, category: cleanCategory, pricePerDay, description, specs: specs.map((s) => s.trim()), available }
}

```
   Call 2. oldText:
```js
  return { name: cleanName, category: cleanCategory, pricePerDay, description, specs: specs.map((s) => s.trim()), available }
}

```
   newText:
```js
  return { name: cleanName, category: cleanCategory, pricePerDay, description, specs: specs.map((s) => s.trim()), available }
}

// A second device with the same name breaks the unique index: say so in plain words.
function rethrow(err) {
  if (/UNIQUE/.test(err.message)) throw new DeviceError(409, 'A device with that name already exists.')
  throw err
}

export function createDevice(db, input, now = new Date().toISOString()) {
  const d = readDevice(input)
  try {
    const result = db
      .prepare('INSERT INTO devices (name, category, price_per_day, description, specs, available, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(d.name, d.category, d.pricePerDay, d.description, JSON.stringify(d.specs), d.available ? 1 : 0, now)
    return getDevice(db, Number(result.lastInsertRowid))
  } catch (err) {
    return rethrow(err)
  }
}

export function updateDevice(db, id, input, now = new Date().toISOString()) {
  if (!getDevice(db, id)) throw new DeviceError(404, 'Device not found')
  const d = readDevice(input)
  try {
    db.prepare(
      'UPDATE devices SET name = ?, category = ?, price_per_day = ?, description = ?, specs = ?, available = ?, updated_at = ? WHERE id = ?',
    ).run(d.name, d.category, d.pricePerDay, d.description, JSON.stringify(d.specs), d.available ? 1 : 0, now, id)
  } catch (err) {
    rethrow(err)
  }
  return getDevice(db, id)
}

// A device that has rentals cannot be deleted: mark it as not available instead.
export function deleteDevice(db, id) {
  if (!getDevice(db, id)) throw new DeviceError(404, 'Device not found')
  try {
    db.prepare('DELETE FROM devices WHERE id = ?').run(id)
  } catch (err) {
    if (/FOREIGN KEY/.test(err.message)) {
      throw new DeviceError(409, 'This device has rentals and cannot be deleted. Mark it as not available instead.')
    }
    throw err
  }
}

```
2. Change `server/app.js` with 3 SEPARATE edit calls, one after the other. Each call is small. Do NOT rewrite the whole file, and do NOT merge calls: a long edit can run past the output limit.
   For each call, oldText must match the file exactly: copy it from here. If a call fails, read the file once and correct oldText from what you read. Do not guess. Do the calls in order, each one right after the last.
   Call 1. oldText:
```js
import { listDevices, getDevice } from './devices.js'
```
   newText:
```js
import { listDevices, getDevice, createDevice, updateDevice, deleteDevice } from './devices.js'
```
   Call 2. oldText:
```js
import { attachUser, requireUser, readCookie,
```
   newText:
```js
import { attachUser, requireUser, requireAdmin, readCookie,
```
   Call 3. oldText:
```js
  app.get('/api/rentals', requireUser, (req, res) => {

```
   newText:
```js
  app.post('/api/devices', requireAdmin, (req, res) => {
    res.status(201).json(createDevice(db, req.body))
  })

  app.put('/api/devices/:id', requireAdmin, (req, res) => {
    res.json(updateDevice(db, Number(req.params.id), req.body))
  })

  app.delete('/api/devices/:id', requireAdmin, (req, res) => {
    deleteDevice(db, Number(req.params.id))
    res.status(204).end()
  })

  app.get('/api/rentals', requireUser, (req, res) => {

```

When done:
- Run `npm run verify -- 041`. If it says FAIL: read the lines under FAIL, fix the files, and run it again. Repeat until the last line is `VERIFY PASSED`.
- NEVER edit files in `tests/`, `package.json` or files the task does not list.
- Tick the checkboxes with this one command: `sed -i '' 's/- \[ \]/- [x]/' backlog/in-progress/041-device-admin-api.md`, then `git mv backlog/in-progress/041-device-admin-api.md backlog/done/041-device-admin-api.md`.
- `git add -A && git commit -m "task 041: Admin API for devices"`
If something is unclear or verify fails 3 times in a row: add a `## Notes` section to the task file explaining the problem and stop.
````
