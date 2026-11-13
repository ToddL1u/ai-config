---
name: qa-browser
description: Verify a running web application through browser automation, including layout, interactions, accessibility, console errors, responsive behavior, and iOS Safari rendering through WebKit. Use for browser QA, visual QA, browser tests, or requests to verify an app in a browser. Report without editing by default; fix and re-verify only when the user explicitly requests fix mode.
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

### 6. Check WebKit when mobile is in scope

Chrome at a mobile width does not render like iOS Safari. When mobile is in
scope and Playwright is available, also render the page in WebKit with an
iPhone profile, using the project's Playwright when it has one:

```bash
npx playwright screenshot --browser webkit --device "iPhone 13" --full-page <url> <out.png>
```

If the engine is missing, run `npx playwright install webkit` once. For
interactions, drive the same profile from a short Playwright script
(`webkit.launch()` with `devices['iPhone 13']`). Compare against the Chrome
mobile screenshot and report the differences.

This is a current WebKit, not the iOS version the project supports, and it has
no iOS browser chrome. List under "Needs device check" what it cannot show:
the collapsing address bar, the on-screen keyboard, real safe-area insets, zoom
on input focus, and CSS newer than the project's oldest supported iOS. If
WebKit is unavailable, say so; Chrome at a mobile width is not iOS coverage.

## Report

Include:

```markdown
## QA Browser Report: [page or flow]

- URL: ...
- Mode: QA / Fix
- Viewports: ...
- Engines: Chromium / WebKit (iPhone profile) / not run, with reason

### Findings
- [severity] [evidence] Issue → recommended fix

### Needs device check
- [mobile only] What WebKit emulation cannot show, as concrete steps on a real iPhone

### Fixed and verified
- [fix mode only] Issue → fix → verification evidence

### Console and network
- Relevant errors and warnings, or "clean"

### Verdict
PASS / NEEDS WORK / BLOCKED
```

If an element fails to respond after two or three evidence-based attempts, stop
and report the blocker instead of clicking blindly.
