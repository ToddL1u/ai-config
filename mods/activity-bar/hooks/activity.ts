/** What the main loop is doing, as the hooks last saw it. Times are epoch ms. */
export type Tool = { id: string; tool: string; detail: string; startedAt: number; isAwaitingApproval: boolean; agentId?: string }

export type Activity = {
  turnStartedAt: number | null
  lastTurnEndedAt: number | null
  /** Last sign of life: a streamed chunk, a tool starting or ending. */
  lastSignAt: number
  isStreaming: boolean
  tools: Tool[]
  agents: number
}

/** Model streaming silent this long reads as stalled. */
export const QUIET_MS = 90_000
/** A tool running this long gets flagged (approval waits excluded). */
export const LONG_TOOL_MS = 5 * 60_000
/** Tools that wait on the person by design. */
const ASKS_PERSON = new Set(['AskUserQuestion', 'ExitPlanMode'])

export const initial = (): Activity => ({
  turnStartedAt: null,
  lastTurnEndedAt: null,
  lastSignAt: 0,
  isStreaming: false,
  tools: [],
  agents: 0,
})

export function duration(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000))
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m${String(s % 60).padStart(2, '0')}s`
  return `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}m`
}

export function detailOf(tool: string, input: Record<string, unknown>): string {
  const pick = input.command ?? input.description ?? input.file_path ?? input.pattern ?? input.url
  if (typeof pick !== 'string') return ''
  const one = (pick.split('\n')[0] ?? '').trim()
  return one.length > 40 ? `${one.slice(0, 39)}…` : one
}

export type Kind = 'idle' | 'working' | 'waiting' | 'stalled'

export type Line = { kind: Kind; text: string }

/** The status line for `a` at `now`; null before the first turn. */
export function describe(a: Activity, now: number): Line | null {
  if (a.turnStartedAt === null) {
    if (a.lastTurnEndedAt === null) return null
    return { kind: 'idle', text: `○ idle ${duration(now - a.lastTurnEndedAt)}` }
  }

  const total = duration(now - a.turnStartedAt)
  const agents = a.agents > 0 ? ` · ${a.agents} agent${a.agents > 1 ? 's' : ''}` : ''
  const label = (t: Tool) => `${t.tool}${t.detail ? ` ${t.detail}` : ''}`

  const approval = a.tools.find(t => t.isAwaitingApproval)
  if (approval) {
    return { kind: 'waiting', text: `⏸ needs approval · ${label(approval)} · ${duration(now - approval.startedAt)}` }
  }
  const asking = a.tools.find(t => ASKS_PERSON.has(t.tool))
  if (asking) return { kind: 'waiting', text: `⏸ waiting for you · ${asking.tool}` }

  // The newest tool is the one on screen.
  const tool = a.tools.filter(t => t.agentId === undefined).at(-1)
  if (tool) {
    const ran = now - tool.startedAt
    const text = `${label(tool)} ${duration(ran)} · turn ${total}${agents}`
    return ran >= LONG_TOOL_MS && tool.tool !== 'Agent'
      ? { kind: 'stalled', text: `⚠ long-running ${text}` }
      : { kind: 'working', text: `● ${text}` }
  }

  const quiet = now - a.lastSignAt
  if (quiet >= QUIET_MS) {
    return { kind: 'stalled', text: `⚠ no output for ${duration(quiet)} · turn ${total}${agents} · Esc to interrupt` }
  }
  return { kind: 'working', text: `● ${a.isStreaming ? 'thinking' : 'working'} · turn ${total}${agents}` }
}
