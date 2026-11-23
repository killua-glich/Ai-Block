# Model benchmark

Tests the local LM Studio models on jobs shaped like the backlog tasks, so each task can go to the model that is good at it.

```bash
node bench/run.mjs                 # all models in MODELS
node bench/run.mjs <model-id>      # one model
node bench/run.mjs --summary       # rebuild summary.md from results/*.json
```

The script loads **one model at a time** with a 32k context (`lms load ... --context-length 32768`), runs the 5 tests, then unloads it. It writes `results/<model>.json` (scores, checks, speed, output samples) and `results/summary.md`.
Close other models in LM Studio before running it.

## Tests

Every test is graded by code, not by eye:

| Test | Like task | What the model does | How it is graded |
|---|---|---|---|
| component | 001, 002 | rewrite `Catalog.jsx` with a filter and sort | real `vite build` on a temp copy, plus checks: useState, categories derived from data, empty state, sort on a copy |
| logic | 004 | `rentalQuote()` with date math | 10 unit tests (month end, leap year, daylight saving, errors) |
| data | 003 | rewrite `devices.js` to a schema | imports the module and checks 8 schema rules |
| tools | agent work | OpenAI tool-calling loop: read `App.jsx`, then write it with a 404 route | valid tool calls, reads before writing, the written file builds (up to 5 turns) |
| scout | explorer role | read `AGENTS.md`, answer which files to edit as JSON | exact file sets plus pure-JSON output |

## Results (2026-11-23, MacBook M1 Pro 32 GB)

| Model | component | logic | data | tools | scout | avg | tok/s | time for all 5 |
|---|---|---|---|---|---|---|---|---|
| Supergemma4 26B MoE | 1.00 | 0.90–1.00 | 1.00 | 1.00 | 1.00 | **0.98–1.00** | 28.5 | 55 s |
| Qwen2.5 Coder 14B | 1.00 | 0.90 | 0.88 | 1.00 | 1.00 | **0.96** | 12.8 | 113 s |
| Spark X2.5 4B | 1.00 | 0.00 | 1.00 | 1.00 | 1.00 | **0.80** | 28.3 | 467 s |
| Inkling 2 Mini (4-bit) * | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | **1.00** | 15.2 | 508 s |
| ~~Qwen3.8 27B~~ | 1.00 | – | – | – | – | removed | ~9 | 5+ min per answer |

What failed:
- **Spark 4B, logic:** reasoned in a loop until it hit the 8192-token limit and returned no code. That is also why its total time is so long. It's fine on anything that's fully specified.
- **Qwen Coder 14B, logic:** off by one across the October daylight-saving change (4 days instead of 3).
- **Qwen Coder 14B, data:** only 4 categories instead of at least 5, so it is weak at counting constraints.
- **Gemma 26B, logic:** passed 10/10 in one run, 9/10 in the other (the March daylight-saving change).
- **Inkling 2 Mini:** perfect score, but it reasons for 1,500–3,200 tokens per answer, so it is about 9× slower than Gemma for the same result. No task assigned (see below).
- **Qwen3.8 27B:** answers were correct but it reasons for thousands of tokens at ~9 tok/s, over 5 minutes per answer. Too slow for the agent loop, so it was removed from `MODELS`.

## \* Inkling 2 Mini: how it was run

LM Studio (MLX 1.14.0 and oMLX 0.5.0) can't load it yet: `Model type inkling2_loop not supported`. The mlx-community 4-bit checkpoint only works with mlx-lm from the unmerged PR #2086:

```bash
uv tool install --python 3.12 "mlx-lm @ git+https://github.com/ml-explore/mlx-lm.git@refs/pull/2086/head"
mlx_lm.server --port 8090 --model ~/.lmstudio/models/mlx-community/Inkling-2-Mini-4bit --max-tokens 8192
node bench/run.mjs inkling-2-mini
```

(mlx-vlm from GitHub main does support Inkling, but expects different weight names than this checkpoint.)

That server returns Inkling's raw message tokens (`<|content_thinking|>`, `<|content_invoke_tool_json|>`) instead of separating the answer and returning structured `tool_calls`. `bench/run.mjs` has a small parser (`parseInkling`) for this, so the score measures the model. **OpenCode can't parse these tokens, so Inkling can't be used as an agent yet.** Check again once LM Studio supports `inkling2_loop`.

RAM: about 7 GB process RSS plus Metal memory, with about 33% of system RAM still free. It fits on 32 GB with nothing else loaded.

## Decision

**One model for every task: Gemma 26B (`gemma-dev`), no orchestrator, no subagents.** It tied for the best score and was the fastest by far. Per-task models (Qwen Coder for components, Spark for small tasks) were assigned at first but dropped to keep the setup simple: one model loaded, one agent, nothing switching models.

## Caveats

- One run per test at temperature 0.2, so results are noisy (see Gemma's logic score). Run it again before trusting small differences.
- Single prompts, not a full OpenCode session: this measures the model, not the harness.
- To add a model (e.g. on the Mac mini), put its LM Studio ID in `MODELS` and run `node bench/run.mjs <id>`.
