# 048 — Web site: the admin page

**Type:** feature + styling
**Depends on:** 047
**Files:** `src/pages/Admin.jsx` (new), `src/App.jsx`, `src/index.css`

## Goal

A new page `/admin` where an admin sees all devices in a table and can add, change and delete them. Everybody else is told it is for admins only, or sent to the login page.

## Acceptance criteria

- [ ] `Admin.jsx` (new): for `status` `anonymous` it redirects to `/login` (with `state={{ from: '/admin' }}`); for a logged-in user who is not an admin it shows the `h1` `Admin` and `<p className="error">Admins only.</p>`; otherwise it shows the page
- [ ] The page has the `h1` `Admin`, a form (class `admin-form`) with the fields `Name`, `Category`, `Price per day`, `Specs` (comma separated), `Description` and a checkbox `Available`, and a table of all devices (Device, Category, Available, Price, and a column with the buttons)
- [ ] `Add device` sends `createDeviceAdmin` with `{ name, category, pricePerDay (a number), description, specs (a list), available }`; `Edit` in a row fills the form and the button becomes `Save changes` (`updateDeviceAdmin`); `Cancel editing` empties the form; `Delete` calls `deleteDeviceAdmin`
- [ ] After every change the table is loaded again; success shows `Device added.`, `Device saved.` or `NAME deleted.` in `<p className="success" role="status">`; a refusal shows the message of the server in `<p className="error" role="alert">` and keeps what was typed
- [ ] `App.jsx` has the route `/admin`; `index.css` has the rules `.admin-form`, `.admin-form label`, `.admin-form input:not([type="checkbox"])`, `.admin-form textarea` and `.admin-actions`
- [ ] `npm run verify -- 048` passes (tests: `tests/task-048*.test.*`)

## Hints

- The header already shows the `Admin` link to admins. Do not touch `Header.jsx`.
- Write `Admin.jsx` once with the code below. Change `src/index.css` with 3 small edit calls, each putting new rules before the line `.visually-hidden {`.
- All the hooks (`useAuth`, `useState`, `useEffect`) are above the first `return`. Keep it that way.

## Prompt

Run `pi` (or `opencode`) in the repo root, then paste:

````text
Context: AGENTS.md (already loaded) has the stack, the conventions, the editing rules and a project map. Use it. Do NOT list or scan the project. Open only the files named below.
Rules: only change the files listed. Do not touch tests/. Never delete a CSS rule. Never rewrite `src/index.css` as a whole: change it with the edit tool and exact text. Do not write files with heredocs. Write each file only once; do not write the same file again and again.

First: `git mv backlog/todo/048-admin-page.md backlog/in-progress/048-admin-page.md`. (If it says the file is not there, it is already moved: go on.)

Task: A new page `/admin` where an admin sees all devices in a table and can add, change and delete them. Everybody else is told it is for admins only, or sent to the login page.

Read first: `src/App.jsx`.
Edit or create: `src/pages/Admin.jsx` (new), `src/App.jsx`, `src/index.css`.

