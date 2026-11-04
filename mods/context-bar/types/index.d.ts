export type Slice = {
  name: string
  tokens: number
  color: string
  kind: 'used' | 'free' | 'buffer'
}

export type Snapshot = {
  slices: Slice[]
  totalTokens: number
  maxTokens: number
  /** Token count where auto-compaction runs; null when it is off. */
  compactAt: number | null
}

declare module 'claude-code' {
  interface PluginState {
    'context-bar': { snapshot: Snapshot | null; isHidden: boolean }
  }
}
