#!/bin/bash

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EXPECTED_SKILL_COUNT=28
ERROR_COUNT=0
SKILL_COUNT=0
SEEN_NAMES="|"

fail() {
  echo "ERROR: $1" >&2
  ERROR_COUNT=$((ERROR_COUNT + 1))
}

for skill_path in "$REPO_ROOT"/skills/*; do
  [[ -d "$skill_path" ]] || continue
  skill_name="$(basename "$skill_path")"
  skill_file="$skill_path/SKILL.md"
  SKILL_COUNT=$((SKILL_COUNT + 1))

  if [[ ! -f "$skill_file" ]]; then
    fail "missing SKILL.md: $skill_path"
    continue
  fi

  frontmatter_name="$(awk '
    NR == 1 && $0 != "---" { exit }
    NR > 1 && $0 == "---" { exit }
    /^name:[[:space:]]*/ {
      sub(/^name:[[:space:]]*/, "")
      gsub(/^['"'"']|['"'"']$/, "")
      print
      exit
    }
  ' "$skill_file")"

  if [[ -z "$frontmatter_name" ]]; then
    fail "missing frontmatter name: $skill_file"
  elif [[ "$frontmatter_name" != "$skill_name" ]]; then
    fail "frontmatter name '$frontmatter_name' does not match '$skill_name'"
  fi

  if ! awk '
    NR == 1 && $0 != "---" { exit 1 }
    NR > 1 && $0 == "---" { exit found ? 0 : 1 }
    /^description:[[:space:]]*[^[:space:]]/ { found=1 }
    END { if (!found) exit 1 }
  ' "$skill_file"; then
    fail "missing non-empty frontmatter description: $skill_file"
  fi

  case "$SEEN_NAMES" in
    *"|$frontmatter_name|"*) fail "duplicate skill name: $frontmatter_name" ;;
    *) SEEN_NAMES="${SEEN_NAMES}${frontmatter_name}|" ;;
  esac

done

if (( SKILL_COUNT != EXPECTED_SKILL_COUNT )); then
  fail "expected $EXPECTED_SKILL_COUNT skills, found $SKILL_COUNT"
fi

if rg -n \
  -e '^allowed-tools:' \
  -e 'mcp__' \
  -e 'TaskCreate|TaskUpdate|TaskList|AskUserQuestion' \
  -e 'claude-in-chrome' \
  -e '~/.claude/skills|~/.codex/skills|~/.agents/skills' \
  -e '/Users/' \
  "$REPO_ROOT/skills"; then
  fail "agent-specific tool names or installation paths remain in skills"
fi

if rg -ni 'write[^\n]*(\.claude|\.codex|\.Codex)/(checkpoints|journal)|write[^\n]*\.claude/handover' "$REPO_ROOT/skills"; then
  fail "a skill still writes mutable state to an agent-specific directory"
fi

if (( ERROR_COUNT > 0 )); then
  echo "repository check failed: $ERROR_COUNT error(s)" >&2
  exit 1
fi

echo "repository check passed: $SKILL_COUNT universal skills"
