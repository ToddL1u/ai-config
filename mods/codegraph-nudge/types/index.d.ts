export type Phase = 'indexed' | 'missing' | 'indexing' | 'failed'

/** The git repo the session runs in and its codegraph index; null outside a repo. */
export type RepoIndex = { root: string; name: string; phase: Phase }

declare module 'claude-code' {
  interface PluginState {
    'codegraph-nudge': { repo: RepoIndex | null; isHidden: boolean }
  }
}
