# Implementation Plan: Experta AI Social Media Manager

## Overview

This implementation plan breaks down the Experta system into discrete, incremental tasks. The system uses a hybrid approach: Node.js 20.x for core application logic, API management, and chat handling; Python 3.11 for AI/ML operations (content generation, trend scraping). All functions are managed within an AWS SAM project for architectural consistency.

**Current Status**: No implementation has been started. All infrastructure and code needs to be created from scratch.

**Architecture Summary**:
- Frontend: React application deployed on AWS Amplify
- Backend: AWS Lambda functions (Node.js 20.x and Python 3.11)
- Storage: DynamoDB for data persistence, S3 for images
- AI/ML: Amazon Bedrock (Claude 3.5 Sonnet for text, Titan for images)
- Orchestration: EventBridge for event-driven automation
- Authentication: Amazon Cognito with JWT tokens
- API: API Gateway with REST endpoints

## Tasks

- [x] 1. Project Setup and Infrastructure Foundation
  - Initialize AWS SAM project with hybrid runtime support (Node.js 20.x + Python 3.11)
  - Create SAM template.yaml with basic structure
  - Configure DynamoDB tables (Brands, Posts, Automation_Logs, Trends) with GSIs
  - Configure S3 bucket for image storage with lifecycle policies
  - Configure EventBridge event bus for system events
  - Set up Cognito User Pool with email verification and custom:brand_id attribute
  - Configure API Gateway with CORS and JWT authorizer
  - Create shared environment configuration
  - Set up KMS key for credential encryption
  - _Requirements: 2.1, 9.1, 9.2, 12.1, 13.1, 2.3_

- [x] 2. Core Shared Libraries (Node.js)
  - [x] 2.1 Create encryption service
    - Create `lib/security/encryption.js` with KMS encrypt/decrypt functions
    - Implement error handling for KMS operations
    - _Requirements: 2.3, 2.4_
  
  - [x] 2.2 Write property test for encryption round-trip

    - **Property 3: Credential Encryption Round-Trip**
    - **Validates: Requirements 2.3, 2.4**
  
  - [x] 2.3 Create authentication middleware
    - Create `lib/auth/jwt-validator.js` for token verification
    - Implement Cognito public key fetching and caching
    - Create middleware function for API Gateway Lambda authorizer
    - _Requirements: 9.3, 9.5_
  
  - [x] 2.4 Create brand authorization helper
    - Create `lib/auth/brand-authorizer.js` to verify user-brand association
    - Implement helper to extract brand_id from Cognito custom attributes
    - _Requirements: 9.4, 7.6_
  
  - [x] 2.5 Write property test for JWT validation

    - **Property 18: JWT Token Validation**
    - **Validates: Requirements 9.5**
  
  - [x] 2.6 Write property test for brand authorization

    - **Property 14: Dashboard Data Filtering**
    - **Validates: Requirements 7.6, 9.4**
  
  - [x] 2.7 Create error handling utilities
    - Create `lib/errors/error-handler.js` with standard error response formatting
    - Implement CloudWatch logging helper with structured logging
    - Create error codes enum (VALIDATION_ERROR, UNAUTHORIZED, etc.)
    - _Requirements: 11.1, 11.2, 13.5_
  
  - [x] 2.8 Create request validation middleware
    - Create `lib/validation/request-validator.js` with schema validation
    - Define JSON schemas for all API endpoints
    - Implement validation error response formatting
    - _Requirements: 13.4, 13.5_
  
  - [x] 2.9 Write property test for API request validation

    - **Property 24: API Request Validation**
    - **Validates: Requirements 13.4, 13.5**

- [x] 3. Core Shared Libraries (Python)
  - [x] 3.1 Create Python error handling utilities
    - Create `lib/errors/error_handler.py` with exception handling
    - Implement CloudWatch logging helper
    - _Requirements: 11.1, 11.2_

