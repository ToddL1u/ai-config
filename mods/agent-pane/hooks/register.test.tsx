import type { AgentInfo, On } from 'claude-code'
import { expect, mock, test } from 'claude-code/testing'

const NOW = Date.parse('2026-11-17T12:00:00Z')

const PANE = {
  plugin: 'agent-pane',
  component: 'Pane',
  requestId: 'agent-pane',
  props: {
    title: 'Subagents',
    isFocused: false,
    bodyColumns: 50,
    placement: 'dock',
    scroll: { offset: 0, bodyRows: 30 },
    view: {},
  },
} as const

function agent(over: Partial<AgentInfo>): AgentInfo {
  return {
    id: 'a1',
    description: 'find auth callers',
    type: 'Explore',
    status: 'running',
    kind: 'local_agent',
    taskStatus: 'running',
    label: 'find auth callers',
    startTime: NOW - 72_000,
    cwd: '/repo',
    tokenCount: 34_200,
    tokenSamples: [],
    hasRow: true,
    ...over,
  }
}

function engine(on: On, agents: AgentInfo[]) {
  mock.clock(on, { now: NOW })
  const opened: string[] = []
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('command.register', () => ({ value: { command: 'agent-pane' } }))
  on('ui.open', (_, e) => {
    opened.push(e.id)
    return { value: { isPlaced: true } }
  })
  on('agent.list', () => ({ value: agents }))
  on('tool.call', () => ({ result: {} }))
  on('prompt.submit', (_, e) => ({ text: e.text }))
  on('agent.spawn', () => ({ agentId: 'a1', model: 'claude-haiku-5-5' }))
  return { opened }
}

test('a spawn opens the pane', async ($, on) => {
  const { opened } = engine(on, [])
  await $.session.start({ cwd: '/repo', surface: 'terminal', isInteractive: true })
  // Only the fields the mod reads; the engine fills the rest in a session.
  await $.agent.spawn({ prompt: 'look', description: 'find auth callers', subagentType: 'Explore' } as Parameters<typeof $.agent.spawn>[0])
  expect(opened).toContain('agent-pane')
})

test('a running agent shows its type, task, current tool, and cost, on every surface', async ($, on) => {
  engine(on, [agent({}), agent({ id: 'a2', type: 'Plan', status: 'completed', description: 'draft plan', label: 'draft plan', startTime: NOW - 5_000, tokenCount: 900 })])
  await $.session.start({ cwd: '/repo', surface: 'terminal', isInteractive: true })
  await $.tool.call({ tool: 'Bash', command: 'rg useAuth', agentId: 'a1' })

  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ ...PANE, surface })
    expect((await ui.find({ type: 'Text', text: /running ·/ }))?.text).toBe('1 running · 1 done')
    expect((await ui.find({ type: 'Text', text: /^● Explore/ }))?.text).toBe('● Explore · 1m12s · 34k tok')
    expect((await ui.find({ type: 'Text', text: /useAuth/ }))?.text).toBe('last: Bash rg useAuth · 1 call')
    expect((await ui.find({ type: 'Text', text: /^✓ Plan/ }))?.text).toBe('✓ Plan · 5s · 900 tok')
    await ui.unmount()
  }
})

test('agents that ended before the latest prompt are hidden', async ($, on) => {
  engine(on, [agent({ status: 'completed', startTime: NOW - 60_000 })])
  await $.session.start({ cwd: '/repo', surface: 'terminal', isInteractive: true })
  await $.prompt.submit({ text: 'next task' } as Parameters<typeof $.prompt.submit>[0])

  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect((await ui.find({ type: 'Text' }))?.text).toBe('No subagents in this turn.')
  await ui.unmount()
})
