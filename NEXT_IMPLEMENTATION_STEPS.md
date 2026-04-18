# Next Implementation Steps

## Current Status
✅ Admin backend (Secrets Manager integration)
✅ User menu component
✅ Cascade deletion infrastructure
✅ Template.yaml updated with new functions

## Remaining Work

### 1. Frontend Pages (High Priority)

#### A. Profile Settings Page
**Path**: `frontend/src/pages/ProfileSettings.jsx`

**Features**:
- Display user email and name
- Edit user name
- Change password
- View account creation date
- Link to delete account

**Components Needed**:
- Form for name update
- Password change form
- Account info display

---

#### B. Connect Accounts Page
**Path**: `frontend/src/pages/ConnectAccounts.jsx`

**Features**:
- Show Instagram connection status
- Show LinkedIn connection status
- "Connect" buttons for each platform
- "Disconnect" buttons for connected platforms
- Display connected account info (username, profile pic)

**Current State**:
- OAuth handler Lambda NOT yet created
- Will need OAuth flow implementation

**Temporary Solution**:
- Show "Coming Soon" message
- Explain OAuth flow will be available soon
- Allow users to continue without connections

---

#### C. Delete Account Page
**Path**: `frontend/src/pages/DeleteAccount.jsx`

**Features**:
- Warning message about permanent deletion
- List what will be deleted:
  - All brands
  - All posts
  - All scheduled content
  - All images
  - All connections
- Confirmation input: "DELETE MY ACCOUNT"
- Delete button (disabled until confirmation typed)
- Call DELETE /account endpoint
- Show deletion summary
- Redirect to login after deletion

**API Integration**:
- ✅ Backend ready: DELETE /account
- ✅ Cascade deletion implemented
- Need frontend form and confirmation flow

---

### 2. Intelligent Onboarding Enhancement (Medium Priority)

#### Current Issues
- ❌ Hardcoded token requests in onboarding
- ❌ Users see technical terms like "API token"
- ❌ No entity extraction from conversation
- ❌ Sequential question flow (not natural)

#### Enhancements Needed

**A. Remove Token Requests**
```javascript
// Remove from Onboarding.jsx
- Instagram token input
- LinkedIn token input

// Remove from handler.js
- instagram_token field
- linkedin_token field
```

**B. Enhance AI Entity Extraction**
```javascript
// In functions/onboarding/handler.js
// Current: Sequential questions
// New: Extract multiple entities from single message

Example:
User: "My brand is Experta, we're in AI/tech, targeting developers"
AI extracts:
- brand_name: "Experta"
- industry: "AI/tech"
- target_audience: "developers"
```

**C. Add Conversation Context**
- Store conversation history in DynamoDB
- AI remembers what's been collected
- Shows progress: "60% complete"
- Asks only for missing information

**D. Natural Conversation Flow**
```
Current:
AI: "What's your brand name?"
User: "Experta"
AI: "What's your industry?"
User: "AI"

New:
AI: "Tell me about your brand"
User: "Experta is an AI company helping developers"
AI: "Great! I got your brand name (Experta) and industry (AI). 
     Who are your main customers?"
```

---

### 3. OAuth Infrastructure (Low Priority - Future Phase)

#### New DynamoDB Table: `OAuth_Connections`
```yaml
Partition Key: brand_id
Sort Key: platform
Attributes:
  - access_token_secret_arn
  - refresh_token_secret_arn
  - token_expires_at
  - connection_status
  - platform_user_id
  - platform_username
```

#### New Lambda: `oauth-handler`
**Endpoints**:
- GET /oauth/authorize/{platform}
- GET /oauth/callback/{platform}
- POST /oauth/refresh/{platform}
- DELETE /oauth/disconnect/{platform}

**Flow**:
1. User clicks "Connect Instagram"
2. Frontend → GET /oauth/authorize/instagram
3. Lambda retrieves master credentials from Secrets Manager
4. Lambda redirects to Instagram OAuth
5. User authorizes
6. Instagram → GET /oauth/callback/instagram?code=...
7. Lambda exchanges code for token
8. Lambda stores token in Secrets Manager
9. Lambda saves connection in OAuth_Connections table
10. Lambda redirects to frontend with success

---

### 4. Admin Dashboard (Low Priority - Future Phase)

#### Admin Panel Pages
**Path**: `frontend/src/pages/admin/`

**Pages**:
1. **AdminDashboard.jsx** - Overview stats
2. **PlatformConfig.jsx** - OAuth app configuration (uses admin-settings API)
3. **BrandManagement.jsx** - View all brands
4. **SystemHealth.jsx** - Monitoring
5. **AuditLogs.jsx** - Admin action logs

**Current State**:
- ✅ Backend ready: POST/GET /admin/settings
- ✅ Secrets Manager integration complete
- ❌ Frontend pages not created
- ❌ Admin group check not enforced

---

## Implementation Priority

### Phase 1: Essential User Features (This Week)
1. ✅ Admin backend (DONE)
2. ✅ User menu (DONE)
3. ✅ Cascade deletion (DONE)
4. 🔄 Delete Account page (IN PROGRESS)
5. 🔄 Profile Settings page (IN PROGRESS)
6. 🔄 Connect Accounts page (placeholder)

### Phase 2: Intelligent Onboarding (Next Week)
1. Remove token requests from onboarding
2. Enhance AI entity extraction
3. Add conversation context storage
4. Add progress indicator
5. Test natural conversation flow

