# Worker spec template

Fill every `{…}` from the board, then hand the result to the worker as its
task.

```text
Implement one board card in this worktree.

Use the dev-flow skill ($dev-flow in Codex) with the card below as its input.
The card is your whole scope: its outcome, acceptance criteria, scope, and
non-goals. Its source references are authoritative; re-open each one before
editing.

Feature: {feature slug}
Card: {card key} — {card title}
Integration branch: {integration branch}

--- card ---
{the card's full text from the board}
--- sources ---
{each source reference: PRD section, Figma frame or node, spec @ version, ticket}
---

The coordinator owns the feature board; this worktree has no .ai/ board, and
board status updates are not part of your task.

Before you report done:
1. Commit your work on your own branch.
2. Merge the latest {integration branch} into your branch, resolve any
   conflicts, and rerun the repository's checks. A conflict that needs a
   product decision is a BLOCKED outcome; describe it instead of guessing.
3. Report: the dev-flow terminal state (SUCCESS, BLOCKED, STALLED, or
   EXHAUSTED), your branch name, its HEAD SHA, and the verification evidence.
```
