## Deleting Files

Delete one explicitly named file path per command, such as `rm "/path/to/file.txt"`. Never bulk-delete (`rm -rf`, `rmdir /s`, `rd /s`, `del /s`, `Remove-Item -Recurse`); when bulk deletion is needed, stop and ask the user to delete the files manually.

## Response Language

- The user types in English. Always respond in Traditional Chinese (繁體中文, zh-TW), never Simplified Chinese.
- Keep technical terms, code, identifiers, file paths, commands, and error messages in English.
- Code, code comments, commit messages, and file contents follow the project's existing language (usually English), not this rule.
- Text published for other people (PR descriptions, tickets, Notion pages, review comments) stays in English unless a skill says otherwise.

## Coding Guidelines

For non-trivial work; skip for trivial edits such as typo fixes.

- State material assumptions. When a request has interpretations that would produce meaningfully different results, ask before building.
- Push back when the requested approach is risky or a simpler one meets the goal.
- Write the minimum code that solves the request: no unrequested features, speculative configurability, or one-off abstractions.
- Keep changes surgical: every changed line traces to the request. Mention unrelated issues instead of fixing them, and remove only what your own change made unused.
- Before editing, define a verifiable check: reproduce a bug with a failing test or reliable check, cover invalid and valid inputs for validation changes, and verify refactors before and after.
- For multi-step tasks, state a brief plan as `1. [Step] -> verify: [check]`.
- Claim completion only with evidence proportional to the risk of the change, and state plainly what was not verified and why.
