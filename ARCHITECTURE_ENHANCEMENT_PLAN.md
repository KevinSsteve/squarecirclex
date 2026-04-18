# Experta Enterprise Architecture Enhancement Plan

## 🎯 Design Principles

### 1. Zero Friction Principle (UX)
**Goal**: Users never see technical complexity
- ✅ OAuth flows instead of manual token entry
- ✅ AI-driven conversational onboarding
- ✅ One-click social media connections
- ✅ Progressive disclosure of features

### 2. Entity Extraction (AI)
**Goal**: Natural conversation → Structured data
- ✅ Claude extracts entities from natural language
- ✅ Conversation state management in DynamoDB
- ✅ Progressive data collection without forms
- ✅ Context-aware follow-up questions

### 3. Vault Security (Backend)
**Goal**: Enterprise-grade security
- ✅ AWS Secrets Manager for all sensitive data
- ✅ KMS encryption at rest and in transit
- ✅ Admin-only access to master OAuth credentials
- ✅ Per-brand encrypted tokens in Secrets Manager

---

## 🏛️ New Architecture Components

### A. Admin Panel Infrastructure

#### 1. New DynamoDB Table: `Platform_Credentials`
```yaml
Purpose: Store master OAuth app credentials (admin-managed)
Partition Key: platform (String) # "instagram", "linkedin", "facebook"
Attributes:
  - platform: String
  - app_name: String
  - client_id_secret_arn: String  # ARN to Secrets Manager
  - client_secret_arn: String     # ARN to Secrets Manager
  - redirect_uri: String
  - scopes: List<String>
  - is_active: Boolean
  - created_by: String (admin user_id)
  - created_at: String (ISO8601)
  - updated_at: String (ISO8601)
```

#### 2. New DynamoDB Table: `Onboarding_Sessions`
```yaml
Purpose: Track conversational onboarding state
Partition Key: session_id (String, UUID)
Sort Key: timestamp (String, ISO8601)
Attributes:
  - session_id: String (UUID)
  - user_id: String (Cognito user_id)
  - brand_id: String (UUID, nullable until created)
  - conversation_state: String # "collecting_name", "collecting_niche", etc.
  - extracted_data: Map # JSON of extracted entities
  - conversation_history: List<Map> # [{role, content, timestamp}]
  - completed_fields: List<String> # ["brand_name", "industry"]
  - pending_fields: List<String> # ["target_audience", "tone"]
  - last_interaction: String (ISO8601)
  - status: String # "active", "completed", "abandoned"
  - ttl: Number (7 days for cleanup)
```

#### 3. New DynamoDB Table: `OAuth_Connections`
```yaml
Purpose: Track user's connected social accounts
Partition Key: brand_id (String, UUID)
Sort Key: platform (String) # "instagram", "linkedin"
Attributes:
  - brand_id: String
  - platform: String
  - platform_user_id: String # Instagram user ID, LinkedIn member ID
  - platform_username: String # @handle or profile name
  - access_token_secret_arn: String # ARN to Secrets Manager
  - refresh_token_secret_arn: String # ARN to Secrets Manager (if applicable)
  - token_expires_at: String (ISO8601, nullable)
  - scopes_granted: List<String>
  - connection_status: String # "active", "expired", "revoked"
  - connected_at: String (ISO8601)
  - last_refreshed_at: String (ISO8601)
  - profile_data: Map # {profile_pic, follower_count, etc.}
```

---

### B. New Lambda Functions

#### 1. **Admin API Lambda** (`functions/admin-api/`)
**Purpose**: Admin-only endpoints for platform configuration
**Runtime**: Node.js 18.x
**Endpoints**:
- `POST /admin/platforms` - Add OAuth app credentials
- `GET /admin/platforms` - List configured platforms
- `PUT /admin/platforms/{platform}` - Update platform config
- `DELETE /admin/platforms/{platform}` - Remove platform
- `GET /admin/stats` - System-wide statistics
- `GET /admin/brands` - List all brands (admin view)

**Security**:
- Cognito authorizer with admin group check
- IAM policy for Secrets Manager write access
- CloudWatch audit logging for all admin actions

**Key Features**:
- Stores OAuth credentials in Secrets Manager
- Validates OAuth app configuration
- Tests OAuth connectivity before saving
- Encrypts all sensitive data with KMS

