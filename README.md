# Ai-Block — Device Rental, built by local AI models

A device-rental website (laptops, tablets, phones, cameras, drones) **and** an experiment: can small, locally running language models build a real application if the work is cut into small, testable tickets?

All 51 tickets were done by local models (LM Studio + the `pi` coding agent) on one MacBook M1 Pro with 32 GB. No cloud models wrote the application code.

| | |
|---|---|
| Status | 51 of 51 tickets done, 53 test files green |
| Site | catalog, device pages, rentals, cancel, accounts, roles, admin area |
| Backend | Express 5 API, SQLite (`node:sqlite`), session-cookie login, Docker |
| Experiment | five models benchmarked, ticket statistics from the agent session logs |

## Read the results

- **Slides (German, 16 slides):** [AI-Block Projektpräsentation.html](AI-Block%20Projektpr%C3%A4sentation.html) — [open it rendered](https://htmlpreview.github.io/?https://raw.githubusercontent.com/killua-glich/Ai-Block/main/AI-Block%20Projektpr%C3%A4sentation.html) (or download the file and open it in a browser)
- **Benchmark method and results:** [bench/README.md](bench/README.md)
- **Raw benchmark data:** [bench/results/summary.md](bench/results/summary.md) and the per-model JSON files in [bench/results/](bench/results/)
- **Backlog (all 51 tickets, with tests):** [backlog/done/](backlog/done/) and [tests/](tests/)
- **Rules the agents follow:** [AGENTS.md](AGENTS.md) and [backlog/README.md](backlog/README.md)
- **Loop guard for `pi`:** [tools/pi-loop-guard/](tools/pi-loop-guard/)

## The model experiment in numbers

### Benchmark (2026-11-23)

Five tests per model, graded by code, one run each at temperature 0.2. Details in [bench/README.md](bench/README.md).

| Model | component | logic | data | tools | scout | avg | tok/s | time for all 5 |
|---|---|---|---|---|---|---|---|---|
| Supergemma4 26B MoE | 1.00 | 0.90–1.00 | 1.00 | 1.00 | 1.00 | **0.98+** | 28.5 | 55 s |
| Inkling 2 Mini (4-bit) | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | **1.00** | 15.2 | 508 s |
| Qwen2.5 Coder 14B | 1.00 | 0.90 | 0.88 | 1.00 | 1.00 | **0.96** | 12.8 | 113 s |
| Spark X2.5 4B | 1.00 | 0.00 | 1.00 | 1.00 | 1.00 | **0.80** | 28.3 | 467 s |
| Qwen 3.8 27B | 1.00 | – | – | – | – | removed | ~9 | 5+ min per answer |

Gemma and Inkling are equally accurate; Gemma needs a ninth of the time.

### In real tickets (from the `pi` session logs)

The benchmark and real work disagreed: Qwen 3.8 failed the benchmark on speed, then became the most stable agent for long tickets and the default model.

| Model | Tickets | Avg. duration | Prompt processing (share of model time) | Avg. input tokens |
|---|---|---|---|---|
| Gemma 26B | 4 | 14.0 min | ~49 % | 414k |
| Inkling 2 Mini | 9 | 9.8 min | ~35 % | 7.4k (plus cache) |
| Qwen 3.8 27B | 38 | 8.3 min | ~43 % | 81k |

How these were estimated: each model answer in the session logs has a duration and token counts. Generation time = output tokens ÷ the model's measured token rate; the rest of the model time counts as prompt processing. The logs show no cache hits for Qwen and Gemma, so every step re-reads the whole conversation. Treat the numbers as orders of magnitude.

### What went wrong, and what it became

| Observation | Cause | Result |
|---|---|---|
| CSS rules deleted, task file shortened, `verify` still green | no CSS tests, task file out of scope | `verify` steps `css` and `task file` |
| Gemma: 9 failed edits, then 40 reads of one file | long, similar `oldText` in a big file | editing rules, loop guard |
| Inkling: ~25 empty bash calls | always picks bash when bash is available | proxy hint "use write, not edit", loop guard |
| `STOP length` on one big edit | one edit needed 8191 tokens | tickets split into small edits (≤ ~30 lines) |
| Qwen repeats the same step | LM Studio loaded 8192 instead of 32768 context | always load with `--context-length 32768`, check `lms ps` |

Main lessons: green `verify` only means the tested part is right, task size beats model size, every model fails differently, and a wrong configuration looks like a model error.

## Getting started

Requires Node 24 (the API uses the built-in `node:sqlite`).

```bash
npm install
npm run dev        # site at http://localhost:5173 (proxies /api to :3001)
npm run server     # API at :3001, database in data/ai-block.db
npm run build      # production build to dist/
npm test           # all tests (Vitest)
npm run verify -- 045   # check one ticket: scope, css, task file, lint, build, tests
npm run codemap    # regenerate the project map in AGENTS.md
```

The first admin comes from the environment: set `ADMIN_EMAIL` and `ADMIN_PASSWORD` before starting the server. Without them there is no admin (a `role` sent in the sign-up form is ignored).

```bash
docker compose up -d   # site on http://localhost:8080, API as a second service, database in the volume db-data
```

## How it is built

1. **One ticket per session.** Tickets are Markdown files in `backlog/` (`todo/`, `in-progress/`, `done/`) with a file list, acceptance criteria and a prompt with small exact steps.
2. **Tests first, written by a human.** `tests/task-NNN.test.*` exist before the agent starts; the agent may not change them.
3. **`npm run verify -- NNN`** checks scope, CSS, task file, lint, build and tests (all finished tickets plus the current one). It runs in the pre-commit hook.
4. **Project map.** `AGENTS.md` holds the rules plus a generated map of the source, so the agent opens 2–4 files instead of scanning.
5. **Loop guard.** A `pi` extension blocks repeated calls, rewrites without running anything, empty calls and failing edits.
6. **Review.** Every commit is read against its ticket before it is pushed.

## Architecture

```
Browser -> Vite proxy (dev) or nginx (Docker) -> server/app.js (Express 5) -> SQLite
```

- **API:** `GET /api/health`, `GET /api/devices`, `GET /api/devices/:id`, `GET`/`POST /api/rentals`, cancel a rental, `POST /api/auth/register|login|logout`, `GET /api/auth/me`, admin routes for devices. Errors are `{ "error": "message" }`.
- **Login:** session cookie `sid` (`HttpOnly`, `SameSite=Lax`, 7 days). Only the SHA-256 hash of the token is stored. Passwords use `scrypt`. Roles: `user`, `admin`.
- **Database (schema version 6):** `categories`, `devices`, `rentals`, `users`, `sessions`. Prices are stored in whole cents; the API and the site still use euros. Schema changes are numbered migrations in `server/migrations.js` (`PRAGMA user_version`).
- **Front end:** React 19, Vite, React Router 7, plain JavaScript. Pages in `src/pages/`, components in `src/components/`, data and API client in `src/data/`. Without a server the site falls back to a built-in device list.

```
src/        pages, components, data, styles (one index.css)
server/     API, database, migrations, seed, accounts
tests/      acceptance tests per ticket plus shared test helpers
backlog/    tickets (todo, in-progress, done)
bench/      model benchmark and results
tools/      loop guard for pi, image helper
scripts/    verify, css checks, code map generator
public/     hero image and device photos (generated locally with Qwen-Image 2.1)
```

## Known gaps

- No login rate limiting and no `Secure` cookie flag (needed once the site runs over HTTPS).
- The Docker images were not rebuilt for the accounts series (only the `ADMIN_*` variables are passed through).
- The admin page briefly shows an empty form until the login check finishes (cosmetic; the server still refuses admin actions).
- Benchmark: one run per test, tickets of very different size, models not compared on the same tickets. Numbers are orders of magnitude, not statistics.

## License note

The hero image and the device photos were generated with Qwen-Image 2.1 (Qwen Research License): fine for a school project, check the license before commercial use.
