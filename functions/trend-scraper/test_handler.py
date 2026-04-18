"""
Unit Tests for Trend Scraper Lambda
Tests Instagram API integration, trend data extraction, and DynamoDB storage
Requirements: 4.2, 4.4
"""

import pytest
import json
import uuid
from datetime import datetime, timedelta
from unittest.mock import Mock, patch, MagicMock, call
import sys
import os

# Add the lib path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../lib/python'))

# Import the handler module
import handler


class TestInstagramAPIIntegration:
    """Unit tests for Instagram API integration"""
    
    @pytest.fixture(autouse=True)
    def setup_environment(self):
        """Set up environment variables for testing"""
        os.environ['TRENDS_TABLE_NAME'] = 'test-trends-table'
        os.environ['INSTAGRAM_APP_ID'] = 'test-app-id'
        os.environ['INSTAGRAM_APP_SECRET'] = 'test-app-secret'
        os.environ['AWS_REGION'] = 'us-east-1'
        
        yield
        
        # Cleanup
        for key in ['TRENDS_TABLE_NAME', 'INSTAGRAM_APP_ID', 'INSTAGRAM_APP_SECRET', 'AWS_REGION']:
            if key in os.environ:
                del os.environ[key]
    
    @patch('handler.secretsmanager')
    def test_get_instagram_credentials_from_secrets_manager(self, mock_secretsmanager):
        """Test retrieving Instagram credentials from Secrets Manager"""
        # Arrange
        expected_token = 'test-access-token-12345'
        mock_secretsmanager.get_secret_value.return_value = {
            'SecretString': json.dumps({
                'access_token': expected_token
            })
        }
        
        # Act
        token = handler.get_instagram_credentials()
        
        # Assert
        assert token == expected_token
        mock_secretsmanager.get_secret_value.assert_called_once_with(
            SecretId='experta/instagram-credentials'
        )
    
    @patch('handler.secretsmanager')
    def test_get_instagram_credentials_fallback_to_env(self, mock_secretsmanager):
        """Test fallback to environment variable when Secrets Manager fails"""
        # Arrange
        mock_secretsmanager.exceptions.ResourceNotFoundException = Exception
        mock_secretsmanager.get_secret_value.side_effect = Exception("Secret not found")
        os.environ['INSTAGRAM_ACCESS_TOKEN'] = 'env-token-12345'
        
        # Act
        token = handler.get_instagram_credentials()
        
        # Assert
        assert token == 'env-token-12345'
        
        # Cleanup
        del os.environ['INSTAGRAM_ACCESS_TOKEN']
    
    @patch('handler.secretsmanager')
    def test_get_instagram_credentials_returns_empty_on_failure(self, mock_secretsmanager):
        """Test that empty string is returned when credentials are unavailable"""
        # Arrange
        mock_secretsmanager.exceptions.ResourceNotFoundException = Exception
        mock_secretsmanager.get_secret_value.side_effect = Exception("Secret not found")
        
        # Act
        token = handler.get_instagram_credentials()
        
        # Assert
        assert token == ''
    
    def test_scrape_instagram_trends_with_no_token_returns_mock_data(self):
        """Test that scraping without token returns mock data"""
        # Act
        trends = handler.scrape_instagram_trends('')
        
        # Assert
        assert isinstance(trends, list)
        assert len(trends) > 0
        
        # Verify mock data structure
        for trend in trends:
            assert 'source' in trend
            assert trend['source'] == 'instagram'
            assert 'hashtag' in trend
            assert 'style_descriptors' in trend
            assert 'themes' in trend
            assert 'engagement_score' in trend
    
    @patch('handler.fetch_hashtag_trends')
    @patch('time.sleep')
    def test_scrape_instagram_trends_with_token_fetches_hashtags(
        self, mock_sleep, mock_fetch_hashtag_trends
    ):
        """Test that scraping with token fetches trends for multiple hashtags"""
        # Arrange
        access_token = 'valid-token-12345'
        mock_fetch_hashtag_trends.return_value = [{
            'source': 'instagram',
            'hashtag': 'test',
            'style_descriptors': ['modern', 'bold'],
            'themes': ['marketing'],
            'engagement_score': 85
        }]
        
        # Act
        trends = handler.scrape_instagram_trends(access_token)
        
        # Assert
        assert isinstance(trends, list)
        assert len(trends) > 0
        
        # Verify fetch_hashtag_trends was called for each hashtag
        assert mock_fetch_hashtag_trends.call_count > 0
        
        # Verify rate limiting (sleep called between requests)
        assert mock_sleep.call_count > 0
    
    def test_fetch_hashtag_trends_returns_valid_structure(self):
        """Test that fetching hashtag trends returns valid data structure"""
        # Arrange
        access_token = 'test-token'
        hashtag = 'trending'
        
        # Act
        trends = handler.fetch_hashtag_trends(access_token, hashtag)
        
        # Assert
        assert isinstance(trends, list)
        assert len(trends) > 0
        
        trend = trends[0]
        assert trend['source'] == 'instagram'
        assert trend['hashtag'] == hashtag
        assert 'style_descriptors' in trend
        assert 'themes' in trend
        assert 'engagement_score' in trend
    
    @patch('handler.fetch_hashtag_trends')
    def test_scrape_instagram_trends_continues_on_hashtag_failure(
        self, mock_fetch_hashtag_trends
    ):
        """Test that scraping continues even if one hashtag fails"""
        # Arrange
        access_token = 'test-token'
        
        # First call fails, second succeeds
        mock_fetch_hashtag_trends.side_effect = [
            Exception("API error"),
            [{
                'source': 'instagram',
                'hashtag': 'viral',
                'style_descriptors': ['dynamic'],
                'themes': ['entertainment'],
                'engagement_score': 90
            }]
        ]
        
        # Act
        with patch('time.sleep'):
            trends = handler.scrape_instagram_trends(access_token)
        
        # Assert
        # Should still return trends from successful hashtags
        assert isinstance(trends, list)
        # At least one successful fetch
        assert len(trends) >= 1


