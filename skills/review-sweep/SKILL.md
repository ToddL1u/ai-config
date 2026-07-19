---
name: review-sweep
description: Review branch changes before a PR using critical and informational passes for data safety, concurrency, LLM boundaries, test gaps, frontend behavior, and performance. Use for review sweep, regression check, final review, or pre-PR review requests. Report findings without editing by default; apply fixes only when the user explicitly requests fix mode.
---

# Review Sweep — Pre-Landing PR Review

Run a two-pass review after tests pass and before opening a PR.

## Modes

- **Review** (default): inspect and report only. Do not modify files.
- **Fix** (`--fix` or an explicit request to fix findings): propose the intended
  fixes, apply only authorized changes, and verify them.

A request to review, inspect, check, or audit is not authorization to edit.

## Workflow

### Step 0 — Detect base branch
Run `gh pr view --json baseRefName 2>/dev/null` or fall back to repo default (`main` or `develop`). If unsure, ask the user.

### Step 1 — Verify there are changes
Run `git diff origin/<base>...HEAD --stat`. If empty, stop: "Nothing to review."

### Step 1.5 — Scope drift detection
Compare stated intent (commit messages via `git log origin/<base>..HEAD --oneline`, PR description if exists) against actual file changes.

Output:
```
Scope Check: [CLEAN / DRIFT DETECTED / REQUIREMENTS MISSING]
Intent: <summary of commits/PR description>
Delivered: <summary of actual file changes>
```
If DRIFT DETECTED or REQUIREMENTS MISSING, flag it before continuing.

### Step 2 — Read all changed files
Fetch the full diff (`git diff origin/<base>...HEAD`) and read every changed file in full.

### Step 3 — Two-pass checklist review

#### Pass 1 — CRITICAL (highest severity)

**SQL & Data Safety**
- String interpolation in SQL — use parameterized queries (Supabase: `.eq()/.filter()`, never template literals in `.rpc()`)
- TOCTOU races: check-then-set that should be atomic
- Bypassing RLS or validation with direct DB writes
- N+1 queries: missing `.select()` joins for data used in loops

**Race Conditions & Concurrency**
- Read-check-write without unique constraint or duplicate key handling
- Find-or-create without unique DB index
- Status transitions without atomic WHERE old_status UPDATE
- Unsafe HTML rendering (`v-html`, `dangerouslySetInnerHTML`) on user-controlled data (XSS)

**LLM Output Trust Boundary**
- LLM-generated values (emails, URLs, names) written to DB or displayed without format validation
- Structured tool output accepted without type/shape checks before DB writes
- User-provided prompts passed to LLM without sanitization or length limits

**Enum & Value Completeness**
When the diff introduces a new enum value, status string, or type constant:
- Trace it through every consumer — READ each file that switches/filters/displays that value
- Check allowlists/filter arrays for sibling values
- Check `case`/`if-else` chains for missing branches
- This requires reading code OUTSIDE the diff

#### Pass 2 — INFORMATIONAL (lower severity)

**Edge Cases**
- Unhandled states: null, undefined, empty arrays/objects, error responses, loading states
- Boundary conditions: zero, negative numbers, max values, empty strings
- Rapid user interactions: double clicks, concurrent requests

**Conditional Side Effects**
- Code paths that branch but forget a side effect on one branch
- Log messages claiming an action happened when conditionally skipped

**Dead Code & Consistency**
- Variables assigned but never read
- Comments/docstrings describing old behavior after code changed
- Version mismatch between PR title and package.json/CHANGELOG

**LLM Prompt Issues**
- 0-indexed lists in prompts (LLMs return 1-indexed)
- Prompt text listing tools/capabilities that don't match what's wired up
- Token limits stated in multiple places that could drift

**Test Gaps**
- Changed source files without corresponding test assertions
- New branches/conditions not covered by tests
- Removed test cases not replaced
- Negative-path tests asserting type/status but not side effects

