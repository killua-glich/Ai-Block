# 031 — Web site: My rentals reads the rentals from the API

**Type:** feature
**Depends on:** 030
**Files:** `src/pages/MyRentals.jsx`

## Goal

The My rentals page loads the rentals from the API. It shows a loading message first, and a clear error when they cannot be loaded.

## Acceptance criteria

- [x] `MyRentals.jsx` no longer imports `getRentals` or `src/data/devices.js`; it uses `fetchRentals` from `../data/api.js` and `useDevices` from `../data/useDevices.js`
- [x] While the rentals load, the page shows the `h1` "My rentals" and a `<p className="muted">` with `Loading your rentals …`
- [x] When loading fails, the page shows the `h1` and a `<p className="error">` with `Could not load your rentals. Is the server running?` (and not the empty state)
- [x] When it works, the page looks as before: Active and Past tables, or the empty state; the device names come from `useDevices()`
- [x] `npm run verify -- 031` passes (tests: `tests/task-031*.test.*`)

## Hints

- Keep the state in `useState(null)` for the rentals (`null` means not loaded yet) and `useState(false)` for the failure.
- Load with `useEffect(..., [])`. Guard with `let isActive = true` and a cleanup `return () => { isActive = false }`, so a page you have left is never updated.
- Put the two early `return`s (failed, still loading) right after the hooks and before the line `const today = ...`.

## Prompt

Run `pi` (or `opencode`) in the repo root, then paste:

````text
Context: AGENTS.md (already loaded) has the stack, the conventions, the editing rules and a project map. Use it. Do NOT list or scan the project. Open only the files named below.
Rules: only change the files listed. Do not touch tests/. Do not write files with heredocs. Write each file only once; do not write the same file again and again.

First: `git mv backlog/todo/031-rentals-from-api.md backlog/in-progress/031-rentals-from-api.md`. (If it says the file is not there, it is already moved: go on.)

Task: The My rentals page loads the rentals from the API. It shows a loading message first, and a clear error when they cannot be loaded.

Read first: `src/pages/MyRentals.jsx`.
Edit or create: `src/pages/MyRentals.jsx`.

Steps:
1. Change `src/pages/MyRentals.jsx` with 2 SEPARATE edit calls, one after the other. Each call is small. Do NOT rewrite the whole file, and do NOT merge calls: a long edit can run past the output limit.
   For each call, oldText must match the file exactly: copy it from here. If a call fails, read the file once and correct oldText from what you read. Do not guess. Do the calls in order, each one right after the last.
   Call 1. oldText:
```jsx
import { Link } from 'react-router-dom'
import { getRentals } from '../data/rentals.js'
import devices from '../data/devices.js'

```
   newText:
```jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchRentals } from '../data/api.js'
import { useDevices } from '../data/useDevices.js'

```
   Call 2. oldText:
```jsx
  const rentals = getRentals()

```
   newText:
```jsx
  const devices = useDevices()
  const [rentals, setRentals] = useState(null)
  const [hasFailed, setHasFailed] = useState(false)

  useEffect(() => {
    let isActive = true
    fetchRentals()
      .then((list) => {
        if (isActive) setRentals(list)
      })
      .catch(() => {
        if (isActive) setHasFailed(true)
      })
    return () => {
      isActive = false
    }
  }, [])

  if (hasFailed) {
    return (
      <section>
        <h1>My rentals</h1>
        <p className="error">Could not load your rentals. Is the server running?</p>
      </section>
    )
  }
  if (rentals === null) {
    return (
      <section>
        <h1>My rentals</h1>
        <p className="muted">Loading your rentals …</p>
      </section>
    )
  }


```

When done:
- Run `npm run verify -- 031`. If it says FAIL: read the lines under FAIL, fix the files, and run it again. Repeat until the last line is `VERIFY PASSED`.
- NEVER edit files in `tests/`, `package.json` or files the task does not list.
- Tick the checkboxes with this one command: `sed -i '' 's/- \[ \]/- [x]/' backlog/in-progress/031-rentals-from-api.md`, then `git mv backlog/in-progress/031-rentals-from-api.md backlog/done/031-rentals-from-api.md`.
- `git add -A && git commit -m "task 031: My rentals reads from the API"`
If something is unclear or verify fails 3 times in a row: add a `## Notes` section to the task file explaining the problem and stop.
````
