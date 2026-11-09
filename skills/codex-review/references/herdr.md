# Herdr path

Herdr commands return JSON; read IDs from responses.

1. **Find the caller pane.** Background or forked sessions run inside Herdr
   without its environment variables, so check both:
   - `HERDR_ENV` is `1` and `HERDR_PANE_ID` is set: use `$HERDR_PANE_ID`.
   - Otherwise, when `herdr status server` reports `status: running`, run
     `herdr pane list` and take the pane with `"focused": true` whose `cwd`
     equals `$PWD`, else the single pane with `"agent": "claude"` whose `cwd`
     equals `$PWD`. With no match, or several and none focused, ask the user
     which pane to split.

2. **Split.** Pick `right` for a wide caller pane, `down` for a narrow or tall
   one:

   ```bash
   herdr pane layout --pane <caller-pane-id>
   herdr pane split <caller-pane-id> --direction right --cwd "$PWD" --no-focus
   ```

   The new pane ID is `.result.pane.pane_id`.

3. **Start Codex** read-only with no approval prompts. Name the agent
   `codex-review`, or `codex-review-<short-head-sha>` when `herdr agent list`
   already has that name, and use that exact name afterwards:

   ```bash
   herdr agent start <agent-name> --kind codex --pane <pane-id> -- --sandbox read-only --ask-for-approval never
   ```

   `agent_not_ready` means Codex is waiting on a startup dialog (for example,
   folder trust). Read it with
   `herdr agent read <agent-name> --source recent-unwrapped --lines 80`, relay
   it to the user, and once they have handled it run
   `herdr agent wait <agent-name> --until idle --timeout 540000`.

4. **Submit the prompt and wait:**

   ```bash
   herdr agent prompt <agent-name> "$(cat "$prompt_file")" --wait --timeout 540000
   ```

   - `blocked`: read with `herdr agent read <agent-name> --source recent-unwrapped --lines 80`
     and relay the question to the user.
   - `timeout` or `agent_prompt_stalled`: check `herdr agent get <agent-name>`
     and `agent read`; while it is still working, repeat
     `herdr agent wait <agent-name> --timeout 540000`.

5. **Read the report**, with more lines if its start is cut off:

   ```bash
   herdr agent read <agent-name> --source recent-unwrapped --lines 400
   ```

6. **Close** the pane once the full report is read:

   ```bash
   herdr pane close <pane-id>
   ```