#### 2. **OAuth Handler Lambda** (`functions/oauth-handler/`)
**Purpose**: Handle OAuth flows for social media connections
**Runtime**: Node.js 18.x
**Endpoints**:
- `GET /oauth/authorize/{platform}` - Initiate OAuth flow
- `GET /oauth/callback/{platform}` - Handle OAuth callback
- `POST /oauth/refresh/{platform}` - Refresh access token
- `DELETE /oauth/disconnect/{platform}` - Revoke connection

**Flow**:
```
User clicks "Connect Instagram"
  ↓
Frontend → GET /oauth/authorize/instagram?brand_id={id}
  ↓
Lambda retrieves master OAuth credentials from Secrets Manager
  ↓
Lambda generates state token (CSRF protection)
  ↓
Lambda redirects to Instagram OAuth URL
  ↓
User authorizes on Instagram
  ↓
Instagram redirects to /oauth/callback/instagram?code={code}&state={state}
  ↓
Lambda exchanges code for access token
  ↓
Lambda stores encrypted token in Secrets Manager
  ↓
Lambda saves connection metadata in OAuth_Connections table
  ↓
Lambda redirects to frontend with success message
```

**Security**:
- State parameter for CSRF protection
- PKCE for enhanced security
- Token encryption before storage
- Automatic token refresh handling

#### 3. **Conversational Onboarding Lambda** (`functions/conversational-onboarding/`)
**Purpose**: AI-powered entity extraction from natural conversation
**Runtime**: Python 3.11 (better for AI/ML)
**Endpoints**:
- `POST /onboarding/start` - Initialize onboarding session
- `POST /onboarding/message` - Process user message
- `GET /onboarding/session/{session_id}` - Get session state
- `POST /onboarding/complete` - Finalize brand creation

**AI Entity Extraction**:
```python
# Claude prompt engineering for entity extraction
system_prompt = """
You are an AI assistant helping users onboard their brand to Experta.
Extract structured information from natural conversation.

Current conversation state: {state}
Already collected: {collected_fields}
Still needed: {pending_fields}

User message: "{user_message}"

Extract any brand information and respond naturally.
Return JSON:
{
  "extracted_entities": {
    "brand_name": "...",
    "industry": "...",
    "target_audience": "...",
    "tone_of_voice": "...",
    "visual_style": "...",
    "content_pillars": [...],
    "post_times": [...]
  },
  "response": "Natural conversational response",
  "next_question": "What to ask next (if needed)",
  "completion_percentage": 75,
  "is_complete": false
}
"""
```

**Key Features**:
- Maintains conversation context in DynamoDB
- Extracts multiple entities from single message
- Asks clarifying questions only when needed
- Shows progress indicator (% complete)
- Validates extracted data before saving

#### 4. **Secrets Manager Helper Lambda** (`functions/secrets-helper/`)
**Purpose**: Centralized secrets management
**Runtime**: Node.js 18.x
**Internal Functions** (not exposed via API):
- `storeSecret(name, value, kmsKeyId)` - Store encrypted secret
- `retrieveSecret(arn)` - Retrieve and decrypt secret
- `rotateSecret(arn)` - Rotate secret (for token refresh)
- `deleteSecret(arn)` - Delete secret

**Used by**: All Lambda functions needing secrets access

---

### C. Modified Lambda Functions

#### 1. **Onboarding Handler** (Enhanced)
**Changes**:
- Remove manual token input
- Add OAuth connection status check
- Integrate with conversational onboarding
- Store brand data only (no tokens)

**New Flow**:
```
1. User starts onboarding → Create session
2. AI extracts brand info from conversation
3. Brand created in DynamoDB (no tokens)
4. User redirected to "Connect Accounts" page
5. User clicks "Connect Instagram" → OAuth flow
6. Tokens stored in Secrets Manager
7. Content generation triggered
```

#### 2. **Auto Publisher** (Enhanced)
**Changes**:
- Retrieve tokens from Secrets Manager (not DynamoDB)
- Automatic token refresh if expired
- Better error handling for revoked tokens

**New Token Retrieval**:
```javascript
// Old way (insecure)
const token = brand.instagram_token_encrypted;

// New way (secure)
const connection = await getOAuthConnection(brand_id, 'instagram');
const token = await retrieveSecret(connection.access_token_secret_arn);

// Auto-refresh if expired
if (isTokenExpired(connection.token_expires_at)) {
  const newToken = await refreshOAuthToken(brand_id, 'instagram');
  token = newToken;
}
```

---

### D. Frontend Changes

