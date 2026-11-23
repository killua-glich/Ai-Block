# 008 — Bug fix: repair damage from the task 001 agent run

**Type:** bug
**Depends on:** 001
**Files:** `src/index.css`, `backlog/done/001-category-filter.md`

## Bug

Found by watching the pi session for task 001 (2026-11-23). `npm run verify -- 001` passed, but the agent:

1. **Deleted the `button` and `button:disabled` CSS rules.** It used them as the edit anchor and replaced them with `.filters`, so all buttons lost their styling.
2. **Added `.filters` twice**, and left `src/index.css` without a newline at the end.
3. **Cut `backlog/done/001-category-filter.md` down from 52 to 20 lines** while ticking the checkboxes. The `## Prompt` section was lost, and a stray `EOF` line was left behind.

`src/pages/Catalog.jsx` is correct. Do not touch it.

## Acceptance criteria

- [x] `button` and `button:disabled` rules are back, unchanged
- [x] `.filters` is defined exactly once, and no selector is defined twice
- [x] `src/index.css` ends with a newline
- [x] `backlog/done/001-category-filter.md` is the full original file again (including `## Prompt`) with every box ticked
- [x] `npm run verify -- 008` passes (tests: `tests/task-008.test.js`)

## Prompt

Run `opencode` (or `pi`) in the repo root, then paste:

````text
Context: AGENTS.md (already loaded) has the stack, the conventions and a project map. Do NOT list or scan the project. Open only the files named below.
Rules: only change the files listed. Do not touch src/pages/Catalog.jsx.

First: `git mv backlog/todo/008-fix-001-regressions.md backlog/in-progress/008-fix-001-regressions.md`.

Task: repair two files that an earlier agent run damaged.

Step 1: Overwrite `src/index.css` with the `write` tool (NOT edit, NOT bash). Use exactly this content, with a newline at the end:

* { box-sizing: border-box; }
body { margin: 0; font-family: system-ui, sans-serif; color: #222; background: #f7f7f8; }
a { color: #2563eb; text-decoration: none; }
.header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 2rem; background: #fff; border-bottom: 1px solid #e5e5e5; }
.logo { font-weight: 700; font-size: 1.25rem; color: #222; }
.container { max-width: 1000px; margin: 0 auto; padding: 2rem; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem; }
.card { background: #fff; border: 1px solid #e5e5e5; border-radius: 8px; padding: 1rem; }
.category { color: #666; font-size: 0.9rem; }
.price { font-weight: 600; }
button { padding: 0.5rem 1rem; border-radius: 6px; border: none; background: #2563eb; color: #fff; cursor: pointer; }
button:disabled { background: #9ca3af; cursor: not-allowed; }
.filters { display: flex; gap: 1rem; margin-bottom: 1rem; }

Step 2: Restore the task 001 file. Run these two bash commands exactly as written, one after the other:
   git show d67c0f5:backlog/todo/001-category-filter.md > backlog/done/001-category-filter.md
   sed -i '' 's/- \[ \]/- [x]/' backlog/done/001-category-filter.md

Do NOT write any file with a heredoc (`cat <<EOF`). Use the write tool for files.

When done:
- Run `npm run verify -- 008`. If it says FAIL: read the lines under FAIL, fix, and run it again. Repeat until the last line is `VERIFY PASSED`.
- NEVER edit files in `tests/`.
- Tick every checkbox in `backlog/in-progress/008-fix-001-regressions.md` with the edit tool (change only `[ ]` to `[x]`, nothing else), then `git mv backlog/in-progress/008-fix-001-regressions.md backlog/done/008-fix-001-regressions.md`.
- `git add -A && git commit -m "task 008: fix 001 regressions"`
If verify fails 3 times in a row: add a `## Notes` section to the task file explaining the problem and stop.
````
