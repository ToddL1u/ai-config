---
name: qa-browser
description: "Real browser QA using Chrome automation. Navigates the app, verifies UI behavior, captures screenshots, and runs an auto-fix loop (find issue → fix → verify). Triggers on: qa browser, browser test, visual qa, check in browser, verify in browser."
---

# QA Browser — Real Browser Verification

Use an available browser-automation capability to verify the app in a real
browser. Find visual bugs, interaction issues, and broken flows, then fix and
re-verify when the user has authorized implementation work.

## Prerequisites
- The app must be running locally (dev server)
- A browser automation capability must be available and connected
- If no browser capability is available, explain the dependency and stop
  instead of pretending to have verified the UI

## Workflow

### Step 0 — Get browser context
Inspect the browser capability's current tabs or pages. Check whether the app is already open.

### Step 1 — Determine test scope
Ask the user (or infer from context):
- What URL to test? (e.g., `http://localhost:5173`)
- What flow to verify? (e.g., "upload photo flow", "login page", "the whole app")
- Any specific things to check? (e.g., "mobile layout", "dark mode", "error states")

### Step 2 — Navigate and capture baseline
1. Open or navigate to the target URL
2. Inspect the visible page and accessible DOM state
3. Take a screenshot for baseline reference

### Step 3 — Systematic verification
For each page/flow, check:

**Layout & Visual**
- Elements render correctly (no overlapping, clipping, or overflow)
- Responsive behavior at current viewport (resize the browser when supported)
- Images load correctly
- Text is readable (no truncation, correct fonts)
- Consistent spacing and alignment

**Interaction**
- Buttons/links are clickable and respond
- Forms accept input and validate correctly
- Loading states appear during async operations
- Error states display when triggered
- Navigation works (back/forward, route changes)

**Accessibility**
- Focus indicators visible on keyboard navigation
- Interactive elements have accessible names
- Color contrast sufficient
- Screen reader landmarks present

**Console Errors**
- Inspect browser console messages and network failures when supported
- Flag any JavaScript errors, failed network requests, or warnings

### Step 4 — Auto-fix loop
For each issue found:

1. **Capture**: Note the issue with file:line reference if identifiable
2. **Fix**: Edit the source file to resolve the issue
3. **Verify**: Wait for hot-reload, then re-check in browser
4. **Confirm**: Take a screenshot showing the fix

Repeat until the page/flow is clean.

Classification:
- **AUTO-FIX**: CSS issues, missing classes, layout bugs, typos, console warnings from own code
- **ASK**: Behavioral bugs, design decisions, UX changes, third-party errors

### Step 5 — Cross-breakpoint check (if applicable)
Test at key breakpoints:
- Mobile: 375px width
- Tablet: 768px width
- Desktop: 1280px width

Resize using the available browser capability. Only check breakpoints relevant to the project.

### Step 6 — Report

```markdown
## QA Browser Report: [page/flow name]

### Environment
- URL: http://localhost:XXXX
- Viewport: WxH

### Issues Found: N
**AUTO-FIXED:**
- [file:line] Issue → fix applied ✅

**NEEDS INPUT:**
- [file:line] Issue description
  Recommended fix: ...

### Console Errors
- [count] errors / [count] warnings (or "Clean")

### Breakpoints Tested
- Mobile (375px): ✅ / ⚠️
- Tablet (768px): ✅ / ⚠️
- Desktop (1280px): ✅ / ⚠️

### Verdict
[PASS / NEEDS WORK — summary]
```

## Notes
- Avoid triggering modal JavaScript dialogs because they can block automation
- If a page element isn't responding after 2-3 attempts, stop and ask the user
- Filter console inspection to errors and relevant warnings to avoid verbose output
- Prefer semantic element lookup over manual DOM traversal
- If the dev server isn't running, ask the user to start it rather than starting it yourself
