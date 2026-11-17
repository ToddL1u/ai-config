/** A subagent's latest tool call; `isRunning` false once the call returned. */
export type Activity = { tool: string; detail: string; at: number; calls: number; isRunning: boolean }

declare module 'claude-code' {
  interface PluginState {
    'agent-pane': {
      /** Latest tool call per agent id. */
      activity: Record<string, Activity>
      /** Finished agents that started before this time are hidden (the last main turn's end). */
      clearedAt: number
      /** Bumped every second while an agent runs, so elapsed times redraw. */
      tick: number
    }
  }
}
