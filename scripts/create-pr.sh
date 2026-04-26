#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────
# create-pr.sh — Create a pull request from a worktree branch
#
# Usage:
#   ./scripts/create-pr.sh BRANCH_NAME "PR title" [PR body file]
#
# If no body file is provided, a short default body is used.
# The script stages all changes, commits, pushes, and creates a PR.
#
# Requirements:
#   - gh CLI authenticated (gh auth status)
#   - Git configured with origin remote
# ──────────────────────────────────────────────────────────────

set -euo pipefail

if [ $# -lt 2 ]; then
  echo "Usage: $0 BRANCH_NAME \"PR title\" [PR body file]"
  exit 1
fi

BRANCH="$1"
TITLE="$2"
BODY_FILE="${3:-}"

# Step 1: Ensure we're on the right branch
CURRENT_BRANCH=$(git symbolic-ref --short HEAD 2>/dev/null || echo "DETACHED")
if [ "$CURRENT_BRANCH" = "DETACHED" ]; then
  echo "⚠️  Detached HEAD detected."
  if git show-ref --verify --quiet "refs/heads/$BRANCH"; then
    git checkout "$BRANCH"
  else
    git checkout -b "$BRANCH"
  fi
elif [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
  echo "⚠️  Currently on branch '$CURRENT_BRANCH', not '$BRANCH'."
  echo "   Either rename the branch or update the parameter."
  exit 1
fi

# Step 2: Stage and commit
echo "→ Staging all changes..."
git add -A

if git diff --cached --quiet; then
  echo "→ No changes to commit."
else
  git commit -m "$TITLE"
fi

# Step 3: Push
echo "→ Pushing branch '$BRANCH' to origin..."
git push -u origin "$BRANCH" 2>&1

# Step 4: Create PR
echo "→ Creating pull request..."
if [ -n "$BODY_FILE" ] && [ -f "$BODY_FILE" ]; then
  gh pr create --base main --head "$BRANCH" --title "$TITLE" --body-file "$BODY_FILE"
else
  gh pr create --base main --head "$BRANCH" --title "$TITLE" --body "Automated PR from \`$BRANCH\`. Please review."
fi

echo "✅ PR created successfully."
