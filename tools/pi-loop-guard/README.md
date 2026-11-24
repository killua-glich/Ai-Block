# pi loop guard

A [pi](https://pi.dev) extension that stops the loops small local models fall into. It watches the
agent's tool calls and, when it sees a loop, blocks the call with a message the model can act on.
After 4 blocked calls in one run it stops the run, so a model that ignores the messages stops
burning time.

## What it catches

Every rule comes from a real session in this project.

| Rule | Loop | Seen in | Block message says |
|---|---|---|---|
| A | the same call 3 times in a row | Gemma read one file 40 times (task 001) | do the next step, or run verify |
| B | writing a file again with no command in between | Gemma rewrote 2 files 6 times without running verify (task 012) | it already worked, run verify; fix with edit only if verify fails |
| C | empty calls: `echo ...`, `true`, `:`, `sleep N` twice in a row | Inkling made about 25 of them (ticket 008) | empty calls do nothing, run verify |
| D | edits that keep failing on one file | Gemma: 9 failed edits with guessed text (task 001) | hint after the 2nd failure, block after the 4th until the file is read |

Rule B resets on every `bash` call, so "write, verify, fix, write again" is fine. Edits are never counted
as writes. A new user message starts a new run with fresh counters.

If the guard itself has a bug it **fails open**: the error is swallowed and the call goes through.

## Files

| File | |
|---|---|
| `guard.js` | the rules, pure logic with no pi imports |
| `index.ts` | the pi extension: `agent_start` (reset), `tool_call` (block), `tool_result` (hint) |
| `guard.test.mjs` | unit tests, one or more per rule, plus "a normal task run is never blocked" |
| `replay.mjs` | replays real pi sessions through the guard and prints what it would have blocked |

## Install

pi loads `~/.pi/agent/extensions/*/index.ts`. Link this folder there, so the repo stays the one copy:

```bash
ln -s ~/Ai-Block/tools/pi-loop-guard ~/.pi/agent/extensions/loop-guard
```

Remove it again with `rm ~/.pi/agent/extensions/loop-guard` (that deletes the link, not the repo files).
Try it once without installing: `pi -e ~/Ai-Block/tools/pi-loop-guard/index.ts`.

## Test

```bash
npm run guard:test                      # unit tests
node tools/pi-loop-guard/replay.mjs     # replay all real sessions of this project
```

The replay is the check against false alarms: the sessions that went well must show `blocked 0`.
Sessions with a loop show where the guard would have stepped in.

## Known limits

- It cannot make a model understand the message. It makes the loop short and visible.
- In `pi -p` (print mode) a run the guard stops ends without a final answer.
- `pi -p --mode json` hung in every test on this Mac, with and without the extension, so it is not a good way to test it. Use the unit tests and the replay.
- Rule C only knows `echo`, `true`, `:` and `sleep`. Other do-nothing commands are not caught.
