# Cognito Admin Group Setup Guide

## Overview

This guide explains how to configure the "Admins" Cognito group to enable admin access to the Experta AI Social Media Manager admin dashboard.

---

## Prerequisites

- AWS CLI configured with appropriate credentials
- Cognito User Pool deployed (from SAM template)
- User Pool ID: `us-east-1_J12Z1OVxM` (from deployment)

---

## Step 1: Create the "Admins" Group

### Using AWS Console

1. **Navigate to Cognito**
   - Go to AWS Console → Amazon Cognito
   - Select "User pools"
   - Click on your user pool: `us-east-1_J12Z1OVxM`

2. **Create Group**
   - Click "Groups" tab
   - Click "Create group"
   - Enter group details:
     - **Group name**: `Admins` (case-sensitive!)
     - **Description**: `System administrators with full access`
     - **Precedence**: `1` (highest priority)
     - **IAM role**: Leave empty (not needed for this use case)
   - Click "Create group"

### Using AWS CLI

```bash
aws cognito-idp create-group \
  --group-name Admins \
  --user-pool-id us-east-1_J12Z1OVxM \
  --description "System administrators with full access" \
  --precedence 1 \
  --region us-east-1
```

**Expected Output**:
```json
{
    "Group": {
        "GroupName": "Admins",
        "UserPoolId": "us-east-1_J12Z1OVxM",
        "Description": "System administrators with full access",
        "Precedence": 1,
        "LastModifiedDate": "2026-02-14T...",
        "CreationDate": "2026-02-14T..."
    }
}
```

---

## Step 2: Add Users to the Admins Group

### Using AWS Console

1. **Navigate to Users**
   - In your User Pool, click "Users" tab
   - Find the user you want to make an admin
   - Click on the username

2. **Add to Group**
   - Scroll to "Group memberships" section
   - Click "Add user to group"
   - Select "Admins" from dropdown
   - Click "Add"

### Using AWS CLI

```bash
# Replace [USERNAME] with the actual username
aws cognito-idp admin-add-user-to-group \
  --user-pool-id us-east-1_J12Z1OVxM \
  --username [USERNAME] \
  --group-name Admins \
  --region us-east-1
```

**Example**:
```bash
aws cognito-idp admin-add-user-to-group \
  --user-pool-id us-east-1_J12Z1OVxM \
  --username admin@example.com \
  --group-name Admins \
  --region us-east-1
```

---

## Step 3: Verify Group Membership

### Using AWS Console

1. Go to User Pool → Users → [Username]
2. Check "Group memberships" section
3. Verify "Admins" is listed

### Using AWS CLI

```bash
# List all groups for a user
aws cognito-idp admin-list-groups-for-user \
  --user-pool-id us-east-1_J12Z1OVxM \
  --username [USERNAME] \
  --region us-east-1
```

**Expected Output**:
```json
{
    "Groups": [
        {
            "GroupName": "Admins",
            "UserPoolId": "us-east-1_J12Z1OVxM",
            "Description": "System administrators with full access",
            "Precedence": 1,
            "LastModifiedDate": "2026-02-14T...",
            "CreationDate": "2026-02-14T..."
        }
    ]
}
```

---

## Step 4: Test Admin Access

### 1. Log Out Current User
If you're already logged in, sign out from the application.

### 2. Log In as Admin User
1. Navigate to `https://your-app-url.com/login`
2. Enter admin user credentials
3. Click "Sign In"

### 3. Access Admin Dashboard
1. Navigate to `https://your-app-url.com/admin`
2. You should see the Admin Dashboard
3. Verify you can access both tabs:
   - Platform Configuration
   - System Monitoring

### 4. Test Non-Admin User
1. Log out
2. Log in as a regular user (not in Admins group)
3. Try to navigate to `/admin`
4. You should be redirected to `/dashboard`

---

## Step 5: Verify JWT Token Contains Group

### Using Browser DevTools

