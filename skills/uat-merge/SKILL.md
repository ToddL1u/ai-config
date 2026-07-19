---
name: uat-merge
description: "Safely merge a feature branch into UAT: switches branch, syncs latest, resolves conflicts (favoring UAT), creates merge commit with conflict summary, then pushes. Triggers on: uat merge, merge to uat, merge into uat"
---

# uat-merge — Merge a Feature Branch into UAT

Safely merge a source branch into `uat` with conflict resolution, a SourceTree-style merge commit, and a confirmed push.

## Workflow

### Step 1 — Identify source branch

If the user did not specify a branch:
1. Run `git branch --show-current` to get the current local branch.
2. Ask:
   > "Merge `<current-branch>` into UAT? (y to confirm, or type a different branch name)"
3. If the user confirms with `y` or equivalent: use the current branch.
4. If the user types a branch name: use that instead.

Store as `SOURCE_BRANCH`.

---

### Step 2 — Switch to UAT safely

**2a. Check for dirty state**

Run: `git status --short`

If the working tree is dirty (any output), offer two options:
> "You have uncommitted changes. How would you like to proceed?
> (A) Stash them now — I'll restore them after the merge
> (B) I'll handle it manually — let me know when ready"

- If A: run `git stash` and note that stash must be popped at the end.
- If B: pause and wait for user confirmation before continuing.
- Do NOT run `git reset` or discard changes without explicit user approval.

**2b. Fetch and checkout UAT**

```bash
git fetch origin
```

Check if `uat` exists locally (`git branch --list uat`):
- If yes: `git checkout uat`
- If no: `git checkout -b uat origin/uat`

**2c. Ensure UAT is at the latest remote commit**

Run: `git status -sb`

Parse the output for `[behind N]`:
- If behind: run `git pull origin uat --ff-only`
- If `--ff-only` fails (diverged): stop and warn:
  > "UAT has diverged from origin/uat and cannot be fast-forwarded. Please resolve this manually (rebase or reset), then re-run the skill."
  Do NOT force-reset. Wait for user to handle it.
- If already up to date: proceed.

---

### Step 3 — Merge source branch

Run:
```bash
git merge "$SOURCE_BRANCH" --no-commit --no-ff
```

Using `--no-commit` so conflicts can be inspected before committing.

**If no conflicts:** proceed to Step 4.

**If conflicts exist:**

For each conflicted file (`git diff --name-only --diff-filter=U`):

1. Check if the conflicting lines on the `theirs` side appear in `$SOURCE_BRANCH`'s history:
   - Run: `git log "$SOURCE_BRANCH" --oneline -- <file>` and compare conflict markers.
2. **Standard conflict** (source branch vs UAT changes):
   - Keep UAT's version: `git checkout --ours -- <file>`
   - Run `git add <file>`
3. **Third-party conflict** (lines that are NOT from `$SOURCE_BRANCH` — already merged into UAT by someone else):
   - Show the conflict diff to the user:
     ```
     Conflict in <file> — involves changes not from your branch:
     <<<<<<< HEAD (uat)
     [their lines]
     =======
     [source branch lines]
     >>>>>>> SOURCE_BRANCH
     ```
   - Ask: "Which version should we keep for `<file>`?
     (ours = keep UAT version / theirs = use source branch version / diff = show full file)"
   - Apply the user's choice and `git add <file>`.

After all files are resolved: `git add .`

Track all resolved conflict file paths for the commit message.

---

### Step 4 — Commit (always a merge commit)

`origin/uat` only accepts merge commits. Never fast-forward — always create a merge commit regardless of history.

Create a merge commit with this message format:

```
Merge branch '$SOURCE_BRANCH' into uat

Conflicts resolved:
- path/to/file1.ext (kept UAT version)
- path/to/file2.ext (user chose: source branch version)

Merged by: uat-merge skill
```

If no conflicts occurred:
```
Merge branch '$SOURCE_BRANCH' into uat
```

Run: `git commit -m "<message>"`

---

### Step 5 — Confirm and push

Show a summary:
```
Ready to push:
  Branch  : uat → origin/uat
  Merged  : $SOURCE_BRANCH
  Conflicts: N files resolved
  Commit  : <short hash> <first line of commit message>
```

Ask:
> "Push to origin/uat? (y/n)"

If confirmed: `git push origin uat`

**If push is rejected (non-fast-forward / new commits on origin/uat):**

> `origin/uat` has new commits. Rebasing local `uat` onto `origin/uat`…

Run:
```bash
git fetch origin
git rebase --rebase-merges origin/uat
```

- `--rebase-merges` is required to preserve the merge commit structure. Plain `git rebase` will flatten the merge commit into a linear commit, which `origin/uat` will reject.
- If the rebase fails with conflicts, stop and tell the user:
  > "Rebase onto origin/uat has conflicts. Please resolve them manually, then run `git rebase --continue`, and re-push."
  Do NOT auto-resolve rebase conflicts — wait for user.
- If rebase succeeds, push again: `git push origin uat`
- If push fails again, stop and report the error — do not loop.

---

### Step 6 — Restore stash (if applicable)

If changes were stashed in Step 2a, run:
```bash
git stash pop
```

Notify the user: "Your stashed changes have been restored."

---

### Step 7 — Deploy to UAT

After a successful push, trigger the deploy-uat skill.

1. Detect the current repo from the working directory name (e.g. `fe-management`, `fe-web-mvc`).
2. Default country: `ng`.
3. Ask the user:
   > "Deploy `{repo}` to UAT? Default country: `ng`. Enter additional countries (comma-separated) or press Enter to proceed with `ng` only."
4. Collect the user's response:
   - If empty/enter: use `ng`
   - Otherwise: combine `ng` with any additional countries provided (dedup)
5. Invoke the deploy-uat skill with arguments: `{countries} --repo={repo}`

---

## Notes

- Never `git reset --hard` without explicit user confirmation.
- `--ff-only` is used for UAT sync to avoid silent divergence.
- `origin/uat` ONLY accepts merge commits — fast-forward and linear pushes will be rejected. Always use `--no-ff` (already set in Step 3) and never skip the merge commit.
- If push is rejected due to new remote commits, use `git rebase --rebase-merges origin/uat` (NOT plain `git rebase`) to replay the merge commit on top. Plain rebase flattens merge commits into linear commits, which `origin/uat` rejects.
- Unit tests are skipped here — CI runs them automatically on push.
- If anything goes wrong mid-merge, run `git merge --abort` and explain what happened before retrying.
