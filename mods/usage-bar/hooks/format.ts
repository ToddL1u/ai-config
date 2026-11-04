/** 84213 → "84.2k", 200_000 → "200k", 10_000_000 → "10.0M". */
export function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  // 200_000 reads "200k", 350_200 "350.2k".
  if (n >= 1_000) return `${+(n / 1_000).toFixed(1)}k`
  return String(n)
}

/** 14_640_000 → "4h 04m", 183_600_000 → "2d 3h", 300_000 → "5m". */
export function formatDuration(ms: number): string {
  const minutes = Math.max(0, Math.floor(ms / 60_000))
  const days = Math.floor(minutes / 1440)
  const hours = Math.floor((minutes % 1440) / 60)
  const mins = minutes % 60
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${String(mins).padStart(2, '0')}m`
  return `${mins}m`
}

const WINDOW_MS: Record<string, number> = {
  five_hour: 5 * 3_600_000,
  seven_day: 7 * 86_400_000,
}

export const WINDOW_LABEL: Record<string, string> = { five_hour: '5h', seven_day: '7d', spend_limit: 'spend' }

/**
 * How far through its window a rate limit is, 0 to 100: where usage would sit
 * if spent evenly. Null for a window of unknown length or reset.
 */
export function pacePercent(kind: string, resetsAt: string | null, now: number): number | null {
  const length = WINDOW_MS[kind]
  if (length === undefined || resetsAt === null) return null
  const left = Date.parse(resetsAt) - now
  if (Number.isNaN(left)) return null

  return Math.min(100, Math.max(0, ((length - left) / length) * 100))
}

export type Cell = 'fill' | 'empty' | 'pace'

/** A `width`-cell gauge filled to `percent`, with the pace cell marked. */
export function gauge(percent: number, pace: number | null, width: number): Cell[] {
  const filled = Math.round((Math.min(100, Math.max(0, percent)) / 100) * width)
  const paceAt = pace === null ? -1 : Math.min(width - 1, Math.floor((pace / 100) * width))

  return Array.from({ length: width }, (_, i) => (i === paceAt ? 'pace' : i < filled ? 'fill' : 'empty'))
}
