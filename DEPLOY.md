# 🚀 One-Click Deployment Scripts

## Quick Deploy (Recommended)
For small fixes and quick changes:
```bash
./quick-deploy.sh
```
or
```bash
npm run quick
```

## Custom Deploy
For changes that need a specific commit message:
```bash
./deploy.sh "Your commit message here"
```
or
```bash
npm run deploy "Your commit message here"
```

## What These Scripts Do
1. ✅ Add all changes (`git add .`)
2. ✅ Commit with message
3. ✅ Push to current branch
4. ✅ If on `main`, also update `codex` branch
5. ✅ Switch back to `main`

## Before These Scripts
- `git add .`
- `git commit -m "message"`
- `git push origin main`
- `git checkout codex/add-declaration-file-for-pdf-parse-module`
- `git merge main`
- `git push origin codex/add-declaration-file-for-pdf-parse-module`
- `git checkout main`

## After These Scripts
- `./quick-deploy.sh` ✨

**That's it! One command instead of 7!** 🎉
