---
name: implement-board
description: Implement a to-tickets board's Ready cards in parallel, one fresh worker per card in its own worktree, merging each into the current feature branch.
disable-model-invocation: true
---

# Implement Board

Build every card a feature board can reach, in parallel where the dependency
graph allows. You are the **coordinator**: you dispatch cards, merge finished
ones, and own the board. **Workers** each build one card with `dev-flow` in
their own worktree and never edit the board.

Arguments: `<feature-slug> [cap]`. `cap` is the most workers running at once;
default 3.

## 1. Check the starting point

1. Take the slug from the arguments; otherwise list `.ai/boards/` and ask.
2. The working tree is clean. The current branch is the **integration
   branch**; when it is the default branch (from `refs/remotes/origin/HEAD`,
   else `main` or `master`), ask before integrating there.
3. Read `.ai/boards/<feature>.md`. When its `Last verified` commit differs from
   `HEAD`, stop and ask the user to run `/to-tickets <feature>` to sync it
   first.
4. Record `HEAD` as the **review fixed point**.

## 2. Pick the runtime

Take the first that applies:

1. **Orca**: `ORCA_TERMINAL_HANDLE` is set and `orca` is on `PATH`. Follow
   [references/orca.md](references/orca.md) for dispatching and waking.
2. **Subagents**: the agent can run subagents in isolated git worktrees. Run
   them in the background, at most `cap` at once, each on a new branch from the
   integration branch tip.
3. **Sequential**: build each card in this session with the `dev-flow` skill,
   one at a time, on the integration branch.

## 3. Dispatch the frontier

The **frontier** is every card whose status is `Ready` and whose dependencies
are all `Done`. Start frontier cards until `cap` workers are running:

- Build each worker's task from
  [references/worker-spec.md](references/worker-spec.md), filled with the
  card's full text and source references from the board.
- Set the card's status to `In progress` on the board.

## 4. Handle each finished worker

- **SUCCESS**: on the integration branch, run
  `git merge --no-ff <card-branch>`, then the repository's own check commands.
  When both pass, set the card to `Done`.
- **Merge conflict**: the integration branch moved after the worker synced.
  Send the card back to the same worker to merge the new tip and recheck. A
  conflict that needs a product decision marks the card `Blocked` and goes to
  the user.
- **BLOCKED, STALLED, or EXHAUSTED**: set the card to `Blocked` with the
  worker's reason, and keep its worker and worktree open for the user.
- **Failed checks after merge**: revert the merge commit with
  `git revert -m 1 <merge-sha>`, set the card to `Blocked` with the failing
  output, and keep its worker open.

After each result, refresh the frontier and dispatch again. Continue until no
worker is running and the frontier is empty.

## 5. Review the whole branch

Run the `review-sweep` skill on the integration branch from the review fixed
point, with the board's source references as the authoritative sources. When it
finds issues, give all of them to one fresh worker built from the worker spec,
then merge its branch as in step 4.

## 6. Report

- Each card: outcome and merge commit, in topological order.
- Each `Blocked` card: the reason and the worker still open for it.
- The review verdict and what was fixed.
- Every worktree this run created, for the user to remove in their tool. This
  skill removes no worktree, branch, or file.

## Rules

- Only the coordinator writes `.ai/boards/<feature>.md`; refresh its
  `Last verified` line after the last merge.
- Workers take everything they need from their task: their worktree has no
  `.ai/` directory.
- `.ai/` files stay out of every commit.
