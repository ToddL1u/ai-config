import type { On } from 'claude-code'
import { expect, mock, test } from 'claude-code/testing'

import { describe, initial } from './activity'

const NOW = Date.parse('2026-11-09T12:00:00Z')

function engine(on: On) {
  const clock = mock.clock(on, { now: NOW })
  const lines: (string | undefined)[] = []
  const notes: string[] = []
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('turn.start', (_, e) => ({ turnId: e.turnId }))
  on('turn.complete', () => ({ text: 'done' }))
  on('tool.call', () => ({ result: {} }))
  on('ui.status', (_, e) => {
    lines.push(e.text)
    return { value: undefined }
  })
  on('ui.notify', (_, e) => {
    notes.push(e.text)
    return { value: { isSent: true, channel: 'terminal_bell' } }
  })
  return { clock, lines, notes }
}

test('a silent turn turns stalled after 90s and notifies once', async ($, on) => {
  const { clock, lines, notes } = engine(on)
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await $.turn.start({ text: 'hi', turnId: 't1' })
  expect(lines.at(-1)).toBe('● working · turn 0s')

  await clock.advance(95_000)
  expect(lines.at(-1)).toMatch(/^⚠ no output for 1m3\ds · turn 1m3\ds/)
  await clock.advance(5_000)
  expect(notes.length).toBe(1)

  await $.turn.complete({ turnId: 't1', reason: 'answer', answer: 'ok', durationMs: 1, isAborted: false })
  await clock.advance(120_000)
  expect(lines.at(-1)).toBe('○ idle 2m00s')
})

test('a running tool names itself and clears when it ends', async ($, on) => {
  const { lines } = engine(on)
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await $.turn.start({ text: 'hi', turnId: 't1' })
  await $.tool.call({ tool: 'Bash', command: 'npm test' })
  expect(lines.some(l => l === '● Bash npm test 0s · turn 0s')).toBe(true)
  expect(lines.at(-1)).toBe('● working · turn 0s')
})

test('approval and questions read as waiting on the person', async () => {
  const base = { ...initial(), turnStartedAt: NOW, lastSignAt: NOW }
  const tool = { id: '1', tool: 'Bash', detail: 'git push', startedAt: NOW, isAwaitingApproval: true }
  expect(describe({ ...base, tools: [tool] }, NOW + 40_000)?.text).toBe('⏸ needs approval · Bash git push · 40s')
  const ask = { ...tool, tool: 'AskUserQuestion', detail: '', isAwaitingApproval: false }
  expect(describe({ ...base, tools: [ask] }, NOW)?.kind).toBe('waiting')
})

test('a tool past five minutes is flagged, a subagent is not', async () => {
  const base = { ...initial(), turnStartedAt: NOW, lastSignAt: NOW, agents: 2 }
  const bash = { id: '1', tool: 'Bash', detail: 'npm test', startedAt: NOW, isAwaitingApproval: false }
  expect(describe({ ...base, tools: [bash] }, NOW + 6 * 60_000)?.text).toBe('⚠ long-running Bash npm test 6m00s · turn 6m00s · 2 agents')
  expect(describe({ ...base, tools: [{ ...bash, tool: 'Agent' }] }, NOW + 6 * 60_000)?.kind).toBe('working')
})
