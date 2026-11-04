import type { Slice } from '../types'

export type Segment = { slice: Slice; cells: number }

/**
 * Split `width` cells across the slices in proportion to their tokens, so the
 * cells always add up to `width`. A used slice with any tokens keeps at least
 * one cell, so a small category never vanishes from the bar.
 */
export function segments(slices: readonly Slice[], width: number): Segment[] {
  const total = slices.reduce((sum, s) => sum + s.tokens, 0)
  if (total <= 0 || width <= 0) return []

  const exact = slices.map(s => (s.tokens / total) * width)
  const cells = exact.map((x, i) =>
    slices[i]!.kind === 'used' && slices[i]!.tokens > 0 ? Math.max(1, Math.floor(x)) : Math.floor(x),
  )

  // Hand leftover cells to the largest remainders, or take surplus from the widest.
  let diff = width - cells.reduce((a, b) => a + b, 0)
  const byRemainder = exact.map((x, i) => ({ i, r: x - Math.floor(x) })).sort((a, b) => b.r - a.r)
  for (let k = 0; diff > 0; k = (k + 1) % byRemainder.length, diff--) cells[byRemainder[k]!.i]! += 1
  while (diff < 0) {
    const widest = cells.indexOf(Math.max(...cells))
    cells[widest]! -= 1
    diff++
  }

  return slices.map((slice, i) => ({ slice, cells: cells[i]! })).filter(s => s.cells > 0)
}

/** 84213 → "84.2k", 1000000 → "1M". */
export function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${+(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${+(n / 1_000).toFixed(1)}k`
  return String(n)
}

/** Yellow at 70% of the compaction point, red at 90%; none below or with compaction off. */
export function level(totalTokens: number, compactAt: number | null): 'ok' | 'warn' | 'danger' {
  if (compactAt === null || compactAt <= 0) return 'ok'
  const ratio = totalTokens / compactAt
  if (ratio >= 0.9) return 'danger'
  if (ratio >= 0.7) return 'warn'
  return 'ok'
}
