# Dashboard Component

The Dashboard component provides a visual calendar interface for managing social media posts.

## Components

### Dashboard.jsx
Main dashboard container that:
- Fetches posts from the API with date range and status filters
- Manages loading and error states
- Handles month navigation
- Provides refresh functionality for real-time updates

### CalendarView.jsx
Calendar grid component that:
- Displays posts organized by date in a monthly calendar view
- Shows day numbers with current day highlighting
- Groups posts by date and sorts by scheduled time
- Provides navigation between months
- Shows post count badges for each day
- Displays up to 3 posts per day with overflow indicator

### PostCard.jsx
Post display component with two modes:
- **Compact mode**: Used in calendar grid, shows time, platform icon, and truncated caption
- **Full mode**: Used in list views, shows thumbnail, full metadata, and status badge

Status badge colors:
- Draft: Yellow
- Scheduled: Blue
- Published: Green
- Failed: Red

### PostDetailsModal.jsx
Modal for viewing full post details:
- Full-size image display
- Complete caption text
- Scheduled date and time
- Content pillar information
- Platform information
- Published timestamp (if applicable)
- Error message (if failed)
- Action buttons: Edit, Regenerate, Delete

### StatusFilter.jsx
Filter buttons for post status:
- All Posts
- Draft
- Scheduled
- Published
- Failed

## API Integration

The dashboard integrates with the backend API through the following endpoints:

### GET /posts
Fetches posts with query parameters:
- `start_date`: Start of date range (YYYY-MM-DD)
- `end_date`: End of date range (YYYY-MM-DD)
- `status`: Filter by status (optional)

Response format:
```json
{
  "posts": [
    {
      "post_id": "uuid",
      "brand_id": "uuid",
      "caption": "string",
      "image_url": "string",
      "platform": "instagram" | "linkedin",
      "scheduled_time": "ISO8601",
      "status": "Draft" | "Scheduled" | "Published" | "Failed",
      "content_pillar": "string",
      "created_at": "ISO8601",
      "published_at": "ISO8601 | null",
      "error_message": "string | null"
    }
  ],
  "count": "number"
}
```

### DELETE /posts/{post_id}
Deletes a post.

### POST /posts/{post_id}/regenerate
Regenerates post content while preserving schedule.

## Real-Time Updates

The dashboard supports real-time updates through the `DashboardContext`:

```javascript
import { useDashboard } from '../../contexts/DashboardContext';

// In a component (e.g., Chat Sidebar)
const { triggerRefresh } = useDashboard();

// After a chat action that modifies posts
await api.sendChatMessage(message);
triggerRefresh(); // Dashboard will automatically refresh
```

## Date Range Selection

The dashboard automatically calculates the date range based on the current month view:
- Start date: First day of the current month
- End date: Last day of the current month

Users can navigate between months using the previous/next buttons in the calendar header.

## Features Implemented

✅ Calendar view with date navigation
✅ Post cards with thumbnail, caption preview, and status badge
✅ Status filter (Draft, Scheduled, Published, Failed)
✅ Post details modal with full view
✅ API integration for fetching posts with filters
✅ Date range selection (month-based)
✅ Real-time dashboard updates via context
✅ Delete post functionality
✅ Regenerate post functionality (placeholder for edit)

## Future Enhancements

The following features will be implemented in later tasks:
- Task 21.1: Full post editing functionality
- Task 19: Chat sidebar integration for real-time updates
- Task 20: Onboarding flow integration

## Requirements Validated

This implementation satisfies the following requirements:
- **7.1**: Display calendar view showing all posts for 30-day period
- **7.2**: Color-code posts by status
- **7.3**: Show post thumbnail, caption preview, platform, and scheduled time
- **7.4**: Display full post details on click
- **7.5**: Group posts by date and sort by scheduled time
- **7.6**: Only display posts for authenticated user's brand (handled by API)
