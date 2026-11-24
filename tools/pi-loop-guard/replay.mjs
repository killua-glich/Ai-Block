// Replays real pi sessions through the guard: which calls would it have blocked?
//   node tools/pi-loop-guard/replay.mjs [sessions folder]
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'
import { createGuard } from './guard.js'

const dir = process.argv[2] ?? join(homedir(), '.pi/agent/sessions/--Users-pandolfodiego-Ai-Block--')
const files = readdirSync(dir).filter((f) => f.endsWith('.jsonl')).sort()
let falseAlarms = 0

for (const file of files) {
  const rows = readFileSync(join(dir, file), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l))
  const guard = createGuard()
  const pending = new Map()
  const blocks = []
  let calls = 0
  let model = ''
  for (const r of rows) {
    if (r.type === 'model_change') model = r.modelId
    const m = r.message
    if (!m) continue
    if (m.role === 'user') guard.reset() // a new prompt is a new run
    if (m.role === 'assistant' && Array.isArray(m.content)) {
      for (const it of m.content) {
        if (it.type !== 'toolCall' && it.type !== 'tool_use') continue
        const name = it.name
        const input = it.arguments ?? it.input ?? {}
        calls += 1
        const v = guard.check({ name, input })
        if (v.block) blocks.push({ n: calls, name, why: v.reason.slice(0, 70), stop: v.terminate })
        pending.set(it.id, { name, input })
      }
    }
    if (m.role === 'toolResult') {
      const c = pending.get(m.toolCallId) ?? [...pending.values()].pop()
      if (c) guard.result({ ...c, isError: !!m.isError })
    }
  }
  const stopped = blocks.some((b) => b.stop)
  console.log(`${file.slice(0, 16)}  ${model.padEnd(36)} calls ${String(calls).padStart(3)}  blocked ${String(blocks.length).padStart(3)}${stopped ? '  (run stopped)' : ''}`)
  for (const b of blocks.slice(0, 2)) console.log(`      first blocks: call #${b.n} ${b.name}: ${b.why}`)
}
