# 028 — Web site: a small client for the API

**Type:** feature
**Depends on:** 027
**Files:** `src/data/api.js` (new)

## Goal

A new file `src/data/api.js` is the one place where the web site talks to the API. Four functions fetch devices and rentals and create a rental; errors become clear messages.

## Acceptance criteria

- [x] `fetchDevices()` asks `/api/devices`, `fetchDevice(id)` asks `/api/devices/ID`, `fetchRentals()` asks `/api/rentals`; each returns the parsed JSON
- [x] `postRental({ deviceId, startDate, endDate })` sends a POST with `Content-Type: application/json` and a body with only those three fields, and returns the saved rental
- [x] When the server answers with an error status, the function throws an `ApiError` (exported; it has `status` and `message`); the message is the `error` text from the JSON, or `Request failed (STATUS)` when there is none
- [x] When the request cannot be made at all (server down), it throws a plain `Error` with the message `Could not reach the server.`
- [x] `npm run verify -- 028` passes (tests: `tests/task-028*.test.*`)

## Hints

- Use relative addresses like `/api/devices` (no host): Vite proxies them in development and nginx in Docker.
- The tests replace the global `fetch` with a fake: write plain `fetch(...)`, do not import a fetch library.

## Prompt

Run `pi` (or `opencode`) in the repo root, then paste:

````text
Context: AGENTS.md (already loaded) has the stack, the conventions, the editing rules and a project map. Use it. Do NOT list or scan the project. Open only the files named below.
Rules: only change the files listed. Do not touch tests/. Do not write files with heredocs. Write each file only once; do not write the same file again and again.

First: `git mv backlog/todo/028-api-client.md backlog/in-progress/028-api-client.md`. (If it says the file is not there, it is already moved: go on.)

Task: A new file `src/data/api.js` is the one place where the web site talks to the API. Four functions fetch devices and rentals and create a rental; errors become clear messages.

Read first: nothing. All the code you need is below.
Edit or create: `src/data/api.js` (new).

Steps:
1. Write the complete file `src/data/api.js` with the write tool, with exactly this content:
```js
// The web site's door to the API. Every function returns the parsed JSON, or throws.
export class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

async function request(path, options) {
  let res
  try {
    res = await fetch(path, options)
  } catch {
    throw new Error('Could not reach the server.')
  }

  const body = await res.json().catch(() => null)
  if (!res.ok) throw new ApiError(res.status, body?.error ?? `Request failed (${res.status})`)
  return body
}

export const fetchDevices = () => request('/api/devices')

export const fetchDevice = (id) => request(`/api/devices/${id}`)

export const fetchRentals = () => request('/api/rentals')

// The server works out the price, the id and the time stamp: send only these three.
export const postRental = ({ deviceId, startDate, endDate }) =>
  request('/api/rentals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceId, startDate, endDate }),
  })
```

When done:
- Run `npm run verify -- 028`. If it says FAIL: read the lines under FAIL, fix the files, and run it again. Repeat until the last line is `VERIFY PASSED`.
- NEVER edit files in `tests/`, `package.json` or files the task does not list.
- Tick the checkboxes with this one command: `sed -i '' 's/- \[ \]/- [x]/' backlog/in-progress/028-api-client.md`, then `git mv backlog/in-progress/028-api-client.md backlog/done/028-api-client.md`.
- `git add -A && git commit -m "task 028: API client for the web site"`
If something is unclear or verify fails 3 times in a row: add a `## Notes` section to the task file explaining the problem and stop.
````
