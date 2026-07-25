---
name: review-sweep
description: Run a read-only pre-landing review through independent specification and engineering-standards axes. Use for review sweep, regression check, final review, or pre-PR review of either uncommitted work in progress or a clean feature branch.
---

# Review Sweep

Freeze one review target, run `spec-review` and `standards-review` independently,
then report their findings without merging their judgments.

The entire review layer is read-only. A request to review never authorizes
edits, fixes, commits, or requirement changes.

## Resolve the target

Use one mode:

- **WIP mode** — require the baseline commit recorded before implementation.
  Review all committed, staged, unstaged, and untracked changes since that
  fixed point.
- **Branch mode** — require a clean working tree and a resolved base branch.
  Set the fixed point to `git merge-base <base> HEAD` and review the complete
  branch through `HEAD`.

For direct invocation, recommend WIP mode from the current `HEAD` when the tree
is dirty, or branch mode on a clean feature branch. If changes predate the
current session, the base is ambiguous, or either choice could omit work, ask
for the fixed point.

## Resolve authoritative sources

Use this order:

1. approved child ticket and parent spec supplied by `dev-flow`;
2. an explicit path, URL, issue, or spec;
3. raw-request acceptance criteria recorded by `dev-flow`;
4. an issue or spec explicitly referenced by the PR.

Never infer requirements from code, commits, or a branch name. If no
authoritative source exists, standards review may still run, but spec review
must report `NOT RUN — no authoritative source`.

## Freeze the bundle

Before invoking reviewers, capture:

- mode, fixed-point commit, target `HEAD`, and resolved base when applicable;
- exact diff from the fixed point, including staged and unstaged changes;
- the path and complete contents of every untracked file;
- changed-file and commit lists;
- exact authoritative requirement sources and stable references or versions;
- applicable repository instruction and standards sources.

Serialize and fingerprint the complete frozen bundle, including code payloads,
lists, requirement sources, standards sources, and their references or
versions. After both reviews, recapture that complete bundle, recompute its
fingerprint, and verify the target `HEAD` is unchanged. If either value differs,
discard the results and freeze a new bundle. Do not rely on working-tree status
alone because content can change while its status label remains the same.

## Run isolated axes

When isolated subagents are available, invoke `spec-review` and
`standards-review` in parallel. Give each reviewer the same frozen bundle and
only its own skill instructions. Do not expose either reviewer's analysis or
findings to the other.

If isolated reviewers are unavailable, run the axes sequentially with fresh
analysis and label the result `Reduced isolation: sequential fallback`.

Do not ask either reviewer to fix findings. Do not let one axis change the
other's severity.

## Aggregate

Present both reports side by side without deduplicating, merging, reranking, or
changing severity.

Set the overall verdict in this order:

- `NEEDS WORK` if either axis has a blocking finding;
- otherwise, if the spec axis did not run, use `INCOMPLETE`;
- otherwise, use `READY`.

For maintenance work, the user may explicitly approve standards-only review.
Record that exception; when the spec axis did not run and standards has no
blocker, replace `INCOMPLETE` with `READY — standards-only exception`.

```markdown
# Review Sweep: <target>

Fixed point: <commit>
Mode: <WIP / branch>
Isolation: <parallel / reduced sequential fallback>

<complete Spec Review report>

<complete Standards Review report>

## Overall Verdict
<READY / NEEDS WORK / INCOMPLETE / READY — standards-only exception>
<blocking summary or exception rationale>
```

After `NEEDS WORK`, return findings to the implementation/TDD loop. A later
review must freeze the same fixed point again so corrections remain in scope.
