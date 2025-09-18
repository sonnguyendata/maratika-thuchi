#!/bin/bash

# Simple deployment script - commits and pushes to both branches
# Usage: ./deploy.sh "commit message"

if [ $# -eq 0 ]; then
    echo "Usage: ./deploy.sh \"commit message\""
    echo "Example: ./deploy.sh \"Fix authentication issue\""
    exit 1
fi

COMMIT_MSG="$1"
CURRENT_BRANCH=$(git branch --show-current)

echo "🚀 Deploying changes..."
echo "Current branch: $CURRENT_BRANCH"
echo "Commit message: $COMMIT_MSG"

# Add all changes
git add .

# Commit changes
git commit -m "$COMMIT_MSG"

# Push to current branch
git push origin $CURRENT_BRANCH

# If we're on main, also push to codex branch
if [ "$CURRENT_BRANCH" = "main" ]; then
    echo "📦 Also updating codex branch..."
    git checkout codex/add-declaration-file-for-pdf-parse-module
    git merge main
    git push origin codex/add-declaration-file-for-pdf-parse-module
    git checkout main
    echo "✅ Both branches updated!"
else
    echo "✅ Branch $CURRENT_BRANCH updated!"
fi

echo "🎉 Deployment complete!"
