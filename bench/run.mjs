#!/usr/bin/env node
// Benchmark local LM Studio models on tasks shaped like the Ai-Block backlog.
// Usage: node bench/run.mjs [modelId ...]   (default: all models in MODELS)
// Loads one model at a time (32k context), runs every test, grades it automatically,
// unloads, and writes bench/results/<model>.json plus bench/results/summary.md.
import { execFileSync, execSync } from 'node:child_process'
import { mkdtempSync, writeFileSync, readFileSync, cpSync, symlinkSync, mkdirSync, rmSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const ROOT = new URL('..', import.meta.url).pathname
const API = 'http://127.0.0.1:1234/v1/chat/completions'
const LMS = join(process.env.HOME, '.lmstudio/bin/lms')
const OUT = join(ROOT, 'bench/results')
const MODELS = [
  'spark-x2.5-4b-mlx',
  'qwen/qwen2.5-coder-14b',
  'supergemma4-26b-uncensored-mlx-v2',
  'inkling-2-mini',
]
const read = (p) => readFileSync(join(ROOT, p), 'utf8')

// Models served outside LM Studio. Start the server yourself before running the bench.
// inkling-2-mini: LM Studio can't load it yet, so it's served by mlx-lm from PR #2086:
//   mlx_lm.server --port 8090 --model ~/.lmstudio/models/mlx-community/Inkling-2-Mini-4bit --max-tokens 8192
const EXTERNAL = {
  'inkling-2-mini': {
    api: 'http://127.0.0.1:8090/v1/chat/completions',
    id: join(process.env.HOME, '.lmstudio/models/mlx-community/Inkling-2-Mini-4bit'),
    parse: parseInkling,
  },
}

// mlx-lm's PR branch returns Inkling's raw message tokens. Extract the answer and tool calls.
function parseInkling(raw) {
  const parts = [...raw.matchAll(/<\|message_model\|>([\w-]*)<\|content_(\w+)\|>([\s\S]*?)(?:<\|end_message\|>|$)/g)]
  const text = parts.filter((m) => m[2] === 'text').map((m) => m[3]).join('\n').trim()
  const calls = parts.filter((m) => m[2] === 'invoke_tool_json').map((m, i) => {
    let j = {}
    try { j = JSON.parse(m[3]) } catch {}
    return { id: 'call_' + i, type: 'function', function: { name: j.name || m[1], arguments: JSON.stringify(j.args ?? j.arguments ?? {}) } }
  })
  return { text: parts.length ? text : raw, calls }
}

// ---------- helpers ----------
// Streaming request: avoids Node fetch's 5-minute header timeout on slow "thinking" models.
async function chat(model, messages, extra = {}) {
  const ext = EXTERNAL[model]
  const t0 = Date.now()
  const res = await fetch(ext ? ext.api : API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: ext ? ext.id : model, messages, temperature: 0.2, max_tokens: 8192, stream: true, stream_options: { include_usage: true }, ...extra }),
    signal: AbortSignal.timeout(30 * 60 * 1000),
  })
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`)
  let content = '', reasoning = '', usage = null
  const calls = []
  const decoder = new TextDecoder()
  let buf = ''
  for await (const chunk of res.body) {
    buf += decoder.decode(chunk, { stream: true })
    let i
    while ((i = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1)
      if (!line.startsWith('data:')) continue
      const data = line.slice(5).trim()
      if (data === '[DONE]') continue
      const j = JSON.parse(data)
      if (j.error) throw new Error(JSON.stringify(j.error))
      if (j.usage) usage = j.usage
      const d = j.choices?.[0]?.delta
      if (!d) continue
      if (d.content) content += d.content
      if (d.reasoning_content) reasoning += d.reasoning_content
      for (const tc of d.tool_calls || []) {
        const c = (calls[tc.index ?? 0] ||= { id: '', type: 'function', function: { name: '', arguments: '' } })
        if (tc.id) c.id = tc.id
        if (tc.function?.name) c.function.name += tc.function.name
        if (tc.function?.arguments) c.function.arguments += tc.function.arguments
      }
    }
  }
  const ms = Date.now() - t0
  if (ext?.parse) {
    const p = ext.parse(content)
    content = p.text
    if (p.calls.length && !calls.length) calls.push(...p.calls)
  }
  const msg = { role: 'assistant', content: content || null }
  if (calls.length) msg.tool_calls = calls.filter(Boolean)
  return { msg, text: stripThink(content), ms, outTokens: usage?.completion_tokens ?? 0, inTokens: usage?.prompt_tokens ?? 0, reasoningChars: reasoning.length }
}
const stripThink = (s) => s.replace(/<think>[\s\S]*?<\/think>/g, '').replace(/<\|channel>thought[\s\S]*?<channel\|>/g, '').trim()

function codeBlock(text) {
  const blocks = [...text.matchAll(/```[\w]*\n([\s\S]*?)```/g)].map((m) => m[1])
  if (!blocks.length) return text.trim()
  return blocks.sort((a, b) => b.length - a.length)[0]
}

// Copy the project to a temp dir, apply file overrides, run vite build.
function buildWith(overrides) {
  const dir = mkdtempSync(join(tmpdir(), 'aiblock-bench-'))
  try {
    for (const f of ['index.html', 'vite.config.js', 'package.json']) cpSync(join(ROOT, f), join(dir, f))
    cpSync(join(ROOT, 'src'), join(dir, 'src'), { recursive: true })
    symlinkSync(join(ROOT, 'node_modules'), join(dir, 'node_modules'))
    for (const [p, c] of Object.entries(overrides)) {
      mkdirSync(join(dir, p, '..'), { recursive: true })
      writeFileSync(join(dir, p), c)
    }
    execFileSync(join(ROOT, 'node_modules/.bin/vite'), ['build', '--logLevel', 'error', '--outDir', join(dir, 'dist')], { cwd: dir, stdio: 'pipe', timeout: 60000 })
    return { ok: true }
  } catch (e) {
    return { ok: false, error: String(e.stderr || e.message).slice(0, 400) }
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

// Run JS source as an ES module in a child node process and return its stdout JSON.
function runModule(source, harness) {
  const dir = mkdtempSync(join(tmpdir(), 'aiblock-mod-'))
  try {
    writeFileSync(join(dir, 'mod.mjs'), source)
    writeFileSync(join(dir, 'h.mjs'), harness)
    const out = execFileSync('node', [join(dir, 'h.mjs')], { cwd: dir, stdio: 'pipe', timeout: 15000 }).toString()
    return JSON.parse(out.trim().split('\n').pop())
  } catch (e) {
    return { error: String(e.stderr || e.message).slice(0, 400) }
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

const SYS = 'You are an expert React + JavaScript developer. Plain JavaScript (.jsx), no TypeScript, no new packages. Function components, default exports, 2-space indent, no semicolons, single quotes.'

// ---------- tests ----------
const TESTS = {
  // Like task 001/002: edit an existing React component.
  async component(model) {
    const prompt = `Edit this file to add a category filter.

