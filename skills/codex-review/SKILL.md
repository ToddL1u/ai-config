---
name: codex-review
description: Hand a read-only code review to Codex running as an interactive agent in a separate Herdr pane, so the user can watch and ask follow-ups there; fall back to headless codex exec outside Herdr. Use when the user asks for a codex review, a review by Codex, a second-model review, or a review in a Herdr pane.
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

Report in this format:

## Findings
- [Blocker|High|Medium|Low|Question] <issue and impact> — <file>:<line> — <how to verify>

## Side effects to verify
## Questions / assumptions
## Tests to add or run

## Verdict
READY or NEEDS WORK, with one line of reasoning.
```

## 3. Herdr path

Use this path only when `test "${HERDR_ENV:-}" = 1` passes. Herdr commands
return JSON; read IDs from responses rather than guessing them.

1. Pick the split direction from the caller pane: `right` when wide, `down`
   when narrow or tall.

   ```bash
   herdr pane layout --pane "$HERDR_PANE_ID"
   herdr pane split --current --direction right --cwd "$PWD" --no-focus
   ```

   Read the new pane ID from `.result.pane.pane_id`.

2. Start Codex read-only with no approval prompts. Use the name
   `codex-review`; if it is taken, use `codex-review-<short-head-sha>`.

   ```bash
   herdr agent start codex-review --kind codex --pane <pane-id> -- --sandbox read-only --ask-for-approval never
   ```

   If the start returns `agent_not_ready`, wait for it to settle with
   `herdr agent wait codex-review --timeout 60000` before prompting.

3. Submit the prompt and wait:

   ```bash
   herdr agent prompt codex-review "<prompt>" --wait --timeout 900000
   ```

   - `blocked`: run `herdr agent read codex-review --source recent-unwrapped --lines 80`,
     show the user the question, and do not answer it for them.
   - `timeout` or `agent_prompt_stalled`: do not resend. Check
     `herdr agent get codex-review` and `agent read` first; keep waiting with
     `herdr agent wait codex-review --timeout 900000` if it is still working.

4. Read the report:

   ```bash
   herdr agent read codex-review --source recent-unwrapped --lines 400
   ```

   If the start of the report is cut off, read again with more lines.

5. Leave the pane and agent running so the user can follow up. Close only what
   this skill created, and only when the user asks.

## 4. Headless fallback

Use this path when not inside Herdr. Run it in the background when the agent
supports it, because reviews can take several minutes:

```bash
report="$(mktemp -t codex-review).md"
codex exec --sandbox read-only -C "$PWD" -o "$report" "<prompt>"
```

Then read `$report`. If it is empty, report Codex's exit status and stderr.

## 5. Relay

Present Codex's report verbatim under this header:

```markdown
# Codex Review: <target>

Reviewer: Codex (<herdr pane <pane-id> | headless>)
Mode: <WIP / branch / commit>
Base: <sha>  HEAD: <sha>

<Codex report, unchanged>
```

Do not re-rank, merge, or drop findings. If a finding contradicts something
you can check quickly, add a short `Caller notes` section after the report,
labeled as your own. Point the user to the pane for follow-up questions.

## Guardrails

- Read-only. A review request never authorizes fixes.
- Do not close panes, tabs, or workspaces this skill did not create.
- Never run `herdr server stop`.
- Do not answer Codex approval or question prompts on the user's behalf.