class TestTrendDataExtraction:
    """Unit tests for trend data extraction functions"""
    
    def test_extract_style_descriptors_for_known_hashtag(self):
        """Test extracting style descriptors for known hashtags"""
        # Arrange
        test_cases = [
            ('trending', ['modern', 'bold', 'vibrant', 'eye-catching']),
            ('viral', ['dynamic', 'energetic', 'colorful', 'engaging']),
            ('socialmedia', ['clean', 'professional', 'minimalist', 'branded'])
        ]
        
        for hashtag, expected_descriptors in test_cases:
            # Act
            descriptors = handler.extract_style_descriptors(hashtag)
            
            # Assert
            assert descriptors == expected_descriptors
    
    def test_extract_style_descriptors_for_unknown_hashtag(self):
        """Test extracting style descriptors for unknown hashtags returns defaults"""
        # Arrange
        unknown_hashtag = 'unknownhashtag123'
        
        # Act
        descriptors = handler.extract_style_descriptors(unknown_hashtag)
        
        # Assert
        assert isinstance(descriptors, list)
        assert len(descriptors) > 0
        # Should return default descriptors
        assert descriptors == ['modern', 'professional', 'engaging']
    
    def test_extract_themes_for_known_hashtag(self):
        """Test extracting themes for known hashtags"""
        # Arrange
        test_cases = [
            ('trending', ['current events', 'popular culture', 'viral moments']),
            ('marketing', ['strategy', 'ROI', 'customer acquisition']),
            ('contentcreation', ['creativity', 'storytelling', 'visual design'])
        ]
        
        for hashtag, expected_themes in test_cases:
            # Act
            themes = handler.extract_themes(hashtag)
            
            # Assert
            assert themes == expected_themes
    
    def test_extract_themes_for_unknown_hashtag(self):
        """Test extracting themes for unknown hashtags returns defaults"""
        # Arrange
        unknown_hashtag = 'unknownhashtag456'
        
        # Act
        themes = handler.extract_themes(unknown_hashtag)
        
        # Assert
        assert isinstance(themes, list)
        assert len(themes) > 0
        # Should return default themes
        assert themes == ['general marketing', 'brand awareness']
    
    def test_calculate_engagement_score_for_known_hashtag(self):
        """Test calculating engagement score for known hashtags"""
        # Arrange
        test_cases = [
            ('trending', 95),
            ('viral', 90),
            ('socialmedia', 85),
            ('marketing', 80)
        ]
        
        for hashtag, expected_score in test_cases:
            # Act
            score = handler.calculate_engagement_score(hashtag)
            
            # Assert
            assert score == expected_score
    
    def test_calculate_engagement_score_for_unknown_hashtag(self):
        """Test calculating engagement score for unknown hashtags returns default"""
        # Arrange
        unknown_hashtag = 'unknownhashtag789'
        
        # Act
        score = handler.calculate_engagement_score(unknown_hashtag)
        
        # Assert
        assert score == 50  # Default score
    
    def test_generate_mock_trends_returns_valid_data(self):
        """Test that mock trend generation returns valid data"""
        # Act
        mock_trends = handler.generate_mock_trends()
        
        # Assert
        assert isinstance(mock_trends, list)
        assert len(mock_trends) > 0
        
        # Verify each trend has required fields
        for trend in mock_trends:
            assert 'source' in trend
            assert trend['source'] == 'instagram'
            assert 'hashtag' in trend
            assert 'style_descriptors' in trend
            assert isinstance(trend['style_descriptors'], list)
            assert len(trend['style_descriptors']) > 0
            assert 'themes' in trend
            assert isinstance(trend['themes'], list)
            assert len(trend['themes']) > 0
            assert 'engagement_score' in trend
            assert isinstance(trend['engagement_score'], int)
            assert 0 <= trend['engagement_score'] <= 100


