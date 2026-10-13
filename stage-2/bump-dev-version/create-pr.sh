#!/usr/bin/env bash
set -euo pipefail
export PS4='+ \[\033[0;34m\]' # blue to stand out in logs

original_commit="$(git rev-parse HEAD)"
head_branch="bump-${VERSION}"

# Update __init__.py:
pattern="(__version__ ?= ?['\"]).*(['\"])"
sed -i -E "s/${pattern}/\1${VERSION}\2/" "$INIT_FILE"

if git diff --quiet -- "$INIT_FILE"; then
    echo "::error::No changes to ${INIT_FILE} occurred"
    exit 1
fi

# Commit & push
set -x

git checkout -b "$head_branch"
git add "$INIT_FILE"

git status
git commit -m "Bump version to ${VERSION}"
git push

set +x

# Create PR:
title="🤖 Bump version to ${VERSION}"

body="
I have attempted to guess the next dev version.
If it is not correct, please push to this branch.

---

Workflow: \`${GITHUB_WORKFLOW}\`, run: ${GITHUB_RUN_NUMBER}
"

set -x

gh pr create -R "$GITHUB_REPOSITORY" \
    -H "$head_branch" -B "$BASE_BRANCH" -t "$title" -b "$body" -r "$REVIEWER"

# Add 'small' label if it exists, else no worries
gh pr edit "$head_branch" -R "$GITHUB_REPOSITORY" --add-label 'small' || true

git checkout "$original_commit"

set +x
