export type Summary = {
  title: string | null
  state: string | null
  branch: string | null
  /** `done` is null when the criteria are a plain list with no checkboxes. */
  criteria: { done: number | null; total: number } | null
  next: string | null
  /** The file without its `# title` line, which the summary already shows. */
  body: string
}

const STATES = /`(IN_PROGRESS|SUCCESS|BLOCKED|STALLED|EXHAUSTED)`/

/** The lines under `## <name>` up to the next `## `; null when there is no such section. */
function section(text: string, name: string): string[] | null {
  const lines = text.split('\n')
  const start = lines.findIndex(l => l.trim().toLowerCase() === `## ${name.toLowerCase()}`)
  if (start === -1) return null
  const rest = lines.slice(start + 1)
  const end = rest.findIndex(l => l.startsWith('## '))

  return (end === -1 ? rest : rest.slice(0, end)).filter(l => l.trim() !== '')
}

const stripItem = (line: string) => line.replace(/^\s*(?:[-*]|\d+\.)\s+(?:\[[ xX]\]\s+)?/, '').trim()

/**
 * Reads what a progress file says, tolerating files that drifted from the
 * dev-flow template: a plain numbered criteria list, a `- Next:` log line.
 */
export function summarize(text: string): Summary {
  const title = text.match(/^# (.+)$/m)?.[1]?.trim() ?? null
  const branch = text.match(/^Branch:\s*(.+)$/m)?.[1]?.trim() ?? null
  const state = (section(text, 'Terminal state')?.join(' ') ?? text).match(STATES)?.[1] ?? null

  const criteriaLines = section(text, 'Acceptance criteria')
  let criteria: Summary['criteria'] = null
  if (criteriaLines !== null) {
    const boxes = criteriaLines.filter(l => /^\s*[-*]\s+\[[ xX]\]/.test(l))
    const items = criteriaLines.filter(l => /^\s*(?:[-*]|\d+\.)\s+/.test(l))
    criteria =
      boxes.length > 0
        ? { done: boxes.filter(l => /\[[xX]\]/.test(l)).length, total: boxes.length }
        : items.length > 0
          ? { done: null, total: items.length }
          : null
  }

  const nextItem = section(text, 'Next')?.find(l => /^\s*(?:[-*]|\d+\.)\s+/.test(l))
  const nextLog = [...text.matchAll(/^\s*[-*]\s+Next:\s*(.+)$/gm)].pop()?.[1]
  const next = nextItem !== undefined ? stripItem(nextItem) : (nextLog?.trim() ?? null)

  return { title, state, branch, criteria, next, body: text.replace(/^# .+\n?/m, '').trim() }
}