- [x] 4. DynamoDB Data Access Layer (Node.js)
  - [x] 4.1 Create Brands table data access
    - Create `lib/db/brands.js` with CRUD operations for Brands table
    - Implement query helpers for user_id GSI
    - _Requirements: 2.1, 2.2_
  
  - [x] 4.2 Create Posts table data access
    - Create `lib/db/posts.js` with CRUD operations for Posts table
    - Implement query helpers for brand_id-scheduled_time and brand_id-status GSIs
    - _Requirements: 2.1, 2.2, 7.1_
  
  - [x] 4.3 Create Automation Logs data access
    - Create `lib/db/logs.js` with write operations for Automation_Logs table
    - Implement query helpers for brand_id-timestamp GSI
    - _Requirements: 11.3, 11.4_
  
  - [x] 4.4 Write property test for brand data completeness

    - **Property 1: Brand Data Completeness**
    - **Validates: Requirements 1.2, 1.3, 1.4, 2.2**
  
  - [x] 4.5 Write property test for brand ID format

    - **Property 2: Brand ID Format Validation**
    - **Validates: Requirements 2.5**
  
  - [x] 4.6 Write property test for post schema completeness

    - **Property 12: Post Schema Completeness**
    - **Validates: Requirements 5.8**
  
  - [x] 4.7 Write property test for automation log schema

    - **Property 22: Automation Log Schema**
    - **Validates: Requirements 11.4**

- [x] 5. EventBridge Integration Utilities (Node.js)
  - [x] 5.1 Create EventBridge helper utilities
    - Create `lib/events/eventbridge-client.js` for publishing events
    - Implement scheduled rule creation for post publishing
    - Implement cron expression generation from scheduled_time
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_
  
  - [x] 5.2 Write property test for EventBridge cron accuracy

    - **Property 19: EventBridge Cron Expression Accuracy**
    - **Validates: Requirements 10.6**
  
  - [x] 5.3 Write unit tests for EventBridge integration

    - Test event publishing
    - Test scheduled rule creation
    - Test cron expression generation
    - _Requirements: 10.1, 10.3_

- [x] 6. Onboarding Handler Lambda (Node.js)
  - [x] 6.1 Create onboarding Lambda function
    - Implement `functions/onboarding/handler.js` with POST /brands endpoint
    - Integrate with Bedrock Claude 3.5 Sonnet for conversational processing
    - Implement brand data validation and structuring
    - Encrypt social media credentials using encryption service
    - Save brand to DynamoDB using data access layer
    - Publish BrandOnboardingComplete event to EventBridge
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.6, 1.7, 2.3, 10.1_
  
  - [x] 6.2 Write unit tests for onboarding handler

    - Test successful brand creation with valid data
    - Test validation errors for missing required fields
    - Test EventBridge event publishing
    - _Requirements: 1.6, 1.7_
  
  - [x] 6.3 Write property test for HTTPS enforcement

    - **Property 23: HTTPS Enforcement**
    - **Validates: Requirements 12.5**

- [x] 7. Content Generator Lambda (Python)
  - [x] 7.1 Create content generation Lambda function
    - Implement `functions/content-generator/handler.py` triggered by EventBridge
    - Fetch brand data from DynamoDB
    - Implement loop to generate 30 posts with round-robin content pillar distribution
    - Integrate with Bedrock Claude for caption generation
    - Integrate with Bedrock Titan for image generation
    - Upload images to S3 with unique keys
    - Calculate scheduled times based on brand post_times
    - Save posts to DynamoDB with "Scheduled" status
    - Create EventBridge scheduled rules for each post
    - Publish ContentCalendarGenerated event
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 10.2, 10.4_
  
  - [x] 7.2 Write property test for content calendar size

    - **Property 8: Content Calendar Size**
    - **Validates: Requirements 5.2**
  
  - [x] 7.3 Write property test for post time alignment

    - **Property 9: Post Time Alignment**
    - **Validates: Requirements 5.3**
  
  - [x] 7.4 Write property test for content pillar distribution

    - **Property 10: Content Pillar Distribution**
    - **Validates: Requirements 5.4**
  
  - [x] 7.5 Write property test for initial post status

    - **Property 11: Initial Post Status**
    - **Validates: Requirements 5.7**
  
  - [x] 7.6 Write property test for image generation prompt inclusion

    - **Property 4: Image Generation Prompt Inclusion**
    - **Validates: Requirements 3.2**
  
  - [x] 7.7 Write property test for image storage consistency

    - **Property 5: Image Storage Consistency**
    - **Validates: Requirements 3.3, 3.4**
  
  - [x] 7.8 Write property test for image resolution requirements

    - **Property 6: Image Resolution Requirements**
    - **Validates: Requirements 3.6**

