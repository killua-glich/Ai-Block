# 021 — Styling: device photos on the cards and on the detail page

**Type:** styling
**Depends on:** 020
**Files:** `src/components/DeviceCard.jsx`, `src/pages/DeviceDetail.jsx`, `src/index.css`

## Goal

Every device card and the detail page show a product photo instead of only the emoji. If a photo cannot load, the emoji and the coloured gradient stay visible, as before.

## Acceptance criteria

- [ ] `DeviceCard.jsx`: `.card-media` holds, after the `.card-icon` span, `<img className="card-photo" src={`/devices/${device.id}.jpg`} alt="" loading="lazy" onError={...} />`
- [ ] `DeviceDetail.jsx`: `.detail-media` holds, after the `.detail-icon` span, `<img className="detail-photo" src={`/devices/${device.id}.jpg`} alt="" onError={...} />`
- [ ] Both `onError` handlers hide the image: `onError={(e) => { e.currentTarget.hidden = true }}`
- [ ] `.card-media` and `.detail-media` get `position: relative` and `overflow: hidden`
- [ ] `.card-photo` and `.detail-photo` fill their box: `position: absolute`, `inset: 0`, `width: 100%`, `height: 100%`, `object-fit: cover`; `.card-photo` also has `transition: transform 0.4s` and `.card:hover .card-photo` has `transform: scale(1.06)`
- [ ] `npm run verify -- 021` passes (tests: `tests/task-021*.test.*`)

## Hints

- The 14 photos already exist in `public/devices/` as `1.jpg` to `14.jpg` (the file name is the device id). Do not create, move or change them.
- Do not add `display` to `.card-photo` or `.detail-photo`: it would stop the `hidden` attribute from working.
- Keep the `.card-icon` and `.detail-icon` spans. They are the fallback.

## Prompt

Run `pi` (or `opencode`) in the repo root, then paste:

````text
Context: AGENTS.md (already loaded) has the stack, the conventions, the editing rules and a project map. Use it. Do NOT list or scan the project. Open only the files named below.
Rules: only change the files listed. Do not touch tests/. Never delete a CSS rule. Do not write files with heredocs. Never rewrite `src/index.css` as a whole: change it with the edit tool and exact text. Write each file only once; do not write the same file again and again.

First: `git mv backlog/todo/021-device-photos.md backlog/in-progress/021-device-photos.md`. (If it says the file is not there, it is already moved: go on.)

Task: Every device card and the detail page show a product photo instead of only the emoji. If a photo cannot load, the emoji and the coloured gradient stay visible. The 14 photos already exist in `public/devices/` (`1.jpg` to `14.jpg`): do not touch them.

Read first: `src/components/DeviceCard.jsx`, `src/pages/DeviceDetail.jsx`, `src/index.css`.
Edit or create: `src/components/DeviceCard.jsx`, `src/pages/DeviceDetail.jsx`, `src/index.css`.

Steps:
1. Change `src/components/DeviceCard.jsx` with ONE call of the edit tool (do not rewrite the file). oldText:
```jsx
        <span className="card-icon">{categoryIcon(device.category)}</span>
```
   newText:
```jsx
        <span className="card-icon">{categoryIcon(device.category)}</span>
        <img className="card-photo" src={`/devices/${device.id}.jpg`} alt="" loading="lazy" onError={(e) => { e.currentTarget.hidden = true }} />
```
2. Change `src/pages/DeviceDetail.jsx` with ONE call of the edit tool (do not rewrite the file). oldText:
```jsx
            <span className="detail-icon">{categoryIcon(device.category)}</span>
```
   newText:
```jsx
            <span className="detail-icon">{categoryIcon(device.category)}</span>
            <img className="detail-photo" src={`/devices/${device.id}.jpg`} alt="" onError={(e) => { e.currentTarget.hidden = true }} />
```
3. Change `src/index.css` with 4 SEPARATE edit calls, one after the other. Each call is small. Do NOT rewrite the whole file, and do NOT merge calls: a long edit can run past the output limit.
   For each call, oldText must match the file exactly: copy it from here. If a call fails, read the file once and correct oldText from what you read. Do not guess. Do the calls in order, each one right after the last.
   Call 1. oldText:
```css
.card-media {
  display: grid;
  place-items: center;
```
   newText:
```css
.card-media {
  position: relative;
  overflow: hidden;
  display: grid;
  place-items: center;
```
   Call 2. oldText:
```css
.detail-media {
  display: grid;
  place-items: center;
```
   newText:
```css
.detail-media {
  position: relative;
  overflow: hidden;
  display: grid;
  place-items: center;
```
   Call 3. oldText:
```css
.card-icon {
  font-size: 3.25rem;
```
   newText:
```css
.card-photo {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s;
}

.card:hover .card-photo {
  transform: scale(1.06);
}

.card-icon {
  font-size: 3.25rem;
```
   Call 4. oldText:
```css
.detail-icon {
  font-size: 5rem;
```
   newText:
```css
.detail-photo {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.detail-icon {
  font-size: 5rem;
```

When done:
- Run `npm run verify -- 021`. If it says FAIL: read the lines under FAIL, fix `src/`, and run it again. Repeat until the last line is `VERIFY PASSED`.
- NEVER edit files in `tests/`, `package.json` or files the task does not list.
- Tick the checkboxes with this one command: `sed -i '' 's/- \[ \]/- [x]/' backlog/in-progress/021-device-photos.md`, then `git mv backlog/in-progress/021-device-photos.md backlog/done/021-device-photos.md`.
- `git add -A && git commit -m "task 021: Device photos on cards and detail page"`
If something is unclear or verify fails 3 times in a row: add a `## Notes` section to the task file explaining the problem and stop.
````
