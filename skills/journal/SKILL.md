---
name: journal
description: Generate a dated project journal entry from git history and optional user notes. Use when the user asks to record work, create a development journal, or summarize a branch session.
---

# Journal Skill

Generate a dated project journal entry summarizing work done on the current branch.

## Steps

1. **Gather context automatically:**
   - Current branch: `git branch --show-current`
   - Recent commits on branch (not on base): `git log master..HEAD --oneline`
   - Changed files: `git diff --stat master...HEAD`
   - Extract ticket ID from branch name (e.g., `SPROM-125` from `feat/SPROM-125-...`) using the pattern: uppercase letters + hyphen + digits

2. **Ask the user** (optional): any extra notes, decisions, or open items to include.

3. **Generate the journal entry** in the local project's `.ai/journal/`
   directory. For reads, check `.ai/journal/` first, then the legacy
   `.claude/journal/`, `.codex/journal/`, and `.Codex/journal/` directories.
   Write new entries only to `.ai/journal/`.
   - **Naming:** `YYYY-MM-DD-{branch-slug}.md` where branch-slug is the branch name with `feat/` or `fix/` prefix removed and `/` replaced with `-`
   - **If an entry for today + branch already exists**, append a new `---` section to it rather than overwriting

4. **Entry format:**

```markdown
# YYYY-MM-DD — TICKET: Short description

**Branch:** `branch-name`
**Ticket:** TICKET-ID

## Summary
- Bullet points of what was done

## Commits
- `sha` — message (one per line)

## Files Changed
- List of files from git diff stat

## Decisions
- Key decisions made (if any)

## Open Items
- Anything left to do (if any)
```

## Rules
- Keep entries concise — bullet points, not paragraphs
- Only include Decisions/Open Items sections if there's content for them
- Derive as much as possible from git data; don't ask the user to repeat what git already knows