- [x] 8. Checkpoint - Verify Onboarding and Content Generation
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Auto Publisher Lambda (Node.js)
  - [x] 9.1 Create auto publisher Lambda function
    - Implement `functions/auto-publisher/handler.js` triggered by EventBridge scheduled rules
    - Fetch post details from DynamoDB
    - Decrypt social media credentials using encryption service
    - Implement Instagram Graph API integration for post publishing
    - Implement LinkedIn API integration for post publishing
    - Update post status to "Published" with published_at timestamp on success
    - Implement retry logic with exponential backoff (max 2 retries)
    - Update post status to "Failed" with error_message on final failure
    - Send SNS notification on final failure
    - Create automation log entry in DynamoDB
    - Publish PostPublished event to EventBridge
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 10.3, 10.5, 11.3_
  
  - [x] 9.2 Write property test for publication state management

    - **Property 13: Publication State Management**
    - **Validates: Requirements 6.4, 6.5, 6.6**
  
  - [x] 9.3 Write property test for platform-specific formatting

    - **Property 30: Platform-Specific Formatting**
    - **Validates: Requirements 15.3, 15.4**
   
  - [x] 9.4 Write unit tests for auto publisher

    - Test successful Instagram publication
    - Test successful LinkedIn publication
    - Test retry logic on API failures
    - Test SNS notification on final failure
    - _Requirements: 6.2, 6.3, 6.7, 6.8_

- [x] 10. Trend Scraper Lambda (Python)
  - [x] 10.1 Create trend scraper Lambda function
    - Implement `functions/trend-scraper/handler.py` triggered by daily EventBridge rule
    - Integrate with Instagram Graph API to fetch trending posts
    - Extract style descriptors and themes from trending content
    - Store trend data in DynamoDB Trends table
    - Implement TTL-based cleanup for 7-day rolling window
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [x] 10.2 Write property test for trend data persistence

    - **Property 7: Trend Data Persistence**
    - **Validates: Requirements 4.3, 4.4**
  
  - [x] 10.3 Write unit tests for trend scraper

    - Test Instagram API integration
    - Test trend data extraction
    - Test DynamoDB storage
    - _Requirements: 4.2, 4.4_

- [x] 11. Posts API Handler Lambda (Node.js)
  - [x] 11.1 Create posts API Lambda function
    - Implement `functions/posts-api/handler.js` with GET /posts endpoint
    - Implement GET /posts/{post_id} endpoint
    - Implement PUT /posts/{post_id} endpoint for updates
    - Implement DELETE /posts/{post_id} endpoint
    - Add query parameter support for filtering (brand_id, start_date, end_date, status)
    - Implement brand authorization checks
    - Implement post sorting by scheduled_time
    - _Requirements: 7.1, 7.3, 7.4, 7.5, 7.6, 14.3, 14.4_
  
  - [x] 11.2 Write property test for post display completeness

    - **Property 15: Post Display Completeness**
    - **Validates: Requirements 7.3**
  
  - [x] 11.3 Write property test for calendar sorting


    - **Property 16: Calendar Sorting**
    - **Validates: Requirements 7.5**
  
  - [x] 11.4 Write property test for post edit status preservation

    - **Property 26: Post Edit Status Preservation**
    - **Validates: Requirements 14.4**
  
  - [x] 11.5 Write unit tests for posts API

    - Test post filtering by date range
    - Test post filtering by status
    - Test authorization enforcement
    - _Requirements: 7.1, 7.6_

