import type { Env, Totals, Usage } from '../types'
import { formatDuration, formatTokens, pacePercent, WINDOW_LABEL } from './format'

export type Icon = 'gauge' | 'calendar' | 'clock' | 'upload' | 'download' | 'layers' | 'coin' | 'branch'

/** One pill, drawn the same way on every surface: a meter, a single figure, or a note. */
export type Pill =
  | {
      kind: 'meter'
      key: string
      color: string
      icon: Icon
      label: string
      percent: number
      /** The percent's own color: the pill's, amber from 75%, red from 90%. */
      tone: string
      pace: number | null
      /** Time to the window's reset ("4h 04m"), or the figure beside the meter. */
      detail: string | null
      hasClock: boolean
    }
  | { kind: 'stat'; key: string; color: string; icon: Icon; value: string }
  | { kind: 'note'; key: string; color: string; icon: Icon; text: string }

export const COLOR = {
  five_hour: '#34d399',
  seven_day: '#a78bfa',
  spend_limit: '#f59e0b',
  input: '#f472b6',
  output: '#2dd4bf',
  cache: '#818cf8',
  cost: '#fbbf24',
  env: '#6b7280',
  warn: '#f59e0b',
  danger: '#ef4444',
} as const

export function toneFor(percent: number, base: string): string {
  if (percent >= 90) return COLOR.danger
  if (percent >= 75) return COLOR.warn
  return base
}

export function buildPills(u: Usage | null, where: Env | null, sum: Totals, now: number): Pill[] {
  const pills: Pill[] = []

  for (const limit of u?.rateLimits ?? []) {
    const color = COLOR[limit.kind as keyof typeof COLOR] ?? COLOR.spend_limit
    const left = limit.resetsAt === null ? Number.NaN : Date.parse(limit.resetsAt) - now
    pills.push({
      kind: 'meter',
      key: limit.kind,
      color,
      icon: limit.kind === 'seven_day' ? 'calendar' : 'gauge',
      label: WINDOW_LABEL[limit.kind] ?? limit.kind,
      percent: limit.percentUsed,
      tone: toneFor(limit.percentUsed, color),
      pace: pacePercent(limit.kind, limit.resetsAt, now),
      detail: Number.isNaN(left) ? null : formatDuration(left),
      hasClock: !Number.isNaN(left),
    })
  }

  if (sum.input + sum.output + sum.cacheRead > 0) {
    pills.push(
      { kind: 'stat', key: 'in', color: COLOR.input, icon: 'upload', value: formatTokens(sum.input + sum.cacheWrite) },
      { kind: 'stat', key: 'out', color: COLOR.output, icon: 'download', value: formatTokens(sum.output) },
      { kind: 'stat', key: 'cache', color: COLOR.cache, icon: 'layers', value: formatTokens(sum.cacheRead) },
    )
  }

  if (u !== null && u.costUsd !== null) {
    pills.push({ kind: 'stat', key: 'cost', color: COLOR.cost, icon: 'coin', value: `$${u.costUsd.toFixed(2)}` })
  }

  if (where !== null) {
    const parts = [where.repo, where.branch, where.node && `node ${where.node}`, where.model]
    pills.push({ kind: 'note', key: 'env', color: COLOR.env, icon: 'branch', text: parts.filter(Boolean).join(' · ') })
  }

  return pills
}
