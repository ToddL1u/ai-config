---
name: handover
description: "Generate or load a structured session handover brief so work can resume in a fresh session without context loss. Use for handover, hand over, save context, or resume session requests."
---

# Handover Skill

Two-mode skill for preserving and restoring context across AI-agent sessions.

Detect the mode from the argument:
- `save` argument, or no argument → **Save mode**: write a brief
- `load` argument → **Load mode**: read the brief and prime context
- No existing brief found during load → tell the user and stop

---

## Save Mode — Generate Handover Brief

### Step 1 — Gather git context automatically

Run all of these:
```bash
git branch --show-current
git log master..HEAD --oneline 2>/dev/null || git log main..HEAD --oneline
git status --short
git diff --stat master...HEAD 2>/dev/null || git diff --stat main...HEAD
```

Extract:
- Current branch name and ticket ID (pattern: `UPPERCASE-123`)
- Commits on this branch not yet in master
- Modified/untracked files

### Step 2 — Gather task context

If the current agent exposes a task or plan tracker, read it to get current
items and statuses. Otherwise infer progress from the conversation and working
tree. Summarize:
- Which tasks are `in_progress` or `completed`
- Which tasks are still `pending`

### Step 3 — Ask the user 4 questions (ask all at once, not one by one)

```
1. What's currently in progress right now (mid-implementation)?
2. What's blocked or unclear — anything you haven't resolved?
3. Any key decisions made this session that aren't obvious from the code?
4. Any gotchas, edge cases, or traps the next agent should know?
```

If the user says "nothing" or skips a question, omit that section from the brief.

### Step 4 — Write the brief

Write to `.ai/handover.md` in the repo root. Create `.ai/` when needed.

If a brief already exists, **overwrite it** — it's a rolling snapshot, not a log.

#### Brief format:

```markdown
# Handover Brief

**Branch:** `{branch-name}`
**Ticket:** {TICKET-ID or "none"}
**Generated:** {YYYY-MM-DD HH:MM}
**Session summary:** {one sentence of what this session accomplished}

---

## Completed This Session
- ✅ {milestone or commit summary}
- ✅ {milestone or commit summary}

## Current State
{Describe where things stand right now — what file/function/component is mid-edit, what's wired up, what isn't}

### Key Files
- `{path}` — {why it matters}
- `{path}` — {why it matters}

## In Progress (pick up here)
{What the next agent should do first. Be specific: file, function, what needs changing.}

## Blocked / Unresolved
{List anything unclear, awaiting backend, waiting on a decision, or intentionally deferred}

## Decisions Made
{Key choices made this session and the reasoning — only include if non-obvious from the code}

## Gotchas
{Traps, edge cases, or constraints the next agent needs to know to avoid mistakes}

## Next Steps (ordered)
1. {First thing to do}
2. {Second thing}
3. {Third thing}

## Success Criteria
- [ ] {How you'll know the feature is done}
- [ ] {Another completion check}
```

Omit any section that has no content.

### Step 5 — Confirm

Tell the user:
```
Handover brief written to .ai/handover.md
Resume next session by invoking `handover` with the `load` argument.
```

---

## Load Mode — Resume from Handover Brief

### Step 1 — Check for brief

Look for `.ai/handover.md` in the repo root. If it is missing, check the legacy
paths `.claude/handover.md`, `.codex/handover.md`, and `.Codex/handover.md` in
that order. Read a legacy brief when found, but write future briefs only to
`.ai/handover.md`. If no brief exists, tell the user:
```
No handover brief found at .ai/handover.md or a supported legacy path
Invoke `handover` with the `save` argument at the end of a session to create one.
```
Then stop.

### Step 2 — Read the brief

Read the full file. Then run:
```bash
git branch --show-current
git status --short
```
to confirm the current branch matches the brief's branch. If they differ, warn the user before continuing.

### Step 3 — Surface the context

Output a structured summary in this format:

```
## Resuming: {branch-name}

**Last session:** {session summary from brief}
**Ticket:** {TICKET-ID}

### Pick up here
{In Progress section from the brief, verbatim or lightly cleaned up}

### Blocked items
{Blocked section, or "none"}

### Next steps
{Numbered list from brief}

### Watch out for
{Gotchas section, or "none"}
```

### Step 4 — Offer to continue

Ask:
```
Ready to pick up. Should I start on step 1 now, or do you want to review first?
```

---

## Rules

- Save mode always overwrites — it's a snapshot, not a history log
- Never commit `handover.md` — it's ephemeral scratch state
- Keep the brief dense and scannable: bullet points, file paths, specific names — not paragraphs
- The "In Progress" and "Next Steps" sections are the most important — make them actionable
- If the user gives vague answers in step 3, ask one follow-up to get specifics
