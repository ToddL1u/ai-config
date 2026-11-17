import { atom, read, update } from 'claude-code'
import type { AgentInfo, Register } from 'claude-code'

import { detailOf, doing, duration, isEnded, tokens, visible } from './agents'

const PANE = 'agent-pane'
const TITLE = 'Subagents'
const STATUS: Record<string, { mark: string; color: string }> = {
  pending: { mark: '○', color: 'subtle' },
  running: { mark: '●', color: 'warning' },
  waiting: { mark: '⏸', color: 'warning' },
  idle: { mark: '○', color: 'subtle' },
  completed: { mark: '✓', color: 'success' },
  failed: { mark: '✗', color: 'error' },
  killed: { mark: '✗', color: 'error' },
}

const activity = atom({ plugin: 'agent-pane', key: 'activity' } as const, {})
const clearedAt = atom({ plugin: 'agent-pane', key: 'clearedAt' } as const, 0)
const tick = atom({ plugin: 'agent-pane', key: 'tick' } as const, 0)

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'agent-pane', description: 'Open or close the subagents pane' })
    // Redraw elapsed times once a second, only while some agent runs.
    $.clock.every(1_000, async () => {
      const agents = await $.agent.list()
      if (agents.some(a => !isEnded(a))) await update($, tick, n => n + 1)
    })

    return next(e)
  })

  on('command.run', { command: 'agent-pane' }, async $ => {
    if ((await $.ui.panes()).some(pane => pane.id === PANE)) {
      await $.ui.close({ id: PANE })

      return { text: 'Subagents pane closed.' }
    }
    await $.ui.open({ id: PANE, title: TITLE })

    return { text: 'Subagents pane opened.' }
  })

  // A new prompt of the person's clears agents that ended in earlier turns.
  on('prompt.submit', async ($, e, next) => {
    const now = await $.clock.now()
    await update($, clearedAt, () => now)

    return next(e)
  })

  // The first subagent opens the pane; a terminal under 144 columns waits for /agent-pane.
  on('agent.spawn', async ($, e, next) => {
    const started = await next(e)
    if ('agentId' in started && started.agentId !== undefined) void $.ui.open({ id: PANE, title: TITLE }).catch(() => undefined)

    return started
  })

  on('tool.call', async ($, e, next) => {
    const id = e.agentId
    if (id === undefined) return next(e)

    const at = await $.clock.now()
    const detail = detailOf(e as unknown as Record<string, unknown>)
    await update($, activity, all => ({
      ...all,
      [id]: { tool: e.tool, detail, at, calls: (all[id]?.calls ?? 0) + 1, isRunning: true },
    }))
    try {
      return await next(e)
    } finally {
      await update($, activity, all => {
        const one = all[id]
        return one === undefined || one.at !== at ? all : { ...all, [id]: { ...one, isRunning: false } }
      })
    }
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text } = $.ui.resolve(e)
    await read($, tick)
    const seen = await read($, activity)
    const since = await read($, clearedAt)
    const now = await $.clock.now()
    const rows = visible(await $.agent.list(), since)

    if (rows.length === 0) {
      return (
        <Box flexDirection="column">
          <Text dimColor>No subagents in this turn.</Text>
          <Text dimColor>Each one shows here as it is spawned.</Text>
        </Box>
      )
    }

    const running = rows.filter(r => !isEnded(r.agent)).length
    const entry = (agent: AgentInfo, depth: number) => {
      const s = STATUS[agent.status] ?? { mark: '?', color: 'subtle' }
      const ended = isEnded(agent)
      const summary = agent.label.trim()

      return (
        <Box key={agent.id} flexDirection="column" paddingLeft={depth * 2}>
          <Text wrap="truncate-end">
            <Text bold color={s.color}>{s.mark} </Text>
            <Text bold>{agent.type}</Text>
            <Text dimColor> · {duration(now - agent.startTime)} · {tokens(agent.tokenCount)} tok</Text>
          </Text>
          <Text wrap="wrap">{agent.description}</Text>
          <Text wrap="truncate-end" color={ended ? 'subtle' : 'suggestion'}>
            {doing(seen[agent.id], ended)}
          </Text>
          {summary !== '' && summary !== agent.description && (
            <Text wrap="wrap" dimColor>{summary.split('\n').slice(-2).join(' ')}</Text>
          )}
        </Box>
      )
    }

    return (
      <Box flexDirection="column" rowGap={1}>
        <Text dimColor>
          {running} running · {rows.length - running} done
        </Text>
        {rows.map(r => entry(r.agent, r.depth))}
      </Box>
    )
  })
}