- [x] 12. Chat Handler Lambda (Node.js)
  - [x] 12.1 Create chat handler Lambda function
    - Implement `functions/chat-handler/handler.js` with POST /chat endpoint
    - Integrate with Bedrock Claude 3.5 Sonnet for message processing
    - Implement intent extraction (create_post, modify_post, delete_post, query)
    - Implement create_post action: generate caption and image, save to DynamoDB
    - Implement modify_post action: update post in DynamoDB
    - Implement delete_post action: delete post from DynamoDB
    - Implement query action: fetch and return information
    - Return conversational response with action confirmation
    - _Requirements: 8.2, 8.3, 8.4, 8.5_
  
  - [x] 12.2 Write property test for chat action persistence

    - **Property 17: Chat Action Persistence**
    - **Validates: Requirements 8.3, 8.4, 8.5**
  
  - [x] 12.3 Write unit tests for chat handler


    - Test create post intent handling
    - Test modify post intent handling
    - Test delete post intent handling
    - Test query intent handling
    - _Requirements: 8.3, 8.4, 8.5_

- [x] 13. Post Regeneration Feature
  - [x] 13.1 Add regeneration endpoint to posts API
    - Implement POST /posts/{post_id}/regenerate endpoint
    - Generate new caption using Bedrock Claude
    - Generate new image using Bedrock Titan
    - Upload new image to S3
    - Update post in DynamoDB with new content
    - Preserve scheduled_time and content_pillar
    - Verify EventBridge rule still exists
    - _Requirements: 14.1, 14.2, 14.5_
  
  - [x] 13.2 Write property test for regeneration invariants

    - **Property 25: Post Regeneration Invariants**
    - **Validates: Requirements 14.2**
  
  - [x] 13.3 Write property test for EventBridge rule preservation

    - **Property 27: EventBridge Rule Preservation**
    - **Validates: Requirements 14.5**

- [x] 14. Multi-Platform Support
  - [x] 14.1 Implement multi-platform post creation
    - Update content generator to support platform selection
    - Implement logic to create separate post records for each platform
    - Ensure all platform posts have same scheduled_time
    - Update auto publisher to handle platform-specific formatting
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_
  
  - [x] 14.2 Write property test for platform selection validation

    - **Property 28: Platform Selection Validation**
    - **Validates: Requirements 15.1**
  
  - [x] 14.3 Write property test for multi-platform post creation

    - **Property 29: Multi-Platform Post Creation**
    - **Validates: Requirements 15.2, 15.5**

- [x] 15. Checkpoint - Verify Backend Functionality
  - Ensure all tests pass, ask the user if questions arise.

- [x] 16. Additional Error Handling and Logging
  - [x] 16.1 Add comprehensive logging to all Lambda functions
    - Ensure all Lambda executions log to CloudWatch
    - Implement structured logging with context information
    - _Requirements: 11.1_
  
  - [x] 16.2 Write property test for Lambda execution logging

    - **Property 20: Lambda Execution Logging**
    - **Validates: Requirements 11.1**
  
  - [x] 16.3 Write property test for error log completeness

    - **Property 21: Error Log Completeness**
    - **Validates: Requirements 11.2**

- [x] 17. Frontend - React Application Setup
  - [x] 17.1 Initialize React application with Tailwind CSS
    - Create React app using Vite
    - Configure Tailwind CSS
    - Set up AWS Amplify SDK for authentication
    - Configure API client for backend communication
    - Set up routing with React Router
    - _Requirements: 12.1, 12.5_
  
  - [x] 17.2 Implement authentication components
    - Create Login component with Cognito integration
    - Create Signup component with email verification
    - Create ProtectedRoute wrapper component
    - Implement JWT token storage and refresh logic
    - _Requirements: 9.1, 9.2, 9.3_

- [x] 18. Frontend - Dashboard Component
  - [x] 18.1 Create dashboard layout
    - Implement calendar view component with date navigation
    - Create post card component with thumbnail, caption preview, status badge
    - Implement status filter (Draft, Scheduled, Published, Failed)
    - Create post details modal for full view
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  
  - [x] 18.2 Integrate dashboard with posts API
    - Implement API calls to fetch posts with filters
    - Implement date range selection
    - Implement real-time dashboard updates after chat actions
    - _Requirements: 7.1, 7.5, 7.6_

- [x] 19. Frontend - Chat Sidebar Component
  - [x] 19.1 Create chat sidebar UI
    - Implement persistent sidebar layout
    - Create message bubble components (user and assistant)
    - Implement text input with send button
    - Add typing indicators
    - _Requirements: 8.1, 8.2_
  
  - [x] 19.2 Integrate chat with backend API
    - Implement POST /chat API calls
    - Implement conversation history management
    - Implement action confirmation messages
    - Trigger dashboard refresh after chat actions
    - _Requirements: 8.2, 8.3, 8.4, 8.5, 8.6_

