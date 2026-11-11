#!/bin/bash

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EXPECTED_SKILL_COUNT=39
ERROR_COUNT=0
SKILL_COUNT=0
USER_INVOKED_COUNT=0
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

  # An unquoted description containing ": " is invalid YAML for strict parsers.
  if awk '
    NR == 1 && $0 != "---" { exit 1 }
    NR > 1 && $0 == "---" { exit bad ? 0 : 1 }
    /^description:[[:space:]]*[^"'"'"'>|[:space:]].*: / { bad=1 }
    END { if (!bad) exit 1 }
  ' "$skill_file"; then
    fail "unquoted description containing ': ' (invalid YAML): $skill_file"
  fi

  case "$SEEN_NAMES" in
    *"|$frontmatter_name|"*) fail "duplicate skill name: $frontmatter_name" ;;
    *) SEEN_NAMES="${SEEN_NAMES}${frontmatter_name}|" ;;
  esac

  # A user-invoked skill must be user-invoked for both agents.
  claude_user_invoked=no
  if awk '
    NR == 1 && $0 != "---" { exit 1 }
    NR > 1 && $0 == "---" { exit found ? 0 : 1 }
    /^disable-model-invocation:[[:space:]]*true[[:space:]]*$/ { found=1 }
    END { if (!found) exit 1 }
  ' "$skill_file"; then
    claude_user_invoked=yes
    USER_INVOKED_COUNT=$((USER_INVOKED_COUNT + 1))
  fi
  codex_user_invoked=no
  if grep -q 'allow_implicit_invocation:[[:space:]]*false' "$skill_path/agents/openai.yaml" 2>/dev/null; then
    codex_user_invoked=yes
  fi
  if [[ "$claude_user_invoked" != "$codex_user_invoked" ]]; then
    fail "invocation mismatch between SKILL.md and agents/openai.yaml: $skill_name"
  fi

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

MOD_COUNT=0
for mod_path in "$REPO_ROOT"/mods/*; do
  [[ -d "$mod_path" ]] || continue
  mod_name="$(basename "$mod_path")"
  MOD_COUNT=$((MOD_COUNT + 1))

  if [[ ! -f "$mod_path/hooks/hooks.json" ]]; then
    fail "missing hooks/hooks.json: $mod_path"
  fi
  manifest_name="$(jq -r '.name // empty' "$mod_path/.claude-plugin/plugin.json" 2>/dev/null || true)"
  if [[ "$manifest_name" != "$mod_name" ]]; then
    fail "mod manifest name '$manifest_name' does not match '$mod_name'"
  fi
done

if (( ERROR_COUNT > 0 )); then
  echo "repository check failed: $ERROR_COUNT error(s)" >&2
  exit 1
fi

echo "repository check passed: $SKILL_COUNT universal skills ($USER_INVOKED_COUNT user-invoked), $MOD_COUNT Claude Code mods"
