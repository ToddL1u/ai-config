---
name: codex-review
description: Hand a read-only code review to Codex running as an interactive agent in a separate Herdr pane, so the user can watch it work, then close the pane once the report is relayed; fall back to headless codex exec outside Herdr. Use when the user asks for a codex review, a review by Codex, a second-model review, or a review in a Herdr pane.
---

# Codex Review

Codex performs the whole review. The calling agent only resolves the target,
starts Codex, and relays its report. The review is read-only: never edit,
fix, stage, or commit as part of it.

If the calling agent is itself Codex, skip the pane and review directly with
the prompt below.

Stop with a clear message if `codex` is not on `PATH`.

## 1. Resolve the target

Use one mode and record its base and `HEAD` SHAs:

- **WIP** — the working tree is dirty: review all staged, unstaged, and
  untracked changes against `HEAD`.
- **Branch** — clean feature branch: base is `git merge-base <base> HEAD`.
  Default `<base>` to the user's stated branch, else `main`, else `master`.
  Ask if none exists or the choice could omit work.
- **Commit** — the user named a commit: review that commit only.

Also collect any spec, ticket, or acceptance criteria the user supplied. Never
infer requirements from code or branch names.

## 2. Build the Codex prompt

Write the prompt to a file with a quoted heredoc, and pass it on only through
that file. Never paste it inline in double quotes: the shell would run its
backticks and expand any `$` in supplied requirements.

```bash
prompt_file="$(mktemp "${TMPDIR:-/tmp}/codex-review-prompt.XXXXXX")"
cat > "$prompt_file" <<'CODEX_PROMPT'
<prompt below, filled in>
CODEX_PROMPT
```

```text
Review these changes in <repo path>. This is a read-only review: do not edit,
stage, or commit anything.

Scope: <one of>
- uncommitted changes: `git diff HEAD` plus untracked files (`git status --short`)
- branch: `git diff <base-sha>...<head-sha>`
- commit: `git show <sha>`

Requirements (if any): <spec / ticket / acceptance criteria, or "none supplied">

Read the surrounding code as needed. Focus on correctness, regressions, async
and state races, error handling, security, data loss, and missing tests.
Skip style nits.

Write the report in Traditional Chinese (繁體中文, zh-TW). Keep technical terms,
code identifiers, file paths, the severity labels, and READY / NEEDS WORK in
English.

Report in this format:

## Findings
- [Blocker|High|Medium|Low|Question] <issue and impact> — <file>:<line> — <how to verify>

## Potential risks by file
- <file>
  - [Severity] <risk> — <line(s)>
List every file that carries a finding or a side effect to verify; one bullet
per risk.

## Side effects to verify
- <side effect> — <file>:<line>
## Questions / assumptions
## Tests to add or run

## Verdict
READY or NEEDS WORK, with one line of reasoning.
```

## 3. Herdr path

Herdr commands return JSON; read IDs from responses rather than guessing them.

Resolve the caller pane before choosing a path. Do not rely on `HERDR_ENV`
alone: background or forked agent sessions run inside Herdr without
inheriting its environment variables.

1. If `test "${HERDR_ENV:-}" = 1` passes and `HERDR_PANE_ID` is set, use
   `$HERDR_PANE_ID` as the caller pane.
2. Otherwise, if `herdr` is on `PATH` and `herdr status server` reports
   `status: running`, run `herdr pane list` and pick the caller pane:
   - prefer the pane with `"focused": true` whose `cwd` equals `$PWD`;
   - else the single pane with `"agent": "claude"` whose `cwd` equals `$PWD`.
   If no pane matches, or several match with no focused one, ask the user
   which pane to split instead of guessing.
3. If neither resolves a pane, use the headless fallback.

Then:

1. Pick the split direction from the caller pane: `right` when wide, `down`
   when narrow or tall.

   ```bash
   herdr pane layout --pane <caller-pane-id>
   herdr pane split <caller-pane-id> --direction right --cwd "$PWD" --no-focus
   ```

   Read the new pane ID from `.result.pane.pane_id`.

2. Start Codex read-only with no approval prompts. Pick `<agent-name>`: run
   `herdr agent list`; use `codex-review` if no agent has that name, else
   `codex-review-<short-head-sha>`. Use that exact name in every later
   command.

   ```bash
   herdr agent start <agent-name> --kind codex --pane <pane-id> -- --sandbox read-only --ask-for-approval never
   ```

   If the start returns `agent_not_ready`, Codex is blocked on a startup
   dialog (for example, folder trust). Do not prompt it yet:
   - run `herdr agent read <agent-name> --source recent-unwrapped --lines 80`
     and show the user the dialog; do not answer it for them;
   - once the user has handled it, run
     `herdr agent wait <agent-name> --until idle --timeout 540000`, then
     continue.

3. Submit the prompt and wait:

   ```bash
   herdr agent prompt <agent-name> "$(cat "$prompt_file")" --wait --timeout 540000
   ```

   Keep every wait at or under 540000 ms so it ends before the 10-minute
   foreground Bash limit.

   - `blocked`: run `herdr agent read <agent-name> --source recent-unwrapped --lines 80`,
     show the user the question, and do not answer it for them.
   - `timeout` or `agent_prompt_stalled`: do not resend. Check
     `herdr agent get <agent-name>` and `agent read` first; keep waiting with
     `herdr agent wait <agent-name> --timeout 540000` while it is still working,
     repeating as needed.

4. Read the report:

   ```bash
   herdr agent read <agent-name> --source recent-unwrapped --lines 400
   ```

   If the start of the report is cut off, read again with more lines.

5. Once the full report is read, close the pane this skill created:

   ```bash
   herdr pane close <pane-id>
   ```

   Keep the pane open instead if the report could not be read in full, or the
   agent is `blocked` or still working, and tell the user why.

## 4. Headless fallback

Use this path when no caller pane resolves (see section 3). Run it in the background when the agent
supports it, because reviews can take several minutes:

```bash
report="$(mktemp "${TMPDIR:-/tmp}/codex-review.XXXXXX")"
codex exec --sandbox read-only -C "$PWD" -o "$report" - < "$prompt_file"
```

Then read `$report`. If it is empty, report Codex's exit status and stderr.

## 5. Relay

Present Codex's report verbatim under this header:

```markdown
# Codex Review: <target>

Reviewer: Codex (<herdr pane, closed | headless>)
Mode: <WIP / branch / commit>
Base: <sha>  HEAD: <sha>

<Codex report, unchanged>
```

Do not re-rank, merge, or drop findings. If a finding contradicts something
you can check quickly, add a short `Caller notes` section after the report,
labeled as your own and written in Traditional Chinese.

## Guardrails

- Read-only. A review request never authorizes fixes.
- Do not close panes, tabs, or workspaces this skill did not create.
- Never run `herdr server stop`.
- Do not answer Codex approval or question prompts on the user's behalf.
