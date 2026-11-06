import type { On } from 'claude-code'
import { expect, test } from 'claude-code/testing'

import { summarize } from './parse'

const TEMPLATE = `# Feature Progress

## Goal

Ship the cart

## Acceptance criteria

- [x] Adds an item
- [ ] Removes an item

## Next

1. Write the remove test

## Terminal state

\`IN_PROGRESS\`
`

const DRIFTED = `# SPROM-1206 — Mission Go CTA

Branch: feat/SPROM-1206-mission

## Acceptance criteria
1. Go button shows
2. Variants render

## Log
- review-sweep READY
- Next: user runs e2e with local proxy
`

const PANE = {
  plugin: 'devflow-pane',
  component: 'Pane',
  requestId: 'devflow',
  props: { title: 'dev-flow', isFocused: false, bodyColumns: 60, placement: 'dock', scroll: { offset: 0, bodyRows: 30 }, view: {} },
} as const

function engine(on: On, file: string | null, opened: string[] = [], branch = 'main') {
  on('ui.render', ($, e) => {
    const { Box } = $.ui.resolve(e)
    return <Box />
  })
  on('command.register', () => ({ value: { command: 'devflow' } }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('session.cwd', () => ({ value: '/repo/app' }))
  on('process.run', (_, e) => {
    const stdout = e.argv.includes('--show-current') ? `${branch}\n` : '/repo/app\n'
    return { value: { exitCode: 0, stdout, stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
  })
  on('fs.exists', () => ({ value: file !== null }))
  on('fs.read', () => ({ value: file ?? '' }))
  on('ui.open', (_, e) => (opened.push(e.id), { value: { isPlaced: true } }))
}

test('summarize reads the template', () => {
  const s = summarize(TEMPLATE)
  expect(s.title).toBe('Feature Progress')
  expect(s.state).toBe('IN_PROGRESS')
  expect(s.criteria).toEqual({ done: 1, total: 2 })
  expect(s.next).toBe('Write the remove test')
})

test('summarize tolerates a drifted file', () => {
  const s = summarize(DRIFTED)
  expect(s.state).toBeNull()
  expect(s.branch).toBe('feat/SPROM-1206-mission')
  expect(s.criteria).toEqual({ done: null, total: 2 })
  expect(s.next).toBe('user runs e2e with local proxy')
})

test('an in-progress file opens the pane and shows its summary', async ($, on) => {
  const opened: string[] = []
  engine(on, TEMPLATE, opened)
  await $.session.start({ cwd: '/repo/app', surface: 'terminal', isInteractive: true })
  expect(opened).toEqual(['devflow'])

  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect(await ui.find({ type: 'Text', text: /IN_PROGRESS/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /1\/2 criteria/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /Write the remove test/ })).toBeDefined()
  await ui.unmount()
})

test('no file: the pane stays shut until /devflow, then says so', async ($, on) => {
  const opened: string[] = []
  engine(on, null, opened)
  await $.session.start({ cwd: '/repo/app', surface: 'terminal', isInteractive: true })
  expect(opened).toEqual([])

  const answer = await $.command.run({ command: 'devflow', args: '', origin: { kind: 'composer' }, presentation: { isFullscreen: false, columns: 160 } })
  expect(answer.text).toMatch(/No \.ai\/feature-progress\.md/)
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect(await ui.find({ type: 'Text', text: /No \.ai\/feature-progress\.md yet/ })).toBeDefined()
  await ui.unmount()
})

test('a file from another branch stays shut and is marked stale', async ($, on) => {
  const opened: string[] = []
  engine(on, DRIFTED, opened, 'feat/SPROM-2000-other')
  await $.session.start({ cwd: '/repo/app', surface: 'terminal', isInteractive: true })
  expect(opened).toEqual([])

  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect(await ui.find({ type: 'Text', text: /STALE · written on feat\/SPROM-1206-mission, now on feat\/SPROM-2000-other/ })).toBeDefined()
  await ui.unmount()
})

test('a file from the current branch opens without a stale marker', async ($, on) => {
  const opened: string[] = []
  engine(on, DRIFTED, opened, 'feat/SPROM-1206-mission')
  await $.session.start({ cwd: '/repo/app', surface: 'terminal', isInteractive: true })
  expect(opened).toEqual(['devflow'])

  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect(await ui.find({ type: 'Text', text: /STALE/ })).toBeUndefined()
  await ui.unmount()
})
