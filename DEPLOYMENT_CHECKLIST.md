# Deployment Checklist: Structural Updates

## 📋 Pre-Deployment

### Code Review
- [x] Backend code reviewed
- [x] Frontend code reviewed
- [x] No console.log statements in production code
- [x] Error handling implemented
- [x] Security measures in place
- [x] Documentation complete

### Dependencies
- [ ] Run `npm install` in `functions/admin-settings/`
- [ ] Run `npm install` in `functions/delete-account/`
- [ ] Run `npm install` in `frontend/`
- [ ] Verify all dependencies up to date
- [ ] Check for security vulnerabilities

### Environment Variables
- [ ] Verify `VITE_API_URL` in frontend
- [ ] Verify AWS region configured
- [ ] Verify Cognito User Pool ID
- [ ] Verify all Lambda environment variables

---

## 🔧 Backend Deployment

### Step 1: Install Dependencies
```bash
cd functions/admin-settings
npm install

cd ../delete-account
npm install

cd ../..
```

### Step 2: Build SAM Application
```bash
sam build
```

**Expected Output**:
- ✅ All Lambda functions built successfully
- ✅ Layers packaged correctly
- ✅ No build errors

### Step 3: Deploy to AWS
```bash
sam deploy --guided
```

**Configuration**:
- Stack Name: `experta-dev` (or your stack name)
- AWS Region: `us-east-1` (or your region)
- Confirm changes: `Y`
- Allow SAM CLI IAM role creation: `Y`
- Save arguments to config: `Y`

**Expected Output**:
- ✅ CloudFormation stack created/updated
- ✅ All resources deployed
- ✅ API Gateway URL displayed
- ✅ No deployment errors

### Step 4: Verify Backend Deployment
```bash
# List Lambda functions
aws lambda list-functions --query 'Functions[?contains(FunctionName, `experta`)].FunctionName'

# Check admin-settings function
aws lambda get-function --function-name experta-admin-settings-dev

# Check delete-account function
aws lambda get-function --function-name experta-delete-account-dev
```

**Verify**:
- [ ] admin-settings function exists
- [ ] delete-account function exists
- [ ] Both functions have correct runtime (nodejs18.x)
- [ ] Both functions have correct IAM role
- [ ] CloudWatch log groups created

---

## 🎨 Frontend Deployment

### Step 1: Update Environment Variables
```bash
cd frontend

# Create or update .env.production
echo "VITE_API_URL=https://your-api-gateway-url.amazonaws.com/dev" > .env.production
```

### Step 2: Build Frontend
```bash
npm run build
```

**Expected Output**:
- ✅ Build completes successfully
- ✅ `dist/` directory created
- ✅ No build errors or warnings
- ✅ Assets optimized

### Step 3: Deploy to Amplify
```bash
# Commit changes
git add .
git commit -m "Add user management pages and structural updates"

# Push to main branch (Amplify auto-deploys)
git push origin main
```

**Amplify Console**:
- [ ] Build starts automatically
- [ ] Build completes successfully
- [ ] Deployment successful
- [ ] New version live

### Step 4: Verify Frontend Deployment
Visit your Amplify URL and check:
- [ ] Homepage loads
- [ ] Login page works
- [ ] Dashboard loads
- [ ] User menu appears
- [ ] Profile settings page loads
- [ ] Connect accounts page loads
- [ ] Delete account page loads

---

## 🧪 Post-Deployment Testing

### Backend API Tests

#### Test Admin Settings
```bash
# Get auth token (replace with your method)
TOKEN="your-jwt-token"

# Test save Instagram settings
curl -X POST https://your-api-url/dev/admin/settings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "instagram",
    "credentials": {
      "appId": "test-app-id",
      "appSecret": "test-app-secret",
      "redirectUri": "https://example.com/callback"
    }
  }'

# Test get Instagram settings
curl -X GET "https://your-api-url/dev/admin/settings?platform=instagram" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected**:
- [ ] POST returns 200 with success message
- [ ] GET returns 200 with masked credentials
- [ ] Secrets created in Secrets Manager
- [ ] CloudWatch logs show operations

#### Test Delete Account
```bash
# Test without confirmation (should fail)
curl -X DELETE https://your-api-url/dev/account \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"confirmation": "wrong"}'

