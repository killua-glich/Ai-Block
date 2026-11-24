// pi extension: stops the loops that small local models fall into. The logic is in guard.js.
// Install: see README.md in this folder.
import { createGuard } from './guard.js'

export default function loopGuard(pi: any) {
  const guard = createGuard()

  // every new prompt is a new run: forget what happened in the last one
  pi.on('agent_start', async () => {
    guard.reset()
  })

  pi.on('tool_call', async (event: any, ctx: any) => {
    try {
      const verdict = guard.check({ name: event.toolName, input: event.input })
      if (!verdict.block) return undefined
      if (ctx?.hasUI) ctx.ui.notify(verdict.terminate ? 'Loop guard: too many repeated calls, stopping this run.' : `Loop guard blocked a ${event.toolName} call`, verdict.terminate ? 'error' : 'warning')
      return { block: true, reason: verdict.reason, terminate: verdict.terminate }
    } catch {
      return undefined // fail open: a bug in the guard must never stop the agent from working
    }
  })

  pi.on('tool_result', async (event: any) => {
    try {
      const hint = guard.result({ name: event.toolName, input: event.input, isError: event.isError })
      if (hint) return { content: [...(event.content ?? []), { type: 'text', text: hint }] }
    } catch {
      // fail open
    }
    return undefined
  })
}
