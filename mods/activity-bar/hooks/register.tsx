import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import { describe, describeAgents, detailOf, initial } from './activity'
import type { Activity, Kind } from './activity'
import type { AgentLines } from '../types'

/** The band's rows, one per running subagent; in $.state so a write redraws the band. */
const agentLines = atom({ plugin: 'activity-bar', key: 'agentLines' } as const, [] as AgentLines)

// Module state: a reload starts it over, which only blanks the line until the next event.
let a: Activity = initial()
let shown: string | undefined
let lastKind: Kind | null = null
let stopTicker: (() => void) | undefined
let shownAgents = ''
/** What each spawn was asked to do, by agentId; its turn.start may arrive before the spawn resolves. */
const spawned = new Map<string, { type: string; description: string }>()

async function refresh($: EngineInterface) {
  const now = await $.clock.now()
  const rows = describeAgents(a, now)
  const key = rows.join('\n')
  if (key !== shownAgents) {
    shownAgents = key
    await update($, agentLines, () => rows)
  }
  const line = describe(a, now)
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
    shownAgents = ''
    spawned.clear()
    await update($, agentLines, () => [])
    $.ui.status(undefined)
    stopTicker?.()
    const timer = $.clock.every(1_000, () => tick($))
    stopTicker = () => timer.cancel()
    return next(e)
  })

  on('turn.start', async ($, e, next) => {
    const now = await $.clock.now()
    const id = e.agentId
    // Background subagents outlive the main turn, so their rows and tools stay.
    if (id === undefined) {
      a = { ...a, turnStartedAt: now, lastSignAt: now, tools: a.tools.filter(t => t.agentId !== undefined) }
    } else if (!a.agents.some(g => g.id === id)) {
      const meta = spawned.get(id) ?? { type: 'agent', description: '' }
      a = { ...a, agents: [...a.agents, { id, ...meta, startedAt: now }], lastSignAt: now }
    }
    await refresh($)
    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    const now = await $.clock.now()
    const id = e.agentId
    if (id === undefined) {
      a = { ...a, turnStartedAt: null, lastTurnEndedAt: now, isStreaming: false, tools: a.tools.filter(t => t.agentId !== undefined) }
    } else {
      spawned.delete(id)
      a = { ...a, agents: a.agents.filter(g => g.id !== id), tools: a.tools.filter(t => t.agentId !== id), lastSignAt: now }
    }
    await refresh($)
    return next(e)
  })

  on('agent.spawn', async ($, e, next) => {
    const result = await next(e)
    const id = result.agentId
    if (id === undefined) return result
    const meta = { type: e.subagentType, description: e.description }
    spawned.set(id, meta)
    a = { ...a, agents: a.agents.map(g => (g.id === id ? { ...g, ...meta } : g)) }
    // The spawn's result must reach the engine even if drawing fails.
    await refresh($).catch(() => undefined)
    return result
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

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const rows = await read($, agentLines)
    if (rows.length === 0 || e.props.hasSurvey) return next(e)
    const { Box, Text } = $.ui.resolve(e)
    return (
      <Box flexDirection="column">
        {rows.map((row, i) => (
          <Text key={String(i)} dimColor={!row.startsWith('⏸')} color={row.startsWith('⏸') ? 'warning' : undefined} wrap="truncate-end">
            {row}
          </Text>
        ))}
      </Box>
    )
  })
}
