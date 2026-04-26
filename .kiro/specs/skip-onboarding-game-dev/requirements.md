# Requirements Document - Skip Onboarding for Game Development

## Introduction

During game appearance development, developers need to access the GameView without completing the full onboarding process. The brand association check is currently commented out in the code, but this needs to be formalized as a proper development mode feature with clear documentation and proper implementation.

## Glossary

- **GameView**: React component that renders the isometric office visualization using PixiJS
- **Brand Association**: Link between a user account and a brand profile created during onboarding
- **Onboarding**: Multi-step process where users provide business information to create their brand
- **Development Mode**: Special mode that allows bypassing certain requirements for testing/development
- **Authentication**: User login verification via AWS Cognito JWT tokens

## Requirements

### Requirement 1: Development Mode Flag

**User Story:** As a developer, I want a clear development mode flag that controls whether brand association is required, so that I can easily toggle this behavior without modifying code.

#### Acceptance Criteria

1. WHEN development mode is enabled THEN the system SHALL skip brand association checks
2. WHEN development mode is disabled THEN the system SHALL enforce brand association checks
3. WHEN the mode changes THEN the system SHALL log the current mode clearly in console
4. WHEN in development mode THEN the system SHALL display a visual indicator in the UI

### Requirement 2: Graceful Backend Handling

**User Story:** As a developer, I want backend API calls to handle missing brand associations gracefully, so that the game view doesn't crash when no brand exists.

#### Acceptance Criteria

1. WHEN backend polling encounters "no brand association" error THEN the system SHALL continue with mock/cached data
2. WHEN backend polling encounters "no brand association" error THEN the system SHALL NOT stop polling permanently
3. WHEN backend polling encounters "no brand association" error THEN the system SHALL log a warning but not an error
4. WHEN a brand is later associated THEN the system SHALL automatically resume normal operation

### Requirement 3: Clear Documentation

**User Story:** As a developer, I want clear documentation explaining how to enable/disable development mode, so that I can quickly configure the system for my needs.

#### Acceptance Criteria

1. WHEN reading the documentation THEN it SHALL explain what development mode does
2. WHEN reading the documentation THEN it SHALL explain how to enable/disable development mode
3. WHEN reading the documentation THEN it SHALL explain the implications of using development mode
4. WHEN reading the documentation THEN it SHALL explain how to re-enable brand association checks

### Requirement 4: Environment-Based Configuration

**User Story:** As a developer, I want development mode to be controlled by environment variables, so that I can configure it differently for local development vs production.

#### Acceptance Criteria

1. WHEN `REACT_APP_DEV_MODE=true` is set THEN the system SHALL enable development mode
2. WHEN `REACT_APP_DEV_MODE=false` or unset THEN the system SHALL disable development mode
3. WHEN in production environment THEN the system SHALL ignore development mode flag
4. WHEN environment variable changes THEN the system SHALL require rebuild to take effect

### Requirement 5: Visual Development Mode Indicator

**User Story:** As a developer, I want a clear visual indicator when development mode is active, so that I don't accidentally deploy with development mode enabled.

#### Acceptance Criteria

1. WHEN development mode is enabled THEN the system SHALL display a banner at the top of GameView
2. WHEN the banner is displayed THEN it SHALL clearly state "Development Mode - Brand Association Disabled"
3. WHEN the banner is displayed THEN it SHALL use warning colors (yellow/orange)
4. WHEN the banner is displayed THEN it SHALL be dismissible but persist across page reloads

### Requirement 6: Proper Code Structure

**User Story:** As a developer, I want the brand association check to be properly structured with feature flags, so that the code is maintainable and not just commented out.

#### Acceptance Criteria

1. WHEN reviewing the code THEN brand association checks SHALL use feature flag pattern
2. WHEN reviewing the code THEN there SHALL be no commented-out code blocks
3. WHEN reviewing the code THEN the logic SHALL be clear and self-documenting
4. WHEN reviewing the code THEN there SHALL be proper TypeScript/JSDoc types

## Non-Functional Requirements

### Security
- Development mode SHALL NOT be enabled in production builds
- Development mode SHALL NOT bypass authentication (only brand association)
- Development mode SHALL log all bypassed checks for audit purposes

### Performance
- Development mode checks SHALL NOT impact render performance
- Feature flag evaluation SHALL happen once at component mount

### Maintainability
- Code SHALL use feature flags instead of comments
- Configuration SHALL be centralized in a single location
- Documentation SHALL be kept up-to-date with code changes

