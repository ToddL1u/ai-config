---
name: ship
description: "One-command release pipeline: run tests → review sweep → CHANGELOG → create PR. Takes code from 'done' to 'PR ready' in a single invocation. Triggers on: ship, release, ship it, create release, ready to ship."
---

# Ship — Release Pipeline

Single command to go from "code done" to "PR ready". Chains testing, review, and PR creation.

## Prerequisites
- All code changes committed to a feature branch (not main/develop)
- Tests should be passing (this skill will verify)

## Workflow

### Step 1 — Pre-flight checks
```bash
# Verify we're on a feature branch
git branch --show-current

# Verify clean working tree
git status --porcelain  # warn if uncommitted changes
```

Resolve `BASE_BRANCH` from an existing PR, an explicit user value, or
`refs/remotes/origin/HEAD`; ask if ambiguous. If the current branch equals the
base or is a protected integration branch such as `main`, `master`, `develop`,
or `uat`, stop: "Create a feature branch first."

If uncommitted changes exist, invoke the `commit-chunk` skill. Follow its full
interactive workflow: present the complete plan, review every chunk, and wait
for explicit approvals before committing. Do not proceed to Step 2 until the
working tree is clean.

### Step 2 — Run tests
Detect the test runner from the project:
- `package.json` with vitest/jest → `npm run test` or `npx vitest run`
- `pytest.ini` / `pyproject.toml` → `pytest`
- If no test config found, ask the user what command to run

If tests fail, stop and report failures. Do not continue.

### Step 3 — Review sweep
Invoke `review-sweep` in its default read-only mode.

- If findings require changes, show them and ask whether to invoke
  `review-sweep --fix`. Do not modify code merely because `ship` ran a review.
- If authorized fixes are applied, run the relevant tests again and use
  `commit-chunk` to review and commit those changes.
- If judgment-required items remain, wait for resolution before continuing.
- If verdict is NEEDS WORK with critical blockers, stop.

### Step 4 — CHANGELOG
If a `CHANGELOG.md` exists:
- Read existing format and follow it
- Generate entry from commits since base branch: `git log origin/<base>..HEAD --oneline`
- Prepend new entry under `## [version] - YYYY-MM-DD` (or `## Unreleased` if no version bump)
- Categorize: Added, Changed, Fixed, Removed

If no CHANGELOG exists, skip.

### Step 5 — Commit release artifacts
If Step 4 produced changes:
```
git add CHANGELOG.md
git commit -m "chore: update CHANGELOG"
```

### Step 6 — Create PR
Invoke `pr --create` and pass the same resolved base branch used for the
CHANGELOG range. The `pr` skill must use that base consistently for its diff and
the created PR. Do not depend on numbered steps or clipboard behavior from
another skill version.

If PR creation fails, report the error and return the generated body so the user
can retry. Do not claim that a PR was created and do not silently change bases.

### Step 7 — Report
```markdown
## Ship Report

- Branch: feature/xxx → <base>
- Tests: ✅ passed
- Review: ✅ clean (N authorized fixes applied)
- CHANGELOG: updated
- PR: <url>
```

## Notes
- Each step depends on the previous — stop on any failure
- Never force-push or push to main directly
- If any step fails, report what succeeded and what blocked