Steps:
1. Write the complete file `src/pages/Admin.jsx` with the write tool, with exactly this content:
```jsx
import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../data/AuthContext.jsx'
import { fetchDevices, createDeviceAdmin, updateDeviceAdmin, deleteDeviceAdmin } from '../data/api.js'
import { formatEuro } from '../data/money.js'

const EMPTY = { name: '', category: '', pricePerDay: '', description: '', specs: '', available: true }

function toForm(device) {
  return {
    name: device.name,
    category: device.category,
    pricePerDay: String(device.pricePerDay),
    description: device.description,
    specs: device.specs.join(', '),
    available: device.available,
  }
}

function toInput(form) {
  return {
    name: form.name,
    category: form.category,
    pricePerDay: Number(form.pricePerDay),
    description: form.description,
    specs: form.specs.split(',').map((s) => s.trim()).filter(Boolean),
    available: form.available,
  }
}

export default function Admin() {
  const { user, status } = useAuth()
  const [devices, setDevices] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [editingId, setEditingId] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let isActive = true
    fetchDevices()
      .then((list) => {
        if (isActive) setDevices(list)
      })
      .catch((err) => {
        if (isActive) setError(err.message)
      })
    return () => {
      isActive = false
    }
  }, [])

  if (status === 'anonymous') return <Navigate to="/login" replace state={{ from: '/admin' }} />
  if (user && user.role !== 'admin') {
    return (
      <section>
        <h1>Admin</h1>
        <p className="error">Admins only.</p>
      </section>
    )
  }

  const change = (field) => (event) => setForm({ ...form, [field]: event.target.value })

  function startEdit(device) {
    setEditingId(device.id)
    setForm(toForm(device))
    setMessage('')
    setError('')
  }

  function stopEdit() {
    setEditingId(null)
    setForm(EMPTY)
  }

  async function save(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    try {
      if (editingId === null) await createDeviceAdmin(toInput(form))
      else await updateDeviceAdmin(editingId, toInput(form))
      setMessage(editingId === null ? 'Device added.' : 'Device saved.')
      stopEdit()
      setDevices(await fetchDevices())
    } catch (err) {
      setError(err.message)
    }
  }

  async function remove(device) {
    setError('')
    setMessage('')
    try {
      await deleteDeviceAdmin(device.id)
      setMessage(`${device.name} deleted.`)
      setDevices(await fetchDevices())
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <section>
      <h1>Admin</h1>
      {message && <p className="success" role="status">{message}</p>}
      {error && <p className="error" role="alert">{error}</p>}

      <form className="admin-form" onSubmit={save}>
        <label>
          Name
          <input type="text" value={form.name} onChange={change('name')} required />
        </label>
        <label>
          Category
          <input type="text" value={form.category} onChange={change('category')} required />
        </label>
        <label>
          Price per day
          <input type="number" min="0" step="0.01" value={form.pricePerDay} onChange={change('pricePerDay')} required />
        </label>
        <label>
          Specs
          <input type="text" value={form.specs} onChange={change('specs')} placeholder="8K video, Waterproof" />
        </label>
        <label>
          Description
          <textarea value={form.description} onChange={change('description')} />
        </label>
        <label>
          <span>
            <input type="checkbox" checked={form.available} onChange={(e) => setForm({ ...form, available: e.target.checked })} /> Available
          </span>
        </label>
        <div className="admin-actions">
          <button type="submit">{editingId === null ? 'Add device' : 'Save changes'}</button>
          {editingId !== null && <button type="button" className="button-ghost" onClick={stopEdit}>Cancel editing</button>}
        </div>
      </form>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Device</th>
              <th>Category</th>
              <th>Available</th>
              <th className="num">Price</th>
              <th><span className="visually-hidden">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {devices.map((device) => (
              <tr key={device.id}>
                <td>{device.name}</td>
                <td>{device.category}</td>
                <td>{device.available ? 'Yes' : 'No'}</td>
                <td className="num">{formatEuro(device.pricePerDay)}</td>
                <td>
                  <button type="button" className="button-ghost" onClick={() => startEdit(device)}>Edit</button>{' '}
                  <button type="button" className="button-ghost" onClick={() => remove(device)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
```
2. Change `src/App.jsx` with 2 SEPARATE edit calls, one after the other. Each call is small. Do NOT rewrite the whole file, and do NOT merge calls: a long edit can run past the output limit.
   For each call, oldText must match the file exactly: copy it from here. If a call fails, read the file once and correct oldText from what you read. Do not guess. Do the calls in order, each one right after the last.
   Call 1. oldText:
```jsx
import Login from './pages/Login.jsx'

```
   newText:
```jsx
import Login from './pages/Login.jsx'
import Admin from './pages/Admin.jsx'

```
   Call 2. oldText:
```jsx
          <Route path="/login" element={<Login />} />

```
   newText:
```jsx
          <Route path="/admin" element={<Admin />} />
          <Route path="/login" element={<Login />} />

```
3. Change `src/index.css` with 3 SEPARATE edit calls, one after the other. Each call is small. Do NOT rewrite the whole file, and do NOT merge calls: a long edit can run past the output limit.
   For each call, oldText must match the file exactly: copy it from here. If a call fails, read the file once and correct oldText from what you read. Do not guess. Do the calls in order, each one right after the last.
   Call 1. oldText:
```css
.visually-hidden {
```
   newText:
```css
.admin-form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
  gap: 1rem;
  margin: 1rem 0 2rem;
  padding: 1.5rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
}

.admin-form label {
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
   Call 2. oldText:
```css
.visually-hidden {
```
   newText:
```css
.admin-form input:not([type="checkbox"]) {
  font: inherit;
  padding: 0.65rem 0.9rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-text);
}

.admin-form textarea {
  font: inherit;
  min-height: 5rem;
  padding: 0.65rem 0.9rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-text);
}

.visually-hidden {
```
   Call 3. oldText:
```css
.visually-hidden {
```
   newText:
```css
.admin-actions {
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
}

.visually-hidden {
```

When done:
- Run `npm run verify -- 048`. If it says FAIL: read the lines under FAIL, fix the files, and run it again. Repeat until the last line is `VERIFY PASSED`.
- NEVER edit files in `tests/`, `package.json` or files the task does not list.
- Tick the checkboxes with this one command: `sed -i '' 's/- \[ \]/- [x]/' backlog/in-progress/048-admin-page.md`, then `git mv backlog/in-progress/048-admin-page.md backlog/done/048-admin-page.md`.
- `git add -A && git commit -m "task 048: Admin page for devices"`
If something is unclear or verify fails 3 times in a row: add a `## Notes` section to the task file explaining the problem and stop.
````
