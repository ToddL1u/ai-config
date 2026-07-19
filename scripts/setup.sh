#!/bin/bash

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MODE="${1:---check}"
CHANGE_COUNT=0
CONFLICT_COUNT=0
BACKUP_ROOT="${AI_CONFIG_BACKUP_ROOT:-$HOME/.ai-config-backups/$(date +%Y%m%d-%H%M%S)}"
BACKUP_CREATED=false

usage() {
  echo "Usage: $0 [--check|--apply]"
}

if [[ "$MODE" != "--check" && "$MODE" != "--apply" ]]; then
  usage >&2
  exit 2
fi

"$REPO_ROOT/scripts/check.sh"

ensure_parent() {
  local destination_path="$1"
  if [[ "$MODE" == "--apply" ]]; then
    mkdir -p "$(dirname "$destination_path")"
  fi
}

backup_one() {
  local destination_path="$1"
  local relative_path backup_path

  relative_path="${destination_path#"$HOME"/}"
  backup_path="$BACKUP_ROOT/$relative_path"

  if [[ "$BACKUP_CREATED" == false ]]; then
    mkdir -p "$BACKUP_ROOT"
    BACKUP_CREATED=true
  fi

  mkdir -p "$(dirname "$backup_path")"
  if [[ -e "$backup_path" || -L "$backup_path" ]]; then
    echo "backup destination already exists: $backup_path" >&2
    exit 1
  fi

  mv "$destination_path" "$backup_path"
  echo "backed up: $destination_path -> $backup_path"
}

manage_link() {
  local source_path="$1"
  local destination_path="$2"

  if [[ -L "$destination_path" && "$(readlink "$destination_path")" == "$source_path" ]]; then
    echo "already linked: $destination_path"
    return
  fi

  if [[ -e "$destination_path" || -L "$destination_path" ]]; then
    if [[ "$MODE" == "--check" ]]; then
      echo "conflict: $destination_path"
      CONFLICT_COUNT=$((CONFLICT_COUNT + 1))
      return
    fi
    backup_one "$destination_path"
  elif [[ "$MODE" == "--check" ]]; then
    echo "missing link: $destination_path"
    CHANGE_COUNT=$((CHANGE_COUNT + 1))
    return
  fi

  ensure_parent "$destination_path"
  ln -s "$source_path" "$destination_path"
  CHANGE_COUNT=$((CHANGE_COUNT + 1))
  echo "linked: $destination_path"
}

manage_copy() {
  local source_path="$1"
  local destination_path="$2"

  if [[ -f "$destination_path" && ! -L "$destination_path" ]] && cmp -s "$source_path" "$destination_path"; then
    echo "already copied: $destination_path"
    return
  fi

  if [[ -e "$destination_path" || -L "$destination_path" ]]; then
    if [[ "$MODE" == "--check" ]]; then
      echo "copy needed: $destination_path"
      CHANGE_COUNT=$((CHANGE_COUNT + 1))
      return
    fi
    backup_one "$destination_path"
  elif [[ "$MODE" == "--check" ]]; then
    echo "missing copy: $destination_path"
    CHANGE_COUNT=$((CHANGE_COUNT + 1))
    return
  fi

  ensure_parent "$destination_path"
  cp "$source_path" "$destination_path"
  CHANGE_COUNT=$((CHANGE_COUNT + 1))
  echo "copied: $destination_path"
}

manage_legacy_codex_skill() {
  local skill_name="$1"
  local legacy_path="$HOME/.codex/skills/$skill_name"

  if [[ ! -e "$legacy_path" && ! -L "$legacy_path" ]]; then
    return
  fi

  if [[ "$MODE" == "--check" ]]; then
    echo "legacy Codex skill to back up: $legacy_path"
    CHANGE_COUNT=$((CHANGE_COUNT + 1))
    return
  fi

  backup_one "$legacy_path"
  CHANGE_COUNT=$((CHANGE_COUNT + 1))
}

manage_legacy_claude_command() {
  local legacy_path="$HOME/.claude/commands/commit-chunk.md"

  if [[ ! -e "$legacy_path" && ! -L "$legacy_path" ]]; then
    return
  fi

  if [[ "$MODE" == "--check" ]]; then
    echo "legacy Claude command to back up: $legacy_path"
    CHANGE_COUNT=$((CHANGE_COUNT + 1))
    return
  fi

  backup_one "$legacy_path"
  CHANGE_COUNT=$((CHANGE_COUNT + 1))
}

manage_copy "$REPO_ROOT/AGENTS.md" "$HOME/.codex/AGENTS.md"
manage_copy "$REPO_ROOT/AGENTS.md" "$HOME/.claude/CLAUDE.md"
manage_legacy_claude_command

for skill_path in "$REPO_ROOT"/skills/*; do
  [[ -d "$skill_path" ]] || continue
  skill_name="$(basename "$skill_path")"
  manage_legacy_codex_skill "$skill_name"
  manage_link "$skill_path" "$HOME/.agents/skills/$skill_name"
  manage_link "$skill_path" "$HOME/.claude/skills/$skill_name"
done

if [[ "$MODE" == "--check" ]]; then
  echo "check summary: $CHANGE_COUNT change(s), $CONFLICT_COUNT conflict(s)"
  if (( CHANGE_COUNT > 0 || CONFLICT_COUNT > 0 )); then
    exit 1
  fi
else
  echo "apply summary: $CHANGE_COUNT change(s)"
  if [[ "$BACKUP_CREATED" == true ]]; then
    echo "backup root: $BACKUP_ROOT"
  fi
fi
