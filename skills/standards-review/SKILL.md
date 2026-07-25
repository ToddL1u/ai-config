---
name: standards-review
description: Review a frozen change bundle for concrete correctness, security, data, concurrency, testing, and repository-standard risks without editing. Use as a model-invoked review axis inside review-sweep, not for requirement conformance.
---

# Standards Review

Review engineering risk independently of product requirements.

## Input contract

Require:

- the fixed point and target mode;
- the exact diff, including complete untracked-file contents;
- the changed-file and commit lists;
- applicable repository instructions and standards.

Read [references/risk-checks.md](references/risk-checks.md). Apply only
categories relevant to the change.

## Review

1. Classify concrete correctness, security, data, concurrency, LLM-boundary,
   broken-test, and material applicable repository-rule violations as blocking.
2. Inspect surrounding consumers outside the diff when a changed public value,
   enum, schema, or interface requires completeness checking.
3. Treat maintainability, performance, accessibility, and code-smell findings
   as advisory unless there is evidence of a concrete defect or material
   repository-rule violation.
4. Suppress generic advice, preference-only feedback, and issues already fixed
   by the supplied diff.

Do not judge whether the implementation satisfies product requirements. Do not
edit files, apply fixes, or broaden the requested scope.

## Output

```markdown
## Standards Review

Standards: <sources used>
Status: [PASS / NEEDS WORK]

### Blocking
- [file:line] concrete risk → smallest safe correction

### Advisory
- [file:line] evidence-backed improvement

### Test Coverage
| Code path | Evidence |
| --- | --- |
| <path> | <covered / gap> |
```

Omit empty finding sections. Return `NEEDS WORK` for any blocking finding and
`PASS` otherwise. Keep severity local to this axis.