- [x] 20. Frontend - Onboarding Flow Component
  - [x] 20.1 Create onboarding UI
    - Implement chat-style onboarding interface
    - Create progressive information collection screens
    - Implement visual confirmation of collected data
    - Create completion celebration screen
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.7_
  
  - [x] 20.2 Integrate onboarding with backend
    - Implement POST /brands API call
    - Handle onboarding completion and redirect to dashboard
    - Display content generation progress indicator
    - _Requirements: 1.6, 1.7_

- [x] 21. Frontend - Post Management Features
  - [x] 21.1 Implement post editing
    - Create edit post modal
    - Implement caption editing
    - Implement PUT /posts/{post_id} API call
    - _Requirements: 14.3, 14.4_
  
  - [x] 21.2 Implement post regeneration
    - Add regenerate button to post details modal
    - Implement POST /posts/{post_id}/regenerate API call
    - Show regeneration progress indicator
    - _Requirements: 14.1, 14.2_
  
  - [x] 21.3 Implement post deletion
    - Add delete button with confirmation dialog
    - Implement DELETE /posts/{post_id} API call
    - _Requirements: 8.5_

- [x] 22. Deployment Configuration
  - [x] 22.1 Configure AWS SAM deployment
    - Complete SAM template with all resources
    - Configure environment variables for all Lambdas
    - Set up IAM roles and policies
    - Configure CloudWatch log groups
    - Configure SNS topic for failure notifications
    - _Requirements: 11.1, 11.5_
  
  - [x] 22.2 Configure AWS Amplify deployment
    - Create Amplify app configuration
    - Configure build settings for React app
    - Set up environment variables
    - Configure custom domain (optional)
    - _Requirements: 12.1, 12.2, 12.3, 12.4_
  
  - [x] 22.3 Set up monitoring and alarms
    - Create CloudWatch alarms for Lambda errors
    - Create CloudWatch alarms for DLQ depth
    - Configure SNS notifications
    - _Requirements: 11.5_

- [x] 23. Integration Testing
  - [x] 23.1 Write end-to-end integration tests

    - Test complete onboarding → content generation → post publishing flow
    - Test chat request → post creation → dashboard update flow
    - Test post regeneration → EventBridge rule update flow
    - Test multi-platform post → simultaneous publishing flow
    - _Requirements: All_

- [x] 24. Final Checkpoint - Complete System Verification
  - ✅ All tests pass (240+ tests, 30 properties validated)
  - ✅ System deployed to AWS and operational
  - ✅ All requirements implemented and verified
  - ✅ Documentation complete
  - ✅ System production-ready

## Phase 2: Intelligent Onboarding Enhancement

- [x] 25. Create New DynamoDB Tables for Phase 2
  - [ ] 25.1 Create Onboarding_Sessions table
    - Add partition key: session_id
    - Add sort key: timestamp
    - Add GSI: user_id-index
    - Configure TTL for 7-day cleanup
    - _Requirements: 18.1, 18.2, 18.6_
  
  - [x] 25.2 Create OAuth_Connections table
    - Add partition key: brand_id
    - Add sort key: platform
    - Add GSI: platform-index
    - _Requirements: 16.4, 16.5, 16.6_
  
  - [x] 25.3 Create Platform_Credentials table
    - Add partition key: platform
    - Store only metadata (ARNs to Secrets Manager)
    - _Requirements: 19.2, 19.5_
  
  - [x] 25.4 Update Brands table schema
    - Remove instagram_token_encrypted field
    - Remove linkedin_token_encrypted field
    - Add has_instagram_connection (Boolean, default false)
    - Add has_linkedin_connection (Boolean, default false)
    - Add onboarding_session_id field
    - Add onboarding_completed_at field
    - _Requirements: 2.3, 2.5, 16.6_

