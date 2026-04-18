# Git Setup & Deployment Guide

**Date**: 2026-04-18  
**Status**: ✅ Git Initialized, Ready for Remote Setup

## What We've Done

✅ Initialized git repository  
✅ Configured git user (local to this repo)  
✅ Created initial commit with all Backend 500 & PixiJS v8 fixes  
✅ Committed 535 files (130,849 lines)

## Current Status

```
Branch: master
Commit: 94db24d - "Deploy Backend 500 & PixiJS v8 fixes"
Remote: Not configured yet
```

## Next Steps

You need to:
1. Create a remote repository (GitHub, GitLab, or Bitbucket)
2. Connect this local repository to the remote
3. Push the code
4. Configure AWS Amplify to deploy from the repository

---

## Step 1: Create Remote Repository

### Option A: GitHub

1. Go to https://github.com/new
2. Create a new repository:
   - Name: `experta-ai-social-manager` (or your preferred name)
   - Description: "AI-powered social media management system"
   - Visibility: Private (recommended) or Public
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
3. Click "Create repository"
4. Copy the repository URL (e.g., `https://github.com/yourusername/experta-ai-social-manager.git`)

### Option B: GitLab

1. Go to https://gitlab.com/projects/new
2. Create a new project:
   - Project name: `experta-ai-social-manager`
   - Visibility: Private (recommended)
   - **Uncheck** "Initialize repository with a README"
3. Click "Create project"
4. Copy the repository URL

### Option C: Bitbucket

1. Go to https://bitbucket.org/repo/create
2. Create a new repository:
   - Repository name: `experta-ai-social-manager`
   - Access level: Private (recommended)
   - **Uncheck** "Include a README"
3. Click "Create repository"
4. Copy the repository URL

---

## Step 2: Connect Local Repository to Remote

Once you have your remote repository URL, run these commands:

```powershell
# Add the remote repository (replace <your-repo-url> with actual URL)
git remote add origin <your-repo-url>

# Verify the remote was added
git remote -v

# Rename branch from 'master' to 'main' (modern convention)
git branch -M main

# Push code to remote repository
git push -u origin main
```

### Example with GitHub:

```powershell
git remote add origin https://github.com/yourusername/experta-ai-social-manager.git
git branch -M main
git push -u origin main
```

### If You Need Authentication:

**For HTTPS URLs:**
- GitHub: Use a Personal Access Token (not password)
  - Go to Settings → Developer settings → Personal access tokens → Generate new token
  - Select scopes: `repo` (full control of private repositories)
  - Use the token as your password when prompted

**For SSH URLs:**
- Set up SSH keys: https://docs.github.com/en/authentication/connecting-to-github-with-ssh

---

## Step 3: Configure AWS Amplify

### 3.1 Navigate to AWS Amplify Console

1. Open AWS Console: https://console.aws.amazon.com/amplify/
2. Click "New app" → "Host web app"

### 3.2 Connect Repository

1. Select your Git provider (GitHub, GitLab, or Bitbucket)
2. Click "Continue"
3. Authorize AWS Amplify to access your repositories
4. Select your repository: `experta-ai-social-manager`
5. Select branch: `main`
6. Click "Next"

### 3.3 Configure Build Settings

Amplify will auto-detect the `amplify.yml` file. Verify the configuration:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - cd frontend
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: frontend/dist
    files:
      - '**/*'
```

Click "Next"

### 3.4 Set Environment Variables

Add these environment variables in Amplify Console:

| Variable | Value | Where to Find |
|----------|-------|---------------|
| `VITE_API_URL` | Your API Gateway URL | From `sam deploy` output or CloudFormation |
| `VITE_USER_POOL_ID` | Cognito User Pool ID | From `sam deploy` output or CloudFormation |
| `VITE_USER_POOL_CLIENT_ID` | Cognito Client ID | From `sam deploy` output or CloudFormation |
| `VITE_AWS_REGION` | `us-east-1` | Your AWS region |

**To get these values:**

```powershell
# Get CloudFormation outputs
aws cloudformation describe-stacks `
  --stack-name onzo `
  --query 'Stacks[0].Outputs' `
  --output table
```

