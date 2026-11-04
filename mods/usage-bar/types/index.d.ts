export type RateWindow = { kind: string; percentUsed: number; resetsAt: string | null }

/** What the engine measured last: the status line's figures. */
export type Usage = {
  contextTokens: number | null
  contextWindow: number
  contextPercent: number | null
  rateLimits: RateWindow[]
  costUsd: number | null
}

/** Where the session runs: read from git, mise and the engine. */
export type Env = { model: string; repo: string | null; branch: string | null; node: string | null }

/** Token counts summed over every turn of the session, subagents included. */
export type Totals = { input: number; output: number; cacheRead: number; cacheWrite: number }

declare module 'claude-code' {
  interface PluginState {
    'usage-bar': { usage: Usage | null; env: Env | null; totals: Totals; isHidden: boolean }
  }
}
