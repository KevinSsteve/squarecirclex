# Task 2 Checkpoint - Backend Error Fixes Testing

**Date**: 2026-04-18  
**Status**: Ready for Testing  
**Spec**: `.kiro/specs/backend-500-pixijs-v8-fix/`

## Checkpoint Overview

This checkpoint validates that all backend 500 error fixes are working correctly before proceeding to PixiJS v8 API updates.

## Completed Tasks

- ✅ Task 1.1: Add authentication check to GameView
- ✅ Task 1.3: Enhance error handling in GameView fetchPosts
- ✅ Task 1.5: Update Posts API error response for missing brand
- ✅ Task 1.7: Add UI components for unauthenticated state

## Testing Checklist

### Manual Testing Required

#### Test 1: GameView Without Authentication
**Steps:**
1. Clear browser localStorage and cookies
2. Navigate directly to `/game` route
3. Observe behavior

**Expected Result:**
- ✅ Should show "Authentication Required" message
- ✅ Should display "Log In" button
- ✅ Should display "Go to Traditional View" button
- ✅ Should NOT make any API calls to `/posts`
- ✅ Console should log: "[GameView] No authentication token found"

**Status:** [ ] Pass / [ ] Fail

---

#### Test 2: GameView With Expired Token
**Steps:**
1. Log in to the application
2. Wait for token to expire (or manually expire it)
3. Navigate to `/game` route
4. Observe behavior

**Expected Result:**
- ✅ Should show "Session Expired" message
- ✅ Should display "Log In" button
- ✅ Console should log: "[GameView] Authentication token expired"

**Status:** [ ] Pass / [ ] Fail

---

#### Test 3: GameView With Authentication But No Brand
**Steps:**
1. Log in with a user account that has no brand association
2. Navigate to `/game` route
3. Observe behavior

**Expected Result:**
- ✅ Should show "Complete Onboarding" message
- ✅ Should display "Start Onboarding" button
- ✅ Console should log: "[GameView] User has no brand association"
- ✅ Backend should return 403 (not 500) if API call is made

**Status:** [ ] Pass / [ ] Fail

---

#### Test 4: GameView With Full Authentication
**Steps:**
1. Log in with a user account that has brand association
2. Navigate to `/game` route
3. Observe behavior

**Expected Result:**
- ✅ Should show loading spinner briefly
- ✅ Should load game view successfully
- ✅ Should start polling `/posts` endpoint
- ✅ Console should log: "[GameView] Authentication successful"
- ✅ No 500 errors in browser console
- ✅ Game renders with office layout and agent

**Status:** [ ] Pass / [ ] Fail

---

#### Test 5: Backend CloudWatch Logs
**Steps:**
1. Trigger a request from a user without brand association
2. Check CloudWatch logs for Posts API Lambda

**Expected Result:**
- ✅ Should see 403 response (not 500)
- ✅ Should see warning log: "User has no brand association"
- ✅ Should NOT see error stack traces for missing brand
- ✅ Error response should include proper structure:
  ```json
  {
    "error": {
      "code": "NO_BRAND_ASSOCIATION",
      "message": "User has no brand association. Please complete onboarding.",
      "details": {
        "requiresOnboarding": true
      }
    }
  }
  ```

**Status:** [ ] Pass / [ ] Fail

---

#### Test 6: UI Button Functionality
**Steps:**
1. Test each button in unauthenticated states
2. Verify navigation works correctly

**Expected Result:**
- ✅ "Log In" button → Redirects to `/login`
- ✅ "Start Onboarding" button → Redirects to `/onboarding`
- ✅ "Go to Traditional View" button → Redirects to `/dashboard`

**Status:** [ ] Pass / [ ] Fail

---

#### Test 7: Error Recovery
**Steps:**
1. Load GameView without authentication
2. Log in via the "Log In" button
3. Navigate back to `/game`

**Expected Result:**
- ✅ Should now load game successfully
- ✅ Should start polling posts
- ✅ No lingering error states

**Status:** [ ] Pass / [ ] Fail

---

### Automated Testing (Optional)

The following unit tests are marked as optional (Tasks 1.2, 1.4, 1.6):
- [ ] Task 1.2: Authentication guard tests
- [ ] Task 1.4: Enhanced error handling tests
- [ ] Task 1.6: Posts API error response tests

These can be implemented later if time permits.

---

## Deployment Instructions

### Backend Deployment

```powershell
# Build SAM application
sam build

# Deploy to development environment
sam deploy --config-env dev

# Verify deployment
aws lambda get-function --function-name onzo-posts-api-dev
```

### Frontend Deployment

```powershell
# Navigate to frontend directory
cd frontend

# Build production bundle
npm run build

# Deploy to S3 (replace with your bucket name)
aws s3 sync dist/ s3://your-frontend-bucket/ --delete

# Invalidate CloudFront cache (replace with your distribution ID)
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

---

## Monitoring After Deployment

### CloudWatch Logs
Monitor: `/aws/lambda/onzo-posts-api-dev`

**Look for:**
- ✅ 403 responses instead of 500 errors
- ✅ Warning logs for "User has no brand association"
- ✅ Proper error structure in responses
- ✅ No error stack traces for missing brand

### Frontend Console
**Look for:**
- ✅ No PixiJS deprecation warnings (will be fixed in next tasks)
- ✅ Authentication checks logged correctly
- ✅ Proper error messages displayed to users
- ✅ No infinite retry loops

### Metrics to Track
- **Before Fix**: High count of 500 errors from Posts API
- **After Fix**: 500 errors should drop to zero, replaced by 403 responses

---

## Known Issues / Limitations

1. **PixiJS Deprecation Warnings**: Still present - will be addressed in Tasks 3-9
2. **Unit Tests**: Optional tasks not implemented - can be added later
3. **Integration Tests**: Not yet implemented - manual testing required

---

## Success Criteria

All of the following must be true to proceed to PixiJS updates:

- [ ] All 7 manual tests pass
- [ ] No 500 errors in CloudWatch logs for missing brand association
- [ ] 403 errors properly logged and structured
- [ ] User experience improved with clear error messages
- [ ] No regression in existing game functionality
- [ ] Circuit breaker logic still works for non-auth errors

---

## Next Steps

### If All Tests Pass:
1. Mark Task 2 as complete
2. Proceed to Task 3: Update PixiJS Graphics API - TaskWorkflowVisuals
3. Continue with systematic PixiJS v8 migration

### If Tests Fail:
1. Document failures in this file
2. Fix issues in code
3. Re-test until all pass
4. Do not proceed to PixiJS updates until backend fixes are solid

---

## Questions for User

Before proceeding, please confirm:

1. **Do you want to deploy these changes now?**
   - If yes, I can help with deployment commands
   - If no, we can continue with local testing

2. **Do you want to implement the optional unit tests?**
   - Tasks 1.2, 1.4, 1.6 are marked optional
   - Can be done now or later

3. **Are you ready to proceed with PixiJS updates?**
   - Once backend fixes are verified
   - Tasks 3-9 will update deprecated PixiJS APIs

---

## Notes

- All changes maintain backward compatibility
- Circuit breaker logic preserved for non-auth errors
- Error recovery system integration maintained
- View toggle functionality unaffected
- Asset loading and game initialization unchanged

---

## Approval

**Tester Name:** _________________  
**Date:** _________________  
**Signature:** _________________  

**Result:** [ ] Approved - Proceed to PixiJS Updates  
           [ ] Rejected - Fix issues and re-test