### 3.5 Deploy

1. Review all settings
2. Click "Save and deploy"
3. Wait for build to complete (5-10 minutes)
4. Access your app at the provided Amplify URL

---

## Step 4: Verify Deployment

### Backend Verification

Check CloudWatch logs for the Posts API:

```powershell
# View recent logs
aws logs tail /aws/lambda/onzo-posts-api-dev --follow

# Check for 403 responses (not 500)
aws logs filter-log-events `
  --log-group-name /aws/lambda/onzo-posts-api-dev `
  --filter-pattern "403"
```

### Frontend Verification

1. Open the Amplify URL in your browser
2. Open browser console (F12)
3. Check for:
   - ✅ No PixiJS deprecation warnings
   - ✅ No 500 errors
   - ✅ Authentication checks working
   - ✅ Game visuals rendering correctly

### Test Scenarios

1. **Unauthenticated User**
   - Open GameView without logging in
   - Should see "Please log in to view the game" message

2. **No Brand Association**
   - Log in with account that has no brand
   - Open GameView
   - Should see "Please complete onboarding" message
   - Backend should return 403 (not 500)

3. **Valid Authentication**
   - Log in with valid account
   - Open GameView
   - Game should load successfully
   - No errors in console

---

## Continuous Deployment

Once set up, Amplify automatically deploys on every push to the `main` branch:

```powershell
# Make changes to your code
# ...

# Commit changes
git add .
git commit -m "Your commit message"

# Push to trigger deployment
git push origin main
```

Amplify will:
1. Detect the push
2. Start a new build
3. Run tests (if configured)
4. Deploy to production
5. Notify you of success/failure

---

## Git Configuration (Optional)

### Update Git User Info

If you want to use your actual name and email:

```powershell
# Set your name and email for this repository
git config user.name "Your Name"
git config user.email "your.email@example.com"

# Or set globally for all repositories
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### Create .gitattributes for Line Endings

To handle line ending warnings:

```powershell
# Create .gitattributes file
echo "* text=auto" > .gitattributes
git add .gitattributes
git commit -m "Add .gitattributes for line ending normalization"
```

---

## Troubleshooting

### Issue: "Permission denied" when pushing

**Solution**: Set up authentication (see Step 2 above)

### Issue: Amplify build fails

**Solution**: 
1. Check build logs in Amplify Console
2. Verify environment variables are set correctly
3. Ensure `frontend/package.json` has all dependencies

### Issue: CORS errors in browser

**Solution**:
1. Verify API Gateway CORS configuration in `template.yaml`
2. Ensure `AllowOrigin` includes your Amplify domain
3. Redeploy backend: `sam build && sam deploy`

### Issue: 404 on page refresh

**Solution**: Add rewrite rule in Amplify Console:
1. Go to Amplify Console → Rewrites and redirects
2. Add rule:
   - Source: `</^[^.]+$|\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|ttf)$)([^.]+$)/>`
   - Target: `/index.html`
   - Type: `200 (Rewrite)`

---

## Summary

Current state:
- ✅ Git repository initialized
- ✅ Initial commit created with all fixes
- ⏳ Remote repository needs to be created
- ⏳ Code needs to be pushed
- ⏳ Amplify needs to be configured

Next action: Create a remote repository and follow Step 2 above.

---

## Quick Reference Commands

```powershell
# Check git status
git status

# View commit history
git log --oneline

# View remote repositories
git remote -v

# Push changes
git push origin main

# Pull latest changes
git pull origin main

# Create a new branch
git checkout -b feature-name

# Switch branches
git checkout main
```

---

## Documentation References

- Git Documentation: https://git-scm.com/doc
- GitHub Docs: https://docs.github.com
- AWS Amplify Docs: https://docs.aws.amazon.com/amplify/
- Backend 500 Fix Documentation: `BACKEND_500_PIXIJS_V8_DOCUMENTATION.md`
- Deployment Checklist: `BACKEND_500_PIXIJS_V8_DEPLOYMENT_COMPLETE.md`

