# 046 — Web site: My rentals and renting need a login

**Type:** feature
**Depends on:** 045
**Files:** `src/components/RequireLogin.jsx` (new), `src/App.jsx`, `src/components/RentalForm.jsx`

## Goal

A visitor who is not logged in is sent from My rentals to the login page and comes back after logging in. On a device page the Rent button is replaced by a link to log in.

## Acceptance criteria

- [x] `src/components/RequireLogin.jsx` (new) shows its children, except when `useAuth().status` is `anonymous`: then it redirects with `<Navigate to="/login" replace state={{ from: location.pathname }} />`
- [x] `App.jsx` wraps the page in the `/rentals` route: `<RequireLogin><MyRentals /></RequireLogin>`
- [x] `RentalForm.jsx`: when the status is `anonymous` the Rent button is replaced by `<p className="muted">` with a link `Log in` (to `/login`, with `state={{ from: '/devices/ID' }}`) and the text ` to rent this device.`; in every other case the button is there as before
- [x] `npm run verify -- 046` passes (tests: `tests/task-046*.test.*`)

## Hints

- Only a status of exactly `anonymous` blocks. While loading, or when the server cannot be reached, everything is shown.
- `RentalForm` needs two more imports at the top: `Link` from `react-router-dom` and `useAuth` from `../data/AuthContext.jsx`. Call `const { status } = useAuth()` next to the other `useState` lines.
- Make the changes to `RentalForm.jsx` with 3 separate edit calls: the imports, the `useAuth` line, and the button.

## Prompt

Run `pi` (or `opencode`) in the repo root, then paste:

````text
Context: AGENTS.md (already loaded) has the stack, the conventions, the editing rules and a project map. Use it. Do NOT list or scan the project. Open only the files named below.
Rules: only change the files listed. Do not touch tests/. Do not write files with heredocs. Write each file only once; do not write the same file again and again.

First: `git mv backlog/todo/046-login-needed.md backlog/in-progress/046-login-needed.md`. (If it says the file is not there, it is already moved: go on.)

Task: A visitor who is not logged in is sent from My rentals to the login page and comes back after logging in. On a device page the Rent button is replaced by a link to log in.

Read first: `src/App.jsx`, `src/components/RentalForm.jsx`.
Edit or create: `src/components/RequireLogin.jsx` (new), `src/App.jsx`, `src/components/RentalForm.jsx`.

Steps:
1. Write the complete file `src/components/RequireLogin.jsx` with the write tool, with exactly this content:
```jsx
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../data/AuthContext.jsx'

// Sends a visitor who is known to be logged out to the login page, and brings them back afterwards.
// While the server has not answered, or cannot be reached, the page is shown: the server checks every request anyway.
export default function RequireLogin({ children }) {
  const { status } = useAuth()
  const location = useLocation()
  if (status === 'anonymous') return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return children
}
```
2. Change `src/App.jsx` with 2 SEPARATE edit calls, one after the other. Each call is small. Do NOT rewrite the whole file, and do NOT merge calls: a long edit can run past the output limit.
   For each call, oldText must match the file exactly: copy it from here. If a call fails, read the file once and correct oldText from what you read. Do not guess. Do the calls in order, each one right after the last.
   Call 1. oldText:
```jsx
import Footer from './components/Footer.jsx'

```
   newText:
```jsx
import Footer from './components/Footer.jsx'
import RequireLogin from './components/RequireLogin.jsx'

```
   Call 2. oldText:
```jsx
<Route path="/rentals" element={<MyRentals />} />
```
   newText:
```jsx
<Route path="/rentals" element={<RequireLogin><MyRentals /></RequireLogin>} />
```
3. Change `src/components/RentalForm.jsx` with 3 SEPARATE edit calls, one after the other. Each call is small. Do NOT rewrite the whole file, and do NOT merge calls: a long edit can run past the output limit.
   For each call, oldText must match the file exactly: copy it from here. If a call fails, read the file once and correct oldText from what you read. Do not guess. Do the calls in order, each one right after the last.
   Call 1. oldText:
```jsx
import { useState } from 'react'
import { postRental } from '../data/api.js'

```
   newText:
```jsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { postRental } from '../data/api.js'
import { useAuth } from '../data/AuthContext.jsx'

```
   Call 2. oldText:
```jsx
  const [isSaving, setIsSaving] = useState(false)

```
   newText:
```jsx
  const [isSaving, setIsSaving] = useState(false)
  const { status } = useAuth()

```
   Call 3. oldText:
```jsx
      <button type="button" disabled={!(days > 0 && device.available) || isSaving} onClick={handleRent}>
        Rent
      </button>

```
   newText:
```jsx
      {status === 'anonymous' ? (
        <p className="muted">
          <Link to="/login" state={{ from: `/devices/${device.id}` }}>Log in</Link> to rent this device.
        </p>
      ) : (
        <button type="button" disabled={!(days > 0 && device.available) || isSaving} onClick={handleRent}>
          Rent
        </button>
      )}

```

When done:
- Run `npm run verify -- 046`. If it says FAIL: read the lines under FAIL, fix the files, and run it again. Repeat until the last line is `VERIFY PASSED`.
- NEVER edit files in `tests/`, `package.json` or files the task does not list.
- Tick the checkboxes with this one command: `sed -i '' 's/- \[ \]/- [x]/' backlog/in-progress/046-login-needed.md`, then `git mv backlog/in-progress/046-login-needed.md backlog/done/046-login-needed.md`.
- `git add -A && git commit -m "task 046: My rentals and renting need a login"`
If something is unclear or verify fails 3 times in a row: add a `## Notes` section to the task file explaining the problem and stop.
````