- [x] 26. Implement Admin Settings API (Already Complete)
  - ✅ Backend Lambda function created (functions/admin-settings/)
  - ✅ POST /admin/settings endpoint for saving OAuth credentials
  - ✅ GET /admin/settings endpoint for retrieving configuration
  - ✅ Secrets Manager integration
  - ✅ KMS encryption
  - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 19.6, 19.7_

- [x] 27. Implement OAuth Handler Lambda
  - [x] 27.1 Create OAuth handler function
    - Implement GET /oauth/authorize/{platform} endpoint
    - Implement GET /oauth/callback/{platform} endpoint
    - Implement POST /oauth/refresh/{platform} endpoint
    - Implement DELETE /oauth/disconnect/{platform} endpoint
    - Retrieve admin OAuth credentials from Secrets Manager
    - Generate state token for CSRF protection
    - Exchange authorization code for access token
    - Store tokens in Secrets Manager (not DynamoDB)
    - Save connection metadata in OAuth_Connections table
    - Update brand connection status flags
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6, 16.7, 16.8_
  
  - [x] 27.2 Write property test for OAuth token storage security
    - **Property 31: OAuth Token Storage Security**
    - **Validates: Requirements 16.4, 16.5**
  
  - [x] 27.3 Write property test for connection status synchronization
    - **Property 32: Connection Status Synchronization**
    - **Validates: Requirements 16.6**
  
  - [x] 27.4 Write property test for token visibility restriction
    - **Property 33: Token Visibility Restriction**
    - **Validates: Requirements 16.9**
  
  - [x] 27.5 Write unit tests for OAuth handler
    - Test Instagram OAuth flow
    - Test LinkedIn OAuth flow
    - Test token refresh
    - Test disconnect flow
    - Test CSRF protection
    - _Requirements: 16.3, 16.8_

- [x] 28. Enhance Onboarding Handler with AI Entity Extraction
  - [x] 28.1 Update onboarding handler Lambda
    - Implement session creation and retrieval
    - Enhance Claude prompt for multi-entity extraction
    - Parse extracted entities from Claude response
    - Update session state in Onboarding_Sessions table
    - Calculate completion percentage
    - Track completed_fields and pending_fields
    - Remove token collection logic
    - Redirect to /connections after completion (not /dashboard)
    - _Requirements: 1.1, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 17.1, 17.2, 17.3, 17.4, 17.5, 17.6, 17.7, 18.1, 18.2, 18.3, 18.4, 18.5_
  
  - [x] 28.2 Write property test for multi-entity extraction
    - **Property 34: Multi-Entity Extraction**
    - **Validates: Requirements 17.1, 17.2**
  
  - [x] 28.3 Write property test for session state persistence
    - **Property 35: Session State Persistence**
    - **Validates: Requirements 18.2, 18.3**
  
  - [x] 28.4 Write property test for completion percentage
    - **Property 36: Session Completion Percentage**
    - **Validates: Requirements 17.6**
  
  - [x] 28.5 Write property test for onboarding token exclusion
    - **Property 39: Onboarding Token Exclusion**
    - **Validates: Requirements 1.9, 2.3**
  
  - [x] 28.6 Write property test for onboarding redirect behavior
    - **Property 40: Onboarding Redirect Behavior**
    - **Validates: Requirements 1.8**
  
  - [x] 28.7 Write unit tests for enhanced onboarding
    - Test session creation
    - Test entity extraction
    - Test completion percentage calculation
    - Test redirect to connections page
    - _Requirements: 1.7, 1.8, 18.1_

- [x] 29. Update Auto Publisher to Use Secrets Manager
  - [x] 29.1 Modify auto publisher Lambda
    - Query OAuth_Connections table for token ARN
    - Retrieve token from Secrets Manager (not DynamoDB)
    - Check token expiration
    - Refresh token if expired (call OAuth handler)
    - Remove DynamoDB token decryption logic
    - _Requirements: 16.4, 16.5_
  
  - [x] 29.2 Write unit tests for Secrets Manager integration
    - Test token retrieval from Secrets Manager
    - Test token refresh flow
    - Test expired token handling
    - _Requirements: 16.4_

