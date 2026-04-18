"""
Property-Based Tests for Trend Scraper Lambda
Feature: experta-ai-social-manager, Property 7: Trend Data Persistence
Validates: Requirements 4.3, 4.4
"""

import pytest
import json
import uuid
from datetime import datetime, timedelta
from unittest.mock import Mock, patch, MagicMock
from hypothesis import given, strategies as st, settings
from hypothesis.strategies import composite
import sys
import os

# Add the lib path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../lib/python'))

# Import the handler module
import handler


# Custom strategies for generating test data
@composite
def trend_data_strategy(draw):
    """Generate valid trend data for testing"""
    num_descriptors = draw(st.integers(min_value=1, max_value=10))
    num_themes = draw(st.integers(min_value=1, max_value=10))
    
    return {
        'source': draw(st.sampled_from(['instagram', 'web'])),
        'hashtag': draw(st.text(min_size=1, max_size=50, alphabet=st.characters(blacklist_categories=('Cs',)))),
        'style_descriptors': [
            draw(st.text(min_size=1, max_size=50, alphabet=st.characters(blacklist_categories=('Cs',))))
            for _ in range(num_descriptors)
        ],
        'themes': [
            draw(st.text(min_size=1, max_size=50, alphabet=st.characters(blacklist_categories=('Cs',))))
            for _ in range(num_themes)
        ],
        'engagement_score': draw(st.integers(min_value=0, max_value=100))
    }


@composite
def eventbridge_event_strategy(draw):
    """Generate valid EventBridge scheduled event for trend scraping"""
    return {
        'version': '0',
        'id': str(uuid.uuid4()),
        'detail-type': 'Scheduled Event',
        'source': 'aws.events',
        'account': '123456789012',
        'time': datetime.utcnow().isoformat() + 'Z',
        'region': 'us-east-1',
        'resources': [
            f"arn:aws:events:us-east-1:123456789012:rule/trend-scraper-daily"
        ],
        'detail': {}
    }


