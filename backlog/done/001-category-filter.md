# 001 — Category filter on catalog

**Depends on:** none
**Files:** `src/pages/Catalog.jsx`, `src/index.css`

## Goal

Let users filter the device list by category.

## Acceptance criteria

- [x] A `<select>` above the grid with "All" plus every category found in `src/data/devices.js` (derived from data, not hard-coded)
- [x] Choosing a category shows only devices of that category; "All" shows everything
- [x] If no device matches, show "No devices found."
- [x] `npm run verify -- 001` passes (tests: `tests/task-001*.test.jsx`)

## Hints

- Use `useState` for the selected category.
EOF
