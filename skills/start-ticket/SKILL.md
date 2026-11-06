---
name: start-ticket
description: Safely create and switch to a categorized ticket branch from the repository's up-to-date default branch. Use when the user provides a ticket key and title and wants a ready development branch without fetching or validating Jira.
---

# Start Ticket

Create a clean development branch from the repository's up-to-date default
branch. Do not call Jira, Atlassian, or any other ticket service. Treat the
ticket key and title supplied by the user as branch-naming input only.

## Workflow

### 1. Collect branch inputs

1. Confirm the current directory is a Git worktree and record the current
   branch.
2. Read the ticket key and title from the request. Ask for either value only
   when it is absent. Do not fetch the ticket to fill either value.
3. Ask for a prefix from `feat`, `fix`, `hotfix`, `chore`, or `refactor` unless
   the user already supplied one.
4. Build `{prefix}/{ISSUE-KEY}-{kebab-title}`. Normalize
   `SPRTPLTFRM-12345` to `SPF-12345`, remove unsafe characters and repeated
   hyphens, and keep the name reasonably short.

### 2. Inspect repository safety

1. Run `git status --short`. If the worktree is dirty, stop and offer to let
   the user commit or stash it; do not stash automatically.
2. Detect the default branch from `refs/remotes/origin/HEAD`. If that reference
   is missing, inspect remote metadata and local `main`/`master` branches. Ask
   when the result is ambiguous; do not assume `master`.
3. Check both local and remote branch names. If the generated branch exists,
   stop and offer to switch to it or choose another name; never overwrite it.

### 3. Update the base branch safely

If the default branch is checked out in another worktree (`git worktree list`
shows it at a different path), as in a worktree an ADE such as Orca created,
do not switch to it; git refuses. Use this path instead and skip to step 5:

1. Run `git fetch origin <default-branch>`.
2. If the current branch has no commits of its own
   (`git rev-list --count origin/<default-branch>..HEAD` is `0`), it is the
   placeholder the ADE created. Show the rename and ask before running it:

   ```bash
   git branch -m <branch-name>
   git merge --ff-only origin/<default-branch>
   ```

   If the current branch has a remote upstream, also run
   `git branch --unset-upstream` so the renamed branch does not track the old
   remote name.
3. Otherwise, leave the current branch intact and create the new branch from
   the fetched base, without tracking it:

   ```bash
   git switch -c <branch-name> --no-track origin/<default-branch>
   ```

Otherwise, show the current branch, detected default branch, and proposed new
branch. If not already on the default branch, ask before switching and stop if
the user declines.

Fetch the default branch. Switch to the local branch when it exists; otherwise
create it as a tracking branch from `origin/<default-branch>`. Update an
existing local branch only with a fast-forward:

```bash
git fetch origin <default-branch>
git switch <default-branch>
git merge --ff-only origin/<default-branch>
```

If the branch has diverged, stop without rebasing or resetting. Report the
state and leave existing commits intact.

### 4. Create the branch

Create and switch to the validated branch:

```bash
git switch -c <branch-name>
```

### 5. Report

Return the user-provided ticket key and title, new branch, detected base
branch, whether the branch was renamed or created, and final worktree status. The repository must finish on the new
branch with the same clean worktree state it had before the workflow.

## Invariants

- Never fetch, read, validate, or update Jira tickets, specifications, or
  blockers.
- Never change branches with a dirty worktree without a separate user decision.
- Never use destructive reset, force, or branch-overwrite operations.
- Never claim the branch is ready until its base is verified and the new branch
  is active.