**Flaky Test Risk**
- `cy.wait()` / `setTimeout` / `setInterval` with hardcoded ms in tests
- Tests depending on execution order or shared state
- Non-deterministic data (random IDs, timestamps)

**Code Quality**
- `any` types in TypeScript
- `console.log` / `console.debug` left in production code
- Missing `aria-*` attributes on interactive elements
- Hardcoded strings that should be constants or i18n keys
- TODO/FIXME comments without linked issues

**Performance & Bundle Impact**
- Heavy dependency additions (moment.js → date-fns, full lodash → lodash-es)
- Images without `loading="lazy"` or explicit width/height (CLS)
- Large static assets committed (>500KB per file)
- `useEffect`/`watch` with fetch depending on another fetch (request waterfall)
- CSS `@import` in stylesheets (blocks parallel loading)

**Frontend / Vue-specific**
- Inline `<style>` blocks re-parsed every render (use scoped or utility classes)
- O(n*m) lookups in templates (`.find()` in v-for — use computed Map/Set)
- Reactive data that should be `shallowRef` or `shallowReactive`
- Missing `key` on `v-for` loops

### Step 3.5 — Design review (conditional)
If any `.vue`, `.css`, `.scss`, or `.html` files changed:
- Check for AI-slop indicators (generic placeholder text, inconsistent spacing)
- Typography: verify consistent font sizes, weights, line-heights
- Spacing: verify consistent use of Tailwind spacing scale
- Interaction states: hover, focus, active, disabled on all interactive elements
- Accessibility: focus indicators, color contrast, semantic HTML

### Step 4 — Report or fix

Classify every finding:

**MECHANICAL CANDIDATE:**
- Dead code / unused variables
- Stale comments contradicting code
- Variables assigned but never read

**JUDGMENT REQUIRED:**
- Security (auth, XSS, injection)
- Race conditions
- Query strategy or N+1 fixes
- LLM validation and fallback behavior
- Design decisions
- Performance rewrites and view-lookup changes
- Enum completeness
- Removing functionality
- Anything changing user-visible behavior

In Review mode, report both categories without editing.

In Fix mode:

1. Show the proposed files and behavioral effect of each fix.
2. Apply mechanical candidates covered by the user's explicit fix request.
3. Ask before every judgment-required fix or scope expansion.
4. Run focused tests after each coherent group of fixes.
5. Re-run the relevant review checks and report remaining findings.

Do not treat issue severity as edit authorization.

### Step 5 — Test coverage audit
Map changed code paths against existing tests:

```
Code Path                          Coverage
────────────────────────────────── ────────
handleSubmit → success             ✅ unit
handleSubmit → validation error    ✅ unit
handleSubmit → network error       ⚠️ GAP
onMounted → fetch data             ✅ e2e
onMounted → auth redirect          ⚠️ GAP
```

Flag paths marked GAP that are high-risk (auth, payments, data mutation).

## Output format

```markdown
## Review Sweep: [branch name]

### Scope Check
[CLEAN / DRIFT DETECTED / REQUIREMENTS MISSING]

### Pre-Landing Review: N issues (X critical, Y informational)

**FINDINGS:**
- [file:line] Problem → recommended fix

**FIXED (fix mode only):**
- [file:line] Problem → verified fix

**NEEDS INPUT:**
- [file:line] Problem description
  Recommended fix: suggested fix

### Test Coverage
[coverage table]

### Verdict
[READY / NEEDS WORK — with summary of blocking items]
```

## Suppressions — DO NOT flag

- Redundancy that aids readability
- "Add a comment explaining this constant" — constants change, comments rot
- Consistency-only changes with no functional impact
- Anything already addressed in the diff being reviewed
- devDependencies additions (don't affect production bundle)
- Dynamic `import()` calls (code splitting is good)
- Small utility additions (<5KB gzipped)

## Notes
- Only flag items that actually apply to the diff — no generic advice
- Default to a read-only report unless fix mode was explicitly requested
- If a category has no issues, skip it entirely
- Be specific: include file paths and line numbers for every item
- Be terse: one line per problem, one line per fix. No preamble.
