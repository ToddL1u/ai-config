import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { RepoIndex } from '../types'

// `shape` declines a value stored before `seed` existed.
const repo = atom({ plugin: 'codegraph-nudge', key: 'repo' } as const, null, { shape: 'repo-2' })
const isHidden = atom({ plugin: 'codegraph-nudge', key: 'isHidden' } as const, false)

const INIT_TIMEOUT_MS = 10 * 60 * 1000

/** The main worktree's index for a linked worktree at `root`, or null. */
async function seedFor($: EngineInterface, root: string): Promise<string | null> {
  const common = await $.process
    .run(['git', 'rev-parse', '--path-format=absolute', '--git-common-dir'], { cwd: root })
    .catch(() => null)
  if (common === null || common.exitCode !== 0) return null
  const gitDir = common.stdout.trim()
  if (!gitDir.endsWith('/.git')) return null
  const main = gitDir.slice(0, -'/.git'.length)
  if (main === root) return null
  const db = `${main}/.codegraph/codegraph.db`

  return (await $.fs.exists(db)) ? `${main}/.codegraph` : null
}

/** Where the session's git repo is, and whether it has a `.codegraph/` index. */
async function probe($: EngineInterface): Promise<RepoIndex | null> {
  const cwd = await $.session.cwd()
  const git = await $.process.run(['git', 'rev-parse', '--show-toplevel'], { cwd }).catch(() => null)
  if (git === null || git.exitCode !== 0) {
    await update($, repo, () => null)
    return null
  }

  const root = git.stdout.trim()
  const hasIndex = await $.fs.exists(`${root}/.codegraph`)
  const seed = hasIndex ? null : await seedFor($, root)

  return update($, repo, (current): RepoIndex => {
    // An init running, or failed, for this repo keeps its phase.
    if (current?.root === root && (current.phase === 'indexing' || (current.phase === 'failed' && !hasIndex))) return current

    return { root, name: root.slice(root.lastIndexOf('/') + 1), phase: hasIndex ? 'indexed' : 'missing', seed }
  })
}

type Step = readonly string[]

/**
 * The commands that index `target`: a linked worktree clones its main worktree's
 * database (an APFS copy-on-write clone, so blocks stay shared until they change)
 * and syncs the difference; anything else builds from scratch.
 */
function plan(target: RepoIndex): Step[] {
  const dir = `${target.root}/.codegraph`
  if (target.seed === null) return [['codegraph', 'init', '-y']]

  return [
    ['mkdir', '-p', dir],
    ['cp', `${target.seed}/.gitignore`, `${dir}/.gitignore`],
    ['cp', '-c', `${target.seed}/codegraph.db`, `${dir}/codegraph.db`],
    ['codegraph', 'sync', target.root],
  ]
}

async function runAll($: EngineInterface, cwd: string, steps: Step[]): Promise<string | null> {
  for (const argv of steps) {
    const { exitCode, stderr } = await $.process.run([...argv], { cwd, timeoutMs: INIT_TIMEOUT_MS })
    if (exitCode !== 0) return `${argv.slice(0, 2).join(' ')}: ${stderr.trim().split('\n').pop() ?? `exit ${exitCode}`}`
  }

  return null
}

async function init($: EngineInterface): Promise<string> {
  const target = await read($, repo)
  if (target === null) return 'Not inside a git repository.'
  if (target.phase === 'indexing') return `codegraph is already indexing ${target.name}.`

  const setPhase = (phase: RepoIndex['phase']) =>
    update($, repo, current => (current?.root === target.root ? { ...current, phase } : current))

  await setPhase('indexing')
  // Runs on after the command answers; the band shows progress, a toast the end.
  void (async () => {
    let failure = await runAll($, target.root, plan(target))
    // A seed that will not clone or sync falls back to a full rebuild over it.
    if (failure !== null && target.seed !== null) failure = await runAll($, target.root, [['codegraph', 'index', target.root]])
    if (failure === null) {
      await setPhase('indexed')
      $.ui.toast(`codegraph indexed ${target.name}${target.seed === null ? '' : ' (seeded from the main worktree)'}`)
      return
    }
    await setPhase('failed')
    $.ui.toast(`codegraph init failed in ${target.name}: ${failure}`)
  })().catch(async (error: unknown) => {
    await setPhase('failed')
    $.ui.toast(`codegraph init could not run: ${String(error)}`)
  })

  return target.seed === null
    ? `Indexing ${target.name} with codegraph in the background.`
    : `Seeding ${target.name}'s codegraph index from the main worktree in the background.`
}

/** A linked worktree whose main worktree is indexed gets its own index without asking. */
async function probeAndSeed($: EngineInterface) {
  const found = await probe($)
  if (found?.phase === 'missing' && found.seed !== null) await init($)
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'cg-init',
      description: 'Build the codegraph index for the current git repository',
    })
    const started = await next(e)
    await probeAndSeed($).catch(() => undefined)

    return started
  })

  on('command.run', { command: 'cg-init' }, async $ => ({ text: await init($) }))

  // A Bash `cd` can move the session into another repo.
  on('turn.complete', async ($, e, next) => {
    const done = await next(e)
    if (e.agentId === undefined) await probeAndSeed($).catch(() => undefined)

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
