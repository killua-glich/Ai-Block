# 011 — Styling: frosted-glass header with a logo mark, pill navigation and a footer

**Type:** styling
**Depends on:** 010
**Files:** `src/components/Header.jsx`, `src/components/Footer.jsx` (new), `src/App.jsx`, `src/index.css`

## Goal

A sticky header that blurs what scrolls under it, a gradient logo mark, a navigation made of pills that shows where you are, and a footer that always sits at the bottom of the page.

## Acceptance criteria

- [ ] `Header.jsx`: the logo link has a decorative `<span className="logo-mark" aria-hidden="true">◆</span>`; the nav uses `NavLink` (Devices with `end`), has `className="nav"` and no inline style
- [ ] New `Footer.jsx` (`<footer className="footer">`): the text "© 2026 Ai-Block · Rent devices by the day" and two links, "Catalog" (to `/`) and "Bookings" (to `/rentals`), in a `div` (not a second `nav`)
- [ ] `App.jsx` renders `<Footer />` after `<main>`
- [ ] `.header` is sticky with `backdrop-filter: blur(...)`; `.logo-mark` is a gradient tile; `.nav a` are pills; the current page is highlighted in the primary colour
- [ ] `#root` is a flex column with `min-height: 100vh` and `.container` has `flex: 1`, so the footer sits at the bottom
- [ ] `npm run verify -- 011` passes (tests: `tests/task-011*.test.*`)

## Hints

- The footer links must not be called "Devices" or "My rentals": other tests look for links with those exact names.

## Prompt

Run `pi` (or `opencode`) in the repo root, then paste:

````text
Context: AGENTS.md (already loaded) has the stack, the conventions, the editing rules and a project map. Use it. Do NOT list or scan the project. Open only the files named below.
Rules: only change the files listed. Do not touch tests/. Never delete a CSS rule. Do not write files with heredocs.

First: `git mv backlog/todo/011-glass-header-footer.md backlog/in-progress/011-glass-header-footer.md`.

Task: A sticky header that blurs what scrolls under it, a gradient logo mark, a navigation made of pills that shows where you are, and a footer that always sits at the bottom of the page.

Read first: `src/components/Header.jsx`, `src/App.jsx`, `src/index.css`.
Edit or create: `src/components/Header.jsx`, `src/components/Footer.jsx` (new), `src/App.jsx`, `src/index.css`.

Steps:
1. Write the complete file `src/components/Header.jsx` with the write tool, with exactly this content:
```jsx
import { Link, NavLink } from 'react-router-dom'

export default function Header() {
  return (
    <header className="header">
      <Link to="/" className="logo">
        <span className="logo-mark" aria-hidden="true">◆</span>
        Ai-Block
      </Link>
      <nav className="nav">
        <NavLink to="/" end>Devices</NavLink>
        <NavLink to="/rentals">My rentals</NavLink>
      </nav>
    </header>
  )
}
```
2. Write the complete file `src/components/Footer.jsx` with the write tool, with exactly this content:
```jsx
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="footer">
      <p>© 2026 Ai-Block · Rent devices by the day</p>
      <div className="footer-links">
        <Link to="/">Catalog</Link>
        <Link to="/rentals">Bookings</Link>
      </div>
    </footer>
  )
}
```
3. Write the complete file `src/App.jsx` with the write tool, with exactly this content:
```jsx
import { Routes, Route } from 'react-router-dom'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import Catalog from './pages/Catalog.jsx'
import DeviceDetail from './pages/DeviceDetail.jsx'
import MyRentals from './pages/MyRentals.jsx'
import NotFound from './pages/NotFound.jsx'

export default function App() {
  return (
    <>
      <Header />
      <main className="container">
        <Routes>
          <Route path="/" element={<Catalog />} />
          <Route path="/devices/:id" element={<DeviceDetail />} />
          <Route path="/rentals" element={<MyRentals />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </>
  )
}
```
4. Write the complete new `src/index.css` with the write tool. Keep every existing rule, in the same order.
   a) These rules change: keep the selector, use exactly this text for each:
```css
.header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.9rem 2rem;
  background: color-mix(in srgb, var(--color-surface) 72%, transparent);
  border-bottom: 1px solid var(--color-border);
  backdrop-filter: blur(14px) saturate(1.4);
}

.logo {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 1.3rem;
  letter-spacing: -0.02em;
  color: var(--color-text);
}

.container {
  flex: 1;
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  padding: 2rem;
}
```
   b) Add these new rules at the END of the file, in this order:
```css
.logo-mark {
  display: inline-grid;
  place-items: center;
  width: 1.9rem;
  height: 1.9rem;
  border-radius: 0.6rem;
  background: var(--gradient-brand);
  color: var(--color-on-primary);
  font-size: 0.9rem;
  box-shadow: var(--shadow);
}

.nav {
  display: flex;
  gap: 0.25rem;
}

.nav a {
  color: var(--color-muted);
  font-weight: 600;
  padding: 0.4rem 0.9rem;
  border-radius: 999px;
  transition: background 0.15s, color 0.15s;
}

.nav a:hover {
  color: var(--color-text);
  background: var(--color-bg);
}

.nav a[aria-current="page"] {
  color: var(--color-primary);
  background: var(--color-bg);
}

#root {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.footer {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 3rem;
  padding: 1.5rem 2rem;
  border-top: 1px solid var(--color-border);
  color: var(--color-muted);
  font-size: 0.9rem;
}

.footer p {
  margin: 0;
}

.footer-links {
  display: flex;
  gap: 1.25rem;
}

.footer-links a {
  color: var(--color-muted);
}

.footer-links a:hover {
  color: var(--color-primary);
}
```

When done:
- Run `npm run verify -- 011`. If it says FAIL: read the lines under FAIL, fix `src/`, and run it again. Repeat until the last line is `VERIFY PASSED`.
- NEVER edit files in `tests/`, `package.json` or files the task does not list.
- Tick the checkboxes with this one command: `sed -i '' 's/- \[ \]/- [x]/' backlog/in-progress/011-glass-header-footer.md`, then `git mv backlog/in-progress/011-glass-header-footer.md backlog/done/011-glass-header-footer.md`.
- `git add -A && git commit -m "task 011: Glass header, pill nav, footer"`
If something is unclear or verify fails 3 times in a row: add a `## Notes` section to the task file explaining the problem and stop.
````
