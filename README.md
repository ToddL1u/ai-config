# Universal AI configuration

Portable, version-controlled configuration for Claude Code and Codex. Every
custom skill has one canonical implementation and is installed for both agents.

## Layout

```text
AGENTS.md                  Shared persistent instructions
SKILL_USAGE.md             Scenarios and prompt examples for every local skill
skills/<name>/             Canonical universal skills
mods/<name>/               Claude Code mods (hooks modules)
scripts/setup.sh           Non-destructive home-directory installer
scripts/check.sh           Repository integrity and portability checks
```

See [SKILL_USAGE.md](SKILL_USAGE.md) when you are unsure which skill to invoke
or want a copyable prompt example.

The `skills/` directory is the only skill catalog and source of truth. Skills
describe capabilities rather than exact vendor tool names and must either work
directly or stop with a clear missing-capability message.

## Check and install

Preview the current state without changing anything:

```bash
./scripts/setup.sh --check
```

Install after reviewing the report:

```bash
./scripts/setup.sh --apply
```

The installer links every skill to:

- `~/.claude/skills/<name>` for Claude Code.
- `~/.agents/skills/<name>` for Codex, its supported user-skill location.

Every mod is linked to `~/.claude/mods/<name>`. Claude Code loads a mod only
from a folder listed in `CLAUDE_CODE_PLUGIN_DIRS` (set in the dotfiles'
`~/.claude/settings.json`), so add a new mod's link there too. Check one with
`claude plugin validate mods/<name>` and `claude plugin test mods/<name>`.

It also copies `AGENTS.md` to `~/.claude/CLAUDE.md` and
`~/.codex/AGENTS.md`. It does not link or overwrite live settings.

When a destination already exists, apply mode moves that one path into
`~/.ai-config-backups/<timestamp>/` before creating the link. It never deletes
or overwrites a conflict. Existing custom skills in the legacy
`~/.codex/skills/` location are backed up; `~/.codex/skills/.system` is never
read, moved, or modified.

## Validate the repository

```bash
./scripts/check.sh
```

The check validates skill frontmatter, unique names, the expected 40-skill
catalog, hardcoded user paths, agent-specific tool names, and agent-specific
mutable-state writes.

## Add or update a skill

1. Add `skills/<name>/SKILL.md` with matching `name` and a clear
   `description` in YAML frontmatter.
2. Keep instructions agent-neutral. Refer to available capabilities such as a
   browser, Jira, Notion, planning, or subagents; do not hardcode a vendor tool
   namespace.
3. Choose how the skill is invoked. Keep it model-invoked only when the agent
   must start it on its own or another skill calls it. Otherwise make it
   user-invoked: add `disable-model-invocation: true` to the frontmatter, write
   the `description` as a one-line summary for humans, and set
   `policy.allow_implicit_invocation: false` in `agents/openai.yaml`.
   `./scripts/check.sh` fails when the two disagree. A user-invoked skill may
   call model-invoked skills, never another user-invoked one.
4. Add optional `scripts/`, `references/`, `assets/`, or `agents/` inside the
   skill directory.
5. Run `./scripts/check.sh`, then `./scripts/setup.sh --apply` to install the
   new skill for both agents.

## Private per-worktree AI workflow

Use a repository-local `.ai/` directory only for personal AI workflow notes,
including `.ai/boards/<feature>.md` and `.ai/current-card.md`. It is not for
shared product specifications.

```text
.ai/journal/
.ai/handover.md
.ai/boards/<feature>.md
.ai/current-card.md
```

New personal skincare data defaults to `~/.ai/skincare-data/`. Relevant skills
can read older Claude or Codex paths for compatibility but write only to neutral
locations.

Do not modify or commit the shared `.gitignore`. Apply the following once per
worktree to ignore private `.ai/` notes locally:

```bash
git rev-parse --git-path info/exclude
# Add .ai/ to the returned local exclude file.
git check-ignore -v .ai/boards/
```