#### 1. **New Admin Panel** (`frontend/src/pages/Admin/`)

**Components**:
```
/admin
  ├── AdminDashboard.jsx       # Overview stats
  ├── PlatformConfig.jsx       # OAuth app configuration
  ├── BrandManagement.jsx      # View all brands
  ├── SystemHealth.jsx         # Monitoring
  └── AuditLogs.jsx            # Admin action logs
```

**PlatformConfig.jsx** - Key Features:
```jsx
// Add Instagram OAuth App
<Form>
  <Input label="App Name" placeholder="Experta Instagram App" />
  <Input label="Client ID" type="password" />
  <Input label="Client Secret" type="password" />
  <Input label="Redirect URI" value="https://api.experta.com/oauth/callback/instagram" />
  <MultiSelect label="Scopes" options={['instagram_basic', 'instagram_content_publish']} />
  <Button>Test Connection</Button>
  <Button>Save Securely</Button>
</Form>

// Shows: "✅ Instagram configured - 45 brands connected"
```

**Security**:
- Only accessible to Cognito admin group
- All actions logged to CloudWatch
- Credentials never displayed after saving
- Test connection before saving

#### 2. **Enhanced Onboarding** (`frontend/src/pages/Onboarding/`)

**New Flow**:
```jsx
// ConversationalOnboarding.jsx
<ChatInterface>
  {/* AI-driven conversation */}
  <MessageBubble from="ai">
    Hi! Let's set up your brand. What's your brand name?
  </MessageBubble>
  
  <MessageBubble from="user">
    My brand is Experta, we help businesses with AI
  </MessageBubble>
  
  <MessageBubble from="ai">
    Great! So Experta is in the AI/Technology space. 
    Who is your target audience?
  </MessageBubble>
  
  {/* Progress indicator */}
  <ProgressBar value={60} label="60% Complete" />
  
  {/* Extracted data preview (optional) */}
  <DataPreview>
    ✅ Brand Name: Experta
    ✅ Industry: AI/Technology
    ⏳ Target Audience: ...
  </DataPreview>
</ChatInterface>
```

**Key Features**:
- Real-time entity extraction
- Progress indicator
- No forms, just conversation
- Can extract multiple fields from one message
- Shows what's been collected

#### 3. **Social Media Connection** (`frontend/src/pages/Connections/`)

**New Component**: `SocialConnections.jsx`
```jsx
<ConnectionsPage>
  <ConnectionCard platform="instagram">
    <Icon name="instagram" />
    <Title>Instagram</Title>
    <Status>Not Connected</Status>
    <Button onClick={() => connectPlatform('instagram')}>
      Connect Instagram
    </Button>
  </ConnectionCard>
  
  <ConnectionCard platform="linkedin">
    <Icon name="linkedin" />
    <Title>LinkedIn</Title>
    <Status>✅ Connected as @experta</Status>
    <Button variant="secondary" onClick={() => disconnectPlatform('linkedin')}>
      Disconnect
    </Button>
  </ConnectionCard>
</ConnectionsPage>
```

**User Experience**:
1. User clicks "Connect Instagram"
2. Popup opens with Instagram OAuth
3. User authorizes
4. Popup closes
5. Status updates to "✅ Connected"
6. No tokens visible to user

---

## 🔐 Security Architecture

### Secrets Manager Structure

```
/experta/dev/platforms/instagram/client-id
/experta/dev/platforms/instagram/client-secret
/experta/dev/platforms/linkedin/client-id
/experta/dev/platforms/linkedin/client-secret

/experta/dev/brands/{brand_id}/instagram/access-token
/experta/dev/brands/{brand_id}/instagram/refresh-token
/experta/dev/brands/{brand_id}/linkedin/access-token
/experta/dev/brands/{brand_id}/linkedin/refresh-token
```

### KMS Key Policy

```yaml
# Separate KMS keys for different security domains
PlatformCredentialsKey:
  Description: Encrypts master OAuth app credentials
  KeyPolicy:
    - Admin users can encrypt/decrypt
    - Admin Lambda can encrypt/decrypt
    - OAuth Lambda can decrypt only

BrandTokensKey:
  Description: Encrypts per-brand OAuth tokens
  KeyPolicy:
    - OAuth Lambda can encrypt/decrypt
    - Auto Publisher Lambda can decrypt only
    - Content Generator Lambda can decrypt only
```

### IAM Policies

