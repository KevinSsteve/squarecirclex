# Requirements Document

## Introduction

Experta is an autonomous AI social media manager that identifies trends, creates brand-consistent content, and fully automates the publishing process to social media platforms. The system uses conversational AI for onboarding, generates visual content aligned with brand identity, and operates autonomously to maintain a consistent social media presence without manual intervention.

## Glossary

- **Experta**: The AI-powered social media management system
- **Brand**: A client organization with social media accounts managed by Experta
- **Content_Pillar**: A thematic category that guides content creation (e.g., "product features", "customer stories", "industry insights")
- **Post**: A social media content item including caption, image, and metadata
- **Content_Calendar**: A 30-day schedule of posts with specific publication times
- **Post_Status**: The lifecycle state of a post (Draft, Scheduled, Published, Failed)
- **Onboarding_Session**: An interactive conversation where Experta gathers brand information with persistent state
- **Trend_Source**: External platforms (Instagram, Web) used for style inspiration
- **Auto_Publisher**: The Lambda function that publishes posts to social media APIs at scheduled times
- **Dashboard**: The web interface displaying the content calendar and chat sidebar
- **OAuth_Connection**: A secure authorization linking a brand to a social media platform account
- **Secrets_Manager**: AWS service storing encrypted OAuth tokens and credentials
- **Admin_Panel**: Web interface for system administrators to configure platform OAuth credentials
- **Entity_Extraction**: AI process of identifying structured data from natural language conversation

## Requirements

### Requirement 1: Conversational Onboarding (Enhanced - Phase 2)

**User Story:** As a brand manager, I want to complete onboarding through a natural conversational interface without seeing technical terms, so that I can easily provide brand information in my own words.

#### Acceptance Criteria

1. WHEN a new user starts onboarding, THE Experta SHALL initiate a conversational flow using Claude 3.5 Sonnet
2. WHEN Experta asks for brand information, THE System SHALL collect brand name, industry, target audience, tone of voice, and visual style preferences through natural conversation
3. WHEN Experta asks for content strategy, THE System SHALL collect at least 3 content pillars and preferred posting times through natural conversation
4. WHEN the user provides information in a single message, THE System SHALL extract multiple entities simultaneously using AI entity extraction
5. WHEN the user provides incomplete information, THE Experta SHALL ask clarifying follow-up questions only for missing fields
6. WHEN onboarding is in progress, THE System SHALL display a progress indicator showing percentage complete
7. WHEN onboarding is complete, THE System SHALL save all brand data to DynamoDB with a unique brand identifier (excluding social media tokens)
8. WHEN onboarding is complete, THE System SHALL redirect the user to the Connect Accounts page
9. WHEN onboarding is complete, THE System SHALL NOT request API tokens or technical credentials from the user

### Requirement 2: Brand Data Persistence (Enhanced - Phase 2)

**User Story:** As a system administrator, I want brand information stored securely and efficiently without storing OAuth tokens in DynamoDB, so that the system maintains enterprise-grade security.

#### Acceptance Criteria

1. WHEN brand data is saved, THE System SHALL store it in a DynamoDB table named Brands with brand_id as partition key
2. WHEN storing brand data, THE System SHALL include fields for brand_name, industry, target_audience, tone_of_voice, visual_style, content_pillars, and post_times
3. WHEN storing brand data, THE System SHALL NOT store social media tokens in DynamoDB
4. WHEN a brand is created, THE System SHALL generate a unique brand_id using UUID format
5. WHEN a brand is created, THE System SHALL include connection status flags (has_instagram_connection, has_linkedin_connection) defaulting to false

### Requirement 3: Visual Content Generation

**User Story:** As a brand manager, I want AI-generated images that match my brand's visual identity, so that my social media maintains consistent aesthetics.

#### Acceptance Criteria

1. WHEN generating an image, THE System SHALL use Amazon Titan Image Generator via Bedrock
2. WHEN generating an image, THE System SHALL include brand visual style preferences in the generation prompt
3. WHEN an image is generated, THE System SHALL store it in Amazon S3 with a unique key
4. WHEN an image is stored, THE System SHALL save the S3 URL in the Post record in DynamoDB
5. WHEN image generation fails, THE System SHALL retry up to 3 times before marking the post as failed
6. WHEN an image is generated, THE System SHALL ensure it meets minimum resolution requirements for target platforms (1080x1080 for Instagram)

### Requirement 4: Trend Identification and Remixing

