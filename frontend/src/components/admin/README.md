# Admin Components

Admin dashboard and configuration components for the Experta AI Social Media Manager.

## Overview

The admin components provide a secure interface for system administrators to:
- Configure platform-wide OAuth credentials
- Monitor system health and activity
- Manage system settings
- View automation logs and metrics

## Components

### Admin.jsx
Main admin dashboard with tabbed navigation.

**Features**:
- Tab-based navigation (Platform Config, System Monitoring)
- Admin badge indicator
- Sign out functionality
- Warning banner for elevated privileges

**Access**: Requires "Admins" Cognito group membership

### PlatformConfig.jsx
Platform-wide OAuth credential configuration.

**Features**:
- Instagram Graph API configuration
- LinkedIn API configuration
- Secure credential storage (AWS Secrets Manager)
- Form validation and error handling

**Fields**:
- Instagram: App ID, App Secret, Redirect URI
- LinkedIn: Client ID, Client Secret, Redirect URI

### SystemMonitoring.jsx
System health and activity monitoring dashboard.

**Features**:
- Real-time metrics (Total Brands, Total Posts, Published Today, Failed Today)
- Recent activity feed with timestamps
- Quick action buttons
- Auto-refresh capability

**Metrics**:
- Total Brands: Count of all brands in system
- Total Posts: Count of all posts (all statuses)
- Published Today: Successfully published posts today
- Failed Today: Failed publication attempts today

## Security

### Access Control
All admin routes are protected by two layers:
1. **ProtectedRoute**: Verifies user is authenticated
2. **AdminRoute**: Verifies user is in "Admins" Cognito group

### Route Protection
```jsx
<Route
  path="/admin"
  element={
    <ProtectedRoute>
      <AdminRoute>
        <Admin />
      </AdminRoute>
    </ProtectedRoute>
  }
/>
```

### Cognito Groups
Admin access requires membership in the "Admins" Cognito group:
- Group name: `Admins` (case-sensitive)
- JWT claim: `cognito:groups`
- Verification: Performed by AdminRoute component

## Usage

### Accessing Admin Dashboard
1. Log in as a user with admin privileges
2. Navigate to `/admin`
3. If not in "Admins" group, redirected to `/dashboard`

### Configuring Platform Credentials
1. Navigate to Admin Dashboard
2. Click "Platform Configuration" tab
3. Enter Instagram or LinkedIn credentials
4. Click "Save" button
5. Credentials encrypted and stored in AWS Secrets Manager

### Monitoring System Health
1. Navigate to Admin Dashboard
2. Click "System Monitoring" tab
3. View real-time metrics and recent activity
4. Use quick actions for common tasks

## API Integration

### Platform Configuration
**Endpoint**: `POST /api/admin/platform/{platform}`
**Payload**:
```json
{
  "appId": "string",
  "appSecret": "string",
  "redirectUri": "string"
}
```

### System Metrics
**Endpoint**: `GET /api/admin/metrics`
**Response**:
```json
{
  "totalBrands": number,
  "totalPosts": number,
  "publishedToday": number,
  "failedToday": number
}
```

### Recent Activity
**Endpoint**: `GET /api/admin/activity`
**Response**:
```json
[
  {
    "id": number,
    "type": "success" | "error" | "warning" | "info",
    "message": string,
    "timestamp": string (ISO 8601)
  }
]
```

## TODO: Backend Implementation

The following backend endpoints need to be implemented:

1. **Admin API Lambda** (`functions/admin-api/`)
   - POST /admin/platform/instagram
   - POST /admin/platform/linkedin
   - GET /admin/metrics
   - GET /admin/activity

2. **AWS Secrets Manager Integration**
   - Store platform credentials securely
   - Encrypt with KMS
   - Separate keys for platform vs brand credentials

3. **DynamoDB Queries**
   - Count total brands
   - Count total posts
   - Query posts by date and status
   - Query automation logs

4. **IAM Permissions**
   - Admin Lambda needs Secrets Manager write access
   - Admin Lambda needs DynamoDB read access
   - Admin Lambda needs CloudWatch Logs read access

## Testing

### Manual Testing
1. Create test user in Cognito
2. Add user to "Admins" group
3. Log in and navigate to `/admin`
4. Verify access granted
5. Test with non-admin user (should redirect)

### Automated Testing
```bash
# Run component tests
npm test -- Admin.test.jsx
npm test -- PlatformConfig.test.jsx
npm test -- SystemMonitoring.test.jsx

# Run integration tests
npm test -- admin.integration.test.jsx
```

## Styling

All admin components use Tailwind CSS with consistent styling:
- Primary color: Blue (blue-600, blue-700)
- Success: Green (green-600)
- Error: Red (red-600)
- Warning: Yellow (yellow-400)
- Info: Blue (blue-400)

## Future Enhancements

1. **User Management**
   - View all users
   - Add/remove users from groups
   - Reset user passwords

2. **Advanced Monitoring**
   - Real-time Lambda metrics
   - Cost tracking
   - Performance analytics

3. **Audit Logging**
   - Track all admin actions
   - Export audit logs
   - Compliance reporting

4. **System Configuration**
   - Adjust posting schedules
   - Configure retry policies
   - Set rate limits

## Support

For issues or questions about admin components:
1. Check CloudWatch logs for errors
2. Verify Cognito group membership
3. Confirm AWS Secrets Manager permissions
4. Review API Gateway logs

## Related Documentation

- [ARCHITECTURE_ENHANCEMENT_PLAN.md](../../../ARCHITECTURE_ENHANCEMENT_PLAN.md)
- [FRONTEND_ROUTE_MAPPING_REPORT.md](../../../FRONTEND_ROUTE_MAPPING_REPORT.md)
- [AuthContext Documentation](../../contexts/AuthContext.jsx)
- [AdminRoute Documentation](../auth/AdminRoute.jsx)
