---
name: test-impact
description: Discover existing coverage and propose stable public testing seams before implementation. Use for non-trivial raw requests, explicit test-impact or test-plan requests, or when an approved spec or ticket names a test seam that is missing, stale, or contradicted by repository evidence.
---

# Test Impact

Produce a pre-coding testing handoff. Discover and propose testing seams; do
not write tests or implementation.

## Workflow

1. Read the planned behavior, repository instructions, domain documentation,
   relevant code, and any approved spec or ticket.
2. Identify the public interfaces through which the behavior can be observed.
3. Search using repository conventions for existing unit, integration,
   contract, and end-to-end tests around those interfaces.
4. Read the relevant tests and record their scenarios, assertions, style,
   fixtures, and external boundaries.
5. Prefer the highest stable existing seam that proves the behavior. Propose a
   new seam only when no existing public interface can provide useful proof.
6. When checking an approved seam, report whether it is valid, stale, missing,
   or contradicted. Do not silently replace it.

Return:

```md
## Test Impact: {change}

### Proposed seams
- {public seam} — {behavior proved and why this is the highest useful seam}

### Existing coverage
- {test path} — {covered scenarios and style}

### Expected impact
- {test likely to change or fail} — {reason}

### New or extended cases
- {seam} — {specific behavior, boundary, and failure cases}

### External boundaries
- {real dependency or justified mock boundary}

### Risks or contradictions
- {missing infrastructure, stale approved seam, flakiness, or `None`}
```

Use independent expected values and behavior-focused assertions. Do not propose
tests of private methods or mocks of internal collaborators.
