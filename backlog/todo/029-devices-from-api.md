# 029 — Web site: the catalog and detail page read devices from the API

**Type:** feature
**Depends on:** 028
**Files:** `src/data/useDevices.js` (new), `src/pages/Catalog.jsx`, `src/pages/DeviceDetail.jsx`

## Goal

A new hook `useDevices` gives the pages the built-in device list at once and swaps in the list from the database when it arrives. The catalog and the detail page use it.

## Acceptance criteria

- [ ] `src/data/useDevices.js` exports `useDevices()` (returns the list) and `resetDevices()`; the first render uses the built-in list from `src/data/devices.js`
- [ ] After the first render it fetches `fetchDevices()`; when the list arrives the page shows it and the hook remembers it, so a page opened later shows it at once; when the fetch fails, nothing changes and no error is shown
- [ ] `Catalog.jsx` and `DeviceDetail.jsx` no longer import `src/data/devices.js`: they call `useDevices()` at the top of the component
- [ ] The detail page finds devices that exist only in the database
- [ ] `npm run verify -- 029` passes (tests: `tests/task-029*.test.*`)

## Hints

- Hooks must run on every render, before any `return`: put `const devices = useDevices()` at the very top of the component.
- Keep the list in a variable outside the hook (`let latest`) so it survives between pages. `resetDevices` is for the tests.
- The old tests still pass because they never run a server: the fetch fails and the built-in list stays.

## Prompt

Run `pi` (or `opencode`) in the repo root, then paste:

````text
Context: AGENTS.md (already loaded) has the stack, the conventions, the editing rules and a project map. Use it. Do NOT list or scan the project. Open only the files named below.
Rules: only change the files listed. Do not touch tests/. Do not write files with heredocs. Write each file only once; do not write the same file again and again.

First: `git mv backlog/todo/029-devices-from-api.md backlog/in-progress/029-devices-from-api.md`. (If it says the file is not there, it is already moved: go on.)

Task: A new hook `useDevices` gives the pages the built-in device list at once and swaps in the list from the database when it arrives. The catalog and the detail page use it.

Read first: `src/pages/Catalog.jsx`, `src/pages/DeviceDetail.jsx`.
Edit or create: `src/data/useDevices.js` (new), `src/pages/Catalog.jsx`, `src/pages/DeviceDetail.jsx`.

Steps:
1. Write the complete file `src/data/useDevices.js` with the write tool, with exactly this content:
```js
import { useEffect, useState } from 'react'
import builtIn from './devices.js'
import { fetchDevices } from './api.js'

// The page shows the built-in list at once, and swaps in the list from the database when it arrives.
// When the server cannot be reached, the built-in list stays.
let latest = builtIn

export function resetDevices() {
  latest = builtIn
}

export function useDevices() {
  const [devices, setDevices] = useState(latest)

  useEffect(() => {
    let isActive = true
    fetchDevices()
      .then((list) => {
        latest = list
        if (isActive) setDevices(list)
      })
      .catch(() => {})
    return () => {
      isActive = false
    }
  }, [])

  return devices
}
```
2. Change `src/pages/Catalog.jsx` with 2 SEPARATE edit calls, one after the other. Each call is small. Do NOT rewrite the whole file, and do NOT merge calls: a long edit can run past the output limit.
   For each call, oldText must match the file exactly: copy it from here. If a call fails, read the file once and correct oldText from what you read. Do not guess. Do the calls in order, each one right after the last.
   Call 1. oldText:
```jsx
import devices from '../data/devices.js'

```
   newText:
```jsx
import { useDevices } from '../data/useDevices.js'

```
   Call 2. oldText:
```jsx
export default function Catalog() {

```
   newText:
```jsx
export default function Catalog() {
  const devices = useDevices()

```
3. Change `src/pages/DeviceDetail.jsx` with 2 SEPARATE edit calls, one after the other. Each call is small. Do NOT rewrite the whole file, and do NOT merge calls: a long edit can run past the output limit.
   For each call, oldText must match the file exactly: copy it from here. If a call fails, read the file once and correct oldText from what you read. Do not guess. Do the calls in order, each one right after the last.
   Call 1. oldText:
```jsx
import devices from '../data/devices.js'

```
   newText:
```jsx
import { useDevices } from '../data/useDevices.js'

```
   Call 2. oldText:
```jsx
  const { id } = useParams()

```
   newText:
```jsx
  const { id } = useParams()
  const devices = useDevices()

```

When done:
- Run `npm run verify -- 029`. If it says FAIL: read the lines under FAIL, fix the files, and run it again. Repeat until the last line is `VERIFY PASSED`.
- NEVER edit files in `tests/`, `package.json` or files the task does not list.
- Tick the checkboxes with this one command: `sed -i '' 's/- \[ \]/- [x]/' backlog/in-progress/029-devices-from-api.md`, then `git mv backlog/in-progress/029-devices-from-api.md backlog/done/029-devices-from-api.md`.
- `git add -A && git commit -m "task 029: Catalog and detail page read devices from the API"`
If something is unclear or verify fails 3 times in a row: add a `## Notes` section to the task file explaining the problem and stop.
````