**User Story:** As a brand manager, I want the system to identify trending content styles and remix them for my brand, so that my content stays relevant and engaging.

#### Acceptance Criteria

1. WHEN trend scraping is triggered, THE System SHALL invoke a Lambda function to scrape Instagram and web sources
2. WHEN scraping Instagram, THE System SHALL use Instagram Graph API to fetch trending posts in relevant hashtags
3. WHEN scraping web sources, THE System SHALL extract visual style patterns and content themes
4. WHEN trend data is collected, THE System SHALL store style descriptors and themes in DynamoDB
5. WHEN generating new content, THE System SHALL incorporate trending style elements while maintaining brand identity
6. WHEN remixing trends, THE System SHALL ensure generated content is original and does not violate copyright

### Requirement 5: Autonomous Content Calendar Generation

**User Story:** As a brand manager, I want a 30-day content calendar generated automatically after onboarding, so that I have consistent content without manual planning.

#### Acceptance Criteria

1. WHEN onboarding completes, THE System SHALL trigger an EventBridge rule to invoke the content generation Lambda
2. WHEN generating the calendar, THE System SHALL create exactly 30 posts distributed across the 30-day period
3. WHEN distributing posts, THE System SHALL align publication times with the brand's preferred post_times
4. WHEN creating posts, THE System SHALL distribute content evenly across all defined content_pillars
5. WHEN generating captions, THE System SHALL use Claude 3.5 Sonnet via Bedrock with brand tone of voice
6. WHEN generating images, THE System SHALL use Amazon Titan with brand visual style preferences
7. WHEN posts are created, THE System SHALL save them to DynamoDB with status "Scheduled"
8. WHEN saving posts, THE System SHALL include fields for post_id, brand_id, caption, image_url, platform, scheduled_time, status, and content_pillar

### Requirement 6: Automated Post Publishing

**User Story:** As a brand manager, I want posts published automatically at scheduled times, so that I maintain consistent presence without manual intervention.

#### Acceptance Criteria

1. WHEN a post's scheduled_time arrives, THE System SHALL trigger the Auto_Publisher Lambda via EventBridge
2. WHEN publishing to Instagram, THE Auto_Publisher SHALL use Instagram Graph API to create the post
3. WHEN publishing to LinkedIn, THE Auto_Publisher SHALL use LinkedIn API to create the post
4. WHEN a post is successfully published, THE Auto_Publisher SHALL update the post status to "Published" in DynamoDB
5. WHEN a post is successfully published, THE Auto_Publisher SHALL record the actual publication timestamp
6. WHEN publishing fails, THE Auto_Publisher SHALL update the post status to "Failed" and log the error message
7. WHEN publishing fails, THE Auto_Publisher SHALL retry up to 2 times with exponential backoff
8. WHEN all retries fail, THE Auto_Publisher SHALL send a notification for manual review

### Requirement 7: Dashboard and Content Visualization

**User Story:** As a brand manager, I want to view my content calendar in a visual dashboard, so that I can see scheduled, drafted, and published content at a glance.

#### Acceptance Criteria

1. WHEN a user accesses the dashboard, THE System SHALL display a calendar view showing all posts for the current 30-day period
2. WHEN displaying posts, THE Dashboard SHALL color-code posts by status (Draft, Scheduled, Published, Failed)
3. WHEN displaying posts, THE Dashboard SHALL show post thumbnail, caption preview, platform, and scheduled time
4. WHEN a user clicks a post, THE Dashboard SHALL display full post details including complete caption and full-size image
5. WHEN displaying the calendar, THE Dashboard SHALL group posts by date and sort by scheduled time
6. WHEN the user is authenticated, THE Dashboard SHALL only display posts for their associated brand

### Requirement 8: Interactive Chat Sidebar

**User Story:** As a brand manager, I want to request manual adjustments through a chat interface, so that I can make ad-hoc changes without navigating complex menus.

#### Acceptance Criteria

1. WHEN the dashboard loads, THE System SHALL display a persistent chat sidebar with Experta
2. WHEN a user sends a message, THE System SHALL process it using Claude 3.5 Sonnet via Bedrock
3. WHEN a user requests a new post (e.g., "create a post about tomorrow's promotion"), THE Experta SHALL generate the post and add it to the calendar
4. WHEN a user requests to modify a post, THE Experta SHALL identify the target post and apply the requested changes
5. WHEN a user requests to delete a post, THE Experta SHALL remove it from the calendar and update DynamoDB
6. WHEN Experta completes an action, THE System SHALL update the dashboard view to reflect changes immediately
7. WHEN Experta cannot understand a request, THE System SHALL ask clarifying questions

