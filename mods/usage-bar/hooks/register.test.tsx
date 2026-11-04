import type { On } from 'claude-code'
import { expect, mock, test } from 'claude-code/testing'
import type { TestBody } from 'claude-code/testing'

import { formatDuration, gauge, pacePercent } from './format'

const NOW = Date.parse('2026-11-04T12:00:00Z')
const BAND = {
  plugin: 'usage-bar',
  component: 'AbovePrompt',
  props: { hasSurvey: false, isWorking: false, maxRows: 12, bodyColumns: 160, scroll: { offset: 0, bodyRows: 11 }, view: {} },
} as const

function engine(on: On) {
  mock.clock(on, { now: NOW })
  mock.store(on)
  on('ui.render', ($, e) => {
    const { Box } = $.ui.resolve(e)
    return <Box />
  })
  on('command.register', () => ({ value: { command: 'usage-bar' } }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('session.cwd', () => ({ value: '/repo/fe-web-mvc' }))
  on('session.model', () => ({ value: 'Opus 5.5' }))
  on('session.usage', () => ({ value: { startedAt: NOW, context: { window: 200_000 }, rateLimits: [] } }))
  on('process.run', (_, e) => {
    const out: Record<string, string> = {
      'git rev-parse --show-toplevel': '/repo/fe-web-mvc',
      'git symbolic-ref --short HEAD': 'feat/ABC-123',
      'mise current node': '22.22.1',
    }
    const stdout = out[e.argv.join(' ')]
    return { value: { exitCode: stdout ? 0 : 1, stdout: stdout ?? '', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
  })
  on('session.measure', (_, e) => ({ changed: e.changed }))
  on('turn.complete', () => ({ text: 'done' }))
}

async function measured($: Parameters<TestBody>[0]) {
  await $.session.start({ cwd: '/repo/fe-web-mvc', surface: 'terminal', isInteractive: true })
  await $.session.measure({
    context: { tokens: 84_200, window: 200_000, percent: 42 },
    rateLimits: [
      { kind: 'five_hour', percentUsed: 29, resetsAt: new Date(NOW + (4 * 60 + 4) * 60_000).toISOString() },
      { kind: 'seven_day', percentUsed: 91, resetsAt: new Date(NOW + (2 * 24 + 3) * 3_600_000).toISOString() },
    ],
    cost: { usd: 9.6 },
    changed: ['context', 'rateLimits', 'cost'],
  })
  await $.turn.complete({
    turnId: 't1',
    reason: 'answer',
    answer: 'ok',
    durationMs: 1000,
    isAborted: false,
    usage: { input_tokens: 200, output_tokens: 46_400, cache_read_input_tokens: 10_000_000, cache_creation_input_tokens: 350_000, model: 'x' },
  })
}

test('terminal: text pills show context, both windows, tokens, cost and where the session runs', async ($, on) => {
  engine(on)
  await measured($)

  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await ui.find({ type: 'Text', text: /ctx/ })).toBeUndefined()
  for (const text of [/5h/, /29%/, /4h 04m/, /7d/, /91%/, /2d 3h/, /350\.2k/, /46\.4k/, /10\.0M/, /\$9\.60/, /feat\/ABC-123/, /22\.22\.1/]) {
    expect([text, (await ui.find({ type: 'Text', text })) !== undefined]).toEqual([text, true])
  }
  await ui.unmount()
})

test('desktop: one Svg pill each, with icons, red past 90%', async ($, on) => {
  engine(on)
  await measured($)

  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  const svgs = await ui.findAll({ type: 'Svg' })
  const alts = svgs.map(s => String(s.props.alt))
  expect(alts).toEqual([
    '5h 29%, resets in 4h 04m',
    '7d 91%, resets in 2d 3h',
    'in 350.2k',
    'out 46.4k',
    'cache 10.0M',
    'cost $9.60',
    'fe-web-mvc · feat/ABC-123 · node 22.22.1 · Opus 5.5',
  ])
  const sevenDay = String(svgs[1]?.props.source)
  expect(sevenDay).toContain('#ef4444')
  expect(sevenDay).toContain('class="pace"')
  expect(String(svgs[0]?.props.source)).not.toContain('#ef4444')
  await ui.unmount()
})

test('/usage-bar hides the pills', async ($, on) => {
  engine(on)
  await $.session.start({ cwd: '/repo/fe-web-mvc', surface: 'terminal', isInteractive: true })
  await $.command.run({ command: 'usage-bar', args: '', origin: { kind: 'composer' }, presentation: { isFullscreen: false, columns: 120 } })

  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await ui.find({ type: 'Text', text: /fe-web-mvc/ })).toBeUndefined()
  await ui.unmount()
})

test('format helpers', () => {
  expect(formatDuration((4 * 60 + 4) * 60_000)).toBe('4h 04m')
  expect(formatDuration((2 * 24 + 3) * 3_600_000)).toBe('2d 3h')
  // 1h into a 5h window: 20% of the way through.
  expect(Math.round(pacePercent('five_hour', new Date(NOW + 4 * 3_600_000).toISOString(), NOW) ?? -1)).toBe(20)
  expect(pacePercent('spend_limit', null, NOW)).toBeNull()
  expect(gauge(30, 50, 10)).toEqual(['fill', 'fill', 'fill', 'empty', 'empty', 'pace', 'empty', 'empty', 'empty', 'empty'])
})
