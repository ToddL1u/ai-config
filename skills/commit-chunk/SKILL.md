---
name: commit-chunk
description: Analyze uncommitted Git changes, divide them into buildable sequential commits, review every proposed chunk with the user, and create the approved commits. Use when the user asks to split changes, organize commits, prepare a clean PR history, or commit work in logical chunks.
---

# Commit Chunk

Split uncommitted changes into a clean, reviewable commit sequence without
breaking intermediate repository states.

## Workflow

### 1. Inventory changes

Inspect without modifying the working tree:

```bash
git status --short
git diff --name-only
git diff --cached --name-only
git diff
git diff --cached
```

Include tracked, staged, and untracked files in the inventory. Read untracked
files directly because they do not appear in a normal diff.

### 2. Propose buildable chunks

Group files or partial diffs into the smallest coherent sequence. Use these
categories as guidance, not rigid boundaries:

| Order | Chunk | Typical contents |
|---|---|---|
| 1 | Interface | Types, interfaces, enums, schemas, contracts |
| 2 | Core integration | Main feature code, routes, stores, API modules |
| 3 | Helpers | Utilities, composables, filters, shared logic |
| 4 | Tests | Unit, integration, and end-to-end tests |

Every proposed commit must leave the repository buildable and internally
consistent. Merge categories when files are tightly coupled. If one file mixes
independent concerns, propose a partial-file chunk only when it can be staged
safely and reviewed clearly.

Present a table containing the proposed order, purpose, and files. Wait for the
user to approve or adjust the complete plan before staging anything.

### 3. Review every chunk

After plan approval, show the relevant diff for each chunk in sequence. For
untracked files, show the complete relevant content. Ask the user to approve
each chunk and record all approvals before committing.

Do not stage or commit during this review phase. Respect requests to move,
split, merge, or skip changes and show an updated plan when the sequence changes.

### 4. Determine commit messages

Extract a ticket identifier such as `SPROM-125` or `OE-427` from the current
branch when present. If no identifier can be determined, ask the user before
committing.

Use this format:

```text
{type}: {emoji} {ticket} {imperative subject}
```

| Type | Emoji | Use |
|---|---|---|
| `feat` | 🎸 | New feature |
| `fix` | 🐛 | Bug fix |
| `refactor` | 💡 | Behavior-preserving code restructuring |
| `style` | 💄 | Formatting or markup-only change |
| `test` | 💍 | Test additions or changes |
| `chore` | 🤖 | Build or auxiliary tooling |
| `docs` | ✏️ | Documentation-only change |
| `perf` | ⚡ | Performance improvement |
| `ci` | 🎡 | Continuous-integration change |

Keep the header at most 50 characters when practical. Use imperative,
present-tense subjects without a trailing period. Wrap optional body text at 72
characters and explain motivation. Prefix breaking-change notes with
`BREAKING CHANGE:`. Do not add generated co-author trailers.

### 5. Commit the approved sequence

Only after every chunk is approved:

1. Stage exactly the approved files or hunks for the first chunk.
2. Verify the staged diff matches the approved chunk.
3. Commit with the approved message.
4. Repeat without pausing for chunks already approved.
5. Stop on any staging, verification, hook, or commit failure and report the
   exact remaining state; do not skip ahead.

Use explicit paths when staging. Never use destructive Git operations to force
the working tree into the proposed shape.

### 6. Report

Show the commits created in order with short hashes and subjects. Report any
approved changes that remain uncommitted and the reason.

## Invariants

- Never commit before the full plan and every chunk have been approved.
- Keep review and commit phases separate.
- Never include unapproved changes in a commit.
- Preserve a buildable, non-broken repository after every commit.
- Do not push unless the user separately requests it.
