# Feature Implementation Loop

## Goal

Deliver the requested feature with objective evidence that its acceptance criteria pass and unrelated behavior was preserved.

## Loop

1. **Inspect** — read the request, repository guidance, relevant code, tests, and similar implementations.
2. **Specify** — for a raw request, write acceptance criteria, scope,
   constraints, and verification commands. For an approved spec, import those
   elements without rewriting them. For an approved ticket, import its
   acceptance criteria and its parent spec's boundaries without rewriting
   either. Surface material ambiguity or contradiction before coding.
3. **Plan** — for a raw request or approved spec, choose the smallest
   independently verifiable implementation slice. For an approved ticket, use
   that ticket as the slice and proceed to implementation without decomposing
   it again.
4. **Implement** — for executable behavior, use `tdd` at the approved seam:
   one failing test, green, then bounded behavior-preserving cleanup. Do not
   write another new failing test until the current one is green. For a
   recorded TDD exception, make the smallest direct change and use
   deterministic verification.
5. **Verify** — run the focused test throughout each TDD cycle, the affected
   test file or package suite and type-checking at slice boundaries, then the
   repository's required broader checks at completion. If the full suite is
   impractical, use the documented scoped alternative and report what was not
   run.
6. **Review** — invoke `review-sweep` in WIP mode with the fixed point recorded
   before implementation and the authoritative sources recorded during
   specification. If either isolated axis reports a blocker, return those
   findings to the Implement step and repeat verification and review from the
   same fixed point. Do not ask the review layer to edit.
7. **Record** — update `.ai/feature-progress.md` with evidence, decisions, failed approaches, blockers, and the next slice.
8. **Decide** — repeat from step 3, or enter a terminal state.

## Limits

- Try at most three distinct repairs for the same unchanged failure.
- Stop before expanding scope across a public API, database schema, security boundary, or more files than the request reasonably implies.
- Stop when requirements conflict or an irreversible/external action needs approval.
- Prefer one coherent slice per iteration; do not accumulate unrelated fixes.

## Terminal states

- `SUCCESS` — every acceptance criterion passes, required checks pass, and the
  final review verdict is `READY`. A standards-only exception is valid only
  when the user explicitly approved it for maintenance work.
- `BLOCKED` — a product decision, missing access/input, scope expansion, or explicit approval is required.
- `STALLED` — three distinct repairs produced no measurable progress on the same failure.
- `EXHAUSTED` — a user-provided time, iteration, token, or cost budget was reached.

Do not call a task successful because the implementation merely looks complete. Record the commands or observations that prove it.
