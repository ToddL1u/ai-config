---
name: start-ticket
description: Fetch a Jira ticket, verify the repository state, safely update the repository's default branch, and create a ticket branch. Use when the user asks to start work from a Jira URL or issue key, create a branch for a ticket, or run start-ticket.
---

# Start Ticket

Fetch the ticket before changing Git state, then create a branch from an
up-to-date default branch.

## Workflow

### 1. Validate inputs and capabilities

1. Confirm the current directory is a Git worktree and record the current branch.
2. Parse a Jira URL or issue key from the request. Ask for one only when absent.
3. Verify an authenticated Jira or Atlassian capability is available.
4. Fetch the issue before switching branches or pulling anything. If access
   fails, stop without changing Git state.

Extract:

- issue key;
- original title and a version with a leading `FE - ` removed;
- description and acceptance criteria summarized into 3–5 bullets.

### 2. Inspect repository safety

Run `git status --short`. If the worktree is dirty, stop and offer to let the
user commit or stash it; do not stash automatically.

Detect the default branch from `refs/remotes/origin/HEAD`. If that reference is
missing, inspect remote metadata and local `main`/`master` branches. Ask when
the result is ambiguous. Do not assume `master`.

### 3. Confirm the branch operation

Show:

- current branch;
- detected default branch;
- ticket key and cleaned title.

If not already on the default branch, ask before switching. Stop if the user
declines.

### 4. Update the default branch safely

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

### 5. Choose and validate the new branch

Ask for a prefix from `feat`, `fix`, `hotfix`, `chore`, or `refactor` unless the
user already supplied one.

Build `{prefix}/{ISSUE-KEY}-{kebab-title}`. For company convention, normalize
`SPRTPLTFRM-12345` to `SPF-12345`. Remove unsafe characters and repeated
hyphens, and keep the name reasonably short.

Check both local and remote branch names before creation. If the name exists,
stop and offer to switch to it or choose another name; never overwrite it.

Create the branch with:

```bash
git switch -c <branch-name>
```

### 6. Report

Return the ticket key and title, new branch, detected base branch, acceptance
criteria, and any useful ticket links. The repository must finish on the new
branch with the same clean worktree state it had before the workflow.

## Invariants

- Fetch Jira before any branch switch or pull.
- Never change branches with a dirty worktree without a separate user decision.
- Never use destructive reset, force, or branch-overwrite operations.
- Never claim the branch is ready until its base is verified and the new branch
  is active.
