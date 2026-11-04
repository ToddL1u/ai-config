import type { On } from 'claude-code'
import { expect, test } from 'claude-code/testing'

const BAND = {
  plugin: 'codegraph-nudge',
  component: 'AbovePrompt',
  props: {
    hasSurvey: false,
    isWorking: false,
    maxRows: 10,
    bodyColumns: 80,
    scroll: { offset: 0, bodyRows: 9 },
    view: {},
  },
} as const

type Run = { argv: readonly string[]; cwd?: string }

function engine(on: On, hasIndex: boolean, runs: Run[] = [], toasts: string[] = []) {
  on('ui.render', ($, e) => {
    const { Box } = $.ui.resolve(e)
    return <Box />
  })
  on('command.register', () => ({ value: { command: 'cg-init' } }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('session.cwd', () => ({ value: '/repo/fe-web-mvc' }))
  on('process.run', (_, e) => {
    runs.push({ argv: e.argv, cwd: e.init?.cwd })
    return e.argv[0] === 'git'
      ? { value: { exitCode: 0, stdout: '/repo/fe-web-mvc\n', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
      : { value: { exitCode: 0, stdout: '', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
  })
  on('fs.exists', () => ({ value: hasIndex }))
  on('ui.toast', (_, e) => (toasts.push(e.text), { value: undefined }))
}

test('a repo without an index shows the nudge, and Hide removes it', async ($, on) => {
  engine(on, false)
  await $.session.start({ cwd: '/repo/fe-web-mvc', surface: 'terminal', isInteractive: true })

  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect((await ui.find({ type: 'Text', text: /fe-web-mvc has no codegraph index/ }))).toBeDefined()
  await ui.press({ key: 'hide' })
  expect(await ui.find({ type: 'Text', text: /no codegraph index/ })).toBeUndefined()
  await ui.unmount()
})

test('an indexed repo shows nothing', async ($, on) => {
  engine(on, true)
  await $.session.start({ cwd: '/repo/fe-web-mvc', surface: 'terminal', isInteractive: true })

  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await ui.find({ type: 'Text', text: /codegraph/ })).toBeUndefined()
  await ui.unmount()
})

test('/cg-init runs codegraph init in the repo root', async ($, on) => {
  const runs: Run[] = []
  const toasts: string[] = []
  engine(on, false, runs, toasts)
  await $.session.start({ cwd: '/repo/fe-web-mvc', surface: 'terminal', isInteractive: true })

  const answer = await $.command.run({
    command: 'cg-init',
    args: '',
    origin: { kind: 'composer' },
    presentation: { isFullscreen: false, columns: 120 },
  })
  expect(answer.text).toMatch(/Indexing fe-web-mvc/)
  // The init runs in the background; let it settle before reading.
  for (let i = 0; i < 50 && !toasts.length; i++) await Promise.resolve()
  expect(toasts).toContain('codegraph indexed fe-web-mvc')
  expect(runs.some(r => r.argv.join(' ') === 'codegraph init -y' && r.cwd === '/repo/fe-web-mvc')).toBe(true)
})