class TestDynamoDBStorage:
    """Unit tests for DynamoDB storage operations"""
    
    @pytest.fixture(autouse=True)
    def setup_environment(self):
        """Set up environment variables for testing"""
        os.environ['TRENDS_TABLE_NAME'] = 'test-trends-table'
        os.environ['AWS_REGION'] = 'us-east-1'
        
        yield
        
        # Cleanup
        for key in ['TRENDS_TABLE_NAME', 'AWS_REGION']:
            if key in os.environ:
                del os.environ[key]
    
    @patch('handler.trends_table')
    def test_store_trends_saves_to_dynamodb(self, mock_trends_table):
        """Test that trends are correctly stored in DynamoDB"""
        # Arrange
        trends = [
            {
                'source': 'instagram',
                'hashtag': 'trending',
                'style_descriptors': ['modern', 'bold'],
                'themes': ['current events'],
                'engagement_score': 95
            },
            {
                'source': 'instagram',
                'hashtag': 'viral',
                'style_descriptors': ['dynamic', 'energetic'],
                'themes': ['entertainment'],
                'engagement_score': 90
            }
        ]
        
        # Mock batch writer
        written_items = []
        mock_batch_writer = MagicMock()
        
        def capture_put_item(Item):
            written_items.append(Item)
        
        mock_batch_writer.put_item.side_effect = capture_put_item
        mock_trends_table.batch_writer.return_value.__enter__.return_value = mock_batch_writer
        
        # Act
        stored_count = handler.store_trends(trends)
        
        # Assert
        assert stored_count == 2
        assert len(written_items) == 2
        
        # Verify structure of stored items
        for i, item in enumerate(written_items):
            assert 'trend_id' in item
            assert 'scraped_at' in item
            assert 'source' in item
            assert item['source'] == 'instagram'
            assert 'style_descriptors' in item
            assert 'themes' in item
            assert 'hashtags' in item
            assert 'engagement_score' in item
            assert 'ttl' in item
    
    @patch('handler.trends_table')
    def test_store_trends_sets_ttl_for_7_days(self, mock_trends_table):
        """Test that stored trends have TTL set for 7 days"""
        # Arrange
        trends = [{
            'source': 'instagram',
            'hashtag': 'test',
            'style_descriptors': ['modern'],
            'themes': ['marketing'],
            'engagement_score': 80
        }]
        
        # Mock batch writer
        written_items = []
        mock_batch_writer = MagicMock()
        
        def capture_put_item(Item):
            written_items.append(Item)
        
        mock_batch_writer.put_item.side_effect = capture_put_item
        mock_trends_table.batch_writer.return_value.__enter__.return_value = mock_batch_writer
        
        # Act
        current_time = datetime.utcnow()
        stored_count = handler.store_trends(trends)
        
        # Assert
        assert stored_count == 1
        assert len(written_items) == 1
        
        item = written_items[0]
        assert 'ttl' in item
        
        # Verify TTL is approximately 7 days in the future
        expected_ttl = int((current_time + timedelta(days=7)).timestamp())
        actual_ttl = item['ttl']
        
        # Allow 1 hour tolerance for test execution time
        assert abs(actual_ttl - expected_ttl) < 3600
    
    @patch('handler.trends_table')
    def test_store_trends_includes_scraped_at_timestamp(self, mock_trends_table):
        """Test that stored trends include scraped_at timestamp"""
        # Arrange
        trends = [{
            'source': 'instagram',
            'hashtag': 'test',
            'style_descriptors': ['modern'],
            'themes': ['marketing'],
            'engagement_score': 80
        }]
        
        # Mock batch writer
        written_items = []
        mock_batch_writer = MagicMock()
        
        def capture_put_item(Item):
            written_items.append(Item)
        
        mock_batch_writer.put_item.side_effect = capture_put_item
        mock_trends_table.batch_writer.return_value.__enter__.return_value = mock_batch_writer
        
        # Act
        stored_count = handler.store_trends(trends)
        
        # Assert
        assert stored_count == 1
        item = written_items[0]
        
        assert 'scraped_at' in item
        # Verify it's a valid ISO8601 timestamp
        scraped_at = item['scraped_at']
        assert scraped_at.endswith('Z')
        # Should be parseable as datetime
        datetime.fromisoformat(scraped_at.replace('Z', '+00:00'))
    
    @patch('handler.trends_table')
    def test_store_trends_generates_unique_trend_ids(self, mock_trends_table):
        """Test that each stored trend gets a unique trend_id"""
        # Arrange
        trends = [
            {'source': 'instagram', 'hashtag': 'test1', 'style_descriptors': ['a'], 'themes': ['b'], 'engagement_score': 80},
            {'source': 'instagram', 'hashtag': 'test2', 'style_descriptors': ['c'], 'themes': ['d'], 'engagement_score': 85},
            {'source': 'instagram', 'hashtag': 'test3', 'style_descriptors': ['e'], 'themes': ['f'], 'engagement_score': 90}
        ]
        
        # Mock batch writer
        written_items = []
        mock_batch_writer = MagicMock()
        
        def capture_put_item(Item):
            written_items.append(Item)
        
        mock_batch_writer.put_item.side_effect = capture_put_item
        mock_trends_table.batch_writer.return_value.__enter__.return_value = mock_batch_writer
        
        # Act
        stored_count = handler.store_trends(trends)
        
        # Assert
        assert stored_count == 3
        
        # Extract all trend_ids
        trend_ids = [item['trend_id'] for item in written_items]
        
        # Verify all are unique
        assert len(trend_ids) == len(set(trend_ids))
        
        # Verify all are valid UUIDs
        for trend_id in trend_ids:
            uuid.UUID(trend_id)  # Will raise ValueError if invalid
    
    @patch('handler.trends_table')
    def test_store_trends_handles_empty_list(self, mock_trends_table):
        """Test that storing empty trends list returns 0"""
        # Arrange
        trends = []
        
        # Mock batch writer
        mock_batch_writer = MagicMock()
        mock_trends_table.batch_writer.return_value.__enter__.return_value = mock_batch_writer
        
        # Act
        stored_count = handler.store_trends(trends)
        
        # Assert
        assert stored_count == 0
        mock_batch_writer.put_item.assert_not_called()
    
    @patch('handler.trends_table')
    def test_store_trends_handles_storage_error_gracefully(self, mock_trends_table):
        """Test that storage errors are handled gracefully"""
        # Arrange
        trends = [{
            'source': 'instagram',
            'hashtag': 'test',
            'style_descriptors': ['modern'],
            'themes': ['marketing'],
            'engagement_score': 80
        }]
        
        # Mock batch writer to raise exception
        mock_batch_writer = MagicMock()
        mock_batch_writer.put_item.side_effect = Exception("DynamoDB error")
        mock_trends_table.batch_writer.return_value.__enter__.return_value = mock_batch_writer
        
        # Act
        stored_count = handler.store_trends(trends)
        
        # Assert
        # Should return 0 on error, not raise exception
        assert stored_count == 0
    
    def test_cleanup_old_trends_completes_without_error(self):
        """Test that cleanup function completes without error"""
        # Act & Assert - should not raise exception
        handler.cleanup_old_trends()


