import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Slice, Snapshot } from '../types'
import { formatTokens, level, segments } from './layout'

const snapshot = atom({ plugin: 'context-bar', key: 'snapshot' } as const, null)
const isHidden = atom({ plugin: 'context-bar', key: 'isHidden' } as const, false)

const HIDDEN_KEY = 'isHidden'
const GLYPH = { used: '█', free: '─', buffer: '░' } as const
const LEVEL_COLOR = { ok: undefined, warn: 'warning', danger: 'error' } as const

// `summary` estimates locally, as /context's grid does, so a refresh makes no API call.
async function refresh($: EngineInterface) {
  const { context } = await $.session.usage({ breakdown: 'summary' })
  const breakdown = context.breakdown
  if (!breakdown) return

  const slices: Slice[] = []
  for (const c of breakdown.categories) {
    if (c.kind === 'deferred') continue
    slices.push({ name: c.name, tokens: c.tokens, color: c.color, kind: c.kind })
  }
  const next: Snapshot = {
    slices,
    totalTokens: breakdown.totalTokens,
    maxTokens: breakdown.rawMaxTokens,
    compactAt: breakdown.isAutoCompactEnabled ? (breakdown.autoCompactThreshold ?? null) : null,
  }
  await update($, snapshot, () => next)
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'context-bar',
      description: 'Show or hide the context window bar above the prompt',
    })
    const stored = await $.store.get(HIDDEN_KEY)
    await update($, isHidden, () => stored === true)
    const started = await next(e)
    await refresh($).catch(() => undefined)

    return started
  })

  on('command.run', { command: 'context-bar' }, async $ => {
    const hidden = !(await read($, isHidden))
    await update($, isHidden, () => hidden)
    await $.store.set(HIDDEN_KEY, hidden)

    return { text: hidden ? 'Context bar hidden.' : 'Context bar shown.' }
  })

  // Main agent only: a subagent's turn does not change the main window.
  on('turn.complete', async ($, e, next) => {
    const done = await next(e)
    if (e.agentId === undefined) await refresh($).catch(() => undefined)

    return done
  })

  on('session.compact', async ($, e, next) => {
    const done = await next(e)
    await refresh($).catch(() => undefined)

    return done
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey || (await read($, isHidden))) return next(e)
    const snap = await read($, snapshot)
    if (snap === null || snap.maxTokens <= 0) return next(e)

    const { Box, Text } = $.ui.resolve(e)
    const width = Math.max(10, e.props.bodyColumns)
    const percent = Math.round((snap.totalTokens / snap.maxTokens) * 100)
    const used = snap.slices.filter(s => s.kind === 'used' && s.tokens > 0)
    const below = await next(e)

    return (
      <Box flexDirection="column">
        <Text wrap="truncate-end">
          <Text bold>Context </Text>
          {formatTokens(snap.totalTokens)} / {formatTokens(snap.maxTokens)}
          {snap.compactAt !== null && <Text dimColor> · compacts at {formatTokens(snap.compactAt)}</Text>}
          {' · '}
          <Text bold color={LEVEL_COLOR[level(snap.totalTokens, snap.compactAt)]}>{percent}%</Text>
        </Text>
        <Text wrap="truncate-end">
          {segments(snap.slices, width).map(({ slice, cells }, i) => (
            <Text key={`seg-${i}`} color={slice.kind === 'used' ? slice.color : 'inactive'} dimColor={slice.kind !== 'used'}>
              {GLYPH[slice.kind].repeat(cells)}
            </Text>
          ))}
        </Text>
        <Box flexDirection="row" flexWrap="wrap" columnGap={2}>
          {used.map((slice, i) => (
            <Text key={`legend-${i}`}>
              <Text color={slice.color}>■</Text> {slice.name}{' '}
              <Text dimColor>
                {formatTokens(slice.tokens)} ({((slice.tokens / snap.maxTokens) * 100).toFixed(1)}%)
              </Text>
            </Text>
          ))}
        </Box>
        {below}
      </Box>
    )
  })
}
