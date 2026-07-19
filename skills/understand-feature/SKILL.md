---
name: understand-feature
description: Use when the user wants to understand a feature, trace a code flow, map dependencies, or investigate how something works before making edits. Triggers on "understand", "trace", "how does X work", "map the flow", "explain this feature".
---

# Understand Feature

Before modifying any non-trivial feature, build a complete understanding first.
Delegate exploration when subagents are available; otherwise perform the same
read-only investigation directly.

## Workflow

1. **Identify scope**: Ask the user for the feature name, starting file/route/keyword, or area of interest
2. **Explore deeply**: Delegate to a code-exploration subagent when available,
   or perform the analysis directly:
   - Find entry points (routes, components, API handlers)
   - Trace execution flow from entry to output
   - Map state management and data transformations
   - Identify all files involved
3. **Map test coverage**: For each identified source file, search for corresponding test files (`*.spec.ts`, `*.test.ts`, `*.cy.ts`, `test_*.py`). Report:
   - Which source files have tests vs which don't
   - What existing tests cover (happy path, edge cases, integration)
   - Test types present (unit, e2e, integration)

4. **Summarize findings**: Present a concise summary with:
   - Entry points with file:line references
   - Key files and their responsibilities
   - Data flow diagram (text-based)
   - Dependencies (internal and external)
   - **Test Coverage** — tested files, untested files, test types present (unit/e2e)
   - Risks or gotchas before modification
5. **Recommend approach**: Based on the analysis, suggest the safest modification strategy

## When NOT to use this
- Simple one-file changes where the scope is obvious
- Adding new standalone files with no existing dependencies
