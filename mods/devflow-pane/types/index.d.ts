/** The repo's dev-flow progress file as last read; `text` null when it is missing. */
export type Progress = { root: string; path: string; text: string | null }

declare module 'claude-code' {
  interface PluginState {
    'devflow-pane': { progress: Progress | null }
  }
}
