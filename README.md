# Universal AI configuration

Portable, version-controlled configuration for Claude Code and Codex. Every
custom skill has one canonical implementation and is installed for both agents.

## Layout

```text
AGENTS.md                  Shared persistent instructions
skills/<name>/             Canonical universal skills
scripts/setup.sh           Non-destructive home-directory installer
scripts/check.sh           Repository integrity and portability checks
```

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

The check validates skill frontmatter, unique names, the expected 28-skill
catalog, hardcoded user paths, agent-specific tool names, and agent-specific
mutable-state writes.

## Add or update a skill

1. Add `skills/<name>/SKILL.md` with matching `name` and a clear
   `description` in YAML frontmatter.
2. Keep instructions agent-neutral. Refer to available capabilities such as a
   browser, Jira, Notion, planning, or subagents; do not hardcode a vendor tool
   namespace.
3. Add optional `scripts/`, `references/`, `assets/`, or `agents/` inside the
   skill directory.
4. Run `./scripts/check.sh`, then `./scripts/setup.sh --apply` to install the
   new skill for both agents.

## Runtime state

Project-local agent state uses `.ai/`:

```text
.ai/checkpoints/
.ai/journal/
.ai/handover.md
```

New personal skincare data defaults to `~/.ai/skincare-data/`. Relevant skills
can read older Claude or Codex paths for compatibility but write only to neutral
locations. Add `.ai/` to project ignore rules unless the state should be shared.
