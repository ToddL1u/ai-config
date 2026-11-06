import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Progress } from '../types'
import { summarize } from './parse'

const PANE = 'devflow'
const TITLE = 'dev-flow'
const FILE = '.ai/feature-progress.md'
const STATE_COLOR: Record<string, string> = {
  IN_PROGRESS: 'warning',
  SUCCESS: 'success',
  BLOCKED: 'error',
  STALLED: 'error',
  EXHAUSTED: 'error',
}

const progress = atom({ plugin: 'devflow-pane', key: 'progress' } as const, null)

/** True when the file names a branch other than the checked-out one. */
const isStale = (fileBranch: string | null, current: string | null) =>
  fileBranch !== null && current !== null && fileBranch !== current

/** Reads the progress file at the git root (or the working directory outside a repo). */
async function refresh($: EngineInterface): Promise<Progress> {
  const cwd = await $.session.cwd()
  const git = await $.process.run(['git', 'rev-parse', '--show-toplevel'], { cwd }).catch(() => null)
  const root = git !== null && git.exitCode === 0 ? git.stdout.trim() : cwd
  const path = `${root}/${FILE}`
  const text = (await $.fs.exists(path)) ? await $.fs.read(path).catch(() => null) : null
  const head = await $.process.run(['git', 'branch', '--show-current'], { cwd }).catch(() => null)
  const branch = head !== null && head.exitCode === 0 && head.stdout.trim() !== '' ? head.stdout.trim() : null
  const next: Progress = { root, path, text: typeof text === 'string' ? text : null, branch }
  await update($, progress, () => next)

  return next
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'devflow', description: 'Open the dev-flow progress pane' })
    const started = await next(e)
    const found = await refresh($).catch(() => null)
    // Open by itself only for work still going on on this branch.
    if (found !== null && found.text !== null) {
      const { state, branch } = summarize(found.text)
      const live = state === null || state === 'IN_PROGRESS'
      if (live && !isStale(branch, found.branch)) void $.ui.open({ id: PANE, title: TITLE })
    }

    return started
  })

  on('command.run', { command: 'devflow' }, async $ => {
    const found = await refresh($)
    await $.ui.open({ id: PANE, title: TITLE })

    return { text: found.text === null ? `No ${FILE} in ${found.root} yet.` : 'dev-flow pane opened.' }
  })

  // Live: redraw right after the agent writes the file, and at each turn's end.
  on('tool.call', { tool: 'Edit' }, async ($, e, next) => {
    const ran = await next(e)
    if (e.file_path.endsWith(FILE)) await refresh($).catch(() => undefined)

    return ran
  })
  on('tool.call', { tool: 'Write' }, async ($, e, next) => {
    const ran = await next(e)
    if (e.file_path.endsWith(FILE)) await refresh($).catch(() => undefined)

    return ran
  })

  on('turn.complete', async ($, e, next) => {
    const done = await next(e)
    if (e.agentId === undefined) await refresh($).catch(() => undefined)

    return done
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Markdown, Text } = $.ui.resolve(e)
    const found = await read($, progress)

    if (found === null || found.text === null) {
      return (
        <Box flexDirection="column">
          <Text dimColor>No {FILE} yet.</Text>
          <Text dimColor>Start one with /dev-flow; it shows here as it is written.</Text>
        </Box>
      )
    }

    const s = summarize(found.text)
    const stale = isStale(s.branch, found.branch)
    const criteria =
      s.criteria === null
        ? null
        : s.criteria.done === null
          ? `${s.criteria.total} criteria`
          : `${s.criteria.done}/${s.criteria.total} criteria`

    return (
      <Box flexDirection="column" rowGap={1}>
        {stale && (
          <Text color="warning" wrap="wrap">
            STALE · written on {s.branch}, now on {found.branch}
          </Text>
        )}
        <Box flexDirection="column">
          {s.title !== null && <Text bold wrap="wrap">{s.title}</Text>}
          <Text wrap="truncate-end">
            <Text bold color={STATE_COLOR[s.state ?? ''] ?? 'subtle'}>● {s.state ?? 'NO STATE'}</Text>
            {criteria !== null && <Text dimColor> · {criteria}</Text>}
            {s.branch !== null && <Text dimColor> · ⎇ {s.branch}</Text>}
          </Text>
          {s.next !== null && (
            <Text wrap="wrap">
              <Text color="suggestion">Next </Text>
              {s.next}
            </Text>
          )}
        </Box>
        <Markdown text={s.body} />
      </Box>
    )
  })
}