```yaml
AdminLambdaPolicy:
  - secretsmanager:CreateSecret (platform credentials only)
  - secretsmanager:PutSecretValue (platform credentials only)
  - secretsmanager:GetSecretValue (platform credentials only)
  - kms:Encrypt (PlatformCredentialsKey)
  - kms:Decrypt (PlatformCredentialsKey)

OAuthLambdaPolicy:
  - secretsmanager:GetSecretValue (platform credentials)
  - secretsmanager:CreateSecret (brand tokens)
  - secretsmanager:PutSecretValue (brand tokens)
  - kms:Decrypt (PlatformCredentialsKey)
  - kms:Encrypt (BrandTokensKey)

PublisherLambdaPolicy:
  - secretsmanager:GetSecretValue (brand tokens only)
  - kms:Decrypt (BrandTokensKey)
```

---

## 📊 Data Flow Diagrams

### Admin Configuration Flow
```
Admin User
  ↓
Admin Panel (Frontend)
  ↓
POST /admin/platforms
  ↓
Admin API Lambda
  ↓
Validate OAuth credentials
  ↓
Store in Secrets Manager (encrypted with PlatformCredentialsKey)
  ↓
Save metadata in Platform_Credentials table
  ↓
Return success
```

### User Onboarding Flow
```
User
  ↓
Conversational Onboarding (Frontend)
  ↓
POST /onboarding/message
  ↓
Conversational Onboarding Lambda
  ↓
Claude extracts entities
  ↓
Save to Onboarding_Sessions table
  ↓
Return AI response + extracted data
  ↓
When complete → Create brand in Brands table
  ↓
Redirect to Social Connections page
```

### OAuth Connection Flow
```
User clicks "Connect Instagram"
  ↓
GET /oauth/authorize/instagram
  ↓
OAuth Handler Lambda
  ↓
Retrieve master credentials from Secrets Manager
  ↓
Generate state token
  ↓
Redirect to Instagram OAuth
  ↓
User authorizes
  ↓
Instagram → GET /oauth/callback/instagram?code=...
  ↓
OAuth Handler Lambda
  ↓
Exchange code for tokens
  ↓
Store tokens in Secrets Manager (encrypted with BrandTokensKey)
  ↓
Save connection metadata in OAuth_Connections table
  ↓
Redirect to frontend with success
```

### Publishing Flow (Enhanced)
```
EventBridge triggers Auto Publisher
  ↓
Auto Publisher Lambda
  ↓
Get brand_id from event
  ↓
Query OAuth_Connections table
  ↓
Check if token expired
  ↓
If expired → Refresh token via OAuth Handler
  ↓
Retrieve token from Secrets Manager
  ↓
Decrypt with KMS
  ↓
Publish to Instagram/LinkedIn
  ↓
Update post status
```

---

## 🗂️ Database Schema Changes

### Modified: `Brands` Table
```yaml
# REMOVE these fields (move to Secrets Manager):
- instagram_token_encrypted ❌
- linkedin_token_encrypted ❌

# KEEP these fields:
- brand_id
- brand_name
- industry
- target_audience
- tone_of_voice
- visual_style
- content_pillars
- post_times
- user_id
- created_at
- updated_at

# ADD these fields:
- onboarding_session_id (String, reference to Onboarding_Sessions)
- onboarding_completed_at (String, ISO8601)
- has_instagram_connection (Boolean)
- has_linkedin_connection (Boolean)
```

---

## 🚀 Implementation Phases

### Phase 1: Foundation (Week 1)
- ✅ Create new DynamoDB tables
- ✅ Create KMS keys for different security domains
- ✅ Set up Secrets Manager structure
- ✅ Update IAM policies

### Phase 2: Admin Panel (Week 2)
- ✅ Build Admin API Lambda
- ✅ Build Admin frontend components
- ✅ Implement platform configuration
- ✅ Test OAuth credential storage

### Phase 3: OAuth Infrastructure (Week 3)
- ✅ Build OAuth Handler Lambda
- ✅ Implement Instagram OAuth flow
- ✅ Implement LinkedIn OAuth flow
- ✅ Build Social Connections frontend
- ✅ Test end-to-end OAuth

### Phase 4: Conversational Onboarding (Week 4)
- ✅ Build Conversational Onboarding Lambda
- ✅ Implement entity extraction with Claude
- ✅ Build conversational UI
- ✅ Integrate with OAuth connections
- ✅ Test complete onboarding flow