1. Log in as admin user
2. Open Browser DevTools (F12)
3. Go to Application → Local Storage
4. Find the Cognito token
5. Decode the JWT token at [jwt.io](https://jwt.io)
6. Verify the token contains:
   ```json
   {
     "cognito:groups": ["Admins"],
     ...
   }
   ```

### Using AWS CLI

```bash
# Get user's ID token
aws cognito-idp admin-initiate-auth \
  --user-pool-id us-east-1_J12Z1OVxM \
  --client-id 5i385r6ath66fnunik1atuvq67 \
  --auth-flow ADMIN_NO_SRP_AUTH \
  --auth-parameters USERNAME=[USERNAME],PASSWORD=[PASSWORD] \
  --region us-east-1
```

Then decode the `IdToken` from the response at [jwt.io](https://jwt.io).

---

## Troubleshooting

### Issue: User Can't Access /admin

**Possible Causes**:
1. User not in "Admins" group
2. Group name misspelled (must be exactly "Admins")
3. User needs to log out and log back in
4. JWT token doesn't contain groups claim

**Solutions**:
```bash
# Verify user is in group
aws cognito-idp admin-list-groups-for-user \
  --user-pool-id us-east-1_J12Z1OVxM \
  --username [USERNAME] \
  --region us-east-1

# If not in group, add them
aws cognito-idp admin-add-user-to-group \
  --user-pool-id us-east-1_J12Z1OVxM \
  --username [USERNAME] \
  --group-name Admins \
  --region us-east-1
```

### Issue: AdminRoute Shows Loading Forever

**Possible Causes**:
1. Network error fetching auth session
2. Cognito configuration issue
3. Browser console shows errors

**Solutions**:
1. Check browser console for errors
2. Verify Cognito User Pool ID in `frontend/.env`
3. Check network tab for failed requests
4. Clear browser cache and local storage

### Issue: Group Not Appearing in JWT Token

**Possible Causes**:
1. User added to group after login
2. Token not refreshed
3. App Client settings incorrect

**Solutions**:
1. Log out and log back in
2. Clear browser local storage
3. Verify App Client has correct scopes:
   ```bash
   aws cognito-idp describe-user-pool-client \
     --user-pool-id us-east-1_J12Z1OVxM \
     --client-id 5i385r6ath66fnunik1atuvq67 \
     --region us-east-1
   ```

---

## Security Best Practices

### 1. Limit Admin Users
- Only add trusted users to Admins group
- Regularly audit group membership
- Remove users who no longer need admin access

### 2. Monitor Admin Actions
- Enable CloudWatch logging for admin endpoints
- Set up alerts for admin API calls
- Review audit logs regularly

### 3. Use MFA for Admin Users
```bash
# Enable MFA for admin user
aws cognito-idp admin-set-user-mfa-preference \
  --user-pool-id us-east-1_J12Z1OVxM \
  --username [USERNAME] \
  --software-token-mfa-settings Enabled=true,PreferredMfa=true \
  --region us-east-1
```

### 4. Rotate Admin Credentials
- Require password changes every 90 days
- Use strong password policies
- Monitor for suspicious login attempts

---

## Automation Script

Create a script to automate admin user setup:

```bash
#!/bin/bash
# setup-admin-user.sh

USER_POOL_ID="us-east-1_J12Z1OVxM"
REGION="us-east-1"
USERNAME=$1

if [ -z "$USERNAME" ]; then
  echo "Usage: ./setup-admin-user.sh <username>"
  exit 1
fi

echo "Setting up admin user: $USERNAME"

# Create Admins group if it doesn't exist
aws cognito-idp create-group \
  --group-name Admins \
  --user-pool-id $USER_POOL_ID \
  --description "System administrators" \
  --precedence 1 \
  --region $REGION \
  2>/dev/null || echo "Admins group already exists"

# Add user to Admins group
aws cognito-idp admin-add-user-to-group \
  --user-pool-id $USER_POOL_ID \
  --username $USERNAME \
  --group-name Admins \
  --region $REGION

# Verify
echo "Verifying group membership..."
aws cognito-idp admin-list-groups-for-user \
  --user-pool-id $USER_POOL_ID \
  --username $USERNAME \
  --region $REGION

echo "Done! User $USERNAME is now an admin."
echo "They need to log out and log back in to access /admin"
```

**Usage**:
```bash
chmod +x setup-admin-user.sh
./setup-admin-user.sh admin@example.com
```

---

## Quick Reference

### Create Group
```bash
aws cognito-idp create-group \
  --group-name Admins \
  --user-pool-id us-east-1_J12Z1OVxM \
  --region us-east-1
```

### Add User to Group
```bash
aws cognito-idp admin-add-user-to-group \
  --user-pool-id us-east-1_J12Z1OVxM \
  --username [USERNAME] \
  --group-name Admins \
  --region us-east-1
```

### Remove User from Group
```bash
aws cognito-idp admin-remove-user-from-group \
  --user-pool-id us-east-1_J12Z1OVxM \
  --username [USERNAME] \
  --group-name Admins \
  --region us-east-1
```

### List Group Members
```bash
aws cognito-idp list-users-in-group \
  --user-pool-id us-east-1_J12Z1OVxM \
  --group-name Admins \
  --region us-east-1
```

### Delete Group
```bash
aws cognito-idp delete-group \
  --group-name Admins \
  --user-pool-id us-east-1_J12Z1OVxM \
  --region us-east-1
```

---

## Next Steps

After setting up the Admins group:

1. ✅ Create the "Admins" group in Cognito
2. ✅ Add at least one admin user
3. ✅ Test admin access to `/admin` route
4. ✅ Verify non-admin users are redirected
5. ⏳ Implement backend Admin API Lambda
6. ⏳ Connect Platform Config to AWS Secrets Manager
7. ⏳ Implement System Monitoring metrics API

---

## Related Documentation

- [FRONTEND_ROUTE_MAPPING_REPORT.md](./FRONTEND_ROUTE_MAPPING_REPORT.md)
- [ARCHITECTURE_ENHANCEMENT_PLAN.md](./ARCHITECTURE_ENHANCEMENT_PLAN.md)
- [Admin Components README](./frontend/src/components/admin/README.md)
- [AWS Cognito Groups Documentation](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-user-groups.html)
