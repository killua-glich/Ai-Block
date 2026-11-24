// Loop guard for coding agents. It watches tool calls and answers the loops we saw in real pi
// sessions with a message the model can act on. Pure logic, no pi imports, so it is easy to test.
//
//   guard.check({ name, input })            before a call runs -> { block: false } or { block, reason, terminate }
//   guard.result({ name, input, isError })  after a call ran   -> a hint to append to the result, or null
//   guard.reset()                           at the start of every run (every new user message)
//
// Rules (each one comes from a real session):
//   A  the same call 3 times in a row            (Gemma read the same file 40 times)
//   B  writing a file again with no command between (Gemma rewrote 2 files 6 times without running verify)
//   C  empty calls like `echo ok` or `true`      (Inkling made 25 of them)
//   D  edits that keep failing on one file       (Gemma: 9 failed edits with guessed text)
//   after `maxBlocks` blocked calls the run is stopped, so a model that ignores the messages stops burning time

const NOOP = /^\s*(echo\b[^|;&>]*|true|:|sleep\s+\d+)\s*$/

export function createGuard({ maxBlocks = 4, repeatLimit = 3, editFailLimit = 4 } = {}) {
  let s

  function reset() {
    s = { last: null, repeat: 0, written: new Set(), noops: 0, editFails: new Map(), blocks: 0 }
  }
  reset()

  const signature = (name, input) => `${name} ${JSON.stringify(input ?? {})}`

  function block(reason) {
    s.blocks += 1
    const terminate = s.blocks >= maxBlocks
    return { block: true, terminate, reason: terminate ? `${reason} The guard stops this run now: too many repeated calls.` : reason }
  }

  function check({ name, input = {} }) {
    const key = signature(name, input)
    if (s.last === key) s.repeat += 1
    else {
      s.last = key
      s.repeat = 1
    }

    // A: the same call again and again
    if (s.repeat >= repeatLimit) {
      return block(`You made this exact ${name} call ${s.repeat} times in a row. The result will not change. Do the next step of the task. If you are not sure what is left, run the verify command from the task.`)
    }

    // B: writing a file again without running anything in between
    if (name === 'write' && s.written.has(input.path)) {
      return block(`You already wrote ${input.path} in this run, and the tool said it worked. Writing it again only risks typos. Run the verify command from the task now. Only if verify fails, fix the file with the edit tool.`)
    }

    // C: calls that do nothing
    if (name === 'bash' && NOOP.test(input.command ?? '')) {
      if (s.noops >= 1) return block(`Empty calls like "${String(input.command).trim()}" do nothing. Do the next real step of the task: run the verify command.`)
      s.noops += 1
      return { block: false }
    }

    // D: edits that keep failing on one file
    if (name === 'edit' && (s.editFails.get(input.path) ?? 0) >= editFailLimit) {
      return block(`${input.path}: ${s.editFails.get(input.path)} edits failed in a row. Read the file once with the read tool, then make ONE edit with oldText copied exactly from what you read.`)
    }

    // the call is allowed: update what we remember
    s.noops = 0
    if (name === 'bash') s.written.clear()
    if (name === 'write') s.written.add(input.path)
    if (name === 'read') s.editFails.delete(input.path)
    return { block: false }
  }

  function result({ name, input = {}, isError = false }) {
    if (name !== 'edit') return null
    if (!isError) {
      s.editFails.delete(input.path)
      return null
    }
    const n = (s.editFails.get(input.path) ?? 0) + 1
    s.editFails.set(input.path, n)
    return n >= 2 ? 'Tip: the edit failed because oldText does not match the file exactly. Read the file once, then copy the exact text. Do not guess.' : null
  }

  return { check, result, reset, get blocks() { return s.blocks } }
}
