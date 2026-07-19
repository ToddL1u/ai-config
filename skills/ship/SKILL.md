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
git branch --show-current  # must NOT be main or develop

# Verify clean working tree
git status --porcelain  # warn if uncommitted changes
```

If on main/develop, stop: "Create a feature branch first."
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
Invoke the `review-sweep` skill for the full two-pass Fix-First review.

- If AUTO-FIX items were applied, create a commit: `fix: auto-fix review findings`
- If ASK items remain, present them to the user. Wait for resolution before continuing.
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
Invoke the `pr` skill using the Skill tool to auto-fill the PR template. After the PR content is generated, you MUST explicitly run the `pbcopy` clipboard step (Step 9 of the pr skill) — do not skip it. Confirm to the user that the template has been copied to their clipboard.

### Step 7 — Report
```markdown
## Ship Report

- Branch: feature/xxx → main
- Tests: ✅ passed
- Review: ✅ clean (N auto-fixes applied)
- CHANGELOG: updated
- PR: <url>
```

## Notes
- Each step depends on the previous — stop on any failure
- Never force-push or push to main directly
- If any step fails, report what succeeded and what blocked
