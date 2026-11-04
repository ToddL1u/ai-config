import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, SessionContextUsage, SessionCost, SessionRateLimit, Timer } from 'claude-code'

import type { Env, Totals, Usage } from '../types'
import { gauge } from './format'
import { buildPills } from './pills'
import type { Icon, Pill } from './pills'
import { pillAlt, pillSvg } from './svg'

const usage = atom({ plugin: 'usage-bar', key: 'usage' } as const, null)
const env = atom({ plugin: 'usage-bar', key: 'env' } as const, null)
const totals = atom({ plugin: 'usage-bar', key: 'totals' } as const, { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 })
const isHidden = atom({ plugin: 'usage-bar', key: 'isHidden' } as const, false)

const HIDDEN_KEY = 'isHidden'
const GAUGE_WIDTH = 10
/** The terminal has no Svg: one glyph stands for each icon there. */
const GLYPH: Record<Icon, string> = {
  gauge: '◷',
  calendar: '▦',
  clock: '↻',
  upload: '↑',
  download: '↓',
  layers: '≋',
  coin: '$',
  branch: '⎇',
}

function toUsage(context: SessionContextUsage, rateLimits: readonly SessionRateLimit[], cost?: SessionCost): Usage {
  return {
    contextTokens: context.tokens ?? null,
    contextWindow: context.window,
    contextPercent: context.percent ?? null,
    rateLimits: rateLimits.map(r => ({ kind: r.kind, percentUsed: r.percentUsed, resetsAt: r.resetsAt ?? null })),
    costUsd: cost?.usd ?? null,
  }
}

async function run($: EngineInterface, argv: string[], cwd: string): Promise<string | null> {
  const out = await $.process.run(argv, { cwd, timeoutMs: 5_000 }).catch(() => null)

  return out !== null && out.exitCode === 0 ? out.stdout.trim() || null : null
}

async function refreshEnv($: EngineInterface) {
  const cwd = await $.session.cwd()
  const [model, root, branch, sha, node] = await Promise.all([
    $.session.model(),
    run($, ['git', 'rev-parse', '--show-toplevel'], cwd),
    run($, ['git', 'symbolic-ref', '--short', 'HEAD'], cwd),
    run($, ['git', 'rev-parse', '--short', 'HEAD'], cwd),
    run($, ['mise', 'current', 'node'], cwd),
  ])
  const next: Env = {
    model,
    repo: root === null ? null : root.slice(root.lastIndexOf('/') + 1),
    branch: branch ?? sha,
    node,
  }
  await update($, env, () => next)
}

async function refreshUsage($: EngineInterface) {
  const now = await $.session.usage()
  await update($, usage, () => toUsage(now.context, now.rateLimits, now.cost))
}

export const register: Register = on => {
  let ticker: Timer | undefined

  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'usage-bar', description: 'Show or hide the usage pills above the prompt' })
    const stored = await $.store.get(HIDDEN_KEY)
    await update($, isHidden, () => stored === true)
    const started = await next(e)
    await Promise.all([refreshEnv($), refreshUsage($)]).catch(() => undefined)
    // Reset countdowns and the pace marker move with time, not with events.
    ticker?.cancel()
    ticker = $.clock.every(60_000, () => $.ui.invalidate('ui.render'))

    return started
  })

  on('command.run', { command: 'usage-bar' }, async $ => {
    const hidden = !(await read($, isHidden))
    await update($, isHidden, () => hidden)
    await $.store.set(HIDDEN_KEY, hidden)

    return { text: hidden ? 'Usage bar hidden.' : 'Usage bar shown.' }
  })

  on('session.measure', async ($, e, next) => {
    await update($, usage, () => toUsage(e.context, e.rateLimits, e.cost))

    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    const done = await next(e)
    const spent = e.usage
    if (spent !== undefined) {
      await update($, totals, (t): Totals => ({
        input: t.input + spent.input_tokens,
        output: t.output + spent.output_tokens,
        cacheRead: t.cacheRead + spent.cache_read_input_tokens,
        cacheWrite: t.cacheWrite + spent.cache_creation_input_tokens,
      }))
    }
    // A Bash `cd` or `git switch` in the turn can change the branch or the node.
    if (e.agentId === undefined) await refreshEnv($).catch(() => undefined)

    return done
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey || (await read($, isHidden))) return next(e)
    const [u, where, sum, now] = await Promise.all([read($, usage), read($, env), read($, totals), $.clock.now()])
    if (u === null && where === null) return next(e)

    const pills = buildPills(u, where, sum, now)
    const below = await next(e)
    const { Box } = $.ui.resolve(e)

    // Desktop, VS Code and mobile draw Svg: the rounded pills with icons. The terminal draws text.
    let row: JSX.Element[]
    if (e.surface === 'terminal') {
      row = pills.map(pill => terminalPill($, e, pill))
    } else {
      const { Svg } = $.ui.resolve(e)
      row = pills.map(pill => {
        const { source, width, height } = pillSvg(pill)
        return <Svg key={pill.key} source={source} alt={pillAlt(pill)} width={width} height={height} />
      })
    }

    return (
      <Box flexDirection="column">
        <Box flexDirection="row" flexWrap="wrap" columnGap={1} rowGap={e.surface === 'terminal' ? 0 : 1}>
          {row}
        </Box>
        {below}
      </Box>
    )
  })
}

function terminalPill($: EngineInterface, e: Parameters<EngineInterface['ui']['resolve']>[0], pill: Pill): JSX.Element {
  const { Box, Text } = $.ui.resolve(e)
  const inside: JSX.Element[] = [<Text color={pill.color}>{GLYPH[pill.icon]} </Text>]

  if (pill.kind === 'stat') inside.push(<Text bold>{pill.value}</Text>)
  if (pill.kind === 'note') inside.push(<Text dimColor>{pill.text}</Text>)
  if (pill.kind === 'meter') {
    inside.push(
      <Text color={pill.color}>{pill.label} </Text>,
      <Text>
        {gauge(pill.percent, pill.pace, GAUGE_WIDTH).map((cell, i) =>
          cell === 'pace' ? (
            <Text key={`c${i}`} bold color="text">│</Text>
          ) : (
            <Text key={`c${i}`} color={cell === 'fill' ? pill.tone : 'subtle'}>{cell === 'fill' ? '━' : '─'}</Text>
          ),
        )}
      </Text>,
      <Text bold color={pill.tone === pill.color ? undefined : pill.tone}> {Math.round(pill.percent)}%</Text>,
      <Text dimColor>{pill.detail === null ? '' : pill.hasClock ? ` │ ${GLYPH.clock} ${pill.detail}` : ` ${pill.detail}`}</Text>,
    )
  }

  return (
    <Box key={pill.key} borderStyle="round" borderColor={pill.color} paddingX={1} flexShrink={0}>
      <Text wrap="truncate-end">{inside}</Text>
    </Box>
  )
}
