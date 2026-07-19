# Caveman Compress

Compress natural-language instruction, memory, or notes files while preserving
Markdown structure, code, links, commands, and technical identifiers.

Run from the skill directory with an explicit provider:

```bash
python3 -m scripts --provider claude /absolute/path/to/file.md
python3 -m scripts --provider codex /absolute/path/to/file.md
```

The command writes the original content to `<name>.original.md`, validates the
compressed result, and restores the original if validation still fails after
two targeted repair attempts. The selected provider executable must be present
on `PATH`.

The repository setup script installs this skill for both supported agents; do
not copy it into an agent-specific home directory manually.