### Requirement 9: User Authentication and Authorization

**User Story:** As a system administrator, I want secure user authentication and authorization, so that only authorized users can access their brand's data.

#### Acceptance Criteria

1. WHEN a user accesses the application, THE System SHALL require authentication via Amazon Cognito
2. WHEN a user signs up, THE System SHALL create a Cognito user account with email verification
3. WHEN a user logs in, THE System SHALL issue JWT tokens for API authorization
4. WHEN accessing brand data, THE System SHALL verify the user is associated with the requested brand
5. WHEN accessing API endpoints, THE System SHALL validate JWT tokens and reject unauthorized requests
6. WHEN a user session expires, THE System SHALL redirect to the login page

### Requirement 10: Event-Driven Architecture

**User Story:** As a system architect, I want event-driven automation, so that the system operates autonomously without manual triggers.

#### Acceptance Criteria

1. WHEN onboarding completes, THE System SHALL publish an event to EventBridge with event type "BrandOnboardingComplete"
2. WHEN a "BrandOnboardingComplete" event is received, THE System SHALL trigger the content generation Lambda
3. WHEN a post's scheduled_time is reached, THE System SHALL trigger the Auto_Publisher Lambda via EventBridge scheduled rule
4. WHEN content generation completes, THE System SHALL publish an event with type "ContentCalendarGenerated"
5. WHEN a post is published, THE System SHALL publish an event with type "PostPublished"
6. WHEN EventBridge rules are created, THE System SHALL use cron expressions based on post scheduled times

### Requirement 11: Error Handling and Logging

**User Story:** As a system administrator, I want comprehensive error handling and logging, so that I can troubleshoot issues and ensure system reliability.

#### Acceptance Criteria

1. WHEN any Lambda function executes, THE System SHALL log execution details to CloudWatch Logs
2. WHEN an error occurs, THE System SHALL log the error message, stack trace, and context information
3. WHEN a post publication fails, THE System SHALL create an automation log entry in DynamoDB
4. WHEN storing automation logs, THE System SHALL include log_id, brand_id, post_id, action, status, error_message, and timestamp
5. WHEN critical errors occur, THE System SHALL send notifications via Amazon SNS
6. WHEN API rate limits are reached, THE System SHALL implement exponential backoff and retry logic

### Requirement 12: Frontend Deployment and Hosting

**User Story:** As a developer, I want the frontend deployed on AWS infrastructure, so that the application is scalable and reliable.

#### Acceptance Criteria

1. WHEN the frontend is built, THE System SHALL deploy it to AWS Amplify
2. WHEN deploying to Amplify, THE System SHALL configure automatic builds from the main branch
3. WHEN a user accesses the application, THE System SHALL serve the React application via Amplify's CDN
4. WHEN environment variables are needed, THE System SHALL configure them in Amplify environment settings
5. WHEN the application is accessed, THE System SHALL use HTTPS for all connections

### Requirement 13: API Gateway and Lambda Integration

**User Story:** As a developer, I want a RESTful API for frontend-backend communication, so that the frontend can interact with backend services securely.

#### Acceptance Criteria

1. WHEN the backend is deployed, THE System SHALL create an API Gateway REST API
2. WHEN defining API endpoints, THE System SHALL include routes for brands, posts, chat, and authentication
3. WHEN an API request is received, THE System SHALL route it to the appropriate Lambda function
4. WHEN processing API requests, THE System SHALL validate request payloads against defined schemas
5. WHEN API responses are returned, THE System SHALL include appropriate HTTP status codes and error messages
6. WHEN CORS is configured, THE System SHALL allow requests from the Amplify frontend domain

### Requirement 14: Content Regeneration and Editing

**User Story:** As a brand manager, I want to regenerate or edit individual posts, so that I can refine content before publication.

#### Acceptance Criteria

1. WHEN a user requests to regenerate a post, THE System SHALL create a new version with updated caption and image
2. WHEN regenerating a post, THE System SHALL preserve the original scheduled time and content pillar
3. WHEN a user edits a post caption, THE System SHALL update the caption in DynamoDB
4. WHEN a user edits a post, THE System SHALL maintain the post status unless explicitly changed
5. WHEN a post is edited after being scheduled, THE System SHALL preserve the EventBridge rule for publication

