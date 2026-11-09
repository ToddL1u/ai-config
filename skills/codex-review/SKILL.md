---
name: codex-review
description: Codex review: hand a read-only code review to Codex in a separate Orca or Herdr pane the user can watch, or headless codex exec outside both, and relay its report. Use when the user asks for a Codex or second-model review.
---

# Codex Review

Codex performs the whole review. The calling agent resolves the target,
starts Codex, and relays its report. The review is read-only: it changes no
files, stages nothing, and commits nothing.

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

## 3. Choose where Codex runs

Take the first that applies:

1. **Orca**: `ORCA_TERMINAL_HANDLE` is set and `orca` is on `PATH`. Follow
   [references/orca.md](references/orca.md).
2. **Herdr**: `HERDR_ENV` is `1`, or `herdr` is on `PATH` and
   `herdr status server` reports `status: running`. Follow
   [references/herdr.md](references/herdr.md); when it finds no caller pane,
   use the headless path.
3. **Headless**: everything else. Run it in the background when the agent
   supports it, because reviews take several minutes:

   ```bash
   report="$(mktemp "${TMPDIR:-/tmp}/codex-review.XXXXXX")"
   codex exec --sandbox read-only -C "$PWD" -o "$report" - < "$prompt_file"
   ```

   Then read `$report`. When it is empty, report Codex's exit status and
   stderr.

## 4. Relay

Present Codex's report verbatim under this header:

```markdown
# Codex Review: <target>

Reviewer: Codex (<orca pane, closed | herdr pane, closed | headless>)
Mode: <WIP / branch / commit>
Base: <sha>  HEAD: <sha>

<Codex report, unchanged>
```

Keep every finding as Codex ranked it. When a finding contradicts something
you can check quickly, add a short `Caller notes` section after the report,
labeled as your own and written in Traditional Chinese.

## Guardrails

- Read-only: a review request authorizes no fixes.
- Codex's approval prompts, startup dialogs, and questions belong to the user:
  show them verbatim and wait for the user to handle them.
- Keep each wait at or under 540000 ms so it ends inside the 10-minute
  foreground command limit, and repeat it while Codex is still working.
- Close only the pane this skill opened, and only after the full report is
  read. When the report is incomplete or Codex is blocked or still working,
  leave the pane open and tell the user why.
- Leave the multiplexer itself running: no `herdr server stop`, no
  `orca terminal close --worktree ... --all`.
