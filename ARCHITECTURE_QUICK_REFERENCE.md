# 🚀 ARCHITECTURE QUICK REFERENCE
## Experta AI Social Media Manager

**Status:** ✅ Production-Ready | **Version:** 2.0.0 | **Date:** April 14, 2026

---

## 📋 SYSTEM AT A GLANCE

**What It Does:** AI-powered social media automation platform  
**Tech Stack:** AWS Serverless (Lambda + DynamoDB + Bedrock)  
**AI Models:** Claude 3.5 Sonnet + Titan Image Generator v2  
**Platforms:** Instagram + LinkedIn  
**Deployment:** us-east-1 (AWS)

---

## 🏗️ ARCHITECTURE LAYERS

```
Frontend (React + Vite + Tailwind)
    ↓
API Gateway (REST + Cognito Auth)
    ↓
Lambda Functions (9 functions: Node.js + Python)
    ↓
Data Layer (DynamoDB 8 tables + S3 + Secrets Manager)
    ↓
AI Layer (Bedrock: Claude + Titan)
    ↓
Orchestration (EventBridge)
```

---

## 🔧 LAMBDA FUNCTIONS (9 Total)

| Function | Runtime | Purpose | Trigger |
|----------|---------|---------|---------|
| Onboarding | Node.js 20.x | AI brand onboarding | API |
| Chat Handler | Node.js 20.x | Conversational interface | API |
| Posts API | Node.js 20.x | Post CRUD | API |
| Content Generator | Python 3.13 | 30-day calendar | EventBridge |
| Auto Publisher | Node.js 20.x | Scheduled publishing | EventBridge |
| Trend Scraper | Python 3.13 | Instagram trends | Cron |
| OAuth Handler | Node.js 20.x | OAuth 2.0 flow | API |
| Admin Settings | Node.js 20.x | Platform config | API |
| Delete Account | Node.js 20.x | Account deletion | API |

---

## 🗄️ DYNAMODB TABLES (8 Total)

1. **Brands** - Brand profiles (PK: brand_id, GSI: user_id)
2. **Posts** - Content calendar (PK: post_id, GSI: brand_id-scheduled_time, brand_id-status)
3. **AutomationLogs** - Audit trail (PK: log_id, SK: timestamp, TTL: 90 days)
4. **Trends** - Instagram trends (PK: trend_id, SK: scraped_at, TTL: 7 days)
5. **OnboardingSessions** - Onboarding progress (PK: session_id, GSI: user_id, TTL: 30 days)
6. **OAuthConnections** - OAuth status (PK: brand_id, SK: platform)
7. **PlatformCredentials** - OAuth app config (PK: platform)
8. **OnzoChatHistory** - Chat persistence (PK: user_id, SK: timestamp, TTL: 30 days)

---

## 🔑 KEY WORKFLOWS

### 1. Onboarding → Content Generation
```
User Chat → AI Extraction → Brand Creation → EventBridge Event
    → Content Generator → 30 Posts (Claude + Titan) → DynamoDB + S3
    → EventBridge Rules Created → Dashboard
```

### 2. Chat Interaction
```
User Message → Load History → Bedrock Claude (with brand context)
    → Parse JSON → Create Post / Generate Image → Save → Return
```

### 3. Automated Publishing
```
EventBridge Cron → Auto Publisher → Get Token (Secrets Manager)
    → Publish to Platform API → Update Status → Log Result
```

---

## 🤖 AI INTEGRATION

**Claude 3.5 Sonnet:**
- Onboarding entity extraction
- Chat conversation
- Caption generation
- Content planning

**Titan Image Generator v2:**
- 1080x1080 square images
- Premium quality
- Brand-aligned visuals

**Prompt Patterns:**
- Multi-entity extraction (onboarding)
- Agentic persona (chat)
- Brand context injection
- JSON output enforcement

---

## 🔐 SECURITY

- **Auth:** Cognito User Pool + JWT
- **Tokens:** AWS Secrets Manager (KMS encrypted)
- **API:** Cognito authorizer on all endpoints
- **Data:** Encryption at rest (DynamoDB, S3)
- **Network:** HTTPS only
- **Authorization:** Brand-level access control

---

## 📊 TESTING

- **Total Tests:** 240+
- **Pass Rate:** 97.3%
- **Types:** Unit, Property-Based, Integration
- **Coverage:** ~90% for shared libraries

---

## 💰 COST ESTIMATE

**Monthly (100 brands, 3K posts):** ~$217
- Bedrock (Claude + Titan): $105
- Secrets Manager: $80
- DynamoDB: $10
- Lambda: $5
- Other: $17

**Per Brand:** ~$2.17/month  
**Per Post:** ~$0.07/post

---

## ⚠️ KNOWN LIMITATIONS

1. No token refresh automation (manual every 60 days)
2. No multi-brand management per user
3. No analytics dashboard
4. No image upload (AI-generated only)
5. No pagination on GET /posts
6. EventBridge rule limit (300 per account)

---

## ✅ PRODUCTION READINESS

**MVP-Ready:** ✅ YES  
**Production-Ready:** ✅ YES  
**Current Stage:** Phase 2 Complete

**Ready For:**
- Beta users
- Revenue generation
- Real customer onboarding

**Not Ready For:**
- High-volume enterprise (need rate limit increases)
- Multi-brand management
- Team collaboration

---

## 🎯 NEXT STEPS (Priority Order)

1. **Token Refresh Automation** (2 days)
2. **Request Queuing for Bedrock** (3 days)
3. **API Pagination** (2 days)
4. **Image Upload Flow** (3 days)
5. **Post Scheduling UI** (5 days)
6. **Performance Dashboard** (7 days)

---

## 📞 QUICK COMMANDS

**Deploy:**
```bash
sam build && sam deploy --guided
```

**View Logs:**
```bash
sam logs -n OnboardingFunction --tail
```

**Run Tests:**
```bash
npm test  # Node.js
pytest    # Python
```

**Frontend Deploy:**
```bash
cd frontend && npm run build
aws s3 sync dist/ s3://bucket-name
```

---

## 🔗 IMPORTANT URLS

- **API:** https://973ese4p09.execute-api.us-east-1.amazonaws.com/dev
- **User Pool:** us-east-1_J12Z1OVxM
- **Dashboard:** https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=Experta-dev

---

**For detailed information, see:** `COMPREHENSIVE_ARCHITECTURE_REPORT.md`