### Phase 3: OAuth Infrastructure (Week 3)
1. Create OAuth_Connections table
2. Create oauth-handler Lambda
3. Implement Instagram OAuth
4. Implement LinkedIn OAuth
5. Complete Connect Accounts page

### Phase 4: Admin Dashboard (Week 4)
1. Create admin pages
2. Implement platform configuration UI
3. Add system monitoring
4. Add brand management
5. Add audit logs

---

## Quick Wins (Can Do Now)

### 1. Delete Account Page (30 minutes)
- Create confirmation form
- Add warning messages
- Call DELETE /account API
- Show deletion summary
- Redirect to login

### 2. Profile Settings Page (30 minutes)
- Display user info
- Add name edit form
- Add password change form
- Link to delete account

### 3. Connect Accounts Placeholder (15 minutes)
- Show "Coming Soon" message
- Explain OAuth flow
- Show Instagram and LinkedIn cards
- Disable connect buttons

### 4. Remove Token Requests from Onboarding (15 minutes)
- Remove token input fields
- Remove token validation
- Update brand creation to skip tokens
- Add message: "You'll connect accounts later"

---

## Testing Strategy

### Unit Tests Needed
- [ ] admin-settings handler tests
- [ ] delete-account handler tests
- [ ] cascade-delete utility tests
- [ ] UserMenu component tests

### Integration Tests Needed
- [ ] Admin settings API flow
- [ ] Account deletion flow
- [ ] Cascade deletion across services
- [ ] User menu navigation

### E2E Tests Needed
- [ ] Complete onboarding without tokens
- [ ] Delete account flow
- [ ] Admin configuration flow (when ready)
- [ ] OAuth connection flow (when ready)

---

## Deployment Checklist

### Before Deploying
- [ ] Install dependencies in new Lambda functions
- [ ] Run unit tests
- [ ] Update environment variables
- [ ] Review IAM permissions
- [ ] Check CloudWatch log retention

### Deploy Steps
```bash
# 1. Install dependencies
cd functions/admin-settings && npm install
cd ../delete-account && npm install

# 2. Build
sam build

# 3. Deploy
sam deploy --guided

# 4. Verify
aws lambda list-functions --query 'Functions[?contains(FunctionName, `experta`)].FunctionName'
```

### After Deploying
- [ ] Test admin settings endpoints
- [ ] Test account deletion endpoint
- [ ] Verify Secrets Manager integration
- [ ] Check CloudWatch logs
- [ ] Test frontend integration

---

## Documentation Updates Needed

### User Documentation
- [ ] How to connect social accounts (when OAuth ready)
- [ ] How to delete account
- [ ] How to manage profile settings
- [ ] Privacy policy updates (data deletion)

### Admin Documentation
- [ ] How to configure platform OAuth credentials
- [ ] How to monitor system health
- [ ] How to view audit logs
- [ ] Security best practices

### Developer Documentation
- [ ] OAuth flow architecture
- [ ] Cascade deletion process
- [ ] Secrets Manager structure
- [ ] API endpoint documentation

---

## Questions to Resolve

1. **Admin Group Enforcement**: Should backend verify admin group or trust frontend?
   - Current: Frontend enforces, backend trusts Cognito
   - Recommendation: Add backend check for production

2. **Token Refresh Strategy**: How often to refresh OAuth tokens?
   - Recommendation: Check expiry before each publish, refresh if needed

3. **Account Deletion**: Permanent delete or soft delete?
   - Current: Cognito user disabled (soft delete)
   - Recommendation: Keep soft delete for audit trail

4. **Onboarding Session Storage**: Where to store conversation context?
   - Option A: DynamoDB table (persistent)
   - Option B: Frontend state (temporary)
   - Recommendation: DynamoDB for multi-device support

---

## Success Criteria

### Phase 1 Complete When:
- ✅ User can delete account with confirmation
- ✅ User can view/edit profile settings
- ✅ User can see connection status (even if placeholder)
- ✅ All user data deleted on account deletion
- ✅ Admin can configure platform credentials

### Phase 2 Complete When:
- ✅ Onboarding uses natural conversation
- ✅ AI extracts multiple entities per message
- ✅ No token requests in onboarding
- ✅ Progress indicator shows completion %
- ✅ Users redirected to connections after onboarding

### Phase 3 Complete When:
- ✅ Users can connect Instagram via OAuth
- ✅ Users can connect LinkedIn via OAuth
- ✅ Tokens stored in Secrets Manager
- ✅ Auto-refresh works for expired tokens
- ✅ Users can disconnect accounts

### Phase 4 Complete When:
- ✅ Admin dashboard shows system stats
- ✅ Admin can configure OAuth apps
- ✅ Admin can view all brands
- ✅ Admin can view audit logs
- ✅ System health monitoring active

---

## Conclusion

**Current Progress**: 40% complete
- ✅ Backend infrastructure
- ✅ User menu
- ✅ Cascade deletion
- 🔄 Frontend pages (in progress)
- ⏳ OAuth infrastructure (planned)
- ⏳ Admin dashboard (planned)

**Next Immediate Steps**:
1. Create Delete Account page
2. Create Profile Settings page
3. Create Connect Accounts placeholder
4. Remove token requests from onboarding
5. Deploy and test

**Estimated Time to MVP**:
- Phase 1: 2-3 hours (essential features)
- Phase 2: 1 week (intelligent onboarding)
- Phase 3: 1 week (OAuth infrastructure)
- Phase 4: 1 week (admin dashboard)

**Total**: 3-4 weeks to complete product loop