### Phase 5: Migration & Cleanup (Week 5)
- ✅ Migrate existing brands to new structure
- ✅ Update Auto Publisher to use Secrets Manager
- ✅ Update Content Generator to use Secrets Manager
- ✅ Remove old token fields from Brands table
- ✅ Update all documentation

---

## 📝 Template.yaml Changes Summary

### New Resources to Add:
1. `PlatformCredentialsTable` (DynamoDB)
2. `OnboardingSessionsTable` (DynamoDB)
3. `OAuthConnectionsTable` (DynamoDB)
4. `PlatformCredentialsKMSKey` (KMS)
5. `BrandTokensKMSKey` (KMS)
6. `AdminApiFunction` (Lambda)
7. `OAuthHandlerFunction` (Lambda)
8. `ConversationalOnboardingFunction` (Lambda)
9. `SecretsHelperLayer` (Lambda Layer)

### Modified Resources:
1. `BrandsTable` - Remove token fields, add connection flags
2. `OnboardingFunction` - Integrate with conversational onboarding
3. `AutoPublisherFunction` - Use Secrets Manager for tokens
4. `ContentGeneratorFunction` - Use Secrets Manager for tokens
5. `LambdaExecutionRole` - Add Secrets Manager permissions

### New API Endpoints:
1. `POST /admin/platforms`
2. `GET /admin/platforms`
3. `PUT /admin/platforms/{platform}`
4. `DELETE /admin/platforms/{platform}`
5. `GET /admin/stats`
6. `GET /oauth/authorize/{platform}`
7. `GET /oauth/callback/{platform}`
8. `POST /oauth/refresh/{platform}`
9. `DELETE /oauth/disconnect/{platform}`
10. `POST /onboarding/start`
11. `POST /onboarding/message`
12. `GET /onboarding/session/{session_id}`
13. `POST /onboarding/complete`

---

## 🎯 Success Metrics

### User Experience
- ⏱️ Onboarding time: < 3 minutes (vs 10+ minutes with forms)
- 🎯 Completion rate: > 90% (vs ~60% with forms)
- 😊 User satisfaction: No technical jargon visible
- 🔗 Connection success rate: > 95%

### Security
- 🔐 Zero tokens in DynamoDB
- 🔐 All secrets in Secrets Manager with KMS encryption
- 🔐 Automatic token rotation
- 🔐 Admin actions fully audited

### Scalability
- 📈 Support 10,000+ brands
- 📈 Handle 100+ OAuth connections/minute
- 📈 Sub-second token retrieval
- 📈 Automatic token refresh

---

## 💡 Key Innovations

1. **Zero Friction OAuth**: Users never see "token" or "API key"
2. **AI Entity Extraction**: Natural conversation → Structured data
3. **Vault Security**: Enterprise-grade secrets management
4. **Admin Separation**: Platform config separate from user data
5. **Progressive Onboarding**: Collect data as conversation flows
6. **Automatic Token Refresh**: No manual intervention needed
7. **Connection Status Tracking**: Real-time OAuth health monitoring

---

## 🔄 Migration Strategy

### For Existing Brands:
```javascript
// Migration Lambda function
async function migrateBrand(brand) {
  // 1. Extract tokens from DynamoDB
  const instagramToken = await decrypt(brand.instagram_token_encrypted);
  const linkedinToken = await decrypt(brand.linkedin_token_encrypted);
  
  // 2. Store in Secrets Manager
  const instagramArn = await storeSecret(
    `/experta/dev/brands/${brand.brand_id}/instagram/access-token`,
    instagramToken
  );
  
  const linkedinArn = await storeSecret(
    `/experta/dev/brands/${brand.brand_id}/linkedin/access-token`,
    linkedinToken
  );
  
  // 3. Create OAuth connection records
  await createOAuthConnection({
    brand_id: brand.brand_id,
    platform: 'instagram',
    access_token_secret_arn: instagramArn,
    connection_status: 'active'
  });
  
  // 4. Update brand record
  await updateBrand(brand.brand_id, {
    has_instagram_connection: true,
    has_linkedin_connection: true
  });
  
  // 5. Remove old token fields (after verification)
}
```

---

This architecture transforms Experta into an enterprise-grade platform with:
- ✅ Consumer-grade UX (zero technical complexity)
- ✅ Enterprise-grade security (Secrets Manager + KMS)
- ✅ AI-powered intelligence (entity extraction)
- ✅ Scalable infrastructure (AWS best practices)

Ready to implement? Let me know which phase to start with!
