import type { On } from 'claude-code'
import { expect, test } from 'claude-code/testing'

const BAND = {
  plugin: 'codegraph-nudge',
  component: 'AbovePrompt',
  props: {
    hasSurvey: false,
    isCollapsed: false,
    isWorking: false,
    maxRows: 10,
    bodyColumns: 80,
    scroll: { offset: 0, bodyRows: 9 },
    view: {},
  },
} as const

type Run = { argv: readonly string[]; cwd?: string }

type Opts = { indexed?: readonly string[]; root?: string; common?: string; runs?: Run[]; toasts?: string[] }

function engine(on: On, { indexed = [], root = '/repo/fe-web-mvc', common = `${root}/.git`, runs = [], toasts = [] }: Opts) {
  const ok = (stdout: string) => ({ value: { exitCode: 0, stdout, stderr: '', isStdoutTruncated: false, isStderrTruncated: false } })
  on('ui.render', ($, e) => {
    const { Box } = $.ui.resolve(e)
    return <Box />
  })
  on('command.register', () => ({ value: { command: 'cg-init' } }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('session.cwd', () => ({ value: root }))
  on('process.run', (_, e) => {
    runs.push({ argv: e.argv, cwd: e.init?.cwd })
    if (e.argv.includes('--show-toplevel')) return ok(`${root}\n`)
    if (e.argv.includes('--git-common-dir')) return ok(`${common}\n`)
    return ok('')
  })
  on('fs.exists', (_, e) => ({ value: indexed.some(p => e.path.startsWith(p)) }))
  on('ui.toast', (_, e) => (toasts.push(e.text), { value: undefined }))
}

const settle = async (done: () => boolean) => {
  for (let i = 0; i < 200 && !done(); i++) await Promise.resolve()
}

test('a repo without an index shows the nudge, and Hide removes it', async ($, on) => {
  engine(on, {})
  await $.session.start({ cwd: '/repo/fe-web-mvc', surface: 'terminal', isInteractive: true })

  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect((await ui.find({ type: 'Text', text: /fe-web-mvc has no codegraph index/ }))).toBeDefined()
  await ui.press({ key: 'hide' })
  expect(await ui.find({ type: 'Text', text: /no codegraph index/ })).toBeUndefined()
  await ui.unmount()
})

test('an indexed repo shows nothing', async ($, on) => {
  engine(on, { indexed: ['/repo/fe-web-mvc/.codegraph'] })
  await $.session.start({ cwd: '/repo/fe-web-mvc', surface: 'terminal', isInteractive: true })

  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await ui.find({ type: 'Text', text: /codegraph/ })).toBeUndefined()
  await ui.unmount()
})

test('/cg-init runs codegraph init in the repo root', async ($, on) => {
  const runs: Run[] = []
  const toasts: string[] = []
  engine(on, { runs, toasts })
  await $.session.start({ cwd: '/repo/fe-web-mvc', surface: 'terminal', isInteractive: true })

  const answer = await $.command.run({
    command: 'cg-init',
    args: '',
    origin: { kind: 'composer' },
    presentation: { isFullscreen: false, columns: 120 },
  })
  expect(answer.text).toMatch(/Indexing fe-web-mvc/)
  // The init runs in the background; let it settle before reading.
  await settle(() => toasts.length > 0)
  expect(toasts).toContain('codegraph indexed fe-web-mvc')
  expect(runs.some(r => r.argv.join(' ') === 'codegraph init -y' && r.cwd === '/repo/fe-web-mvc')).toBe(true)
})

test('a linked worktree clones the main worktree\'s index and syncs it, unasked', async ($, on) => {
  const runs: Run[] = []
  const toasts: string[] = []
  engine(on, {
    root: '/orca/fe-web-mvc/uat',
    common: '/repo/fe-web-mvc/.git',
    indexed: ['/repo/fe-web-mvc/.codegraph'],
    runs,
    toasts,
  })
  await $.session.start({ cwd: '/orca/fe-web-mvc/uat', surface: 'terminal', isInteractive: true })
  await settle(() => toasts.length > 0)

  const ran = runs.map(r => r.argv.join(' '))
  expect(ran).toContain('cp -c /repo/fe-web-mvc/.codegraph/codegraph.db /orca/fe-web-mvc/uat/.codegraph/codegraph.db')
  expect(ran).toContain('codegraph sync /orca/fe-web-mvc/uat')
  expect(ran).not.toContain('codegraph init -y')
  expect(toasts).toContain('codegraph indexed uat (seeded from the main worktree)')
})

test('a repo with no indexed main worktree waits for the person', async ($, on) => {
  const runs: Run[] = []
  engine(on, { root: '/orca/other/wt', common: '/repo/other/.git', runs })
  await $.session.start({ cwd: '/orca/other/wt', surface: 'terminal', isInteractive: true })

  expect(runs.some(r => r.argv[0] === 'codegraph')).toBe(false)
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await ui.find({ type: 'Text', text: /wt has no codegraph index/ })).toBeDefined()
  await ui.unmount()
})
