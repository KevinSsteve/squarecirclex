"""
Pytest configuration for trend-scraper tests
Sets up mocks for AWS services before any test modules are imported
"""

import sys
import os
from unittest.mock import MagicMock

# Set up environment variables before importing handler
os.environ['TRENDS_TABLE_NAME'] = 'test-trends-table'
os.environ['INSTAGRAM_APP_ID'] = 'test-app-id'
os.environ['INSTAGRAM_APP_SECRET'] = 'test-app-secret'
os.environ['AWS_REGION'] = 'us-east-1'

# Mock boto3 and AWS services before any imports
mock_boto3 = MagicMock()
mock_dynamodb = MagicMock()
mock_secretsmanager = MagicMock()

sys.modules['boto3'] = mock_boto3

# Configure boto3 mock to return appropriate clients
def mock_client(service, **kwargs):
    clients = {
        'secretsmanager': mock_secretsmanager
    }
    return clients.get(service, MagicMock())

def mock_resource(service, **kwargs):
    if service == 'dynamodb':
        return mock_dynamodb
    return MagicMock()

mock_boto3.client = mock_client
mock_boto3.resource = mock_resource

# Mock the error handler module
mock_error_handler = MagicMock()
mock_error_handler.ErrorHandler = MagicMock()
mock_error_handler.ErrorHandler.log_info = MagicMock()
mock_error_handler.ErrorHandler.log_error = MagicMock()
mock_error_handler.ErrorHandler.log_warning = MagicMock()
mock_error_handler.ValidationException = Exception

sys.modules['errors'] = MagicMock()
sys.modules['errors.error_handler'] = mock_error_handler
