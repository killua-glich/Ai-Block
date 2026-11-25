# 045 — Web site: the header shows who is logged in

**Type:** feature + styling
**Depends on:** 044
**Files:** `src/components/Header.jsx`, `src/index.css`

## Goal

The header shows the name of the logged-in user with a Log out button, or Log in and Sign up links for a visitor. Admins get an Admin link.

## Acceptance criteria

- [x] `Header.jsx` uses `useAuth()`: a logged-in user gets `<span className="nav-user">NAME</span>` and a `Log out` button (class `button-ghost`) that calls `logout`; when `status` is `anonymous` it shows the links `Log in` (`/login`) and `Sign up` (`/register`); in every other case (loading, unknown) it shows neither
- [x] A user with the role `admin` also gets the link `Admin` (`/admin`)
- [x] The links `Devices` and `My rentals` and the logo stay as they are
- [x] `index.css` has the rules `.nav-user` and `.nav .button-ghost`
- [x] `npm run verify -- 045` passes (tests: `tests/task-045*.test.*`)

## Hints

- This file is short: write the whole file once with the code below.
- Change `src/index.css` with ONE edit call that puts the two new rules before the line `.visually-hidden {`.

## Prompt

Run `pi` (or `opencode`) in the repo root, then paste:

````text
Context: AGENTS.md (already loaded) has the stack, the conventions, the editing rules and a project map. Use it. Do NOT list or scan the project. Open only the files named below.
Rules: only change the files listed. Do not touch tests/. Never delete a CSS rule. Never rewrite `src/index.css` as a whole: change it with the edit tool and exact text. Do not write files with heredocs. Write each file only once; do not write the same file again and again.

First: `git mv backlog/todo/045-header-user.md backlog/in-progress/045-header-user.md`. (If it says the file is not there, it is already moved: go on.)

Task: The header shows the name of the logged-in user with a Log out button, or Log in and Sign up links for a visitor. Admins get an Admin link.

Read first: `src/components/Header.jsx`.
Edit or create: `src/components/Header.jsx`, `src/index.css`.

Steps:
1. Write the complete file `src/components/Header.jsx` with the write tool, with exactly this content:
```jsx
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../data/AuthContext.jsx'

export default function Header() {
  const { user, status, logout } = useAuth()

  return (
    <header className="header">
      <Link to="/" className="logo">
        <span className="logo-mark" aria-hidden="true">◆</span>
        Ai-Block
      </Link>
      <nav className="nav">
        <NavLink to="/" end>Devices</NavLink>
        <NavLink to="/rentals">My rentals</NavLink>
        {user?.role === 'admin' && <NavLink to="/admin">Admin</NavLink>}
        {user && (
          <>
            <span className="nav-user">{user.name}</span>
            <button type="button" className="button-ghost" onClick={logout}>Log out</button>
          </>
        )}
        {!user && status === 'anonymous' && (
          <>
            <NavLink to="/login">Log in</NavLink>
            <NavLink to="/register">Sign up</NavLink>
          </>
        )}
      </nav>
    </header>
  )
}
```
2. Change `src/index.css` with ONE call of the edit tool (do not rewrite the file). oldText:
```css
.visually-hidden {
```
   newText:
```css
.nav-user {
  align-self: center;
  margin-left: 0.5rem;
  font-weight: 600;
  color: var(--color-text);
}

.nav .button-ghost {
  margin-left: 0.25rem;
  padding: 0.35rem 0.9rem;
}

.visually-hidden {
```

When done:
- Run `npm run verify -- 045`. If it says FAIL: read the lines under FAIL, fix the files, and run it again. Repeat until the last line is `VERIFY PASSED`.
- NEVER edit files in `tests/`, `package.json` or files the task does not list.
- Tick the checkboxes with this one command: `sed -i '' 's/- \[ \]/- [x]/' backlog/in-progress/045-header-user.md`, then `git mv backlog/in-progress/045-header-user.md backlog/done/045-header-user.md`.
- `git add -A && git commit -m "task 045: Header shows the user, Log out and the login links"`
If something is unclear or verify fails 3 times in a row: add a `## Notes` section to the task file explaining the problem and stop.
````
