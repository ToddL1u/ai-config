import { describe, expect, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'
import type { CommandRunInput, On, RenderElement } from 'claude-code'

import type { Slice } from '../types'
import { level, segments } from './layout'

const BAND = {
  plugin: 'context-bar',
  component: 'AbovePrompt',
  props: {
    hasSurvey: false,
    isWorking: false,
    maxRows: 10,
    bodyColumns: 100,
    scroll: { offset: 0, bodyRows: 10 },
    view: {},
  },
} as const

const SURFACES = ['terminal', 'desktop'] as const

const SLICES: Slice[] = [
  { name: 'System prompt', tokens: 3_000, color: 'promptBorder', kind: 'used' },
  { name: 'Messages', tokens: 47_000, color: 'claude', kind: 'used' },
  { name: 'Free space', tokens: 117_000, color: 'inactive', kind: 'free' },
  { name: 'Autocompact buffer', tokens: 33_000, color: 'inactive', kind: 'buffer' },
]

const fakeUsage = (on: On, totalTokens: number) => {
  const store = new Map<string, unknown>()
  on('session.start', ($, e) => ({ cwd: e.cwd }))
  on('command.register', ($, e) => ({ value: { command: e.name } }))
  // The engine's own band beneath the mod: an empty box.
  on('ui.render', { component: 'AbovePrompt' }, ($, e) => {
    const { Box } = $.ui.resolve(e)
    return h(Box, {}) as RenderElement
  })
  on('store.get', ($, e) => ({ value: store.get(e.key) }))
  on('store.set', ($, e) => {
    store.set(e.key, e.value)
    return { value: undefined }
  })
  on('session.usage', () => ({
    value: {
      startedAt: 0,
      rateLimits: [],
      context: {
        window: 200_000,
        tokens: totalTokens,
        breakdown: {
          categories: [
            ...SLICES.map(s => ({ ...s, isDeferred: false })),
            { name: 'MCP tools (deferred)', tokens: 9_000, color: 'inactive', isDeferred: true, kind: 'deferred' as const },
          ],
          totalTokens,
          maxTokens: 200_000,
          rawMaxTokens: 200_000,
          autocompactSource: 'auto',
          percentage: Math.round((totalTokens / 200_000) * 100),
          gridRows: [],
          model: 'test',
          memoryFiles: [],
          mcpTools: [],
          agents: [],
          autoCompactThreshold: 167_000,
          isAutoCompactEnabled: true,
          apiUsage: null,
        },
      },
    },
  }))
}

const TOGGLE: CommandRunInput = {
  command: 'context-bar',
  args: '',
  origin: { kind: 'composer' },
  presentation: { isFullscreen: false, columns: 100 },
}

const start = ($: Engine) => $.session.start({ cwd: '/repo', surface: 'terminal', isInteractive: true })

describe('segments', () => {
  test('fills the width exactly', () => {
    for (const width of [10, 37, 100, 143]) {
      expect(segments(SLICES, width).reduce((n, s) => n + s.cells, 0)).toBe(width)
    }
  })

  test('keeps a tiny used slice visible', () => {
    const tiny: Slice = { name: 'Memory', tokens: 10, color: 'remember', kind: 'used' }
    const cells = segments([tiny, ...SLICES], 40)
    expect(cells.find(s => s.slice.name === 'Memory')?.cells).toBe(1)
  })
})

describe('level', () => {
  test('warns at 70% and 90% of the compaction point', () => {
    expect(level(100_000, 167_000)).toBe('ok')
    expect(level(120_000, 167_000)).toBe('warn')
    expect(level(155_000, 167_000)).toBe('danger')
    expect(level(190_000, null)).toBe('ok')
  })
})

describe('context-bar band', () => {
  test('shows the header and a legend without deferred rows', async ($, on) => {
    fakeUsage(on, 50_000)
    await start($)

    for (const surface of SURFACES) {
      const ui = await $.ui.mount({ ...BAND, surface })
      const header = await ui.find({ type: 'Text', text: /^Context/ })
      expect(header?.text).toContain('50k / 200k')
      expect(header?.text).toContain('compacts at 167k')
      expect(header?.text).toContain('25%')
      expect((await ui.find({ type: 'Text', text: /Messages/ }))?.text).toContain('47k')
      expect(await ui.find({ type: 'Text', text: /deferred/ })).toBeUndefined()
      await ui.unmount()
    }
  })

  test('/context-bar hides and shows it', async ($, on) => {
    fakeUsage(on, 50_000)
    await start($)

    await $.command.run(TOGGLE)
    let ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
    expect(await ui.find({ type: 'Text', text: /^Context/ })).toBeUndefined()
    await ui.unmount()

    await $.command.run(TOGGLE)
    ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
    expect(await ui.find({ type: 'Text', text: /^Context/ })).toBeDefined()
    await ui.unmount()
  })
})