class TestEndToEndHandler:
    """End-to-end tests for the Lambda handler"""
    
    @pytest.fixture(autouse=True)
    def setup_environment(self):
        """Set up environment variables for testing"""
        os.environ['TRENDS_TABLE_NAME'] = 'test-trends-table'
        os.environ['INSTAGRAM_APP_ID'] = 'test-app-id'
        os.environ['INSTAGRAM_APP_SECRET'] = 'test-app-secret'
        os.environ['AWS_REGION'] = 'us-east-1'
        
        yield
        
        # Cleanup
        for key in ['TRENDS_TABLE_NAME', 'INSTAGRAM_APP_ID', 'INSTAGRAM_APP_SECRET', 'AWS_REGION']:
            if key in os.environ:
                del os.environ[key]
    
    @patch('handler.trends_table')
    @patch('handler.secretsmanager')
    def test_handler_successful_execution(self, mock_secretsmanager, mock_trends_table):
        """Test successful end-to-end handler execution"""
        # Arrange
        event = {
            'version': '0',
            'id': str(uuid.uuid4()),
            'detail-type': 'Scheduled Event',
            'source': 'aws.events',
            'time': datetime.utcnow().isoformat() + 'Z',
            'detail': {}
        }
        
        mock_context = Mock()
        mock_context.request_id = 'test-request-id'
        
        # Mock Secrets Manager (no credentials, will use mock data)
        mock_secretsmanager.exceptions.ResourceNotFoundException = Exception
        mock_secretsmanager.get_secret_value.side_effect = Exception("Secret not found")
        
        # Mock DynamoDB batch writer
        mock_batch_writer = MagicMock()
        mock_trends_table.batch_writer.return_value.__enter__.return_value = mock_batch_writer
        
        # Act
        response = handler.handler(event, mock_context)
        
        # Assert
        assert response['statusCode'] == 200
        
        body = json.loads(response['body'])
        assert 'message' in body
        assert 'trends_scraped' in body
        assert 'trends_stored' in body
        assert body['trends_scraped'] > 0
        assert body['trends_stored'] > 0
    
    @patch('handler.trends_table')
    @patch('handler.secretsmanager')
    def test_handler_with_instagram_credentials(self, mock_secretsmanager, mock_trends_table):
        """Test handler execution with Instagram credentials"""
        # Arrange
        event = {
            'version': '0',
            'id': str(uuid.uuid4()),
            'detail-type': 'Scheduled Event',
            'source': 'aws.events',
            'time': datetime.utcnow().isoformat() + 'Z',
            'detail': {}
        }
        
        mock_context = Mock()
        mock_context.request_id = 'test-request-id'
        
        # Mock Secrets Manager with valid credentials
        mock_secretsmanager.get_secret_value.return_value = {
            'SecretString': json.dumps({
                'access_token': 'valid-instagram-token'
            })
        }
        
        # Mock DynamoDB batch writer
        mock_batch_writer = MagicMock()
        mock_trends_table.batch_writer.return_value.__enter__.return_value = mock_batch_writer
        
        # Act
        with patch('time.sleep'):  # Skip rate limiting delays
            response = handler.handler(event, mock_context)
        
        # Assert
        assert response['statusCode'] == 200
        
        body = json.loads(response['body'])
        assert body['trends_scraped'] > 0
        assert body['trends_stored'] > 0
    
    @patch('handler.trends_table')
    @patch('handler.secretsmanager')
    @patch('handler.scrape_instagram_trends')
    def test_handler_propagates_critical_errors(
        self, mock_scrape, mock_secretsmanager, mock_trends_table
    ):
        """Test that critical errors are propagated"""
        # Arrange
        event = {'detail': {}}
        mock_context = Mock()
        mock_context.request_id = 'test-request-id'
        
        # Mock scraping to raise exception
        mock_scrape.side_effect = Exception("Critical error")
        
        # Act & Assert
        with pytest.raises(Exception) as exc_info:
            handler.handler(event, mock_context)
        
        assert "Critical error" in str(exc_info.value)
