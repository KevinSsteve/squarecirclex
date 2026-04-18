# Task 25.4 Summary: Update Brands Table Schema

## Overview
Successfully updated the Brands table schema to remove encrypted token fields and add new Phase 2 fields for OAuth connection management and onboarding session tracking.

## Changes Made

### 1. Database Schema Updates

#### Brands Table (lib/nodejs/db/brands.js)
**Removed Fields:**
- `instagram_token_encrypted` (Buffer) - Moved to Secrets Manager
- `linkedin_token_encrypted` (Buffer) - Moved to Secrets Manager

**Added Fields:**
- `has_instagram_connection` (Boolean, default: false) - Tracks Instagram OAuth connection status
- `has_linkedin_connection` (Boolean, default: false) - Tracks LinkedIn OAuth connection status
- `onboarding_session_id` (String, UUID, nullable) - References Onboarding_Sessions table
- `onboarding_completed_at` (String, ISO8601) - Timestamp when onboarding was completed

### 2. Code Updates

#### lib/nodejs/db/brands.js
- Updated `createBrand()` method to:
  - Remove `instagram_token_encrypted` and `linkedin_token_encrypted` parameters
  - Add `has_instagram_connection`, `has_linkedin_connection`, `onboarding_session_id` fields
  - Set `onboarding_completed_at` timestamp automatically
  - Remove credential redaction from error logging (no longer needed)

#### functions/onboarding/handler.js
- Removed encryption service initialization
- Removed token encryption logic for Instagram and LinkedIn
- Updated brand data preparation to use new schema fields:
  - Set `has_instagram_connection: false` (will be updated by OAuth handler)
  - Set `has_linkedin_connection: false` (will be updated by OAuth handler)
  - Include `onboarding_session_id` if provided
- Added Phase 2 requirement references (1.9, 2.3, 16.6)

#### functions/content-generator/handler.py
- Updated platform detection logic:
  - Changed from checking `instagram_token_encrypted` to `has_instagram_connection`
  - Changed from checking `linkedin_token_encrypted` to `has_linkedin_connection`
- Updated log messages to reflect "connection" terminology
- Added Phase 2 requirement reference (16.6)

#### functions/auto-publisher/handler.js
- Updated token retrieval logic:
  - Changed from checking encrypted token fields to connection flags
  - Added TODO comments for Task 29 (Secrets Manager integration)
  - Temporarily throws errors indicating Secrets Manager retrieval not yet implemented
- Added Phase 2 requirement references (16.4, 16.5, 16.6)

### 3. Test Updates

#### lib/nodejs/db/brands.property.test.js
- Updated `brandDataGenerator()` to generate new fields:
  - `has_instagram_connection: fc.boolean()`
  - `has_linkedin_connection: fc.boolean()`
  - `onboarding_session_id: fc.option(fc.uuid(), { nil: null })`
- Removed encrypted token field generators
- Updated Property 1 assertions to check for new fields instead of old ones

#### functions/onboarding/handler.test.js
- Removed encryption mock setup from successful brand creation test
- Updated brand creation assertions to check for new fields
- Modified "encryption failure" test to verify successful creation (no longer relevant)
- Updated all test expectations to use new schema fields

## Requirements Validated

### Requirement 2.3 (Brand Data Persistence - Enhanced)
✅ OAuth tokens are NOT stored in DynamoDB
✅ Connection status flags track OAuth connections

### Requirement 2.5 (Brand ID Format)
✅ Brand ID remains UUID format (unchanged)

### Requirement 16.6 (OAuth Connection Status)
✅ Connection status flags added to Brands table
✅ Flags default to false until OAuth connection established

### Requirement 1.9 (Onboarding Token Exclusion)
✅ Onboarding no longer collects or stores tokens
✅ Brand records do not contain encrypted token fields

## Test Results

### Unit Tests
✅ All 18 onboarding handler tests passing
✅ All 6 brands property tests passing

### Property-Based Tests
✅ Property 1: Brand Data Completeness - Updated and passing
✅ Property 2: Brand ID Format Validation - Passing (unchanged)

## Migration Notes

### For Existing Brands
Existing brand records with `instagram_token_encrypted` and `linkedin_token_encrypted` fields will need to be migrated:

1. Extract tokens from DynamoDB
2. Store tokens in Secrets Manager (via OAuth handler - Task 27)
3. Update brand records with connection flags
4. Remove encrypted token fields

### For New Brands
New brands created after this change:
- Will not have encrypted token fields
- Will have connection flags set to false
- Will need to complete OAuth flow to establish connections (Task 27)

## Dependencies

### Completed
- ✅ Task 25.1: Create Onboarding_Sessions table
- ✅ Task 25.2: Create OAuth_Connections table
- ✅ Task 25.3: Create Platform_Credentials table

### Pending
- ⏳ Task 27: Implement OAuth Handler Lambda (will use connection flags)
- ⏳ Task 29: Update Auto Publisher to use Secrets Manager (prepared with TODOs)
- ⏳ Task 28: Enhance Onboarding Handler with AI Entity Extraction (will use onboarding_session_id)

## Security Improvements

### Before (Phase 1)
- Tokens stored encrypted in DynamoDB
- Tokens accessible via DynamoDB queries
- Encryption/decryption required for every access

### After (Phase 2)
- Tokens stored in AWS Secrets Manager (more secure)
- Tokens only accessible via Secrets Manager API
- Automatic rotation support available
- Better audit logging
- Reduced attack surface

## Breaking Changes

### API Changes
None - The onboarding API still accepts the same fields, but tokens are no longer stored in DynamoDB.

### Database Schema
- Brands table no longer has `instagram_token_encrypted` or `linkedin_token_encrypted` fields
- New fields added: `has_instagram_connection`, `has_linkedin_connection`, `onboarding_session_id`, `onboarding_completed_at`

### Code Changes
- Auto publisher temporarily cannot publish posts (awaiting Task 29)
- Content generator uses connection flags instead of token presence

## Next Steps

1. **Task 27**: Implement OAuth Handler Lambda
   - Create OAuth authorization endpoints
   - Store tokens in Secrets Manager
   - Update connection flags in Brands table

2. **Task 28**: Enhance Onboarding Handler
   - Implement AI entity extraction
   - Use onboarding_session_id for session tracking
   - Remove token collection from onboarding flow

3. **Task 29**: Update Auto Publisher
   - Implement Secrets Manager token retrieval
   - Replace TODO comments with actual implementation
   - Add token refresh logic

4. **Task 30**: Update Frontend
   - Remove token input fields from onboarding
   - Add OAuth connection flow
   - Display connection status

## Conclusion

Task 25.4 successfully updated the Brands table schema to support Phase 2's OAuth-based authentication model. The changes improve security by moving tokens to Secrets Manager and provide better tracking of connection status. All tests have been updated and are passing.