src/data/devices.js:
\`\`\`js
${read('src/data/devices.js')}\`\`\`

src/pages/Catalog.jsx:
\`\`\`jsx
${read('src/pages/Catalog.jsx')}\`\`\`

Requirements:
1. A <select> above the grid with "All" plus every category from the data (derived with devices.map, not hard-coded).
2. Use useState for the selected category. Choosing a category shows only those devices, "All" shows everything.
3. If nothing matches, render <p>No devices found.</p>.
4. A second <select> to sort by pricePerDay: "default", "asc", "desc". Sort a COPY, never mutate devices.

Reply with ONLY the complete new src/pages/Catalog.jsx in one \`\`\`jsx code block.`
    const r = await chat(model, [{ role: 'system', content: SYS }, { role: 'user', content: prompt }])
    const code = codeBlock(r.text)
    const build = buildWith({ 'src/pages/Catalog.jsx': code })
    const checks = {
      build: build.ok,
      useState: /useState/.test(code),
      derived: /devices\.map\(/.test(code) && !/['"]Laptop['"]/.test(code),
      empty: /No devices found/.test(code),
      copySort: (/\[\s*\.\.\.\w+\s*\]|\.slice\(\)|toSorted\(|\.filter\([\s\S]*?\)\s*\.sort\(/.test(code)) && !/\bdevices\.sort\(/.test(code),
    }
    const score = (checks.build ? 0.5 : 0) + 0.5 * (Object.values(checks).filter(Boolean).length - (checks.build ? 1 : 0)) / 4
    return { r, score, checks, note: build.error }
  },

  // Like task 004/005: pure logic, graded by unit tests.
  async logic(model) {
    const prompt = `Write an ES module that exports this function:

export function rentalQuote(startDate, endDate, pricePerDay, today)

- All dates are 'YYYY-MM-DD' strings. today is passed in (do not use the real clock).
- If startDate or endDate is empty → return { days: 0, total: 0, error: null }
- If startDate < today → { days: 0, total: 0, error: 'Start date cannot be in the past.' }
- Else if endDate < startDate → { days: 0, total: 0, error: 'End date must be after start date.' }
- Otherwise days = number of calendar days INCLUDING both start and end day (same day = 1),
  total = days * pricePerDay, error = null.
- Must be correct across month ends, leap years and daylight-saving changes.

Reply with ONLY the module in one \`\`\`js code block.`
    const r = await chat(model, [{ role: 'system', content: SYS }, { role: 'user', content: prompt }])
    const code = codeBlock(r.text)
    const cases = [
      [['2026-12-01', '2026-12-01', 10, '2026-11-23'], { days: 1, total: 10, error: null }],
      [['2026-12-01', '2026-12-05', 25, '2026-11-23'], { days: 5, total: 125, error: null }],
      [['2026-11-30', '2026-12-02', 7, '2026-11-23'], { days: 3, total: 21, error: null }],
      [['2028-02-28', '2028-03-01', 1, '2026-11-23'], { days: 3, total: 3, error: null }],
      [['2027-03-27', '2027-03-29', 2, '2026-11-23'], { days: 3, total: 6, error: null }],
      [['2027-10-30', '2027-11-01', 2, '2026-11-23'], { days: 3, total: 6, error: null }],
      [['2026-11-23', '2026-11-23', 5, '2026-11-23'], { days: 1, total: 5, error: null }],
      [['2026-11-20', '2026-11-25', 5, '2026-11-23'], { days: 0, total: 0, error: 'Start date cannot be in the past.' }],
      [['2026-12-05', '2026-12-01', 5, '2026-11-23'], { days: 0, total: 0, error: 'End date must be after start date.' }],
      [['', '2026-12-01', 5, '2026-11-23'], { days: 0, total: 0, error: null }],
    ]
    const harness = `import { rentalQuote } from './mod.mjs'
const cases = ${JSON.stringify(cases)}
let pass = 0; const fails = []
for (const [args, want] of cases) {
  try { const got = rentalQuote(...args); if (got && got.days === want.days && got.total === want.total && (got.error ?? null) === want.error) pass++; else fails.push({ args, got }) } catch (e) { fails.push({ args, err: String(e) }) }
}
console.log(JSON.stringify({ pass, total: cases.length, fails: fails.slice(0, 3) }))`
    const res = runModule(code, harness)
    return { r, score: res.error ? 0 : res.pass / res.total, checks: res, note: res.error }
  },

  // Like task 003: generate structured data that must match a schema.
  async data(model) {
    const prompt = `Rewrite src/data/devices.js. Current file:
\`\`\`js
${read('src/data/devices.js')}\`\`\`

Requirements:
- Keep the 4 existing devices (same id and name). Add more so there are at least 10 devices in at least 5 categories.
- Every object has exactly: { id: number, name: string, category: string, pricePerDay: number, description: string, specs: string[] (3-5 items), available: boolean }
- ids are 1, 2, 3, ... with no gaps. At least 2 devices have available: false.
- Keep \`export default devices\`.

Reply with ONLY the complete file in one \`\`\`js code block.`
    const r = await chat(model, [{ role: 'system', content: SYS }, { role: 'user', content: prompt }])
    const code = codeBlock(r.text)
    const harness = `import devices from './mod.mjs'
const keys = 'id,name,category,pricePerDay,description,specs,available'
const c = {}
c.count = Array.isArray(devices) && devices.length >= 10
c.categories = new Set(devices.map((d) => d.category)).size >= 5
c.exactKeys = devices.every((d) => Object.keys(d).sort().join() === keys.split(',').sort().join())
c.types = devices.every((d) => typeof d.id === 'number' && typeof d.name === 'string' && typeof d.pricePerDay === 'number' && typeof d.description === 'string' && typeof d.available === 'boolean')
c.specs = devices.every((d) => Array.isArray(d.specs) && d.specs.length >= 3 && d.specs.length <= 5 && d.specs.every((s) => typeof s === 'string'))
c.ids = devices.every((d, i) => d.id === i + 1)
c.unavailable = devices.filter((d) => d.available === false).length >= 2
c.kept = ['MacBook Pro 14"', 'iPad Air', 'Sony Alpha 7 IV', 'Google Pixel 9'].every((n, i) => devices[i] && devices[i].name === n)
console.log(JSON.stringify(c))`
    const res = runModule(code, harness)
    if (res.error) return { r, score: 0, checks: {}, note: res.error }
    return { r, score: Object.values(res).filter(Boolean).length / Object.keys(res).length, checks: res }
  },

  // Agent ability: OpenAI-style tool calling loop (read file, then write file).
  async tools(model) {
    const tools = [
      { type: 'function', function: { name: 'read_file', description: 'Read a file from the project', parameters: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] } } },
      { type: 'function', function: { name: 'write_file', description: 'Overwrite a file with new full content', parameters: { type: 'object', properties: { path: { type: 'string' }, content: { type: 'string' } }, required: ['path', 'content'] } } },
    ]
    const messages = [
      { role: 'system', content: SYS + ' You are a coding agent. Use the tools to read and change files. Always read a file before you overwrite it.' },
      { role: 'user', content: "In src/App.jsx add a catch-all route: <Route path=\"*\" element={<NotFound />} /> as the last route, and import NotFound from './pages/NotFound.jsx' (that file already exists)." },
    ]
    const checks = { call1: false, readFirst: false, call2: false, build: false }
    const stub = "export default function NotFound() { return <p>Not found</p> }\n"
    const files = { 'src/App.jsx': read('src/App.jsx'), 'src/pages/NotFound.jsx': stub }
    const total = { ms: 0, outTokens: 0, inTokens: 0, text: '' }
    let readApp = false, writeArgs = null, note = null
    for (let turn = 0; turn < 5 && !writeArgs; turn++) {
      const r = await chat(model, messages, { tools })
      total.ms += r.ms; total.outTokens += r.outTokens; total.inTokens += r.inTokens; total.text = r.text
      const tc = r.msg.tool_calls?.[0]
      let args = null
      try { args = tc && JSON.parse(tc.function.arguments) } catch {}
      if (!args) { note = `turn ${turn + 1}: no valid tool call. text: ` + r.text.slice(0, 200); break }
      if (turn === 0) checks.call1 = true
      messages.push({ role: 'assistant', content: r.msg.content, tool_calls: [tc] })
      const path = (args.path || '').replace(/^\.?\//, '')
      if (tc.function.name === 'read_file') {
        if (path === 'src/App.jsx') readApp = true
        messages.push({ role: 'tool', tool_call_id: tc.id, content: files[path] ?? 'Error: file not found' })
      } else if (tc.function.name === 'write_file') {
        writeArgs = { ...args, path }
      } else {
        messages.push({ role: 'tool', tool_call_id: tc.id, content: 'Error: unknown tool' })
      }
    }
    checks.readFirst = readApp
    checks.call2 = !!(writeArgs && writeArgs.path === 'src/App.jsx' && writeArgs.content)
    if (checks.call2) {
      const c = writeArgs.content
      const b = buildWith({ 'src/App.jsx': c, 'src/pages/NotFound.jsx': stub })
      checks.build = b.ok && /path=["']\*["']/.test(c) && /import NotFound/.test(c)
      note = b.error || null
    }
    return { r: total, score: Object.values(checks).filter(Boolean).length / 4, checks, note }
  },

  // Scout/planning: read the project map and answer precisely in a fixed format.
  async scout(model) {
    const map = read('AGENTS.md')
    const prompt = `${map}

Question: To add a new page at /rentals called MyRentals and a "My rentals" link in the header, which existing files must be edited and which new file must be created?
Reply with ONLY a JSON object, no prose: {"edit": ["path", ...], "create": ["path", ...]}`
    const r = await chat(model, [{ role: 'user', content: prompt }])
    let obj = null
    try { obj = JSON.parse(r.text.replace(/^```\w*\n?|```$/g, '').trim()) } catch {}
    if (!obj) return { r, score: 0, checks: { json: false }, note: r.text.slice(0, 200) }
    const norm = (a) => new Set((a || []).map((p) => p.replace(/^\.?\//, '')))
    const jac = (a, b) => { const u = new Set([...a, ...b]); return u.size ? [...a].filter((x) => b.has(x)).length / u.size : 1 }
    const edit = jac(norm(obj.edit), new Set(['src/App.jsx', 'src/components/Header.jsx']))
    const create = jac(norm(obj.create), new Set(['src/pages/MyRentals.jsx']))
    const pureJson = /^\s*[{`]/.test(r.text)
    return { r, score: 0.45 * edit + 0.45 * create + 0.1 * (pureJson ? 1 : 0), checks: { json: true, edit, create, pureJson, answer: obj } }
  },
}

// ---------- runner ----------
function lms(args) {
  return execFileSync(LMS, args, { stdio: 'pipe', timeout: 10 * 60 * 1000 }).toString()
}

async function benchModel(model) {
  console.log(`\n=== ${model} ===`)
  const ext = EXTERNAL[model]
  if (!ext) try { lms(['unload', '--all']) } catch {}
  const t0 = Date.now()
  if (!ext) lms(['load', model, '--context-length', '32768', '-y'])
  const loadMs = Date.now() - t0
  console.log(`loaded in ${(loadMs / 1000).toFixed(0)}s`)
  const results = { model, loadMs, tests: {} }
  for (const [name, fn] of Object.entries(TESTS)) {
    process.stdout.write(`  ${name} ... `)
    try {
      const { r, score, checks, note } = await fn(model)
      const tps = r.outTokens && r.ms ? r.outTokens / (r.ms / 1000) : 0
      results.tests[name] = { score: +score.toFixed(2), seconds: +(r.ms / 1000).toFixed(1), outTokens: r.outTokens, tokPerSec: +tps.toFixed(1), checks, note: note || null, sample: (r.text || '').slice(0, 1500) }
      console.log(`score ${score.toFixed(2)}  ${(r.ms / 1000).toFixed(0)}s  ${tps.toFixed(1)} tok/s`)
    } catch (e) {
      results.tests[name] = { score: 0, error: String(e).slice(0, 400) }
      console.log(`ERROR ${String(e).slice(0, 120)}`)
    }
  }
  if (!ext) try { lms(['unload', '--all']) } catch {}
  writeFileSync(join(OUT, model.replace(/\//g, '_') + '.json'), JSON.stringify(results, null, 2))
  return results
}

function summary() {
  const all = readdirSync(OUT).filter((f) => f.endsWith('.json')).map((f) => JSON.parse(readFileSync(join(OUT, f), 'utf8')))
  const names = Object.keys(TESTS)
  const rows = all.map((m) => {
    const t = m.tests
    const avg = names.reduce((s, n) => s + (t[n]?.score ?? 0), 0) / names.length
    const tps = names.map((n) => t[n]?.tokPerSec).filter(Boolean)
    const speed = tps.length ? tps.reduce((a, b) => a + b) / tps.length : 0
    const secs = names.reduce((s, n) => s + (t[n]?.seconds ?? 0), 0)
    return `| ${m.model} | ${names.map((n) => (t[n]?.score ?? 0).toFixed(2)).join(' | ')} | **${avg.toFixed(2)}** | ${speed.toFixed(1)} | ${secs.toFixed(0)}s |`
  })
  const md = `# Benchmark results\n\nGenerated ${new Date().toISOString().slice(0, 16)} by \`node bench/run.mjs\`. Scores 0–1, one run each at temperature 0.2.\n\n| Model | ${names.join(' | ')} | avg | tok/s | total time |\n|---|${names.map(() => '---').join('|')}|---|---|---|\n${rows.join('\n')}\n`
  writeFileSync(join(OUT, 'summary.md'), md)
  console.log('\n' + md)
}

const wanted = process.argv.slice(2)
if (wanted[0] === '--summary') { summary(); process.exit(0) }
for (const m of wanted.length ? wanted : MODELS) await benchModel(m)
summary()
