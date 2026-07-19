# Feature Implementation Loop

## Goal

Deliver the requested feature with objective evidence that its acceptance criteria pass and unrelated behavior was preserved.

## Loop

1. **Inspect** — read the request, repository guidance, relevant code, tests, and similar implementations.
2. **Specify** — write acceptance criteria, scope, constraints, and verification commands. Surface material ambiguity before coding.
3. **Plan** — choose the smallest independently verifiable implementation slice.
4. **Implement** — make only that slice and update relevant tests.
5. **Verify** — run the narrowest useful checks, diagnose failures, and repair the cause.
6. **Review** — inspect the diff for correctness, regression risk, missing tests, and scope drift. Use `review-sweep` for the final pass.
7. **Record** — update `.ai/feature-progress.md` with evidence, decisions, failed approaches, blockers, and the next slice.
8. **Decide** — repeat from step 3, or enter a terminal state.

## Limits

- Try at most three distinct repairs for the same unchanged failure.
- Stop before expanding scope across a public API, database schema, security boundary, or more files than the request reasonably implies.
- Stop when requirements conflict or an irreversible/external action needs approval.
- Prefer one coherent slice per iteration; do not accumulate unrelated fixes.

## Terminal states

- `SUCCESS` — every acceptance criterion passes, required checks pass, and final review has no unresolved blocking finding.
- `BLOCKED` — a product decision, missing access/input, scope expansion, or explicit approval is required.
- `STALLED` — three distinct repairs produced no measurable progress on the same failure.
- `EXHAUSTED` — a user-provided time, iteration, token, or cost budget was reached.

Do not call a task successful because the implementation merely looks complete. Record the commands or observations that prove it.
