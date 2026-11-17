import type { AgentInfo } from 'claude-code'

import type { Activity } from '../types'

const ENDED = new Set(['completed', 'failed', 'killed'])

export const isEnded = (agent: Pick<AgentInfo, 'status'>) => ENDED.has(agent.status)

/** One line of a tool's input: the command, path, pattern, or description it was given. */
export function detailOf(input: Record<string, unknown>): string {
  const pick = input.command ?? input.description ?? input.file_path ?? input.pattern ?? input.url ?? input.query
  if (typeof pick !== 'string') return ''
  const one = (pick.split('\n')[0] ?? '').trim()

  return one.length > 60 ? `${one.slice(0, 59)}…` : one
}

export function duration(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000))
  if (s < 60) return `${s}s`

  return `${Math.floor(s / 60)}m${String(s % 60).padStart(2, '0')}s`
}

export function tokens(n: number): string {
  if (n < 1000) return `${n}`

  return n < 1_000_000 ? `${Math.round(n / 1000)}k` : `${(n / 1_000_000).toFixed(1)}M`
}

/**
 * The agents to show, parents before children with their nesting depth:
 * every one still running, and ended ones started after `clearedAt`.
 */
export function visible(agents: readonly AgentInfo[], clearedAt: number): { agent: AgentInfo; depth: number }[] {
  const shown = agents.filter(a => !isEnded(a) || a.startTime >= clearedAt)
  const ids = new Set(shown.map(a => a.id))
  const byParent = new Map<string | undefined, AgentInfo[]>()
  for (const a of shown) {
    const parent = a.parentId !== undefined && ids.has(a.parentId) ? a.parentId : undefined
    byParent.set(parent, [...(byParent.get(parent) ?? []), a])
  }
  const out: { agent: AgentInfo; depth: number }[] = []
  const walk = (parent: string | undefined, depth: number) => {
    for (const a of [...(byParent.get(parent) ?? [])].sort((x, y) => x.startTime - y.startTime)) {
      out.push({ agent: a, depth })
      walk(a.id, depth + 1)
    }
  }
  walk(undefined, 0)

  return out
}

/** What the agent is doing now, or last did: its tool call, else nothing yet. */
export function doing(activity: Activity | undefined, ended: boolean): string {
  if (activity === undefined) return ended ? 'no tool calls' : 'thinking…'
  const call = `${activity.tool}${activity.detail ? ` ${activity.detail}` : ''}`
  const count = `${activity.calls} call${activity.calls === 1 ? '' : 's'}`

  return `${ended || !activity.isRunning ? 'last' : 'now'}: ${call} · ${count}`
}
