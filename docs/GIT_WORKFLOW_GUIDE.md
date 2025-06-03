# Git Workflow & Safety Guide

CRITICAL: Never push to main without confirmation. Always follow this workflow.

FOR AI ASSISTANTS: Always follow this workflow. Never suggest pushing directly to main branch without explicit user confirmation that everything is tested and working.

## BRANCH STRUCTURE

main                    <- Production/Live (PROTECTED)
├── stable-backup      <- Safe backup state
├── development        <- Integration branch
└── feature/*          <- Individual features

## BRANCH PURPOSES

main: Production-ready code that triggers live deployment
stable-backup: Last known working state (safety net)
development: Integration and testing branch
feature/*: Individual feature development

## DEVELOPMENT WORKFLOW

Initial Setup (One Time):
```bash
# Create stable backup from current working state
git checkout -b stable-backup
git push origin stable-backup

# Create development branch
git checkout -b development
git push origin development

# Set development as default working branch
git checkout development
```

Feature Development:
```bash
# Always start from development
git checkout development
git pull origin development

# Create feature branch
git checkout -b feature/descriptive-name

# Work on your changes...
# Test locally first!

# Stage and commit
git add .
git commit -m "feat: descriptive commit message"

# Push feature branch
git push origin feature/descriptive-name
```

Testing & Integration:
```bash
# Merge to development for testing
git checkout development
git merge feature/descriptive-name

# TEST EVERYTHING:
# - Run npm start (frontend)
# - Run npm run build
# - Test all functionality
# - Check Debug tab
# - Test error handling
# - Verify no regressions

# If tests pass, push to development
git push origin development
```

Production Deployment (Only After User Approval):
```bash
# USER MUST CONFIRM: "Everything tested and working"
# Only then merge to main

git checkout main
git pull origin main
git merge development

# Final verification before deployment
echo "FINAL CHECK: About to deploy to production"
echo "All tests passed?"
echo "User confirmed everything working?"
echo "No breaking changes?"

# If yes to all above:
git push origin main  # This triggers Vercel deployment
```

## SAFETY PROTOCOLS

Emergency Rollback:
```bash
# If something breaks in production
git checkout main
git reset --hard stable-backup
git push origin main --force

# Update stable backup when everything is confirmed working
git checkout stable-backup
git reset --hard main
git push origin stable-backup --force
```

Before Any Main Push - Checklist:
- All features tested locally
- Frontend builds successfully (npm run build)
- No console errors
- Debug tools working
- Error handling tested
- User explicitly confirmed ready for production
- Stable backup is up to date

## AI ASSISTANT GUIDELINES

DO:
- Suggest working on feature branches
- Recommend thorough testing
- Ask for user confirmation before main deployment
- Suggest creating backups
- Guide through proper merge process

DO NOT:
- Push directly to main without testing
- Skip the development branch
- Deploy without user confirmation
- Merge untested code
- Override safety checks

## AUTOMATED COMMANDS

Quick Feature Start:
```bash
# Save as: start-feature.sh
git checkout development
git pull origin development
echo "Enter feature name:"
read feature_name
git checkout -b feature/$feature_name
echo "Feature branch created: feature/$feature_name"
```

Pre-Deployment Check:
```bash
# Save as: pre-deploy-check.sh
echo "Running pre-deployment checks..."

# Build check
cd frontend
npm run build
if [ $? -ne 0 ]; then
    echo "Build failed! Fix errors before deploying."
    exit 1
fi

echo "Build successful"
echo "Manual testing required:"
echo "1. Test all functionality"
echo "2. Check Debug tab"
echo "3. Verify error handling"
echo "4. Confirm no regressions"
echo ""
echo "Type 'DEPLOY' to continue to production:"
read confirmation

if [ "$confirmation" = "DEPLOY" ]; then
    echo "Proceeding to production deployment"
else
    echo "Deployment cancelled"
    exit 1
fi
```

## COMMIT MESSAGE FORMAT

```bash
feat: add new feature
fix: bug fix
docs: documentation changes
style: formatting, missing semicolons, etc
refactor: code refactoring
test: adding tests
chore: maintenance tasks
```

## EXAMPLE WORKFLOW SESSION

```bash
# Start new feature
git checkout development
git checkout -b feature/enhanced-error-handling

# Make changes, test locally
git add .
git commit -m "feat: enhance JSON parsing error handling"

# Test in development
git checkout development
git merge feature/enhanced-error-handling
git push origin development

# After testing, get user approval for production
git checkout main
git merge development
git push origin main
```

## CURRENT PROJECT STATUS

Current branch: development
Railway linked: Project "SmurfGaurd"
User logged in: rei.ale01@gmail.com
All tests: 19/19 passing
Frontend: Live on Vercel
Backend: Live on Railway

## EMERGENCY CONTACTS

If deployment fails:
1. Check Railway logs
2. Verify Vercel build status
3. Roll back to stable-backup if needed
4. Contact user immediately

## VERIFICATION COMMANDS

Check current status:
- git status
- railway status
- git branch -a
- npx jest (run tests)
- npm run build (verify frontend builds) 