#!/usr/bin/env bash
# Blocks Bash tool calls that would commit to main or push to origin/main directly.
# All work in mind-court must go through a feature branch + PR.

input=$(cat)
cmd=$(printf '%s' "$input" | jq -r '.tool_input.command // ""' 2>/dev/null || true)

if [[ -z "$cmd" ]]; then
  exit 0
fi

# Only enforce inside the mind-court working tree.
project_dir="${CLAUDE_PROJECT_DIR:-$(pwd)}"
toplevel=$(git -C "$project_dir" rev-parse --show-toplevel 2>/dev/null || true)
if [[ "$toplevel" != *"/mind-court" ]]; then
  exit 0
fi

branch=$(git -C "$project_dir" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")

block() {
  cat >&2 <<EOF
BLOCKED: $1

All work in mind-court must land on main via a merged PR. Workflow:
  git checkout -b <type>/<short-name>
  # commit on the branch
  git push -u origin HEAD
  gh pr create

(See CLAUDE.md "Workflow" section. To bypass intentionally, the user must run the command directly outside of Claude.)
EOF
  exit 2
}

# --- git commit on main ---
if [[ "$branch" == "main" ]]; then
  if [[ "$cmd" =~ (^|[[:space:]\;\|\&])git[[:space:]]+commit([[:space:]]|$) ]]; then
    block "direct commit to main."
  fi
fi

# --- git push that targets main explicitly ---
if [[ "$cmd" =~ git[[:space:]]+push[[:space:]].*[[:space:]]main([[:space:]]|$) ]]; then
  block "explicit push to main."
fi

# --- bare 'git push' or 'git push origin' while on main ---
if [[ "$branch" == "main" ]]; then
  if [[ "$cmd" =~ (^|[[:space:]\;\|\&])git[[:space:]]+push([[:space:]]+origin)?([[:space:]]|$) ]]; then
    block "push from main (would push to origin/main)."
  fi
fi

# --- force push to main from anywhere ---
if [[ "$cmd" =~ git[[:space:]]+push.*(-f|--force|--force-with-lease).*main ]]; then
  block "force push touching main."
fi

exit 0
