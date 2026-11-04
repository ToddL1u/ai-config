import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { RepoIndex } from '../types'

const repo = atom({ plugin: 'codegraph-nudge', key: 'repo' } as const, null)
const isHidden = atom({ plugin: 'codegraph-nudge', key: 'isHidden' } as const, false)

const INIT_TIMEOUT_MS = 10 * 60 * 1000

/** Where the session's git repo is, and whether it has a `.codegraph/` index. */
async function probe($: EngineInterface) {
  const cwd = await $.session.cwd()
  const git = await $.process.run(['git', 'rev-parse', '--show-toplevel'], { cwd }).catch(() => null)
  if (git === null || git.exitCode !== 0) {
    await update($, repo, () => null)
    return
  }

  const root = git.stdout.trim()
  const hasIndex = await $.fs.exists(`${root}/.codegraph`)
  await update($, repo, (current): RepoIndex => {
    // An init running for this repo keeps its phase until it ends.
    if (current?.root === root && current.phase === 'indexing') return current

    return { root, name: root.slice(root.lastIndexOf('/') + 1), phase: hasIndex ? 'indexed' : 'missing' }
  })
}

async function init($: EngineInterface): Promise<string> {
  const target = await read($, repo)
  if (target === null) return 'Not inside a git repository.'
  if (target.phase === 'indexing') return `codegraph is already indexing ${target.name}.`

  const setPhase = (phase: RepoIndex['phase']) =>
    update($, repo, current => (current?.root === target.root ? { ...current, phase } : current))

  await setPhase('indexing')
  // Runs on after the command answers; the band shows progress, a toast the end.
  void $.process
    .run(['codegraph', 'init', '-y'], { cwd: target.root, timeoutMs: INIT_TIMEOUT_MS })
    .then(async ({ exitCode, stderr }) => {
      if (exitCode === 0) {
        await setPhase('indexed')
        $.ui.toast(`codegraph indexed ${target.name}`)
        return
      }
      await setPhase('failed')
      $.ui.toast(`codegraph init failed in ${target.name}: ${stderr.trim().split('\n').pop() ?? `exit ${exitCode}`}`)
    })
    .catch(async (error: unknown) => {
      await setPhase('failed')
      $.ui.toast(`codegraph init could not run: ${String(error)}`)
    })

  return `Indexing ${target.name} with codegraph in the background.`
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'cg-init',
      description: 'Build the codegraph index for the current git repository',
    })
    const started = await next(e)
    await probe($).catch(() => undefined)

    return started
  })

  on('command.run', { command: 'cg-init' }, async $ => ({ text: await init($) }))

  // A Bash `cd` can move the session into another repo.
  on('turn.complete', async ($, e, next) => {
    const done = await next(e)
    if (e.agentId === undefined) await probe($).catch(() => undefined)

    return done
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const current = await read($, repo)
    const isQuiet = e.props.hasSurvey || current === null || current.phase === 'indexed' || (await read($, isHidden))
    if (isQuiet) return next(e)

    const { Box, Button, Text } = $.ui.resolve(e)
    const below = await next(e)
    const hide = () => update($, isHidden, () => true)

    const line =
      current.phase === 'indexing' ? (
        <Text dimColor>◌ codegraph is indexing {current.name}…</Text>
      ) : (
        <Box flexDirection="row" columnGap={1}>
          <Text>
            <Text color="warning">◆</Text>{' '}
            {current.phase === 'failed'
              ? `codegraph init failed in ${current.name}`
              : `${current.name} has no codegraph index`}
          </Text>
          <Button
            key="index"
            hotkey="i"
            variant="primary"
            label={current.phase === 'failed' ? 'Retry' : 'Index now'}
            onPress={async () => void (await init($))}
          />
          <Button key="hide" hotkey="h" dimColor label="Hide" onPress={hide} />
        </Box>
      )

    return (
      <Box flexDirection="column">
        {line}
        {below}
      </Box>
    )
  })
}
