# 047 — Web site: cancel a rental on the My rentals page

**Type:** feature
**Depends on:** 046
**Files:** `src/pages/MyRentals.jsx`

## Goal

Every rental that has not started yet gets a Cancel button on the My rentals page. A cancelled rental moves to the Past list with the chip Cancelled.

## Acceptance criteria

- [ ] `MyRentals.jsx` imports `cancelRentalById` and keeps an error text in state (`cancelError`)
- [ ] A table row gets a Cancel button (class `button-ghost`) only when its `status` is not `cancelled` and its `startDate` is after today; clicking it calls `cancelRentalById(id)` and replaces the rental in the list with the one the server answers; when the server refuses, the message shows in `<p className="error" role="alert">` above the tables
- [ ] Cancelled rentals are listed under Past (not Active) and show the chip `Cancelled` (classes `chip chip-past`) instead of Active or Past
- [ ] The tables get a sixth column with the header `<th><span className="visually-hidden">Actions</span></th>`; the first five columns stay as they are
- [ ] `npm run verify -- 047` passes (tests: `tests/task-047*.test.*`)

## Hints

- Make the changes with 7 separate edit calls: the import, the state, the `handleCancel` function (before the line `const today`), the two filters, the table header, the chip, the button cell and the error line. Each one is small.
- The hooks (`useState`) must stay above the early `return`s. The `handleCancel` function is not a hook and may sit below them.
- Cancelled rentals count as past: `active` is the not-cancelled rentals that end today or later, `past` is the cancelled ones and those that ended before today.

## Prompt

Run `pi` (or `opencode`) in the repo root, then paste:

````text
Context: AGENTS.md (already loaded) has the stack, the conventions, the editing rules and a project map. Use it. Do NOT list or scan the project. Open only the files named below.
Rules: only change the files listed. Do not touch tests/. Do not write files with heredocs. Write each file only once; do not write the same file again and again.

First: `git mv backlog/todo/047-cancel-button.md backlog/in-progress/047-cancel-button.md`. (If it says the file is not there, it is already moved: go on.)

Task: Every rental that has not started yet gets a Cancel button on the My rentals page. A cancelled rental moves to the Past list with the chip Cancelled.

Read first: `src/pages/MyRentals.jsx`.
Edit or create: `src/pages/MyRentals.jsx`.

Steps:
1. Change `src/pages/MyRentals.jsx` with 7 SEPARATE edit calls, one after the other. Each call is small. Do NOT rewrite the whole file, and do NOT merge calls: a long edit can run past the output limit.
   For each call, oldText must match the file exactly: copy it from here. If a call fails, read the file once and correct oldText from what you read. Do not guess. Do the calls in order, each one right after the last.
   Call 1. oldText:
```jsx
import { fetchRentals } from '../data/api.js'
```
   newText:
```jsx
import { fetchRentals, cancelRentalById } from '../data/api.js'
```
   Call 2. oldText:
```jsx
  const [hasFailed, setHasFailed] = useState(false)

```
   newText:
```jsx
  const [hasFailed, setHasFailed] = useState(false)
  const [cancelError, setCancelError] = useState('')

```
   Call 3. oldText:
```jsx
  const today = new Date().toISOString().slice(0, 10)
  const active = rentals.filter((r) => r.endDate >= today)
  const past = rentals.filter((r) => r.endDate < today)

```
   newText:
```jsx
  async function handleCancel(id) {
    setCancelError('')
    try {
      const updated = await cancelRentalById(id)
      setRentals((list) => list.map((r) => (r.id === id ? updated : r)))
    } catch (err) {
      setCancelError(err.message)
    }
  }

  const today = new Date().toISOString().slice(0, 10)
  const active = rentals.filter((r) => r.status !== 'cancelled' && r.endDate >= today)
  const past = rentals.filter((r) => r.status === 'cancelled' || r.endDate < today)

```
   Call 4. oldText:
```jsx
            <th className="num">Total</th>
          </tr>

```
   newText:
```jsx
            <th className="num">Total</th>
            <th><span className="visually-hidden">Actions</span></th>
          </tr>

```
   Call 5. oldText:
```jsx
                  <span className={status === 'active' ? 'chip chip-active' : 'chip chip-past'}>
                    {status === 'active' ? 'Active' : 'Past'}
                  </span>

```
   newText:
```jsx
                  {r.status === 'cancelled' ? (
                    <span className="chip chip-past">Cancelled</span>
                  ) : (
                    <span className={status === 'active' ? 'chip chip-active' : 'chip chip-past'}>
                      {status === 'active' ? 'Active' : 'Past'}
                    </span>
                  )}

```
   Call 6. oldText:
```jsx
                <td className="num">{formatEuro(r.totalPrice)}</td>

```
   newText:
```jsx
                <td className="num">{formatEuro(r.totalPrice)}</td>
                <td>
                  {r.status !== 'cancelled' && r.startDate > today && (
                    <button type="button" className="button-ghost" onClick={() => handleCancel(r.id)}>Cancel</button>
                  )}
                </td>

```
   Call 7. oldText:
```jsx
      <h1>My rentals</h1>
      <h2>Active</h2>

```
   newText:
```jsx
      <h1>My rentals</h1>
      {cancelError && <p className="error" role="alert">{cancelError}</p>}
      <h2>Active</h2>

```

When done:
- Run `npm run verify -- 047`. If it says FAIL: read the lines under FAIL, fix the files, and run it again. Repeat until the last line is `VERIFY PASSED`.
- NEVER edit files in `tests/`, `package.json` or files the task does not list.
- Tick the checkboxes with this one command: `sed -i '' 's/- \[ \]/- [x]/' backlog/in-progress/047-cancel-button.md`, then `git mv backlog/in-progress/047-cancel-button.md backlog/done/047-cancel-button.md`.
- `git add -A && git commit -m "task 047: Cancel button on My rentals"`
If something is unclear or verify fails 3 times in a row: add a `## Notes` section to the task file explaining the problem and stop.
````
