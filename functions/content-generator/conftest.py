"""
Pytest configuration for content-generator tests
Sets up mocks for AWS services before any test modules are imported
"""

import sys
import os
from unittest.mock import MagicMock

# Set up environment variables before importing handler
os.environ['BRANDS_TABLE_NAME'] = 'test-brands-table'
os.environ['POSTS_TABLE_NAME'] = 'test-posts-table'
os.environ['S3_BUCKET_NAME'] = 'test-bucket'
os.environ['BEDROCK_CLAUDE_MODEL_ID'] = 'anthropic.claude-3-5-sonnet-20241022-v2:0'
os.environ['BEDROCK_TITAN_MODEL_ID'] = 'amazon.titan-image-generator-v1'
os.environ['EVENTBRIDGE_BUS_NAME'] = 'default'
os.environ['AWS_REGION'] = 'us-east-1'

# Mock boto3 and AWS services before any imports
mock_boto3 = MagicMock()
mock_dynamodb = MagicMock()
mock_s3_client = MagicMock()
mock_bedrock_runtime = MagicMock()
mock_events_client = MagicMock()
mock_sts_client = MagicMock()

sys.modules['boto3'] = mock_boto3

# Configure boto3 mock to return appropriate clients
def mock_client(service, **kwargs):
    clients = {
        's3': mock_s3_client,
        'bedrock-runtime': mock_bedrock_runtime,
        'events': mock_events_client,
        'sts': mock_sts_client
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
mock_error_handler.ValidationException = Exception

sys.modules['errors'] = MagicMock()
sys.modules['errors.error_handler'] = mock_error_handler
