---
name: uat-merge
description: Safely merge a feature branch into UAT with explicit conflict decisions, a merge commit, confirmed push, restoration of the original branch and worktree, and optional deployment. Use when the user asks to merge into UAT or run a UAT merge.
---

# UAT Merge

Merge a source branch into `uat` without losing feature work or restoring local
changes onto the wrong branch.

## State to preserve

Before changing anything, record:

- `ORIGINAL_BRANCH` from `git branch --show-current`;
- `SOURCE_BRANCH` from the user's argument, or `ORIGINAL_BRANCH` after confirmation;
- whether this workflow created a stash;
- every conflicted file and the resolution the user approved.

Stop on a detached HEAD. Verify both `SOURCE_BRANCH` and `origin/uat` exist
before switching branches.

## Workflow

### 1. Confirm the source

If the user did not specify a source, show `ORIGINAL_BRANCH` and ask whether to
merge it into `uat`. Reject `uat` itself as the source. Do not guess another
branch name.

### 2. Preserve the original worktree

Run `git status --short`. If it is dirty, offer:

1. Create a temporary stash including untracked files with a descriptive label.
2. Stop so the user can handle the changes manually.

Only stash after explicit approval. Record the exact stash object created; do
not assume an older `stash@{0}` belongs to this workflow.

### 3. Synchronize UAT

Fetch `origin`. Switch to local `uat`, or create it from `origin/uat` when it
does not exist. Compare local and remote with:

```bash
git rev-list --left-right --count uat...origin/uat
```

If local `uat` is ahead or the branches have diverged, stop rather than pushing
unreviewed local commits. If local `uat` is behind, fast-forward it:

```bash
git merge --ff-only origin/uat
```

Stop without resetting, rebasing, or discarding anything whenever synchronization
is not a clean remote-only fast-forward. Return to the original branch and
restore this workflow's stash using the cleanup procedure.

### 4. Start the merge

Run:

```bash
git merge "<source-branch>" --no-commit --no-ff
```

If the command fails for a reason other than merge conflicts, run
`git merge --abort` when a merge is active, then perform cleanup and report the
error.

### 5. Resolve every conflict explicitly

For each path from `git diff --name-only --diff-filter=U`:

1. Read the conflict in its surrounding file and compare the base, UAT (`ours`),
   and source (`theirs`) versions.
2. Explain the behavioral difference and recommend a resolution.
3. Ask the user to choose UAT, source, or a proposed combined edit.
4. Apply only the approved resolution, verify no conflict markers remain in the
   file, and stage that path explicitly.

Never automatically prefer UAT or source. Never use `git add .` to mark all
conflicts resolved. After all decisions, verify that
`git diff --name-only --diff-filter=U` is empty and show the staged merge diff.

### 6. Create the merge commit

Create a merge commit only after the user has approved all conflict decisions.
Use:

```text
Merge branch '<source-branch>' into uat

Conflicts resolved:
- <path> (<approved resolution>)
```

Omit the conflict section when there were none. Verify the resulting commit has
two parents before proceeding.

### 7. Confirm and push

Show the source, destination, merge commit, and conflict summary. Ask for
confirmation, then run `git push origin uat`.

If the push is rejected because `origin/uat` advanced, do not automatically
rebase, reset, force-push, or retry. Report that local `uat` retains the merge
commit and must be reconciled with the new remote state. Then perform cleanup.

### 8. Restore the original context

After a successful push—or before stopping after any recoverable failure:

1. Abort an active merge when the operation is being abandoned.
2. Switch back to `ORIGINAL_BRANCH`.
3. If this workflow created a stash, apply that exact stash only now.
4. Drop it only after the apply succeeds and the restored worktree is verified.
5. If applying the stash conflicts, keep the stash, report the conflict, and do
   not claim cleanup succeeded.

Never restore a feature-branch stash while checked out on `uat`.

### 9. Offer deployment

After a successful push and successful cleanup, offer to invoke `deploy-uat`
with the detected repository and explicit country selection. Deployment is a
separate external action and still requires its own confirmation.

## Safety invariants

- Never use `git reset --hard`, force-push, or discard local changes.
- Never resolve semantic conflicts without user approval.
- Never leave the user on `uat` unless `uat` was their original branch.
- Never drop a stash until its contents have been restored successfully.
- Report the current branch, worktree state, merge state, and stash state after
  any failure.
