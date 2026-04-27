# Deploy Landing Page to GitHub - Quick Guide

**Status:** ✅ Build Complete - Ready to Deploy
**Date:** 2026-04-27

## Build Status

✅ Production build completed successfully
- Build output: `frontend/dist/`
- Bundle size: ~1.2 MB (optimized)
- All assets generated

## Deploy Steps

### Step 1: Check Git Status

```powershell
git status
```

### Step 2: Add All Files

```powershell
git add .
```

### Step 3: Commit Changes

```powershell
git commit -m "feat: landing page redesign complete - tasks 1-16

- Implemented complete design system
- Created all landing page sections (Hero, Services, Process, Metrics, Testimonials, Pricing, FAQ, Contact)
- Added performance optimizations and lazy loading
- Implemented comprehensive test suite (80+ tests)
- Production build ready for deployment"
```

### Step 4: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `experta-landing-page` (or your choice)
3. Description: "Modern landing page for Experta - AI-powered social media management"
4. Visibility: Public (for GitHub Pages)
5. **DO NOT** check "Initialize with README"
6. Click "Create repository"

### Step 5: Connect to GitHub

Replace `YOUR_USERNAME` and `YOUR_REPO` with your actual values:

```powershell
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

**Example:**
```powershell
git remote add origin https://github.com/joaosilva/experta-landing-page.git
git branch -M main
git push -u origin main
```

### Step 6: Configure GitHub Pages

#### Option A: Using GitHub Actions (Recommended)

1. Go to your repository on GitHub
2. Click "Settings" tab
3. Click "Pages" in the left sidebar
4. Under "Build and deployment":
   - Source: Select "GitHub Actions"
5. The workflow file is already in `.github/workflows/deploy-landing-page.yml`
6. Push will trigger automatic deployment

#### Option B: Direct Deployment

1. Go to your repository on GitHub
2. Click "Settings" tab
3. Click "Pages" in the left sidebar
4. Under "Build and deployment":
   - Source: Select "Deploy from a branch"
   - Branch: Select "main"
   - Folder: Select "/ (root)"
5. Click "Save"
6. Wait 2-5 minutes

### Step 7: Verify Deployment

1. Go to "Actions" tab in your repository
2. Watch the deployment workflow run
3. When complete (green checkmark), your site is live!
4. Access at: `https://YOUR_USERNAME.github.io/YOUR_REPO/`

## Important: Configure Base Path

If your repository is NOT at the root (e.g., `username.github.io/repo-name`), you need to configure the base path:

### Update vite.config.js

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/YOUR_REPO_NAME/', // Add this line
})
```

### Update package.json

Add homepage field:

```json
{
  "name": "frontend",
  "homepage": "https://YOUR_USERNAME.github.io/YOUR_REPO_NAME",
  ...
}
```

Then rebuild and redeploy:

```powershell
cd frontend
npm run build
cd ..
git add .
git commit -m "chore: configure base path for GitHub Pages"
git push origin main
```

## Troubleshooting

### Problem: "fatal: not a git repository"

**Solution:**
```powershell
git init
```

### Problem: "remote origin already exists"

**Solution:**
```powershell
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
```

### Problem: "Permission denied (publickey)"

**Solution:** Use HTTPS with Personal Access Token:

1. Go to GitHub Settings > Developer settings > Personal access tokens > Tokens (classic)
2. Generate new token with `repo` scope
3. Use token as password when pushing:

```powershell
git remote set-url origin https://YOUR_TOKEN@github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### Problem: "404 Not Found" after deployment

**Solutions:**
1. Wait 5-10 minutes for DNS propagation
2. Check GitHub Pages settings are correct
3. Verify the base path is configured correctly
4. Clear browser cache (Ctrl+Shift+R)

### Problem: Blank page or routing issues

**Solution:** Add 404.html redirect:

Create `frontend/public/404.html`:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Experta</title>
    <script>
      sessionStorage.redirect = location.href;
    </script>
    <meta http-equiv="refresh" content="0;URL='/'">
  </head>
</html>
```

Then rebuild and redeploy.

## Quick Commands Reference

```powershell
# Check status
git status

# Add all changes
git add .

# Commit
git commit -m "your message"

# Push
git push origin main

# View remotes
git remote -v

# View branches
git branch -a

# View commit history
git log --oneline -10
```

## GitHub Actions Workflow

The workflow file `.github/workflows/deploy-landing-page.yml` is already configured to:

1. Trigger on push to main branch (when frontend files change)
2. Install Node.js 18
3. Install dependencies
4. Build the frontend
5. Deploy to GitHub Pages

No additional configuration needed!

## Custom Domain (Optional)

To use a custom domain like `www.experta.com.br`:

1. In GitHub Pages settings, add custom domain
2. In your DNS provider, add:
   - CNAME record: `www` → `YOUR_USERNAME.github.io`
   - A records for `@`:
     - 185.199.108.153
     - 185.199.109.153
     - 185.199.110.153
     - 185.199.111.153

## Next Steps After Deployment

1. ✅ Test the live site on different devices
2. ✅ Verify all sections render correctly
3. ✅ Test all CTAs and links
4. ✅ Check responsive behavior
5. ✅ Test form submission
6. ✅ Verify performance (Lighthouse)
7. ✅ Add Google Analytics (optional)
8. ✅ Configure custom domain (optional)

## Summary

✅ Landing page complete (Tasks 1-16)
✅ Production build successful
✅ Ready for GitHub deployment
✅ GitHub Actions workflow configured
✅ Deployment guides created

**Your site will be live at:**
`https://YOUR_USERNAME.github.io/YOUR_REPO/`

---

Need help? Check the detailed guide in `GITHUB_DEPLOY_LANDING_PAGE_GUIDE.md`
