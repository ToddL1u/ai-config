---
name: checkpoint
description: "Save, restore, or list work checkpoints. Triggers on 'checkpoint', 'save state', 'where was I', 'pick up where I left off'."
---

# Checkpoint

Three modes based on $ARGUMENTS:

## Mode: Save (no argument, or `save {title}`)

1. **Collect git state** by running:
   - `git branch --show-current`
   - `git status --short`
   - `git log --oneline -10`
   - `git diff --stat HEAD`

2. **Synthesize checkpoint markdown** with YAML frontmatter + four sections:
   - Frontmatter fields: `status` (always "in-progress"), `branch`, `timestamp` (ISO-8601), `files_modified` (list from git status output)
   - `## Summary` — 2–4 sentences: what is being worked on and the high-level goal
   - `## Decisions Made` — bullets with rationale (always include the *why*, not just the *what*)
   - `## Remaining Work` — checkbox list, prioritized, most critical first
   - `## Notes` — gotchas, failed approaches, file-specific warnings, anything a fresh agent needs to know to avoid repeating mistakes

3. **Write to two paths** inside the project (create `.ai/checkpoints/` first):
   - Timestamped copy: `.ai/checkpoints/{TIMESTAMP}-{title-slug}.md`
   - Latest: `.ai/checkpoints/latest.md` — overwrite every time
   - TIMESTAMP = `$(date +%Y-%m-%dT%H-%M-%S)`
   - title-slug = kebab-case of title arg, or "checkpoint" if no title given

4. **Confirm:** tell the user "Checkpoint saved → `.ai/checkpoints/{filename}`."

---

## Mode: Resume (`resume` argument)

1. Read `.ai/checkpoints/latest.md`. If missing, check
   `.claude/checkpoints/latest.md`, `.codex/checkpoints/latest.md`, then
   `.Codex/checkpoints/latest.md`. Read legacy content in place, but write future
   checkpoints only to `.ai/checkpoints/`.
2. Parse the frontmatter branch field; if it differs from current branch (`git branch --show-current`), warn: "This checkpoint was saved on `{saved-branch}`. You are currently on `{current-branch}`."
3. Present the checkpoint contents — Summary, Remaining Work, Notes — formatted for easy scanning
4. Ask: "Ready to continue from here?"

---

## Mode: List (`list` argument)

1. List `.ai/checkpoints/*.md` (exclude `latest.md`). If the directory is
   missing, use the first existing supported legacy checkpoint directory.
2. Read frontmatter from each file
3. Print as a markdown table: `Date | Title | Branch | Status`
4. Default: show only checkpoints matching current branch. If $ARGUMENTS contains `--all`, show all branches.

---

## Notes
- **No code changes** — this skill only reads state and writes to `.ai/checkpoints/`
- Project `.ai/` runtime state should be gitignored unless the user explicitly wants it versioned
- Be specific and opinionated in the synthesis — vague notes are useless on restore
- If not in a git repo, skip all git steps and synthesize entirely from session context
