---
name: test-impact
description: "Generates a pre-coding test plan — identifies what tests exist, what will break, and what new tests are needed. Use before writing any code. Triggers on \"test impact\", \"what tests do I need\", \"what will break\", \"test plan\"."
---

# Test Impact — Pre-Coding Test Plan

Analyze a planned change and produce a structured test plan before writing any code.

## Workflow

1. **Get the planned change**: Ask what they plan to change, or use context
   from a prior `understand-feature` run in the conversation.

2. **Identify files that will be touched**: Based on the change description, list all source files likely to be modified or created.

3. **Search for existing tests**: For each identified source file, search for matching test files:
   - `*.spec.ts`, `*.test.ts` (unit tests)
   - `*.cy.ts`, `*.cy.js` (Cypress e2e)
   - `test_*.py`, `*_test.py` (Python)
   - Check `__tests__/` directories and co-located test files

4. **Read existing tests**: For each found test file, read it and note:
   - What scenarios are covered (happy path, edge cases, error states)
   - What assertions exist
   - Whether tests are integration or unit style

5. **Produce the test impact report** with these sections:

```markdown
## Test Impact Report: [change description]

### Existing tests that will break
- `path/to/test.spec.ts` — [why it will break: changed function signature, removed prop, etc.]

### New unit tests needed
- [composable/util/store action] — [what to assert]

### New e2e tests needed
- [user flow] — [what to verify]

### Existing tests to extend
- `path/to/test.spec.ts` — [new cases to add: new prop value, new state, etc.]

### Risk notes
- [snapshot fragility, flaky patterns like hardcoded waits, timing-dependent assertions, etc.]
```

## Notes
- Do NOT write any test code in this skill — only produce the plan.
- If no tests exist for affected files, say so explicitly in the report.
- Keep the report actionable: each item should be specific enough to write a test from.
