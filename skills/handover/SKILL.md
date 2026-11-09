---
name: handover
description: Save a structured session handover brief, or resume from one.
disable-model-invocation: true
---

# Handover

Preserve and restore working context across agent sessions through one rolling
snapshot at `.ai/handover.md` in the repository root.

Pick the mode from the argument:

- `save`, `save <focus>`, or no argument → **Save**. Any text after `save`
  names what the next session will work on.
- `load` → **Load**.

## Save

1. **Read the repository state.** Detect the default branch from
   `refs/remotes/origin/HEAD` (fall back to a local `main` or `master`), then
   run:

   ```bash
   git branch --show-current
   git status --short
   git log --oneline <default-branch>..HEAD
   ```

   Take the ticket ID from the branch name (`UPPERCASE-123`) when present.
   Outside a git repository, skip these commands and build the brief from the
   session context alone.

2. **Collect the session context** from the conversation, the agent's plan or
   task tracker when one exists, and artifacts such as `.ai/feature-progress.md`,
   `.ai/current-card.md`, specs, and boards.

3. **Fill the gaps.** For each brief section the context leaves empty or vague
   (in progress, blocked, non-obvious decisions, gotchas), ask the user in one
   batched message. Ask nothing when the context already answers every
   section.

4. **Write the brief** to `.ai/handover.md` from
   [assets/brief.md](assets/brief.md), creating `.ai/` when needed and
   overwriting any existing brief: it is a snapshot, not a log.
   - Reference commits, diffs, specs, tickets, and files by SHA, path, or URL;
     the brief carries only what those artifacts do not.
   - Make "Pick up here" and "Next steps" concrete: file, function, change.
   - Tailor the brief to the save argument's focus when one was given.
   - Replace secrets, tokens, passwords, and personal data with
     `[redacted]`.
   - Drop sections with no content.

5. **Confirm**: report the path and that `/handover load` resumes from it.

## Load

1. Read `.ai/handover.md`. When it is missing, tell the user that no brief
   exists and that `/handover save` creates one, then stop.

2. Run `git branch --show-current` and `git status --short`. When the branch
   differs from the brief's, tell the user before continuing.

3. Present the brief's summary, "Pick up here", next steps, blocked items, and
   gotchas, then ask whether to start on the first step or review first.

Keep `.ai/handover.md` local scratch state: leave it unstaged and uncommitted.