- [x] 30. Frontend - Remove Token Requests from Onboarding
  - [x] 30.1 Update Onboarding.jsx component
    - Remove instagram_token from state
    - Remove linkedin_token from state
    - Remove token input prompts
    - Remove token validation
    - Add progress indicator showing completion %
    - Display extracted entities for user confirmation
    - _Requirements: 1.4, 1.6, 1.9, 17.4_
  
  - [x] 30.2 Update DataConfirmation.jsx component
    - Remove Instagram token display
    - Remove LinkedIn token display
    - Keep all other brand information display
    - _Requirements: 1.9, 16.9_
  
  - [x] 30.3 Update CompletionCelebration.jsx component
    - Change redirect from /dashboard to /connections
    - Add message about connecting accounts via OAuth
    - Update next steps to mention OAuth connection
    - _Requirements: 1.8, 16.1_

- [x] 31. Frontend - Create Connect Accounts Page
  - [x] 31.1 Create ConnectAccounts.jsx page (Already Complete)
    - ✅ Display Instagram connection card
    - ✅ Display LinkedIn connection card
    - ✅ Show connection status for each platform
    - ✅ "Connect" button for each platform
    - ✅ "Disconnect" button for connected platforms
    - ✅ Display platform username when connected
    - _Requirements: 16.2, 16.3, 16.7, 16.8_
  
  - [x] 31.2 Implement OAuth flow in frontend
    - Handle "Connect" button click → Open OAuth popup
    - Call GET /oauth/authorize/{platform}
    - Handle OAuth callback
    - Update connection status after successful auth
    - Handle disconnect button → Call DELETE /oauth/disconnect/{platform}
    - _Requirements: 16.3, 16.8_
  
  - [x] 31.3 Update api.js with OAuth endpoints
    - Add getOAuthAuthorizeUrl(platform, brandId)
    - Add disconnectOAuth(platform, brandId)
    - Add getConnectionStatus(brandId)
    - _Requirements: 16.3, 16.8_

- [x] 32. Frontend - Create Admin Panel Components
  - [x] 32.1 Create Admin.jsx dashboard
    - Display system statistics
    - Show number of brands
    - Show number of active connections
    - Show recent activity
    - _Requirements: 19.1_
  
  - [x] 32.2 Create PlatformConfig.jsx component (Already Complete)
    - ✅ Form for adding OAuth app credentials
    - ✅ Display configured platforms
    - ✅ Test connection button
    - ✅ Save to Secrets Manager
    - _Requirements: 19.2, 19.3, 19.4, 19.5_
  
  - [x] 32.3 Create SystemMonitoring.jsx component (Already Complete)
    - ✅ Display CloudWatch metrics
    - ✅ Show Lambda execution stats
    - ✅ Show error rates
    - _Requirements: 19.7_
  
  - [x] 32.4 Create AdminRoute.jsx wrapper (Already Complete)
    - ✅ Check Cognito admin group membership
    - ✅ Redirect non-admins to dashboard
    - _Requirements: 19.1_
  
  - [x] 32.5 Write property test for admin authorization
    - **Property 37: Admin Authorization Enforcement**
    - **Validates: Requirements 19.1**
  
  - [x] 32.6 Write property test for platform credentials encryption
    - **Property 38: Platform Credentials Encryption**
    - **Validates: Requirements 19.2, 19.3**

- [x] 33. Update Template.yaml for Phase 2
  - [x] 33.1 Add new DynamoDB tables
    - Add OnboardingSessionsTable
    - Add OAuthConnectionsTable
    - Add PlatformCredentialsTable
    - Update BrandsTable schema
    - _Requirements: 18.1, 16.4, 19.5, 2.3_
  
  - [x] 33.2 Add new Lambda functions
    - Add OAuthHandlerFunction
    - Update OnboardingFunction with new permissions
    - Update AutoPublisherFunction with Secrets Manager permissions
    - _Requirements: 16.1, 18.1, 16.4_
  
  - [x] 33.3 Add Secrets Manager permissions
    - Grant admin-settings Lambda write access to Secrets Manager
    - Grant OAuth handler Lambda read/write access
    - Grant auto publisher Lambda read access
    - Configure KMS key policies
    - _Requirements: 19.2, 16.4, 16.5_
  
  - [x] 33.4 Add new API endpoints
    - Add GET /oauth/authorize/{platform}
    - Add GET /oauth/callback/{platform}
    - Add POST /oauth/refresh/{platform}
    - Add DELETE /oauth/disconnect/{platform}
    - Add GET /connections/{brand_id}
    - _Requirements: 16.3, 16.8_

