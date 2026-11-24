import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createGuard } from './guard.js'

const call = (name, input) => ({ name, input })
const bash = (command) => call('bash', { command })
const read = (path) => call('read', { path })
const write = (path) => call('write', { path, content: 'x' })
const edit = (path) => call('edit', { path, edits: [] })
const blocked = (g, c) => g.check(c).block

test('A: the same call three times in a row is blocked on the third', () => {
  const g = createGuard()
  assert.equal(blocked(g, read('a.css')), false)
  assert.equal(blocked(g, read('a.css')), false)
  const third = g.check(read('a.css'))
  assert.equal(third.block, true)
  assert.match(third.reason, /3 times in a row/)
})

test('A: a different call in between starts the count again', () => {
  const g = createGuard()
  for (const c of [read('a'), read('a'), read('b'), read('a'), read('a')]) assert.equal(blocked(g, c), false)
})

test('B: writing a file again without running anything is blocked', () => {
  const g = createGuard()
  assert.equal(blocked(g, write('src/a.jsx')), false)
  const again = g.check(write('src/a.jsx'))
  assert.equal(again.block, true)
  assert.match(again.reason, /already wrote src\/a\.jsx/)
})

test('B: writing two files alternately is blocked (the task 012 loop)', () => {
  const g = createGuard()
  assert.equal(blocked(g, write('a')), false)
  assert.equal(blocked(g, write('b')), false)
  assert.equal(blocked(g, write('a')), true)
})

test('B: after a command (verify), the file may be written again', () => {
  const g = createGuard()
  assert.equal(blocked(g, write('a')), false)
  assert.equal(blocked(g, bash('npm run verify -- 012')), false)
  assert.equal(blocked(g, write('a')), false)
})

test('B: edits are never counted as writes', () => {
  const g = createGuard()
  for (const c of [edit('a'), edit('a'), write('a'), edit('a')]) assert.equal(blocked(g, c), false)
})

test('C: a second empty call in a row is blocked, a real call resets', () => {
  const g = createGuard()
  assert.equal(blocked(g, bash('echo ok')), false)
  assert.equal(blocked(g, bash('echo done')), true)
  const h = createGuard()
  assert.equal(blocked(h, bash('echo ok')), false)
  assert.equal(blocked(h, bash('npm run verify')), false)
  assert.equal(blocked(h, bash('echo ok')), false)
  for (const c of ['true', ':', 'sleep 3']) assert.equal(createGuard().check(bash(c)).block, false)
})

test('C: echo into a pipe or a file is not an empty call', () => {
  const g = createGuard()
  for (const c of [bash('echo hi > a.txt'), bash('echo hi | wc -c'), bash('echo ok'), bash('echo x >> b')]) assert.equal(blocked(g, c), false)
})

test('D: failing edits get a hint on the second failure and a block after four', () => {
  const g = createGuard()
  assert.equal(g.result({ name: 'edit', input: { path: 'a' }, isError: true }), null)
  assert.match(g.result({ name: 'edit', input: { path: 'a' }, isError: true }), /Read the file once/)
  g.result({ name: 'edit', input: { path: 'a' }, isError: true })
  g.result({ name: 'edit', input: { path: 'a' }, isError: true })
  const v = g.check(edit('a'))
  assert.equal(v.block, true)
  assert.match(v.reason, /4 edits failed/)
  assert.equal(blocked(g, read('a')), false)
  assert.equal(blocked(g, edit('a')), false)
})

test('D: a successful edit clears the failures', () => {
  const g = createGuard()
  for (let i = 0; i < 3; i++) g.result({ name: 'edit', input: { path: 'a' }, isError: true })
  g.result({ name: 'edit', input: { path: 'a' }, isError: false })
  for (let i = 0; i < 3; i++) g.result({ name: 'edit', input: { path: 'a' }, isError: true })
  assert.equal(blocked(g, edit('a')), false)
})

test('the run is stopped after four blocked calls', () => {
  const g = createGuard()
  g.check(write('a'))
  const verdicts = [1, 2, 3, 4].map(() => g.check(write('a')))
  assert.deepEqual(verdicts.map((v) => v.terminate), [false, false, false, true])
  assert.match(verdicts[3].reason, /stops this run/)
})

test('reset starts a new run', () => {
  const g = createGuard()
  g.check(write('a'))
  assert.equal(blocked(g, write('a')), true)
  g.reset()
  assert.equal(g.blocks, 0)
  assert.equal(blocked(g, write('a')), false)
})

test('a normal task run is never blocked', () => {
  const g = createGuard()
  const steps = [
    bash('git mv backlog/todo/012-x.md backlog/in-progress/'), read('src/pages/Catalog.jsx'), read('src/index.css'),
    write('src/pages/Catalog.jsx'), edit('src/index.css'), bash('npm run verify -- 012'),
    edit('src/index.css'), bash('npm run verify -- 012'), bash("sed -i '' 's/- \\[ \\]/- [x]/' backlog/in-progress/012-x.md"),
    bash('git mv backlog/in-progress/012-x.md backlog/done/'), bash('git add -A && git commit -m "task 012"'),
  ]
  for (const c of steps) assert.equal(blocked(g, c), false, JSON.stringify(c).slice(0, 80))
})
