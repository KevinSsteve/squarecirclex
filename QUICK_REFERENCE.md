# Experta - Quick Reference Card

## 🔑 Essential Information

### API Endpoint
```
https://973ese4p09.execute-api.us-east-1.amazonaws.com/dev
```

### Cognito
```
User Pool ID: us-east-1_J12Z1OVxM
Client ID: 5i385r6ath66fnunik1atuvq67
Region: us-east-1
```

### AWS Account
```
Account ID: 116708768297
Region: us-east-1
Environment: dev
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/brands` | Create brand (onboarding) |
| GET | `/posts` | List posts |
| GET | `/posts/{id}` | Get post details |
| PUT | `/posts/{id}` | Update post |
| DELETE | `/posts/{id}` | Delete post |
| POST | `/posts/{id}/regenerate` | Regenerate post |
| POST | `/chat` | Send chat message |

---

## 🔧 Quick Commands

### View Logs
```bash
# Onboarding
aws logs tail /aws/lambda/experta-onboarding-dev --follow

# Content Generator
aws logs tail /aws/lambda/experta-content-generator-dev --follow

# Chat Handler
aws logs tail /aws/lambda/experta-chat-handler-dev --follow
```

### Check Tables
```bash
# Brands
aws dynamodb scan --table-name Experta-Brands-dev

# Posts
aws dynamodb scan --table-name Experta-Posts-dev
```

### Test API
```bash
# Should return 401 (correct!)
curl https://973ese4p09.execute-api.us-east-1.amazonaws.com/dev/posts
```

---

## 📊 Monitoring

**Dashboard**:  
https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=Experta-dev

**Cost Explorer**:  
https://console.aws.amazon.com/cost-management/home

---

## 📦 Resources

| Resource | Name |
|----------|------|
| Brands Table | Experta-Brands-dev |
| Posts Table | Experta-Posts-dev |
| S3 Bucket | experta-content-116708768297-dev |
| Event Bus | experta-events-dev |
| SNS Topic | experta-failures-dev |

---

## 🚀 Frontend Setup

**Environment file**: `frontend/.env` (already created)

**Deploy to Amplify**:
1. Push code to GitHub
2. Connect Amplify to repository
3. Configure build settings
4. Deploy!

**Run locally**:
```bash
cd frontend
npm install
npm run dev
```

---

## 💡 Tips

- ✅ Frontend .env is ready
- ✅ All Lambda functions deployed
- ✅ Bedrock models enabled
- ⚠️ Subscribe to SNS for alerts
- ⚠️ Set up billing alerts

---

**Full docs**: See `DEPLOYMENT_SUCCESS.md`