class TestTrendDataPersistenceProperty:
    """Property-based tests for trend data persistence"""
    
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
    
    # Feature: experta-ai-social-manager, Property 7: Trend Data Persistence
    @given(
        trends=st.lists(trend_data_strategy(), min_size=1, max_size=10)
    )
    @settings(max_examples=20, deadline=None)
    def test_stored_trends_contain_required_fields(self, trends):
        """
        Property: For any trend scraping operation, the resulting trend 
        records in DynamoDB SHALL contain style_descriptors and themes fields.
        
        This test verifies that regardless of:
        - Number of trends (1-10)
        - Source type (instagram, web)
        - Number of style descriptors (1-10)
        - Number of themes (1-10)
        
        All stored trend records contain the required fields.
        """
        # Arrange: Mock DynamoDB table
        with patch('handler.trends_table') as mock_trends_table:
            # Capture items written to DynamoDB
            written_items = []
            mock_batch_writer = MagicMock()
            
            def capture_put_item(Item):
                written_items.append(Item)
            
            mock_batch_writer.put_item.side_effect = capture_put_item
            mock_trends_table.batch_writer.return_value.__enter__.return_value = mock_batch_writer
            
            # Act: Store trends
            stored_count = handler.store_trends(trends)
            
            # Assert: All trends were stored
            assert stored_count == len(trends), \
                f"Expected {len(trends)} trends to be stored, but got {stored_count}"
            
            # Property: All stored items contain style_descriptors and themes
            for i, item in enumerate(written_items):
                # Verify required fields exist
                assert 'style_descriptors' in item, \
                    f"Trend {i} missing 'style_descriptors' field"
                assert 'themes' in item, \
                    f"Trend {i} missing 'themes' field"
                
                # Verify fields are lists
                assert isinstance(item['style_descriptors'], list), \
                    f"Trend {i} 'style_descriptors' is not a list: {type(item['style_descriptors'])}"
                assert isinstance(item['themes'], list), \
                    f"Trend {i} 'themes' is not a list: {type(item['themes'])}"
                
                # Verify lists are not empty (based on our test data)
                assert len(item['style_descriptors']) > 0, \
                    f"Trend {i} has empty 'style_descriptors' list"
                assert len(item['themes']) > 0, \
                    f"Trend {i} has empty 'themes' list"
                
                # Verify other required fields
                assert 'trend_id' in item, f"Trend {i} missing 'trend_id'"
                assert 'scraped_at' in item, f"Trend {i} missing 'scraped_at'"
                assert 'source' in item, f"Trend {i} missing 'source'"
                assert 'hashtags' in item, f"Trend {i} missing 'hashtags'"
                assert 'engagement_score' in item, f"Trend {i} missing 'engagement_score'"
                assert 'ttl' in item, f"Trend {i} missing 'ttl'"
    
    # Feature: experta-ai-social-manager, Property 7: Trend Data Persistence
    @given(
        event=eventbridge_event_strategy()
    )
    @settings(max_examples=20, deadline=None)
    @patch('handler.trends_table')
    @patch('handler.secretsmanager')
    def test_end_to_end_trend_persistence(
        self,
        mock_secretsmanager,
        mock_trends_table,
        event
    ):
        """
        Property: For any trend scraping operation triggered by EventBridge,
        all resulting trend records SHALL contain style_descriptors and themes.
        
        This is an end-to-end test that verifies the property holds
        through the entire handler execution.
        """
        # Arrange: Set up mocks
        # Mock Secrets Manager (no credentials available, will use mock data)
        mock_secretsmanager.exceptions.ResourceNotFoundException = Exception
        mock_secretsmanager.get_secret_value.side_effect = Exception("Secret not found")
        
        # Capture items written to DynamoDB
        written_items = []
        mock_batch_writer = MagicMock()
        
        def capture_put_item(Item):
            written_items.append(Item)
        
        mock_batch_writer.put_item.side_effect = capture_put_item
        mock_trends_table.batch_writer.return_value.__enter__.return_value = mock_batch_writer
        
        # Mock context
        mock_context = Mock()
        mock_context.request_id = 'test-request-id'
        
        # Act: Call the handler
        response = handler.handler(event, mock_context)
        
        # Assert: Response should be successful
        assert response['statusCode'] == 200
        body = json.loads(response['body'])
        
        # Verify trends were scraped and stored
        assert body['trends_scraped'] > 0, "No trends were scraped"
        assert body['trends_stored'] > 0, "No trends were stored"
        assert len(written_items) > 0, "No items were written to DynamoDB"
        
        # Property: All stored trends contain style_descriptors and themes
        for i, item in enumerate(written_items):
            assert 'style_descriptors' in item, \
                f"Trend {i} missing 'style_descriptors' field"
            assert 'themes' in item, \
                f"Trend {i} missing 'themes' field"
            
            # Verify they are lists
            assert isinstance(item['style_descriptors'], list), \
                f"Trend {i} 'style_descriptors' is not a list"
            assert isinstance(item['themes'], list), \
                f"Trend {i} 'themes' is not a list"
            
            # Verify lists contain data
            assert len(item['style_descriptors']) > 0, \
                f"Trend {i} has empty 'style_descriptors'"
            assert len(item['themes']) > 0, \
                f"Trend {i} has empty 'themes'"
    
    # Feature: experta-ai-social-manager, Property 7: Trend Data Persistence
    @given(
        hashtag=st.text(min_size=1, max_size=50, alphabet=st.characters(blacklist_categories=('Cs',)))
    )
    @settings(max_examples=20, deadline=None)
    def test_scrape_functions_return_required_fields(self, hashtag):
        """
        Property: For any hashtag scraped, the resulting trend data
        SHALL contain style_descriptors and themes fields.
        
        This tests the core scraping logic in isolation.
        """
        # Act: Extract style descriptors and themes
        style_descriptors = handler.extract_style_descriptors(hashtag)
        themes = handler.extract_themes(hashtag)
        
        # Assert: Property - both fields are present and non-empty
        assert style_descriptors is not None, \
            f"extract_style_descriptors returned None for hashtag '{hashtag}'"
        assert themes is not None, \
            f"extract_themes returned None for hashtag '{hashtag}'"
        
        # Verify they are lists
        assert isinstance(style_descriptors, list), \
            f"style_descriptors is not a list: {type(style_descriptors)}"
        assert isinstance(themes, list), \
            f"themes is not a list: {type(themes)}"
        
        # Verify lists are not empty
        assert len(style_descriptors) > 0, \
            f"style_descriptors is empty for hashtag '{hashtag}'"
        assert len(themes) > 0, \
            f"themes is empty for hashtag '{hashtag}'"
        
        # Verify all elements are strings
        for descriptor in style_descriptors:
            assert isinstance(descriptor, str), \
                f"style_descriptor element is not a string: {type(descriptor)}"
        
        for theme in themes:
            assert isinstance(theme, str), \
                f"theme element is not a string: {type(theme)}"
    
    # Feature: experta-ai-social-manager, Property 7: Trend Data Persistence
    @given(
        access_token=st.text(min_size=0, max_size=100, alphabet=st.characters(blacklist_categories=('Cs',)))
    )
    @settings(max_examples=20, deadline=None)
    def test_scrape_instagram_trends_returns_valid_structure(self, access_token):
        """
        Property: For any Instagram scraping operation (with or without token),
        the returned trends SHALL contain style_descriptors and themes.
        
        This tests that even with mock data or API failures, the structure
        is maintained.
        """
        # Act: Scrape Instagram trends
        trends = handler.scrape_instagram_trends(access_token)
        
        # Assert: Property - all trends have required fields
        assert isinstance(trends, list), \
            f"scrape_instagram_trends did not return a list: {type(trends)}"
        
        # Even if no token, should return mock data
        assert len(trends) > 0, \
            "scrape_instagram_trends returned empty list"
        
        for i, trend in enumerate(trends):
            assert 'style_descriptors' in trend, \
                f"Trend {i} missing 'style_descriptors'"
            assert 'themes' in trend, \
                f"Trend {i} missing 'themes'"
            
            # Verify they are lists
            assert isinstance(trend['style_descriptors'], list), \
                f"Trend {i} 'style_descriptors' is not a list"
            assert isinstance(trend['themes'], list), \
                f"Trend {i} 'themes' is not a list"
            
            # Verify lists are not empty
            assert len(trend['style_descriptors']) > 0, \
                f"Trend {i} has empty 'style_descriptors'"
            assert len(trend['themes']) > 0, \
                f"Trend {i} has empty 'themes'"
    
    # Feature: experta-ai-social-manager, Property 7: Trend Data Persistence
    def test_generate_mock_trends_returns_valid_structure(self):
        """
        Property: The mock trend generation function SHALL always return
        trends with style_descriptors and themes fields.
        
        This ensures the fallback data maintains the required structure.
        """
        # Act: Generate mock trends
        mock_trends = handler.generate_mock_trends()
        
        # Assert: Property - all mock trends have required fields
        assert isinstance(mock_trends, list), \
            f"generate_mock_trends did not return a list: {type(mock_trends)}"
        
        assert len(mock_trends) > 0, \
            "generate_mock_trends returned empty list"
        
        for i, trend in enumerate(mock_trends):
            assert 'style_descriptors' in trend, \
                f"Mock trend {i} missing 'style_descriptors'"
            assert 'themes' in trend, \
                f"Mock trend {i} missing 'themes'"
            
            # Verify they are lists
            assert isinstance(trend['style_descriptors'], list), \
                f"Mock trend {i} 'style_descriptors' is not a list"
            assert isinstance(trend['themes'], list), \
                f"Mock trend {i} 'themes' is not a list"
            
            # Verify lists are not empty
            assert len(trend['style_descriptors']) > 0, \
                f"Mock trend {i} has empty 'style_descriptors'"
            assert len(trend['themes']) > 0, \
                f"Mock trend {i} has empty 'themes'"
            
            # Verify all elements are strings
            for descriptor in trend['style_descriptors']:
                assert isinstance(descriptor, str), \
                    f"Mock trend {i} style_descriptor is not a string"
            
            for theme in trend['themes']:
                assert isinstance(theme, str), \
                    f"Mock trend {i} theme is not a string"
    
    # Feature: experta-ai-social-manager, Property 7: Trend Data Persistence
    @given(
        trends=st.lists(trend_data_strategy(), min_size=1, max_size=10)
    )
    @settings(max_examples=20, deadline=None)
    def test_trend_records_have_ttl_for_cleanup(self, trends):
        """
        Property: For any stored trend records, they SHALL have a TTL field
        set for automatic cleanup (7-day rolling window).
        
        This verifies that trends are properly configured for automatic
        expiration, supporting the 7-day rolling window requirement.
        """
        # Arrange: Mock DynamoDB table
        with patch('handler.trends_table') as mock_trends_table:
            # Capture items written to DynamoDB
            written_items = []
            mock_batch_writer = MagicMock()
            
            def capture_put_item(Item):
                written_items.append(Item)
            
            mock_batch_writer.put_item.side_effect = capture_put_item
            mock_trends_table.batch_writer.return_value.__enter__.return_value = mock_batch_writer
            
            # Act: Store trends
            stored_count = handler.store_trends(trends)
            
            # Assert: All trends have TTL
            assert stored_count == len(trends)
            
            current_time = datetime.utcnow()
            expected_ttl_min = int((current_time + timedelta(days=6, hours=23)).timestamp())
            expected_ttl_max = int((current_time + timedelta(days=7, hours=1)).timestamp())
            
            for i, item in enumerate(written_items):
                assert 'ttl' in item, f"Trend {i} missing 'ttl' field"
                
                # Verify TTL is an integer (Unix timestamp)
                assert isinstance(item['ttl'], int), \
                    f"Trend {i} 'ttl' is not an integer: {type(item['ttl'])}"
                
                # Verify TTL is approximately 7 days in the future
                assert expected_ttl_min <= item['ttl'] <= expected_ttl_max, \
                    f"Trend {i} TTL {item['ttl']} is not within 7 days range " \
                    f"[{expected_ttl_min}, {expected_ttl_max}]"
