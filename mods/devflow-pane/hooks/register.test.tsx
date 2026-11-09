import type { On } from 'claude-code'
import { expect, test } from 'claude-code/testing'
import type { TestBody } from 'claude-code/testing'

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

type Seen = { opened: string[]; closed: string[]; status: (string | undefined)[] }

function engine(on: On, file: string | null, branch = 'main'): Seen {
  const seen: Seen = { opened: [], closed: [], status: [] }
  const up = new Set<string>()
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
  on('ui.status', (_, e) => (seen.status.push(e.text), { value: undefined }))
  on('ui.open', (_, e) => (seen.opened.push(e.id), up.add(e.id), { value: { isPlaced: true } }))
  on('ui.close', (_, e) => (seen.closed.push(e.id), up.delete(e.id), { value: undefined }))
  on('ui.panes', () => ({
    value: [...up].map(id => ({ id, title: id, isShown: true, isFocused: false, isPlaced: true })),
  }))

  return seen
}

const run = ($: Parameters<TestBody>[0]) =>
  $.command.run({ command: 'devflow', args: '', origin: { kind: 'composer' }, presentation: { isFullscreen: false, columns: 160 } })
const start = ($: Parameters<TestBody>[0]) =>
  $.session.start({ cwd: '/repo/app', surface: 'terminal', isInteractive: true })

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

test('starts collapsed: a status line, no pane', async ($, on) => {
  const seen = engine(on, TEMPLATE)
  await start($)
  expect(seen.opened).toEqual([])
  expect(seen.status.at(-1)).toBe('dev-flow · IN_PROGRESS · 1/2 criteria · Next: Write the remove test · /devflow to expand')
})

test('/devflow expands the pane, then collapses it', async ($, on) => {
  const seen = engine(on, TEMPLATE)
  await start($)

  expect((await run($)).text).toBe('dev-flow pane opened.')
  expect(seen.opened).toEqual(['devflow'])
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect(await ui.find({ type: 'Text', text: /IN_PROGRESS/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /1\/2 criteria/ })).toBeDefined()
  await ui.unmount()

  expect((await run($)).text).toBe('dev-flow pane collapsed.')
  expect(seen.closed).toEqual(['devflow'])
  expect(seen.status.at(-1)).toMatch(/IN_PROGRESS/)
})

test('no file: no status line; /devflow says so', async ($, on) => {
  const seen = engine(on, null)
  await start($)
  expect(seen.opened).toEqual([])
  expect(seen.status.at(-1)).toBeUndefined()

  expect((await run($)).text).toMatch(/No \.ai\/feature-progress\.md/)
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect(await ui.find({ type: 'Text', text: /No \.ai\/feature-progress\.md yet/ })).toBeDefined()
  await ui.unmount()
})

test('a file from another branch is marked stale', async ($, on) => {
  const seen = engine(on, DRIFTED, 'feat/SPROM-2000-other')
  await start($)
  expect(seen.status.at(-1)).toMatch(/STALE \(feat\/SPROM-1206-mission\)/)

  await run($)
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect(await ui.find({ type: 'Text', text: /STALE · written on feat\/SPROM-1206-mission, now on feat\/SPROM-2000-other/ })).toBeDefined()
  await ui.unmount()
})

test('a file from the current branch has no stale marker', async ($, on) => {
  const seen = engine(on, DRIFTED, 'feat/SPROM-1206-mission')
  await start($)
  expect(seen.status.at(-1)).not.toMatch(/STALE/)

  await run($)
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect(await ui.find({ type: 'Text', text: /STALE/ })).toBeUndefined()
  await ui.unmount()
})
