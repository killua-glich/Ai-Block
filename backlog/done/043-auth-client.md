# 043 — Web site: the API client and the AuthProvider

**Type:** feature
**Depends on:** 042
**Files:** `src/data/api.js`, `src/data/AuthContext.jsx` (new), `src/App.jsx`

## Goal

The API client gets the functions for accounts, cancelling and device admin. A new `AuthProvider` asks the server once who is logged in and tells every page through `useAuth()`.

## Acceptance criteria

- [x] `src/data/api.js` gets: `fetchMe()` (the user, `null` for a 401 answer, other errors thrown), `registerUser`, `loginUser` (they give back the user), `logoutUser`, `cancelRentalById(id)` (POST `/api/rentals/ID/cancel`), `createDeviceAdmin(device)`, `updateDeviceAdmin(id, device)` and `deleteDeviceAdmin(id)`
- [x] `src/data/AuthContext.jsx` (new) exports `AuthProvider` and `useAuth()`; `useAuth()` gives `{ user, status, login, register, logout }` with `status` `loading`, `user`, `anonymous` or `unknown` (server cannot be reached, or does not know accounts)
- [x] Without a provider `useAuth()` gives `status: 'unknown'`
- [x] `login` and `register` set the user and throw the error of the server when it refuses; `logout` makes the visitor anonymous even when the request fails
- [x] `App.jsx` wraps the header, the pages and the footer in `<AuthProvider>`
- [x] `npm run verify -- 043` passes (tests: `tests/task-043*.test.*`)

## Hints

- Add the new code at the end of `src/data/api.js`. The `request` and `ApiError` there already do the work.
- Pages only block visitors who are known to be `anonymous`. With `unknown` (no server) they show their content, so the site and its old tests keep working.
- In `App.jsx` replace the empty tags `<>` and `</>` around the page with `<AuthProvider>` and `</AuthProvider>`.

## Prompt

Run `pi` (or `opencode`) in the repo root, then paste:

````text
Context: AGENTS.md (already loaded) has the stack, the conventions, the editing rules and a project map. Use it. Do NOT list or scan the project. Open only the files named below.
Rules: only change the files listed. Do not touch tests/. Do not write files with heredocs. Write each file only once; do not write the same file again and again.

First: `git mv backlog/todo/043-auth-client.md backlog/in-progress/043-auth-client.md`. (If it says the file is not there, it is already moved: go on.)

Task: The API client gets the functions for accounts, cancelling and device admin. A new `AuthProvider` asks the server once who is logged in and tells every page through `useAuth()`.

Read first: `src/data/api.js`, `src/App.jsx`.
Edit or create: `src/data/api.js`, `src/data/AuthContext.jsx` (new), `src/App.jsx`.

Steps:
1. Change `src/data/api.js` with ONE call of the edit tool (do not rewrite the file). oldText:
```js
    body: JSON.stringify({ deviceId, startDate, endDate }),
  })

```
   newText:
```js
    body: JSON.stringify({ deviceId, startDate, endDate }),
  })

const jsonSend = (method, body) => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

// Who is logged in: the user, or null when nobody is (the server answers 401). Other errors are thrown.
export async function fetchMe() {
  try {
    const body = await request('/api/auth/me')
    return body.user
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return null
    throw err
  }
}

export const registerUser = ({ email, name, password }) =>
  request('/api/auth/register', jsonSend('POST', { email, name, password })).then((body) => body.user)

export const loginUser = ({ email, password }) =>
  request('/api/auth/login', jsonSend('POST', { email, password })).then((body) => body.user)

export const logoutUser = () => request('/api/auth/logout', { method: 'POST' })

export const cancelRentalById = (id) => request(`/api/rentals/${id}/cancel`, { method: 'POST' })

export const createDeviceAdmin = (device) => request('/api/devices', jsonSend('POST', device))

export const updateDeviceAdmin = (id, device) => request(`/api/devices/${id}`, jsonSend('PUT', device))

export const deleteDeviceAdmin = (id) => request(`/api/devices/${id}`, { method: 'DELETE' })

```
2. Write the complete file `src/data/AuthContext.jsx` with the write tool, with exactly this content:
```jsx
import { createContext, useContext, useEffect, useState } from 'react'
import { fetchMe, loginUser, registerUser, logoutUser } from './api.js'

// status is one of:
//   loading    the server has not answered yet
//   user       somebody is logged in (`user` is set)
//   anonymous  the server says nobody is logged in
//   unknown    the server cannot be reached, or does not know accounts
// Pages only block visitors who are known to be anonymous. When the server cannot say, they show their
// content: the server checks every request anyway.
const AuthContext = createContext({
  user: null,
  status: 'unknown',
  login: async () => null,
  register: async () => null,
  logout: async () => {},
})

export function AuthProvider({ children }) {
  const [state, setState] = useState({ user: null, status: 'loading' })

  useEffect(() => {
    let isActive = true
    fetchMe()
      .then((user) => {
        if (isActive) setState(user ? { user, status: 'user' } : { user: null, status: 'anonymous' })
      })
      .catch(() => {
        if (isActive) setState({ user: null, status: 'unknown' })
      })
    return () => {
      isActive = false
    }
  }, [])

  async function login(credentials) {
    const user = await loginUser(credentials)
    setState({ user, status: 'user' })
    return user
  }

  async function register(details) {
    const user = await registerUser(details)
    setState({ user, status: 'user' })
    return user
  }

  async function logout() {
    try {
      await logoutUser()
    } finally {
      setState({ user: null, status: 'anonymous' })
    }
  }

  return <AuthContext.Provider value={{ ...state, login, register, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
```
3. Change `src/App.jsx` with 3 SEPARATE edit calls, one after the other. Each call is small. Do NOT rewrite the whole file, and do NOT merge calls: a long edit can run past the output limit.
   For each call, oldText must match the file exactly: copy it from here. If a call fails, read the file once and correct oldText from what you read. Do not guess. Do the calls in order, each one right after the last.
   Call 1. oldText:
```jsx
import Footer from './components/Footer.jsx'

```
   newText:
```jsx
import Footer from './components/Footer.jsx'
import { AuthProvider } from './data/AuthContext.jsx'

```
   Call 2. oldText:
```jsx
    <>
      <Header />
```
   newText:
```jsx
    <AuthProvider>
      <Header />
```
   Call 3. oldText:
```jsx
      <Footer />
    </>

```
   newText:
```jsx
      <Footer />
    </AuthProvider>

```

When done:
- Run `npm run verify -- 043`. If it says FAIL: read the lines under FAIL, fix the files, and run it again. Repeat until the last line is `VERIFY PASSED`.
- NEVER edit files in `tests/`, `package.json` or files the task does not list.
- Tick the checkboxes with this one command: `sed -i '' 's/- \[ \]/- [x]/' backlog/in-progress/043-auth-client.md`, then `git mv backlog/in-progress/043-auth-client.md backlog/done/043-auth-client.md`.
- `git add -A && git commit -m "task 043: API client for accounts and the AuthProvider"`
If something is unclear or verify fails 3 times in a row: add a `## Notes` section to the task file explaining the problem and stop.
````
