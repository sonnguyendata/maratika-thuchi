#!/bin/bash

# Quick deploy script - for small fixes
# Usage: ./quick-deploy.sh

COMMIT_MSG="Quick fix: $(date '+%Y-%m-%d %H:%M')"
CURRENT_BRANCH=$(git branch --show-current)

echo "⚡ Quick deploy..."
echo "Branch: $CURRENT_BRANCH"
echo "Message: $COMMIT_MSG"

# Add all changes and commit
git add . && git commit -m "$COMMIT_MSG"

# Push to current branch
git push origin $CURRENT_BRANCH

# If on main, also update codex branch
if [ "$CURRENT_BRANCH" = "main" ]; then
    git checkout codex/add-declaration-file-for-pdf-parse-module
    git merge main
    git push origin codex/add-declaration-file-for-pdf-parse-module
    git checkout main
fi

echo "✅ Done!"
