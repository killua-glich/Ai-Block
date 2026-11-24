# Backlog

Work queue for the local coding agents (and humans). One task = one Markdown file.

## Folders = status

| Folder         | Meaning                                  |
|----------------|------------------------------------------|
| `todo/`        | Ready to pick up. Lowest number first.   |
| `in-progress/` | Someone/some agent is working on it.     |
| `done/`        | Finished and acceptance criteria met.    |

Move a task with `git mv backlog/todo/003-x.md backlog/in-progress/`.

## Rules for agents

1. Pick the **lowest-numbered** file in `todo/` whose `Depends on` tasks are all in `done/`.
2. Move it to `in-progress/` before starting.
3. Only touch the files listed under **Files**, unless the task says otherwise.
4. Stack: React 19 + Vite, **plain JavaScript (.jsx)**, no TypeScript, no new libraries unless the task allows it.
5. Done = every acceptance-criteria checkbox ticked **and** `npm run verify -- NNN` ends with `VERIFY PASSED`.
6. Tick the boxes, move the file to `done/`, commit with message `task NNN: <title>`.
7. If stuck or the task is unclear: add a `## Notes` section explaining why, leave it in `in-progress/`, stop.

## Task template

Copy `TEMPLATE.md` to `todo/NNN-short-name.md` (next free number, 3 digits).
Keep tasks small: one component or one page change, ideally < 150 lines of code.
**Write `tests/task-NNN.test.jsx` before the task goes into `todo/`.** Check that it fails now, and passes with a quick reference solution (see Verification).

## Running a task with a local agent

Every task file ends with a `## Prompt` section. Start OpenCode in the repo root
(default agent `qwen-orchestrator`, Qwen3.8 27B) and paste that prompt.
**One task per session.** Start a fresh session for the next task so the 32k context stays clean.

Prompts are written for small local models:
- self-contained: they don't rely on earlier chat history
- no exploring: `AGENTS.md` (auto-loaded) holds a generated project map, so the agent opens only the files the task names
- exact file paths, data shapes, and numbered steps
- the build check and the git workflow are part of every prompt
- the agent stops and writes `## Notes` instead of guessing

When you write a new task, keep the prompt under ~400 words and follow the same structure.

## Context strategy

Rescanning the repo every session wastes the 32k context, so:

1. **`AGENTS.md`** in the repo root is auto-loaded by OpenCode and pi. It holds the rules plus a generated **project map**: every file under `src/` with its exports, imports, hooks, routes, data shapes and CSS classes (~500 tokens).
2. **`scripts/codemap.mjs`** generates that map (`npm run codemap`).
3. **`.githooks/pre-commit`** reruns it on every commit, so after each task the next session starts with an up-to-date map. `npm install` enables the hook via the `prepare` script.
4. **Task prompts** name the exact files to read and edit, so the agent opens 2–4 files instead of the whole repo.

## Agent: one model, no orchestrator

Every task runs with the same single agent, **`gemma-dev`** (Supergemma4 26B MoE), the default in `opencode.json`. Just run `opencode` in the repo root.

- **Single model, no orchestrator, no subagents.** Only one model is loaded at a time, there's no delegation overhead, and nothing switches models between steps. The `AGENTS.md` map replaces the explorer.
- **Why Gemma:** best score and fastest in `bench/` (1.00 avg, ~28 tok/s, 55 s for all 5 tests), and the only fast model that got the date logic right.
- Your global agents (orchestrators, explorers, `gemma-lead`, `qwen-coder`) are disabled in this project via `opencode.json`. Your global config is unchanged.
- If a task fails twice: make it smaller or more explicit (prompt and test), don't switch models.

## Verification

An agent saying "done" doesn't count. `npm run verify -- NNN` decides:

| Step | Checks | Catches |
|---|---|---|
| scope | `git status` vs. the task's **Files** line (plus `backlog/`, `AGENTS.md`) | edits outside the task, edited tests, new npm packages |
| css | `src/**/*.css` vs. `HEAD` (parser: `scripts/css.mjs`) | deleted CSS rules, duplicate selectors. A rule inside `@media` counts as different from the same selector outside it |
| task file | task files in `in-progress/` and `done/` vs. `HEAD`, ignoring `[ ]`/`[x]` and a trailing `## Notes` | an agent rewriting or truncating its task file |
| lint | `eslint src tests` (JS recommended + React hooks rules) | unused vars, undefined names, broken hook usage |
| build | `vite build` | syntax and import errors |
| tests | Vitest + Testing Library: `task-000` baseline, **every task in `done/`**, and task NNN | wrong behavior, regressions in earlier tasks |

- Tests are **written by a human before the agent starts**, and test behavior (roles, visible text), not implementation. So different correct solutions pass and the agent can't game them.
- Tests run in a fixed timezone (`Europe/Zurich`), so daylight-saving bugs show up the same on every machine.
- The output is short (PASS/FAIL per step, first errors only), so a 4B model can read it and fix the code.
- The **pre-commit hook** runs `npm run verify` (all done tasks). A failing agent can't commit, and an old task that breaks blocks the commit.

How the tests were checked (2026-11-23):
1. All task tests fail on the current code, so they really test something new.
2. Reference solutions for 001–007, written exactly as the prompts say, pass every step, so the tests don't block correct work.
3. Four planted bugs were caught: sorting the original array (002), the daylight-saving off-by-one from the benchmark (004), a missing 404 route (007), and an unused variable (lint).

After the agent: run `npm run verify -- NNN` yourself, then look at `git show` for anything the tests can't see (style, UX). Then start the next task.

The css and task-file guards were added after watching a real agent run (task 001, see bug ticket 008): it deleted the `button` rules and truncated its task file, and verify was still green. Both kinds of damage are now caught, which I checked by planting them again.

## Ticket types

| Type | Example | How it starts |
|---|---|---|
| (feature) | 001–007 | test first, then the ticket |
| bug | 008 repair, 009 euros | test that shows the bug, then the ticket |
| styling | 010–019 | tests that check what can be measured: CSS variables, hover and focus rules, media queries, labels, classes and behavior in the markup |

Styling tickets are a chain: each rewrites `src/index.css`, so they run **in order** (010 first). Together they turn the plain page into a bold, modern design: violet to pink gradient brand, frosted-glass header, hero with live search, category icons on gradient cards, a sticky booking card, status chips, dark mode, and reduced motion. Every prompt contains the exact CSS and component code to write, taken from a reference solution that was checked in a throwaway copy. The tests for tickets that aren't done yet are not part of `npm run verify`, but `npm test` runs them all.

CSS tests use `tests/css-helpers.js`, which reads `src/index.css` with the same parser as the verify guard.
