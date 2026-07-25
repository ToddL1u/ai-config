---
name: spec-review
description: Compare a frozen change bundle with its authoritative specification and report requirement mismatches without editing. Use as a model-invoked review axis inside review-sweep, not as a general code-quality review.
---

# Spec Review

Review only whether the delivered change matches the authoritative requirement
sources supplied in the frozen bundle.

## Input contract

Require:

- the fixed point and target mode;
- the exact diff, including complete untracked-file contents;
- the changed-file and commit lists;
- the authoritative spec sources and their stable references or versions.

Do not discover a replacement specification from the implementation, commit
messages, branch name, or reviewer assumptions. If no authoritative source is
provided, return `NOT RUN — no authoritative source`.

## Review

1. Extract required behavior, acceptance criteria, constraints, and non-goals
   from the supplied sources.
2. Trace each requirement to concrete evidence in the diff and relevant tests.
3. Report only observable mismatches:
   - required behavior is absent or incorrect;
   - acceptance criteria lack implementation or verification evidence;
   - the change contradicts a constraint or non-goal;
   - an approved ticket exceeds or conflicts with its parent specification.
4. Treat a mismatch as blocking when it can make the delivered behavior differ
   from the approved intent. Use advisory severity only for a low-risk ambiguity
   that does not establish incorrect behavior.

Do not review general style, maintainability, security, or repository
conventions unless they directly contradict an explicit requirement. Do not
edit files or propose unrelated improvements.

## Output

```markdown
## Spec Review

Source: <stable references and versions>
Status: [PASS / NEEDS WORK / NOT RUN]

### Blocking
- [requirement → file:line] mismatch and smallest compliant correction

### Advisory
- [source location] ambiguity or low-risk observation

### Coverage
- [MET / NOT MET / NOT PROVEN] requirement → evidence
```

Omit empty finding sections. Include paths and line numbers where applicable.
Return `NEEDS WORK` for any blocking finding and `PASS` otherwise.
