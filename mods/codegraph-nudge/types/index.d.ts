export type Phase = 'indexed' | 'missing' | 'indexing' | 'failed'

/**
 * The git repo the session runs in and its codegraph index; null outside a repo.
 * `seed` is the main worktree's index a linked worktree can clone, null when there is none.
 */
export type RepoIndex = { root: string; name: string; phase: Phase; seed: string | null }

declare module 'claude-code' {
  interface PluginState {
    'codegraph-nudge': { repo: Shaped<RepoIndex | null>; isHidden: boolean }
  }
}
