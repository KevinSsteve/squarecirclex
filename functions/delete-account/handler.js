/**
 * Delete Account Lambda Function
 * 
 * Handles user account deletion with cascade delete of all user data
 * DELETE /account endpoint
 * 
 * Security: Requires user authentication and confirmation
 */

const { CascadeDelete } = require('/opt/nodejs/db/cascade-delete');
const { ErrorHandler, ErrorCodes } = require('/opt/nodejs/errors/error-handler');

/**
 * Main Lambda handler
 * DELETE /account endpoint
 */
exports.handler = async (event, context) => {
  const startTime = Date.now();
  
  try {
    ErrorHandler.logInfo('Delete account handler invoked', {
      requestId: context.requestId,
      functionName: context.functionName,
      path: event.path,
      httpMethod: event.httpMethod
    });

    // Extract user_id from Cognito authorizer context
    const user_id = event.requestContext?.authorizer?.claims?.sub;
    if (!user_id) {
      return ErrorHandler.formatErrorResponse(
        ErrorCodes.UNAUTHORIZED,
        'User ID not found in authorization context'
      );
    }

    // Parse request body for confirmation
    let body;
    try {
      body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    } catch (error) {
      return ErrorHandler.formatErrorResponse(
        ErrorCodes.VALIDATION_ERROR,
        'Invalid JSON in request body'
      );
    }

    // Require explicit confirmation
    if (body.confirmation !== 'DELETE MY ACCOUNT') {
      return ErrorHandler.formatErrorResponse(
        ErrorCodes.VALIDATION_ERROR,
        'Account deletion requires explicit confirmation. Please send: {"confirmation": "DELETE MY ACCOUNT"}'
      );
    }

    // Perform cascade delete
    ErrorHandler.logInfo('Starting cascade delete for user', { user_id });
    const deletionSummary = await CascadeDelete.deleteUserData(user_id);

    // Log completion
    const executionDuration = Date.now() - startTime;
    ErrorHandler.logInfo('Account deletion completed', {
      requestId: context.requestId,
      user_id,
      executionDurationMs: executionDuration,
      summary: deletionSummary
    });

    return ErrorHandler.formatSuccessResponse({
      message: 'Account and all associated data have been deleted',
      summary: deletionSummary
    }, 200);

  } catch (error) {
    const executionDuration = Date.now() - startTime;
    ErrorHandler.logError(error, { 
      operation: 'delete_account_handler',
      requestId: context.requestId,
      executionDurationMs: executionDuration
    });
    return ErrorHandler.handleLambdaError(error, event);
  }
};
