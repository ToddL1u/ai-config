/** One rendered row per running subagent. */
export type AgentLines = string[]

declare module 'claude-code' {
  interface PluginState {
    'activity-bar': { agentLines: AgentLines }
  }
}
