---
name: qa-browser
description: Verify a running web application through browser automation, including layout, interactions, accessibility, console errors, and responsive behavior. Use for browser QA, visual QA, browser tests, or requests to verify an app in a browser. Report without editing by default; fix and re-verify only when the user explicitly requests fix mode.
---

# QA Browser

Verify the app in a real browser and distinguish evidence gathering from code
modification.

## Modes

- **QA** (default): navigate, inspect, capture evidence, and report. Do not edit
  source files.
- **Fix** (`--fix` or an explicit request to fix browser findings): propose,
  implement, and re-verify authorized fixes.

A request to check or verify in the browser does not authorize code changes.

## Prerequisites

- Require a running application and an available browser-automation capability.
- Infer the URL and flow from context when reliable; otherwise ask.
- If the app or browser is unavailable, identify the missing dependency instead
  of claiming verification.

## Workflow

### 1. Establish scope and baseline

Record the URL, flow, authenticated state, relevant test data, and requested
viewports. Inspect the visible and accessible page state and capture a baseline
screenshot.

### 2. Verify systematically

Check the relevant areas:

- **Layout:** overlap, clipping, overflow, spacing, typography, images, and
  responsive behavior.
- **Interaction:** controls, forms, validation, loading and error states,
  navigation, and repeated interactions.
- **Accessibility:** keyboard order, visible focus, accessible names, landmarks,
  semantics, and contrast when measurable.
- **Runtime:** relevant console errors, warnings, and failed network requests
  when the browser capability exposes them.

Use semantic element lookup where possible. Avoid blocking JavaScript dialogs
and irreversible actions unless they are explicitly in scope.

### 3. Classify findings

- **Mechanical candidate:** clear typo, missing class, or narrowly scoped CSS
  defect with one obvious correction.
- **Judgment required:** behavior, UX, design, data, authentication, destructive
  action, or third-party failure.

In QA mode, report both categories with evidence and recommendations but make no
edits.

### 4. Fix only in Fix mode

For each authorized fix:

1. Show the issue, intended files, and expected behavior change.
2. Ask before judgment-required changes or scope expansion.
3. Apply the smallest coherent fix.
4. Wait for reload, repeat the failing interaction, and capture the result.
5. Run relevant automated checks when available.

Do not repeat the fix loop in QA mode.

### 5. Check relevant breakpoints

Use project breakpoints when known. Otherwise use only relevant defaults:

- mobile: 375px;
- tablet: 768px;
- desktop: 1280px.

Do not claim a breakpoint passed unless it was actually inspected.

## Report

Include:

```markdown
## QA Browser Report: [page or flow]

- URL: ...
- Mode: QA / Fix
- Viewports: ...

### Findings
- [severity] [evidence] Issue → recommended fix

### Fixed and verified
- [fix mode only] Issue → fix → verification evidence

### Console and network
- Relevant errors and warnings, or "clean"

### Verdict
PASS / NEEDS WORK / BLOCKED
```

If an element fails to respond after two or three evidence-based attempts, stop
and report the blocker instead of clicking blindly.
