---
name: fill-pr
description: Auto-fill GitHub PR template from current branch changes
---

# Fill PR Template Skill

Auto-fill the GitHub PR template (`.github/pull_request_template.md`) based on the current branch's git diff and commit history against master.

## Workflow

### Step 1: Gather branch context

Run the following git commands to collect all context:

```bash
git branch --show-current
git merge-base master HEAD
git log master..HEAD --pretty=format:"%h %s"
git diff master...HEAD --stat
git diff master...HEAD
```

If there are no commits ahead of master, inform the user and stop.

### Step 2: Extract Jira ticket

Parse the branch name for a Jira ticket ID. Branch names follow the pattern `{type}/{TICKET-ID}-description` (e.g. `feat/SPF-16068-mission-phase-7`).

- Extract ticket ID (e.g. `SPF-16068`) and construct Jira URL: `https://sportygroup.atlassian.net/browse/{TICKET-ID}`
- If multiple tickets appear across commit messages, collect all of them
- If no ticket is found, leave the reference section with "No Jira ticket found in branch name"

### Step 3: Detect type of change

Infer from the branch prefix and commit message prefixes:

| Branch prefix | Type |
|---|---|
| `feat/` | New feature |
| `fix/`, `hotfix/` | Bug fix |
| `refactor/` | Refactor |
| `docs/` | Documentation update |
| `breaking/` | Breaking change |

Also scan commit prefixes (`feat:`, `fix:`, `refactor:`, etc.) to confirm or supplement.

Mark the matching checkbox(es) in the "Type of change" section with `[x]`.

### Step 4: Generate summary

Analyze the diff and commit history to write a concise summary that covers:
- **What changed**: high-level description of the modifications
- **Why**: the problem being solved or feature being added
- **How**: brief technical approach

Keep it to 2-5 sentences. Focus on the "why" and business value, not just listing files changed.

### Step 5: Generate test steps

Based on the affected modules/pages in the diff:
1. Identify the user-facing feature or page affected
2. Write numbered QA steps to verify the change
3. Include preconditions if needed (e.g. "Login as a user with active missions")
4. Cover both happy path and key edge cases

### Step 6: Fill root cause & limitation

- For **bugfix** branches (`fix/`, `hotfix/`): analyze the diff to describe the root cause and any limitations
- For **non-bugfix** branches: fill both sections with "N/A"

### Step 7: Fill checklist

Auto-check items based on diff analysis:
- **"Remove unnecessary console or comment"**: check `[x]` if no `console.log`, `console.warn`, `console.error`, or `console.debug` statements are added in the diff (ignore removals)
- **"Add unit tests"**: check `[x]` if test files (`.spec.ts`, `.test.ts`, `__test__/`) are included in the diff

### Step 8: Output filled template

Render the complete filled PR template as a markdown code block so the user can copy it. Use the exact structure from `.github/pull_request_template.md`.

Format:

~~~markdown
## Summary
{generated summary}

## Type of change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [x] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] This change requires a documentation update
- [ ] Refactor (no functionality changes)

## Screenshot(s)
<!-- Please attach screenshots -->

## Test Steps
{generated test steps}

## Reference Document(s)
- [{TICKET-ID}](https://sportygroup.atlassian.net/browse/{TICKET-ID})

## Root Cause (bugfix only)
{root cause or N/A}

## Limitation (bugfix only and if any)
{limitation or N/A}

## Checklist
- [x] Remove unnecessary console or comment
- [x] Add unit tests
~~~

### Step 9: Copy to clipboard

After outputting the template, automatically copy it to the clipboard using:

```bash
printf '%s' "<filled template content>" | pbcopy
```

Inform the user the template has been copied to their clipboard.

### Step 10: Offer next actions

After copying, ask the user which action they'd like:

1. **Paste directly** — they'll paste it into the PR themselves (already in clipboard)
2. **Create PR via CLI** — run `gh pr create` with the filled template (ask for title confirmation first)
3. **Adjust** — modify any section before finalizing

## Edge Cases

- **No commits ahead of master**: Stop early with a message
- **No Jira ticket in branch name**: Leave reference as "No Jira ticket found" but still fill everything else
- **Very large diffs** (>2000 lines): Summarize from `--stat` and commit messages instead of full diff to avoid context overflow
- **Non-master base branch**: If the user specifies a different base, use that instead of master
