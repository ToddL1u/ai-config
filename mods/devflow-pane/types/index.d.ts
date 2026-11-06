/**
 * The repo's dev-flow progress file as last read; `text` null when it is missing.
 * `branch` is the checked-out branch, null when detached or outside a repo.
 */
export type Progress = { root: string; path: string; text: string | null; branch: string | null }

declare module 'claude-code' {
  interface PluginState {
    'devflow-pane': { progress: Progress | null }
  }
}