# Test with correct confirmation
curl -X DELETE https://your-api-url/dev/account \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"confirmation": "DELETE MY ACCOUNT"}'
```

**Expected**:
- [ ] First request returns 400 error
- [ ] Second request returns 200 with deletion summary
- [ ] All user data deleted from DynamoDB
- [ ] S3 objects deleted
- [ ] EventBridge rules deleted
- [ ] Secrets deleted
- [ ] Cognito user disabled

### Frontend UI Tests

#### User Menu
- [ ] User menu appears in Dashboard
- [ ] User menu appears in Onboarding
- [ ] Avatar shows user's first letter
- [ ] Dropdown opens on click
- [ ] Dropdown closes on outside click
- [ ] All menu items navigate correctly
- [ ] Logout works

#### Profile Settings Page
- [ ] Page loads without errors
- [ ] User email displays correctly
- [ ] Display name shows current value
- [ ] Edit button enables name field
- [ ] Save button works (when API ready)
- [ ] Cancel button reverts changes
- [ ] Navigate to connections works
- [ ] Navigate to delete account works
- [ ] Back to dashboard works

#### Connect Accounts Page
- [ ] Page loads without errors
- [ ] Coming soon banner displays
- [ ] Instagram card renders
- [ ] LinkedIn card renders
- [ ] Connect buttons are disabled
- [ ] FAQ section displays
- [ ] Back to dashboard works

#### Delete Account Page
- [ ] Page loads without errors
- [ ] Warning message displays
- [ ] List of deletions shows
- [ ] User email displays
- [ ] Confirmation input works
- [ ] Delete button disabled until confirmation typed
- [ ] Delete button enabled with correct confirmation
- [ ] API call succeeds
- [ ] Deletion summary displays
- [ ] User logged out after 3 seconds
- [ ] Redirect to login works

### Mobile Testing
- [ ] Test on iPhone (Safari)
- [ ] Test on Android (Chrome)
- [ ] Test on tablet
- [ ] User menu works on mobile
- [ ] All pages responsive
- [ ] Forms work on mobile
- [ ] Navigation works on mobile

---

## 🔍 Verification Checklist

### AWS Console Checks

#### Lambda Functions
- [ ] admin-settings function deployed
- [ ] delete-account function deployed
- [ ] Both functions have correct environment variables
- [ ] Both functions have correct IAM role
- [ ] Both functions have correct timeout (30s for admin, 300s for delete)
- [ ] Both functions have correct memory (512MB for admin, 1024MB for delete)

#### API Gateway
- [ ] POST /admin/settings endpoint exists
- [ ] GET /admin/settings endpoint exists
- [ ] DELETE /account endpoint exists
- [ ] All endpoints have Cognito authorizer
- [ ] CORS configured correctly

#### CloudWatch
- [ ] Log group for admin-settings exists (30-day retention)
- [ ] Log group for delete-account exists (90-day retention)
- [ ] Logs are being written
- [ ] No error logs (except expected test errors)

#### Secrets Manager
- [ ] Test secrets created successfully
- [ ] Secrets encrypted with KMS
- [ ] Secrets have correct tags
- [ ] Secrets accessible by Lambda functions

#### IAM
- [ ] Lambda execution role has Secrets Manager permissions
- [ ] Lambda execution role has Cognito permissions
- [ ] Lambda execution role has DynamoDB permissions
- [ ] Lambda execution role has S3 permissions
- [ ] Lambda execution role has EventBridge permissions

### Frontend Checks

#### Routing
- [ ] /profile route works
- [ ] /connections route works
- [ ] /delete-account route works
- [ ] All routes require authentication
- [ ] Redirect to login if not authenticated

#### Components
- [ ] UserMenu component renders
- [ ] ProfileSettings page renders
- [ ] ConnectAccounts page renders
- [ ] DeleteAccount page renders
- [ ] No console errors
- [ ] No React warnings

#### API Integration
- [ ] API base URL configured correctly
- [ ] JWT token included in requests
- [ ] Error handling works
- [ ] Loading states work
- [ ] Success messages display

---

## 🚨 Rollback Plan

### If Backend Deployment Fails
```bash
# Rollback CloudFormation stack
aws cloudformation rollback-stack --stack-name experta-dev

# Or delete and redeploy
aws cloudformation delete-stack --stack-name experta-dev
sam deploy --guided
```

### If Frontend Deployment Fails
```bash
# Revert git commit
git revert HEAD
git push origin main

# Or rollback in Amplify Console
# Go to Amplify Console → App → Deployments → Redeploy previous version
```

### If Issues Found After Deployment
1. Check CloudWatch logs for errors
2. Verify environment variables
3. Check IAM permissions
4. Test API endpoints manually
5. Review frontend console for errors
6. Rollback if necessary

---

## 📊 Success Criteria

### Backend
- ✅ All Lambda functions deployed
- ✅ All API endpoints working
- ✅ Secrets Manager integration working
- ✅ Cascade deletion working
- ✅ CloudWatch logs showing operations
- ✅ No errors in logs

### Frontend
- ✅ All pages loading
- ✅ User menu working
- ✅ Navigation working
- ✅ Forms working
- ✅ API calls succeeding
- ✅ Responsive on all devices
- ✅ No console errors

### Integration
- ✅ Frontend can call backend APIs
- ✅ Authentication working
- ✅ Delete account flow working end-to-end
- ✅ Error handling working
- ✅ Loading states working

---

## 📝 Post-Deployment Tasks

### Documentation
- [ ] Update API documentation
- [ ] Update user guide
- [ ] Update developer documentation
- [ ] Create release notes

### Monitoring
- [ ] Set up CloudWatch alarms
- [ ] Monitor error rates
- [ ] Monitor API latency
- [ ] Monitor user activity

### Communication
- [ ] Notify team of deployment
- [ ] Update stakeholders
- [ ] Announce new features to users
- [ ] Provide training if needed

---

## 🎯 Final Checklist

### Before Going Live
- [ ] All tests passing
- [ ] No critical bugs
- [ ] Performance acceptable
- [ ] Security reviewed
- [ ] Documentation complete
- [ ] Rollback plan ready
- [ ] Team notified
- [ ] Monitoring in place

### Go Live
- [ ] Deploy backend
- [ ] Deploy frontend
- [ ] Verify deployment
- [ ] Run smoke tests
- [ ] Monitor for issues
- [ ] Be ready to rollback

### After Go Live
- [ ] Monitor CloudWatch logs
- [ ] Check error rates
- [ ] Verify user activity
- [ ] Collect feedback
- [ ] Document any issues
- [ ] Plan next iteration

---

## 🎉 Deployment Complete!

Once all items are checked:
1. ✅ Backend deployed and verified
2. ✅ Frontend deployed and verified
3. ✅ All tests passing
4. ✅ Monitoring in place
5. ✅ Team notified

**Status**: Ready for Production Use

**Next Steps**: Monitor for 24 hours, then begin Phase 2 (Intelligent Onboarding)

---

**Deployment Date**: _____________

**Deployed By**: _____________

**Version**: 1.0.0

**Notes**: _____________________________________________
