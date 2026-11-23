#!/usr/bin/env node
// One command to check an agent's work. Short output on purpose, so small models can read it.
//
//   npm run verify -- 001   check task 001: scope + lint + build + tests (baseline, done tasks, 001)
//   npm run verify          check everything that is done: lint + build + tests (used by the pre-commit hook)
//
// Exit code 0 = all passed. The last line is always "VERIFY PASSED" or "VERIFY FAILED: <steps>".
import { execFileSync } from 'node:child_process'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const BIN = (name) => join(ROOT, 'node_modules/.bin', name)
const task = process.argv[2]?.padStart(3, '0')
const failed = []
const ANSI = /\x1b\[[0-9;]*m/g

function run(cmd, args) {
  try {
    return { ok: true, out: execFileSync(cmd, args, { cwd: ROOT, stdio: 'pipe', encoding: 'utf8', env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1', TZ: 'Europe/Zurich' } }).replace(ANSI, '') }
  } catch (e) {
    return { ok: false, out: (`${e.stdout || ''}${e.stderr || ''}` || e.message).replace(ANSI, '') }
  }
}

function report(step, ok, details = '', maxLines = 25) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${step}`)
  if (!ok) {
    failed.push(step)
    const lines = details.trim().split('\n').filter((l) => l.trim())
    console.log(lines.slice(0, maxLines).map((l) => '      ' + l).join('\n'))
    if (lines.length > maxLines) console.log(`      ... ${lines.length - maxLines} more lines`)
  }
}

function findTask(n) {
  for (const status of ['in-progress', 'todo', 'done']) {
    const dir = join(ROOT, 'backlog', status)
    if (!existsSync(dir)) continue
    const f = readdirSync(dir).find((x) => x.startsWith(n + '-'))
    if (f) return { status, file: join(dir, f) }
  }
  return null
}

function doneTasks() {
  const dir = join(ROOT, 'backlog/done')
  return existsSync(dir) ? readdirSync(dir).filter((f) => /^\d{3}-/.test(f)).map((f) => f.slice(0, 3)) : []
}

function testFilesFor(numbers) {
  const all = readdirSync(join(ROOT, 'tests')).filter((f) => f.endsWith('.test.jsx') || f.endsWith('.test.js'))
  return all.filter((f) => f.startsWith('task-000') || numbers.some((n) => f.startsWith(`task-${n}`))).map((f) => join('tests', f))
}

// ---------- 1. scope: only the files the task names may change ----------
if (task) {
  const t = findTask(task)
  if (!t) {
    console.log(`No task ${task} in backlog/`)
    process.exit(2)
  }
  const md = readFileSync(t.file, 'utf8')
  const filesLine = md.match(/^\*\*Files:\*\*(.*)$/m)?.[1] || ''
  const allowed = [...filesLine.matchAll(/`([^`]+)`/g)].map((m) => m[1])
  const status = run('git', ['status', '--porcelain', '--untracked-files=all']).out
  const changed = status.split('\n').filter(Boolean).map((l) => l.slice(3).split(' -> ').pop())
  const extra = changed.filter((f) => !allowed.includes(f) && !f.startsWith('backlog/') && f !== 'AGENTS.md')
  const hints = []
  if (extra.some((f) => f.startsWith('tests/'))) hints.push('Do not edit tests. Change the code in src/ so the tests pass.')
  if (extra.some((f) => f.startsWith('package'))) hints.push('Do not add npm packages.')
  report(`scope (task ${task} may change: ${allowed.join(', ')})`, extra.length === 0, [`Files changed that the task does not list:`, ...extra.map((f) => '- ' + f), ...hints, 'Undo them with: git checkout -- <file>  (or delete new files)'].join('\n'))
}

// ---------- 2. lint ----------
const lint = run(BIN('eslint'), ['src', 'tests'])
report('lint (eslint src tests)', lint.ok, lint.out)

// ---------- 3. build ----------
const build = run(BIN('vite'), ['build', '--logLevel', 'error', '--outDir', join(ROOT, 'node_modules/.verify-dist'), '--emptyOutDir'])
report('build (vite build)', build.ok, build.out)

// ---------- 4. tests: baseline + all done tasks + this task ----------
const numbers = [...new Set([...doneTasks(), ...(task ? [task] : [])])].sort()
const files = testFilesFor(numbers)
const tests = run(BIN('vitest'), ['run', '--reporter=dot', ...files])
const summary = tests.out.split('\n').filter((l) => /FAIL|✗|×|AssertionError|Error:|expected|Expected|Received|Unable to find|Tests\s+\d|Test Files/.test(l))
report(`tests (${files.map((f) => f.replace('tests/', '')).join(', ')})`, tests.ok, summary.join('\n') || tests.out, 40)

console.log(failed.length ? `VERIFY FAILED: ${failed.map((s) => s.split(' ')[0]).join(', ')}` : 'VERIFY PASSED')
process.exit(failed.length ? 1 : 0)
