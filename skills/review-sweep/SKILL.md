---
name: review-sweep
description: "Pre-PR review with two-pass analysis and Fix-First execution. Pass 1: critical (SQL safety, race conditions, LLM boundaries, enum completeness). Pass 2: informational (side effects, dead code, test gaps, frontend, performance). Auto-fixes mechanical issues, batches judgment calls. Triggers on: review sweep, regression check, final review, pre-PR review."
---

# Review Sweep — Pre-Landing PR Review

Two-pass review with Fix-First execution. Run after tests pass, before opening a PR.

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

### Step 4 — Fix-First execution

Classify every finding:

**AUTO-FIX (apply without asking):**
- Dead code / unused variables
- N+1 queries (add eager loading)
- Stale comments contradicting code
- Magic numbers → named constants
- Missing LLM output validation (add basic guards)
- Variables assigned but never read
- Inline styles, O(n*m) view lookups

**ASK (batch into one user-input request):**
- Security (auth, XSS, injection)
- Race conditions
- Design decisions
- Large fixes (>20 lines)
- Enum completeness
- Removing functionality
- Anything changing user-visible behavior

**Rule of thumb:** If the fix is mechanical and a senior engineer would apply it without discussion → AUTO-FIX. If reasonable engineers could disagree → ASK.

Critical findings default toward ASK. Informational findings default toward AUTO-FIX.

Apply all AUTO-FIX items first with one-line summaries. Then batch all ASK items into a single question with recommended fixes for each.

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

**AUTO-FIXED:**
- [file:line] Problem → fix applied

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
- If a category has no issues, skip it entirely
- Be specific: include file paths and line numbers for every item
- Be terse: one line per problem, one line per fix. No preamble.
