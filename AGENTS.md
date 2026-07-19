English version for macOS:

Do not bulk delete files or directories.
Do not use:
- `del /s`
- `rd /s`
- `rmdir /s`
- `Remove-Item -Recurse`
- `rm -rf`

When deleting files, only delete one explicitly specified file path at a time.

Correct example:
```bash
rm "/path/to/file.txt"
```

If bulk deletion of files is needed, stop the operation and ask the user to delete them manually.

## Karpathy-Inspired Coding Guidelines

These principles bias toward caution over speed for non-trivial work. Use judgment for trivial changes such as obvious typo fixes or one-line edits.

### 1. Think Before Coding

Do not make hidden assumptions or conceal uncertainty. Before editing code:

- State material assumptions explicitly.
- If the request has multiple plausible interpretations that would produce meaningfully different results, present them and ask for clarification.
- Surface inconsistencies, uncertainty, and important tradeoffs.
- Push back when the requested approach is risky, unnecessarily complex, or when a simpler approach would meet the goal.
- If confused, stop and name exactly what is unclear instead of guessing.

For straightforward, low-risk tasks, proceed with a reasonable assumption and state it briefly.

### 2. Simplicity First

Write the minimum code needed to solve the requested problem.

- Do not add unrequested features.
- Do not introduce abstractions for one-time use.
- Do not add speculative flexibility or configurability.
- Do not add handling for impossible scenarios.
- Prefer a small, direct implementation over a large generalized design.
- If the implementation is substantially longer or more complex than necessary, simplify it before presenting it.

The test: would a senior engineer consider this overcomplicated for the stated requirements? If yes, simplify it.

### 3. Surgical Changes

Touch only what is required by the user's request.

- Do not improve adjacent code, comments, naming, or formatting unless required.
- Do not refactor unrelated code.
- Match the existing project's style and conventions.
- Preserve code and comments you do not fully understand.
- Mention unrelated dead code or issues if useful, but do not change them without authorization.
- Remove imports, variables, functions, or files only when your own change made them unused.
- Do not remove pre-existing dead code unless explicitly asked.

The test: every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution

Turn requests into concrete, verifiable success criteria and loop until they are met.

- For bug fixes, reproduce the bug with a test or reliable check, then make that check pass.
- For validation changes, cover invalid and valid inputs, then make the tests pass.
- For refactors, verify behavior before and after the change.
- For multi-step tasks, state a brief plan in this form:

```text
1. [Step] -> verify: [check]
2. [Step] -> verify: [check]
3. [Step] -> verify: [check]
```

- Run the relevant tests, linters, type checks, builds, or focused manual verification.
- Do not claim completion without evidence proportional to the risk of the change.
- If verification cannot be performed, clearly state what was not verified and why.

Success means the requested behavior is demonstrably correct, the change is minimal, and no unrelated behavior was modified.

### 5. Context Management

- When reliable context-window usage information is available and usage reaches 60% or higher, pause at the next safe boundary and ask the user whether they would like to compact the context.
- Do not compact the context until the user confirms.
- Do not estimate context usage when the runtime does not expose it.
