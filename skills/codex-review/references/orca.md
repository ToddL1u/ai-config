# Orca path

The caller pane is `$ORCA_TERMINAL_HANDLE`. Orca commands take `--json`; read
handles from responses.

1. **Open Codex.** Split the caller pane and start Codex read-only with no
   approval prompts:

   ```bash
   orca terminal split --terminal "$ORCA_TERMINAL_HANDLE" --direction horizontal \
     --command "codex --sandbox read-only --ask-for-approval never" --json
   ```

   The new pane handle is `.result.split.handle`. A split timeout can still
   open the pane: re-run with `--retry-split <leafId>` from the error.

2. **Wait until ready:**

   ```bash
   orca terminal wait --terminal <handle> --for tui-idle --timeout-ms 60000 --json
   ```

   A wait that times out with no `blockedReason` usually means Codex never
   started: a shell startup prompt (such as an oh-my-zsh update question) ate
   the start command's first characters. Read the pane with `--screen`; when it
   shows a shell prompt or `command not found`, start Codex again with
   `orca terminal send --terminal <handle> --text "codex --sandbox read-only --ask-for-approval never" --enter --json`
   and wait again.

   A set `.result.wait.blockedReason` (for example `agent-update-prompt` or a
   folder-trust dialog) means Codex is waiting on a startup dialog. Read it
   with `orca terminal read --terminal <handle> --screen --json`, relay it to
   the user, wait for them to handle it, then wait again.

3. **Submit the prompt and wait:**

   ```bash
   orca terminal send --terminal <handle> --text "$(cat "$prompt_file")" --enter --wait-submit 15 --json
   orca terminal wait --terminal <handle> --for tui-idle --timeout-ms 540000 --json
   ```

   - `agent_prompt_blocked` or a `blockedReason`: read with `--screen` and
     relay the question to the user.
   - Ambiguous send failure: re-issue the exact command with the reported
     `--retry-request <id>`; that is the only resend.
   - Wait `timeout` while `status` is `running`: repeat the wait.

4. **Read the report** from the accumulated output. Codex repaints its
   screen, so a cursor taken before the send can read back empty:

   ```bash
   orca terminal read --terminal <handle> --limit 1000 --json
   ```

   Take the lines of `.result.terminal.tail` after the submitted prompt. When
   `limited` is true, page with `--cursor <oldestCursor> --limit <n>`.

5. **Close** the pane once the full report is read:

   ```bash
   orca terminal close --terminal <handle> --json
   ```