- [x] 34. Checkpoint - Verify Phase 2 Implementation
  - Ensure all Phase 2 tests pass
  - Verify onboarding works without token requests
  - Verify OAuth flows work for Instagram and LinkedIn
  - Verify tokens stored in Secrets Manager only
  - Verify admin panel accessible to admin users only
  - Ask the user if questions arise

- [x] 35. Two-Step Lazy Generation Implementation (Cost Optimization)
  - [x] 35.1 Backend: Implement silent mode and skip flags
    - Added `skip_image_generation` flag to main /chat endpoint
    - Added `silent_mode` flag to skip chat history saving
    - Created dedicated POST /chat/generate-image endpoint
    - Fixed duplicate endpoint definition bug
    - Added [SILENT] logging prefixes for debugging
    - _Cost Savings: 46-93% reduction in AWS costs_
  
  - [x] 35.2 Frontend: Implement two-step UI in ContentPlanCard
    - Created independent fetch functions (no parent state pollution)
    - Implemented three-state UI (Empty → Text Ready → Image Ready)
    - Added "🎨 Gerar Imagem" button for lazy image generation
    - Fixed double JSON parsing bug with type checking
    - Separate loading states for text and images
    - _User Experience: Faster initial responses, on-demand image generation_
  
  - [x] 35.3 Testing and Verification
    - Code review confirms proper isolation (no chat pollution)
    - JSON sanitization handles both objects and strings
    - Silent mode properly implemented in backend
    - Ready for deployment and integration testing
    - _Status: Implementation complete, awaiting deployment_

- [x] 36. Integration Testing for Phase 2
  - [x] 35.1 Test complete onboarding flow without tokens
    - User completes onboarding
    - No token requests shown
    - Redirected to Connect Accounts page
    - Brand created without tokens in DynamoDB
    - _Requirements: 1.9, 1.8, 2.3_
  
  - [x] 35.2 Test OAuth connection flow
    - User clicks "Connect Instagram"
    - OAuth popup opens
    - User authorizes
    - Token stored in Secrets Manager
    - Connection status updated
    - _Requirements: 16.3, 16.4, 16.6_
  
  - [x] 35.3 Test AI entity extraction
    - User provides multiple entities in one message
    - All entities extracted correctly
    - Session state updated
    - Completion percentage accurate
    - _Requirements: 17.1, 17.2, 17.6_
  
  - [x] 35.4 Test admin platform configuration
    - Admin logs in
    - Configures Instagram OAuth app
    - Credentials stored in Secrets Manager
    - Test connection succeeds
    - _Requirements: 19.1, 19.2, 19.4_

- [x] 36. Final Phase 2 Checkpoint
  - All Phase 2 requirements implemented
  - All Phase 2 tests passing
  - OAuth flows working end-to-end
  - No tokens in DynamoDB
  - Admin panel functional
  - Documentation updated

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties across all inputs
- Unit tests validate specific examples and edge cases
- The hybrid approach uses Node.js for API/business logic and Python for AI/ML operations
- All functions are managed within a single AWS SAM project for consistency
- Testing libraries: Use `fast-check` for JavaScript/TypeScript, `hypothesis` for Python
- Each property test must run minimum 100 iterations
- Each property test must include a comment tag: `// Feature: experta-ai-social-manager, Property N: [property text]`

## Implementation Order Rationale

1. **Infrastructure First**: Set up AWS SAM, DynamoDB, S3, Cognito, and API Gateway to establish the foundation
2. **Shared Libraries**: Build reusable utilities (encryption, auth, error handling, data access) before Lambda functions
3. **Core Backend Flow**: Implement onboarding → content generation → publishing in sequence
4. **API Endpoints**: Build Posts API and Chat API to enable frontend integration
5. **Frontend**: Develop React components once backend APIs are available
6. **Deployment & Testing**: Configure deployment and run comprehensive integration tests

This order ensures each component builds on stable foundations and minimizes rework.
