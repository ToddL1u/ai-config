---
name: tdd
description: Implement executable behavior through focused red-green-bounded-cleanup cycles at an approved public testing seam. Use when building or fixing behavior test-first, when dev-flow has an approved test seam, or when the user asks for TDD or red-green-refactor.
---

# Test-Driven Development

Build one behavioral tracer bullet at a time. Tests must prove observable
behavior through a stable public seam, not mirror the implementation.

Read [references/good-tests.md](references/good-tests.md) and
[references/mocking.md](references/mocking.md) before the first cycle.

## Establish the seam

Reuse the testing seam approved by the active spec or ticket without asking
again. Confirm that the seam still exists and can observe the required
behavior.

For a raw request with no approved seam, return a needs-seam handoff to
`test-impact` or the caller. Do not invent a private seam during implementation.

If repository evidence contradicts an approved seam, stop and report the
conflict. Do not silently replace it.

## Recognize a TDD exception

Do not create a fake test for documentation-only, metadata-only, generated
artifact, or other work with no meaningful executable behavior. Return:

- why a failing behavioral test would add no value;
- the deterministic verification the caller should use instead.

Do not implement the exception inside this skill.

## Run one cycle

### 1. Red

Write one focused test for the smallest missing behavior at one approved seam.
Use an independent expected value from the spec, a worked example, or a known
contract.

Do not write a second new failing test while the current test is red. Bring one
test to green before introducing the next missing behavior.

Run the narrowest command that exercises the test. Confirm that it fails for
the expected missing behavior, not because of syntax, setup, imports, fixtures,
or infrastructure.

If an existing focused test already fails for the required behavior, use it as
the red state instead of adding a duplicate. If a new test passes before the
change, revise it; it does not prove the behavior is missing.

### 2. Green

Write only enough production code to make that test pass. Do not anticipate
later criteria, generalize for hypothetical callers, or implement another
slice.

Run the same focused command until it passes. Follow the caller's bounded
repair limit; repeated unchanged failure is not permission to broaden scope.

### 3. Bounded cleanup

After green, allow only behavior-preserving cleanup directly caused by the
slice. Do not add new behavior, speculative abstractions, or a wide refactor.
Move substantial refactoring to a separately approved ticket.

Rerun the focused test after cleanup. Revert the cleanup if it breaks green and
cannot be repaired without expanding scope.

### 4. Record

Record:

- seam and behavior;
- red command and expected failure;
- green command and passing result;
- cleanup performed, or `None`.

Repeat for the next behavior only after the current cycle is green.

## Verify the slice

After its cycles:

1. Run the affected test file or package suite.
2. Run type-checking or the repository's equivalent when available.
3. Return evidence to the caller for broader completion checks.

The caller owns the final required suite and review. Report anything not run
and why.

Do not commit, publish, invoke review, or expand the approved ticket.

Adapted from Matt Pocock's
[tdd](https://github.com/mattpocock/skills/tree/main/skills/engineering/tdd)
skill.
