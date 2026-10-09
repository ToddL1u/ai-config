---
name: ship
description: "Ship the current feature branch to GitHub: lint, then push. Never merges, never switches branches, never creates a PR. Triggers on: ship, ship it, ship the branch, push the branch."
---

# Ship — lint and push, nothing else

Gets the current feature branch onto GitHub. That is the entire job.

## Hard limits — no exceptions, no "helpful" extras

This skill runs exactly two commands that change anything: `npm run elint` and
`git push`. It must **never**:

- `git checkout` / `git switch` to any other branch — stay on the current branch start to finish
- `git merge` anything into anything, `uat` included
- `gh pr create` or otherwise open a PR
- `git commit`, `git stash`, `git rebase`, `git reset`, or any force-push

Merging to `uat` is a **separate, explicitly-invoked** `/uat-merge` run. Shipping does not
imply it, lead into it, or offer it. If the user wants it, they will say so.
Do not ask for a base branch — there isn't one; nothing is being merged.
The PR (to `pre-release-tw`) is the user's job, never mine.

## Workflow

### Step 1 — Pre-flight
```bash
git branch --show-current
git status --porcelain
```
- Current branch is `master`, `uat`, or `pre-release-tw` → stop: "Create a feature branch first."
- Dirty tree → stop and list the files. Do not commit; the user commits when they choose to.

### Step 2 — Lint
```bash
npm run elint
```
Lints only git-changed files. A real ESLint error report → stop, report it, push nothing.

Expected non-failure: on a clean tree `elint` finds no changed files and exits with
`No files matching the pattern "src/sw/"`. That means "nothing to lint" — continue.

### Step 3 — Push
```bash
git push -u origin <current-branch>
```
Never `--force`. A pre-push hook runs the unit suite; if it fails, the push is rejected —
report the failure as-is.

If the push is rejected because the remote advanced, stop and report. Do not rebase, reset,
or force anything.

### Step 4 — Report, then stop
```markdown
## Ship Report

- Branch: <branch> → pushed to origin
- Lint: <passed / nothing to lint>
- Tests (pre-push hook): <result>

Not done (by design): no merge, no PR.
```

End the turn there.
