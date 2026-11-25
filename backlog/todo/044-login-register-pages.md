# 044 — Web site: the login page and the register page

**Type:** feature + styling
**Depends on:** 043
**Files:** `src/pages/Login.jsx` (new), `src/pages/Register.jsx` (new), `src/App.jsx`, `src/index.css`

## Goal

Two new pages, `/login` and `/register`, with forms in a card. Logging in or registering goes to the catalog, or back to the page the visitor came from.

## Acceptance criteria

- [ ] `Login.jsx`: `<section className="auth-card">` with the `h1` `Log in`, a form with fields `Email` and `Password`, the error message in `<p className="error" role="alert">` when the login is refused, a submit button `Log in` that is disabled while saving, and the link `Create one` to `/register`; a successful login goes to `location.state.from` or to `/`
- [ ] `Register.jsx`: the same card with the `h1` `Create your account`, fields `Name`, `Email` and `Password` (`minLength` 8) with the hint `At least 8 characters.`, the button `Create account` and the link `Log in` to `/login`; success goes to `/`
- [ ] `App.jsx` has the routes `/login` and `/register` (before the `*` route)
- [ ] `index.css` has the rules `.auth-card`, `.auth-card h1`, `.auth-card form`, `.auth-card label`, `.auth-card input`, `.auth-card input:focus-visible`, `.auth-card button` and `.auth-hint` as in the code below
- [ ] `npm run verify -- 044` passes (tests: `tests/task-044*.test.*`)

## Hints

- Use `login` and `register` from `useAuth()`: they already throw the message of the server.
- Change `src/index.css` with 4 small edit calls. Each call puts new rules before the line `.visually-hidden {`.
- No `#` hex colours in the CSS: use the variables.

## Prompt

Run `pi` (or `opencode`) in the repo root, then paste:

````text
Context: AGENTS.md (already loaded) has the stack, the conventions, the editing rules and a project map. Use it. Do NOT list or scan the project. Open only the files named below.
Rules: only change the files listed. Do not touch tests/. Never delete a CSS rule. Never rewrite `src/index.css` as a whole: change it with the edit tool and exact text. Do not write files with heredocs. Write each file only once; do not write the same file again and again.

First: `git mv backlog/todo/044-login-register-pages.md backlog/in-progress/044-login-register-pages.md`. (If it says the file is not there, it is already moved: go on.)

Task: Two new pages, `/login` and `/register`, with forms in a card. Logging in or registering goes to the catalog, or back to the page the visitor came from.

Read first: `src/App.jsx`.
Edit or create: `src/pages/Login.jsx` (new), `src/pages/Register.jsx` (new), `src/App.jsx`, `src/index.css`.

Steps:
1. Write the complete file `src/pages/Login.jsx` with the write tool, with exactly this content:
```jsx
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../data/AuthContext.jsx'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setIsSaving(true)
    try {
      await login({ email, password })
      navigate(location.state?.from ?? '/', { replace: true })
    } catch (err) {
      setError(err.message)
      setIsSaving(false)
    }
  }

  return (
    <section className="auth-card">
      <h1>Log in</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <button type="submit" disabled={isSaving}>Log in</button>
      </form>
      <p className="auth-hint">No account yet? <Link to="/register">Create one</Link></p>
    </section>
  )
}
```
2. Write the complete file `src/pages/Register.jsx` with the write tool, with exactly this content:
```jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../data/AuthContext.jsx'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setIsSaving(true)
    try {
      await register({ email, name, password })
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message)
      setIsSaving(false)
    }
  }

  return (
    <section className="auth-card">
      <h1>Create your account</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Name
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
        </label>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" minLength={8} required />
        </label>
        <p className="auth-hint">At least 8 characters.</p>
        {error && <p className="error" role="alert">{error}</p>}
        <button type="submit" disabled={isSaving}>Create account</button>
      </form>
      <p className="auth-hint">Already have an account? <Link to="/login">Log in</Link></p>
    </section>
  )
}
```
3. Change `src/App.jsx` with 2 SEPARATE edit calls, one after the other. Each call is small. Do NOT rewrite the whole file, and do NOT merge calls: a long edit can run past the output limit.
   For each call, oldText must match the file exactly: copy it from here. If a call fails, read the file once and correct oldText from what you read. Do not guess. Do the calls in order, each one right after the last.
   Call 1. oldText:
```jsx
import NotFound from './pages/NotFound.jsx'

```
   newText:
```jsx
import NotFound from './pages/NotFound.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'

```
   Call 2. oldText:
```jsx
          <Route path="*" element={<NotFound />} />

```
   newText:
```jsx
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<NotFound />} />

```
4. Change `src/index.css` with 4 SEPARATE edit calls, one after the other. Each call is small. Do NOT rewrite the whole file, and do NOT merge calls: a long edit can run past the output limit.
   For each call, oldText must match the file exactly: copy it from here. If a call fails, read the file once and correct oldText from what you read. Do not guess. Do the calls in order, each one right after the last.
   Call 1. oldText:
```css
.visually-hidden {
```
   newText:
```css
.auth-card {
  max-width: 26rem;
  margin: 3rem auto;
  padding: 2rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}

.auth-card h1 {
  margin: 0 0 1.25rem;
}

.visually-hidden {
```
   Call 2. oldText:
```css
.visually-hidden {
```
   newText:
```css
.auth-card form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.auth-card label {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-muted);
}

.visually-hidden {
```
   Call 3. oldText:
```css
.visually-hidden {
```
   newText:
```css
.auth-card input {
  width: 100%;
  font: inherit;
  padding: 0.65rem 0.9rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-text);
}

.auth-card input:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.visually-hidden {
```
   Call 4. oldText:
```css
.visually-hidden {
```
   newText:
```css
.auth-card button {
  width: 100%;
}

.auth-hint {
  margin: 0;
  font-size: 0.85rem;
  color: var(--color-muted);
}

.visually-hidden {
```

When done:
- Run `npm run verify -- 044`. If it says FAIL: read the lines under FAIL, fix the files, and run it again. Repeat until the last line is `VERIFY PASSED`.
- NEVER edit files in `tests/`, `package.json` or files the task does not list.
- Tick the checkboxes with this one command: `sed -i '' 's/- \[ \]/- [x]/' backlog/in-progress/044-login-register-pages.md`, then `git mv backlog/in-progress/044-login-register-pages.md backlog/done/044-login-register-pages.md`.
- `git add -A && git commit -m "task 044: Login and register pages"`
If something is unclear or verify fails 3 times in a row: add a `## Notes` section to the task file explaining the problem and stop.
````