### Requirement 15: Multi-Platform Support

**User Story:** As a brand manager, I want to publish to multiple social media platforms simultaneously, so that I maximize my reach efficiently.

#### Acceptance Criteria

1. WHEN creating a post, THE System SHALL allow selection of target platforms (Instagram, LinkedIn, or both)
2. WHEN a post targets multiple platforms, THE System SHALL create separate post records for each platform
3. WHEN publishing to Instagram, THE System SHALL format content according to Instagram requirements
4. WHEN publishing to LinkedIn, THE System SHALL format content according to LinkedIn requirements
5. WHEN a multi-platform post is scheduled, THE System SHALL publish to all selected platforms at the same time

### Requirement 16: OAuth Social Media Connections (Phase 2)

**User Story:** As a brand manager, I want to connect my social media accounts through secure OAuth flows without seeing technical terms, so that I can authorize Experta safely and easily.

#### Acceptance Criteria

1. WHEN a user completes onboarding, THE System SHALL redirect them to a Connect Accounts page
2. WHEN a user views the Connect Accounts page, THE System SHALL display connection cards for Instagram and LinkedIn
3. WHEN a user clicks "Connect Instagram", THE System SHALL initiate an OAuth authorization flow using admin-configured credentials
4. WHEN a user authorizes Instagram, THE System SHALL store the access token in AWS Secrets Manager (not DynamoDB)
5. WHEN a user authorizes LinkedIn, THE System SHALL store the access token in AWS Secrets Manager (not DynamoDB)
6. WHEN a connection is established, THE System SHALL update the brand's connection status flags in DynamoDB
7. WHEN a connection is established, THE System SHALL display connection status with platform username
8. WHEN a user clicks "Disconnect", THE System SHALL revoke the OAuth token and remove it from Secrets Manager
9. WHEN the user views connection status, THE System SHALL NEVER display raw tokens or technical credentials

### Requirement 17: AI Entity Extraction (Phase 2)

**User Story:** As a brand manager, I want the AI to understand my natural language and extract multiple pieces of information from a single message, so that onboarding feels like a real conversation.

#### Acceptance Criteria

1. WHEN a user sends a message during onboarding, THE System SHALL use Claude to extract all identifiable entities
2. WHEN multiple entities are present in one message, THE System SHALL extract all of them simultaneously
3. WHEN entities are extracted, THE System SHALL update the onboarding session state in DynamoDB
4. WHEN entities are extracted, THE System SHALL display extracted information to the user for confirmation
5. WHEN the AI is uncertain about extracted data, THE System SHALL ask clarifying questions
6. WHEN all required fields are collected, THE System SHALL indicate 100% completion
7. WHEN the user confirms extracted data, THE System SHALL create the brand record

### Requirement 18: Onboarding Session Management (Phase 2)

**User Story:** As a system administrator, I want onboarding conversations tracked in a persistent session, so that users can resume onboarding across devices or sessions.

#### Acceptance Criteria

1. WHEN a user starts onboarding, THE System SHALL create an onboarding session record in DynamoDB
2. WHEN storing session data, THE System SHALL include session_id, user_id, conversation_state, extracted_data, and conversation_history
3. WHEN a user sends a message, THE System SHALL update the session with new conversation history
4. WHEN a user returns to onboarding, THE System SHALL retrieve their existing session
5. WHEN onboarding is completed, THE System SHALL mark the session status as "completed"
6. WHEN a session is inactive for 7 days, THE System SHALL automatically delete it using TTL

### Requirement 19: Admin Platform Configuration (Phase 2)

**User Story:** As a system administrator, I want to configure OAuth application credentials for social media platforms, so that users can connect their accounts without managing API apps themselves.

#### Acceptance Criteria

1. WHEN an admin accesses the admin panel, THE System SHALL require Cognito admin group membership
2. WHEN an admin configures a platform, THE System SHALL store OAuth client credentials in AWS Secrets Manager
3. WHEN storing OAuth credentials, THE System SHALL encrypt them using KMS
4. WHEN an admin saves platform configuration, THE System SHALL test the OAuth connection before saving
5. WHEN platform configuration is saved, THE System SHALL store metadata in DynamoDB (not the actual credentials)
6. WHEN a user initiates OAuth, THE System SHALL retrieve admin-configured credentials from Secrets Manager
7. WHEN admin actions occur, THE System SHALL log all actions to CloudWatch for audit purposes
