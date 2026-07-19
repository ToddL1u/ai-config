---
name: debug
description: "Systematic root-cause debugging: reproduce → isolate → hypothesize → verify → fix. Avoids shotgun debugging. Triggers on: debug, root cause, investigate bug, why is this broken, diagnose."
---

# Debug — Systematic Root-Cause Investigation

Structured debugging workflow that finds root causes instead of applying band-aids.

## When to use
- A bug report or failing test with unclear cause
- Something "randomly" breaks or works inconsistently
- A fix was applied but the bug came back
- You need to understand WHY something fails, not just make it pass

## Workflow

### Step 1 — Define the bug clearly
Gather from the user or context:
- **What's happening**: exact error message, unexpected behavior, or failing assertion
- **What's expected**: correct behavior
- **When it started**: recent commit? always been there? after a dependency update?
- **Reproduction steps**: how to trigger it reliably

If any of these are unclear, ask before proceeding.

### Step 2 — Reproduce
Verify the bug is reproducible:
- Run the failing test or trigger the behavior
- Capture the exact error output
- If not reproducible, investigate environmental differences (OS, Node version, env vars, data state)

```
Reproduction: [CONFIRMED / INTERMITTENT / NOT REPRODUCIBLE]
Error: <exact error message>
Trigger: <how to reproduce>
```

If NOT REPRODUCIBLE, stop and discuss with user before continuing.

### Step 3 — Isolate
Narrow down the cause systematically:

1. **Trace the error back**: Read the stack trace. Identify the exact file:line where the error originates (not where it surfaces).
2. **Read the code path**: From entry point to error site, read every function in the chain. Note assumptions each function makes.
3. **Check recent changes**: `git log --oneline -20` and `git log --all --oneline -- <file>` for the affected files. Did a recent commit change behavior?
4. **Check data state**: Is the input data what the code expects? Log or inspect the actual values at the failure point.
5. **Binary search**: If the cause isn't obvious, use `git bisect` or comment out sections to narrow down.

### Step 4 — Hypothesize
Form 1-3 ranked hypotheses:

```markdown
### Hypotheses (ranked by likelihood)
1. **[Most likely]** Description — because [evidence]
2. **[Possible]** Description — because [evidence]
3. **[Unlikely but check]** Description — because [evidence]
```

Each hypothesis must be falsifiable — describe what you'd check to confirm or rule it out.

### Step 5 — Verify
Test hypotheses in order:
- For each hypothesis, describe the test and run it
- Mark as CONFIRMED or RULED OUT
- If all hypotheses fail, return to Step 3 with new information

```
Hypothesis 1: CONFIRMED / RULED OUT
Evidence: <what you found>
```

### Step 6 — Fix
Once root cause is confirmed:
1. Write the minimal fix that addresses the root cause
2. Verify the fix resolves the original reproduction
3. Check for other code paths with the same pattern (grep for similar logic)
4. Add or update tests to cover the failure case

### Step 7 — Report

```markdown
## Debug Report

### Bug
[One-line description]

### Root Cause
[What was actually wrong and why]

### Fix
[What was changed — file:line references]

### Regression Prevention
[Test added or guardrail in place]

### Related Risk
[Other code with the same pattern that might have the same issue]
```

## Anti-patterns to avoid
- **Shotgun debugging**: Making random changes hoping something sticks
- **Symptom fixing**: Suppressing the error instead of fixing the cause
- **Assuming the obvious**: "It must be X" without evidence — verify first
- **Ignoring the stack trace**: Always read it fully, including "caused by" chains
- **Fixing in the wrong layer**: If the bug is bad data, fix the data source, not every consumer

## Notes
- Prefer reading code and tracing logic over adding console.log everywhere
- Use `git blame` on the suspicious lines to understand intent
- If the bug is in a dependency, check the GitHub issues for that package first
- If stuck after 3 hypothesis cycles, ask the user for more context
