import type { EngineInterface, Register } from 'claude-code'

import { describe, detailOf, initial } from './activity'
import type { Activity, Kind } from './activity'

// Module state: a reload starts it over, which only blanks the line until the next event.
let a: Activity = initial()
let shown: string | undefined
let lastKind: Kind | null = null
let stopTicker: (() => void) | undefined

async function refresh($: EngineInterface) {
  const line = describe(a, await $.clock.now())
  if (line?.kind === 'stalled' && lastKind !== 'stalled') {
    await $.ui.notify(line.text.replace(/^⚠ /, ''), { title: 'Claude may be stuck' }).catch(() => undefined)
  }
  lastKind = line?.kind ?? null
  const text = line?.text
  if (text !== shown) {
    shown = text
    $.ui.status(text)
  }
}

async function touch($: EngineInterface) {
  a = { ...a, lastSignAt: await $.clock.now() }
}

function tick($: EngineInterface) {
  void refresh($).catch(() => undefined)
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    a = initial()
    shown = undefined
    lastKind = null
    $.ui.status(undefined)
    stopTicker?.()
    const timer = $.clock.every(1_000, () => tick($))
    stopTicker = () => timer.cancel()
    return next(e)
  })

  on('turn.start', async ($, e, next) => {
    const now = await $.clock.now()
    a = e.agentId === undefined
      ? { ...a, turnStartedAt: now, lastSignAt: now, tools: [], agents: 0 }
      : { ...a, agents: a.agents + 1, lastSignAt: now }
    await refresh($)
    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    const now = await $.clock.now()
    a = e.agentId === undefined
      ? { ...a, turnStartedAt: null, lastTurnEndedAt: now, isStreaming: false, tools: [], agents: 0 }
      : { ...a, agents: Math.max(0, a.agents - 1), lastSignAt: now }
    await refresh($)
    return next(e)
  })

  // Each streamed chunk is a sign of life; silence while streaming is what "stalled" measures.
  on('turn.step', async function* ($, e, next) {
    const isMain = e.agentId === undefined
    if (isMain) a = { ...a, isStreaming: true }
    await touch($)
    const stream = next(e)
    try {
      for (;;) {
        const step = await stream.next()
        if (step.done) return step.value
        await touch($)
        yield step.value
      }
    } finally {
      if (isMain) a = { ...a, isStreaming: false }
      await touch($)
    }
  })

  on('tool.call', async ($, e, next) => {
    const id = e.tool_use_id
    if (id === undefined) return next(e)
    const now = await $.clock.now()
    const tool = {
      id,
      tool: e.tool,
      detail: detailOf(e.tool, e as unknown as Record<string, unknown>),
      startedAt: now,
      isAwaitingApproval: false,
      agentId: e.agentId,
    }
    a = { ...a, tools: [...a.tools, tool], lastSignAt: now }
    await refresh($)
    try {
      return await next(e)
    } finally {
      a = { ...a, tools: a.tools.filter(t => t.id !== id) }
      await touch($)
      await refresh($)
    }
  })

  // An `ask` verdict means a dialog (or auto mode's classifier) decides next.
  on('tool.check', async ($, e, next) => {
    const verdict = await next(e)
    if (verdict.decision === 'ask' && e.tool_use_id !== undefined) {
      const now = await $.clock.now()
      const id = e.tool_use_id
      a = { ...a, tools: a.tools.map(t => (t.id === id ? { ...t, isAwaitingApproval: true, startedAt: now } : t)) }
      await refresh($)
    }
    return verdict
  })
}
