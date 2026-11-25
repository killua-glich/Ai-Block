# 030 — Web site: the rental form saves through the API

**Type:** feature
**Depends on:** 029
**Files:** `src/components/RentalForm.jsx`

## Goal

The rental form sends the rental to the API instead of saving it in the browser. It shows the message of the server when the rental is refused, and switches the button off while it saves.

## Acceptance criteria

- [x] `RentalForm.jsx` imports `postRental` from `../data/api.js` and no longer imports `addRental`
- [x] Clicking Rent calls `postRental({ deviceId, startDate, endDate })`; when it works the form shows `Rental confirmed!` and empties the dates
- [x] When it fails, the form shows the error message in a `<p className="error">` under the date checks, does not confirm, keeps the dates, and forgets the message at the next try
- [x] The Rent button is disabled while the rental is being saved; the date checks and the price summary work as before
- [x] `npm run verify -- 030` passes (tests: `tests/task-030*.test.*`)

## Hints

- Make `handleRent` an `async` function and use `try { ... } catch (err) { ... } finally { ... }`.
- The message to show is `err.message`: the API client already makes it clear (for example `Those dates are already booked.`).
- Do not touch `src/data/rentals.js`: nothing uses it any more, but an old test still checks it.

## Prompt

Run `pi` (or `opencode`) in the repo root, then paste:

````text
Context: AGENTS.md (already loaded) has the stack, the conventions, the editing rules and a project map. Use it. Do NOT list or scan the project. Open only the files named below.
Rules: only change the files listed. Do not touch tests/. Do not write files with heredocs. Write each file only once; do not write the same file again and again.

First: `git mv backlog/todo/030-form-saves-via-api.md backlog/in-progress/030-form-saves-via-api.md`. (If it says the file is not there, it is already moved: go on.)

Task: The rental form sends the rental to the API instead of saving it in the browser. It shows the message of the server when the rental is refused, and switches the button off while it saves.

Read first: `src/components/RentalForm.jsx`.
Edit or create: `src/components/RentalForm.jsx`.

Steps:
1. Change `src/components/RentalForm.jsx` with 5 SEPARATE edit calls, one after the other. Each call is small. Do NOT rewrite the whole file, and do NOT merge calls: a long edit can run past the output limit.
   For each call, oldText must match the file exactly: copy it from here. If a call fails, read the file once and correct oldText from what you read. Do not guess. Do the calls in order, each one right after the last.
   Call 1. oldText:
```jsx
import { addRental } from '../data/rentals.js'

```
   newText:
```jsx
import { postRental } from '../data/api.js'

```
   Call 2. oldText:
```jsx
  const [confirmed, setConfirmed] = useState(false)

```
   newText:
```jsx
  const [confirmed, setConfirmed] = useState(false)
  const [serverError, setServerError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

```
   Call 3. oldText:
```jsx
  function handleRent() {
    addRental({ id: crypto.randomUUID(), deviceId: device.id, startDate, endDate, totalPrice: total, createdAt: new Date().toISOString() })
    setConfirmed(true)
    setStartDate('')
    setEndDate('')
  }

```
   newText:
```jsx
  async function handleRent() {
    setIsSaving(true)
    setServerError('')
    try {
      await postRental({ deviceId: device.id, startDate, endDate })
      setConfirmed(true)
      setStartDate('')
      setEndDate('')
    } catch (err) {
      setConfirmed(false)
      setServerError(err.message)
    } finally {
      setIsSaving(false)
    }
  }

```
   Call 4. oldText:
```jsx
      {error && <p className="error">{error}</p>}

```
   newText:
```jsx
      {error && <p className="error">{error}</p>}
      {serverError && <p className="error">{serverError}</p>}

```
   Call 5. oldText:
```jsx
disabled={!(days > 0 && device.available)}
```
   newText:
```jsx
disabled={!(days > 0 && device.available) || isSaving}
```

When done:
- Run `npm run verify -- 030`. If it says FAIL: read the lines under FAIL, fix the files, and run it again. Repeat until the last line is `VERIFY PASSED`.
- NEVER edit files in `tests/`, `package.json` or files the task does not list.
- Tick the checkboxes with this one command: `sed -i '' 's/- \[ \]/- [x]/' backlog/in-progress/030-form-saves-via-api.md`, then `git mv backlog/in-progress/030-form-saves-via-api.md backlog/done/030-form-saves-via-api.md`.
- `git add -A && git commit -m "task 030: Rental form saves through the API"`
If something is unclear or verify fails 3 times in a row: add a `## Notes` section to the task file explaining the problem and stop.
````
