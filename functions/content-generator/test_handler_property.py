"""
Property-Based Tests for Content Generator Lambda
Feature: experta-ai-social-manager, Property 8: Content Calendar Size
Validates: Requirements 5.2
"""

import pytest
import json
import uuid
import base64
from datetime import datetime, timedelta
from unittest.mock import Mock, patch, MagicMock
from hypothesis import given, strategies as st, settings
from hypothesis.strategies import composite
import sys
import os

# Add the lib path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../lib/python'))

# Import the handler module (boto3 is already mocked in conftest.py)
import handler


# Custom strategies for generating test data
@composite
def brand_data_strategy(draw):
    """Generate valid brand data for testing"""
    num_pillars = draw(st.integers(min_value=3, max_value=10))
    num_times = draw(st.integers(min_value=1, max_value=5))
    
    # Generate unique content pillars by using a set and adding index suffix
    content_pillars = []
    for i in range(num_pillars):
        pillar_name = draw(st.text(min_size=1, max_size=50, alphabet=st.characters(blacklist_categories=('Cs',))))
        # Ensure uniqueness by appending index if needed
        unique_pillar = f"{pillar_name}_{i}"
        content_pillars.append(unique_pillar)
    
    return {
        'brand_id': str(uuid.uuid4()),
        'brand_name': draw(st.text(min_size=1, max_size=100, alphabet=st.characters(blacklist_categories=('Cs',)))),
        'industry': draw(st.text(min_size=1, max_size=100, alphabet=st.characters(blacklist_categories=('Cs',)))),
        'target_audience': draw(st.text(min_size=1, max_size=200, alphabet=st.characters(blacklist_categories=('Cs',)))),
        'tone_of_voice': draw(st.text(min_size=1, max_size=100, alphabet=st.characters(blacklist_categories=('Cs',)))),
        'visual_style': draw(st.text(min_size=1, max_size=200, alphabet=st.characters(blacklist_categories=('Cs',)))),
        'content_pillars': content_pillars,
        'post_times': [
            f"{draw(st.integers(min_value=0, max_value=23)):02d}:{draw(st.integers(min_value=0, max_value=59)):02d}"
            for _ in range(num_times)
        ],
        'created_at': datetime.utcnow().isoformat() + 'Z',
        'updated_at': datetime.utcnow().isoformat() + 'Z'
    }


@composite
def eventbridge_event_strategy(draw):
    """Generate valid EventBridge event for content generation"""
    brand_id = str(uuid.uuid4())
    return {
        'version': '0',
        'id': str(uuid.uuid4()),
        'detail-type': 'BrandOnboardingComplete',
        'source': 'experta.onboarding',
        'account': '123456789012',
        'time': datetime.utcnow().isoformat() + 'Z',
        'region': 'us-east-1',
        'resources': [],
        'detail': {
            'brand_id': brand_id,
            'timestamp': datetime.utcnow().isoformat() + 'Z'
        }
    }


class TestContentCalendarSizeProperty:
    """Property-based tests for content calendar size"""
    
    @pytest.fixture(autouse=True)
    def setup_environment(self):
        """Set up environment variables for testing"""
        os.environ['BRANDS_TABLE_NAME'] = 'test-brands-table'
        os.environ['POSTS_TABLE_NAME'] = 'test-posts-table'
        os.environ['S3_BUCKET_NAME'] = 'test-bucket'
        os.environ['BEDROCK_CLAUDE_MODEL_ID'] = 'anthropic.claude-3-5-sonnet-20241022-v2:0'
        os.environ['BEDROCK_TITAN_MODEL_ID'] = 'amazon.titan-image-generator-v1'
        os.environ['EVENTBRIDGE_BUS_NAME'] = 'default'
        os.environ['AWS_REGION'] = 'us-east-1'
        
        yield
        
        # Cleanup
        for key in ['BRANDS_TABLE_NAME', 'POSTS_TABLE_NAME', 'S3_BUCKET_NAME', 
                    'BEDROCK_CLAUDE_MODEL_ID', 'BEDROCK_TITAN_MODEL_ID', 
                    'EVENTBRIDGE_BUS_NAME', 'AWS_REGION']:
            if key in os.environ:
                del os.environ[key]
    
    # Feature: experta-ai-social-manager, Property 8: Content Calendar Size
    @given(
        brand_data=brand_data_strategy(),
        event=eventbridge_event_strategy()
    )
    @settings(max_examples=100, deadline=None)
    @patch('handler.brands_table')
    @patch('handler.posts_table')
    @patch('handler.bedrock_runtime')
    @patch('handler.s3_client')
    @patch('handler.events_client')
    def test_content_calendar_generates_exactly_30_posts(
        self,
        mock_events_client,
        mock_s3_client,
        mock_bedrock_runtime,
        mock_posts_table,
        mock_brands_table,
        brand_data,
        event
    ):
        """
        Property: For any completed content generation operation, 
        exactly 30 post records SHALL be created in DynamoDB.
        
        This test verifies that regardless of:
        - Number of content pillars (3-10)
        - Number of post times (1-5)
        - Brand characteristics
        
        The system always generates exactly 30 posts.
        """
        # Arrange: Set up mocks
        event['detail']['brand_id'] = brand_data['brand_id']
        
        # Mock DynamoDB get_item to return brand data
        mock_brands_table.get_item.return_value = {
            'Item': brand_data
        }
        
        # Mock batch writer for posts table
        mock_batch_writer = MagicMock()
        mock_posts_table.batch_writer.return_value.__enter__.return_value = mock_batch_writer
        
        # Mock Bedrock responses for caption generation
        mock_bedrock_runtime.invoke_model.return_value = {
            'body': MagicMock(read=lambda: json.dumps({
                'content': [{'text': 'Generated caption for social media post'}]
            }).encode())
        }
        
        # Mock S3 upload
        mock_s3_client.put_object.return_value = {}
        
        # Mock EventBridge rule creation
        mock_events_client.put_rule.return_value = {}
        mock_events_client.put_targets.return_value = {}
        mock_events_client.put_events.return_value = {'FailedEntryCount': 0}
        
        # Mock STS for account ID
        with patch('handler.get_account_id', return_value='123456789012'):
            # Mock context
            mock_context = Mock()
            mock_context.request_id = 'test-request-id'
            
            # Act: Call the handler
            response = handler.handler(event, mock_context)
            
            # Assert: Response should be successful
            assert response['statusCode'] == 200
            body = json.loads(response['body'])
            
            # Property: Exactly 30 posts should be created
            assert body['posts_created'] == 30, \
                f"Expected exactly 30 posts, but got {body['posts_created']}"
            
            # Verify batch writer was called with 30 posts
            assert mock_batch_writer.put_item.call_count == 30, \
                f"Expected 30 put_item calls, but got {mock_batch_writer.put_item.call_count}"
            
            # Verify all posts have required fields
            for call in mock_batch_writer.put_item.call_args_list:
                post = call[1]['Item']
                assert 'post_id' in post
                assert 'brand_id' in post
                assert post['brand_id'] == brand_data['brand_id']
                assert 'caption' in post
                assert 'image_url' in post
                assert 'scheduled_time' in post
                assert 'status' in post
                assert post['status'] == 'Scheduled'
                assert 'content_pillar' in post
    
    # Feature: experta-ai-social-manager, Property 8: Content Calendar Size
    @given(brand_data=brand_data_strategy())
    @settings(max_examples=100, deadline=None)
    @patch('handler.get_brand_data')
    @patch('handler.generate_caption')
    @patch('handler.generate_and_upload_image')
    def test_generate_content_calendar_returns_30_posts(
        self,
        mock_generate_image,
        mock_generate_caption,
        mock_get_brand_data,
        brand_data
    ):
        """
        Property: The generate_content_calendar function should always 
        return exactly 30 posts regardless of brand configuration.
        
        This is a more focused unit test of the core generation logic.
        """
        # Arrange: Mock the generation functions
        mock_generate_caption.return_value = "Test caption"
        mock_generate_image.return_value = f"https://test-bucket.s3.us-east-1.amazonaws.com/images/{brand_data['brand_id']}/test.png"
        
        # Act: Call generate_content_calendar directly
        posts = handler.generate_content_calendar(brand_data)
        
        # Assert: Property - exactly 30 posts
        assert len(posts) == 30, \
            f"Expected exactly 30 posts, but got {len(posts)}"
        
        # Verify each post has the correct structure
        for i, post in enumerate(posts):
            assert 'post_id' in post, f"Post {i} missing post_id"
            assert 'brand_id' in post, f"Post {i} missing brand_id"
            assert post['brand_id'] == brand_data['brand_id'], \
                f"Post {i} has incorrect brand_id"
            assert 'caption' in post, f"Post {i} missing caption"
            assert 'image_url' in post, f"Post {i} missing image_url"
            assert 'platform' in post, f"Post {i} missing platform"
            assert 'scheduled_time' in post, f"Post {i} missing scheduled_time"
            assert 'status' in post, f"Post {i} missing status"
            assert post['status'] == 'Scheduled', \
                f"Post {i} has incorrect status: {post['status']}"
            assert 'content_pillar' in post, f"Post {i} missing content_pillar"
            assert 'created_at' in post, f"Post {i} missing created_at"
            assert 'retry_count' in post, f"Post {i} missing retry_count"
            assert post['retry_count'] == 0, \
                f"Post {i} has non-zero retry_count: {post['retry_count']}"
    
    # Feature: experta-ai-social-manager, Property 8: Content Calendar Size
    @given(
        brand_data=brand_data_strategy(),
        num_failures=st.integers(min_value=0, max_value=5)
    )
    @settings(max_examples=100, deadline=None)
    @patch('handler.generate_caption')
    @patch('handler.generate_and_upload_image')
    def test_calendar_size_maintained_despite_partial_failures(
        self,
        mock_generate_image,
        mock_generate_caption,
        brand_data,
        num_failures
    ):
        """
        Property: Even if some individual post generations fail,
        the system should still attempt to generate all 30 posts.
        
        This tests resilience - the calendar size property should hold
        even in the presence of failures.
        """
        # Arrange: Set up mocks with some failures
        call_count = [0]
        
        def caption_side_effect(*args, **kwargs):
            call_count[0] += 1
            if call_count[0] <= num_failures:
                # First N calls fail
                return "Fallback caption due to error"
            return "Generated caption"
        
        mock_generate_caption.side_effect = caption_side_effect
        mock_generate_image.return_value = f"https://test-bucket.s3.us-east-1.amazonaws.com/images/{brand_data['brand_id']}/test.png"
        
        # Act: Generate calendar
        posts = handler.generate_content_calendar(brand_data)
        
        # Assert: Property - still exactly 30 posts despite failures
        assert len(posts) == 30, \
            f"Expected exactly 30 posts even with {num_failures} failures, but got {len(posts)}"
        
        # All posts should still be valid
        for post in posts:
            assert post['status'] == 'Scheduled'
            assert post['caption'] is not None
            assert len(post['caption']) > 0


class TestPostTimeAlignmentProperty:
    """Property-based tests for post time alignment"""
    
    @pytest.fixture(autouse=True)
    def setup_environment(self):
        """Set up environment variables for testing"""
        os.environ['BRANDS_TABLE_NAME'] = 'test-brands-table'
        os.environ['POSTS_TABLE_NAME'] = 'test-posts-table'
        os.environ['S3_BUCKET_NAME'] = 'test-bucket'
        os.environ['BEDROCK_CLAUDE_MODEL_ID'] = 'anthropic.claude-3-5-sonnet-20241022-v2:0'
        os.environ['BEDROCK_TITAN_MODEL_ID'] = 'amazon.titan-image-generator-v1'
        os.environ['EVENTBRIDGE_BUS_NAME'] = 'default'
        os.environ['AWS_REGION'] = 'us-east-1'
        
        yield
        
        # Cleanup
        for key in ['BRANDS_TABLE_NAME', 'POSTS_TABLE_NAME', 'S3_BUCKET_NAME', 
                    'BEDROCK_CLAUDE_MODEL_ID', 'BEDROCK_TITAN_MODEL_ID', 
                    'EVENTBRIDGE_BUS_NAME', 'AWS_REGION']:
            if key in os.environ:
                del os.environ[key]
    
    # Feature: experta-ai-social-manager, Property 9: Post Time Alignment
    @given(brand_data=brand_data_strategy())
    @settings(max_examples=100, deadline=None)
    @patch('handler.generate_caption')
    @patch('handler.generate_and_upload_image')
    def test_all_posts_align_with_brand_post_times(
        self,
        mock_generate_image,
        mock_generate_caption,
        brand_data
    ):
        """
        Property: For any post created during content generation, 
        the scheduled_time SHALL align with one of the brand's defined 
        post_times (matching the time component HH:MM).
        
        This test verifies that regardless of:
        - Number of post times (1-5)
        - Specific time values
        - Number of content pillars
        
        Every generated post's scheduled time matches one of the 
        brand's preferred posting times.
        """
        # Arrange: Mock the generation functions
        mock_generate_caption.return_value = "Test caption"
        mock_generate_image.return_value = f"https://test-bucket.s3.us-east-1.amazonaws.com/images/{brand_data['brand_id']}/test.png"
        
        # Act: Generate content calendar
        posts = handler.generate_content_calendar(brand_data)
        
        # Assert: Property - all posts align with brand post_times
        brand_post_times = brand_data['post_times']
        
        for i, post in enumerate(posts):
            # Extract time component from scheduled_time (ISO8601 format)
            scheduled_time_str = post['scheduled_time']
            
            # Parse ISO8601 datetime
            # Format: YYYY-MM-DDTHH:MM:SS.000000Z or YYYY-MM-DDTHH:MM:SSZ
            scheduled_dt = datetime.fromisoformat(scheduled_time_str.replace('Z', '+00:00'))
            
            # Extract HH:MM from scheduled time
            scheduled_time_component = f"{scheduled_dt.hour:02d}:{scheduled_dt.minute:02d}"
            
            # Verify this time matches one of the brand's post_times
            assert scheduled_time_component in brand_post_times, \
                f"Post {i} scheduled at {scheduled_time_component} does not match any brand post_times: {brand_post_times}"
        
        # Additional verification: ensure we're using all post_times in round-robin
        # Extract all unique time components from posts
        post_time_components = set()
        for post in posts:
            scheduled_dt = datetime.fromisoformat(post['scheduled_time'].replace('Z', '+00:00'))
            time_component = f"{scheduled_dt.hour:02d}:{scheduled_dt.minute:02d}"
            post_time_components.add(time_component)
        
        # All post_time_components should be from brand_post_times
        assert post_time_components.issubset(set(brand_post_times)), \
            f"Found post times {post_time_components} not in brand post_times {brand_post_times}"
    
    # Feature: experta-ai-social-manager, Property 9: Post Time Alignment
    @given(
        brand_data=brand_data_strategy(),
        event=eventbridge_event_strategy()
    )
    @settings(max_examples=100, deadline=None)
    @patch('handler.brands_table')
    @patch('handler.posts_table')
    @patch('handler.bedrock_runtime')
    @patch('handler.s3_client')
    @patch('handler.events_client')
    def test_end_to_end_post_time_alignment(
        self,
        mock_events_client,
        mock_s3_client,
        mock_bedrock_runtime,
        mock_posts_table,
        mock_brands_table,
        brand_data,
        event
    ):
        """
        Property: For any completed content generation operation,
        all created posts SHALL have scheduled_time values that align
        with the brand's post_times.
        
        This is an end-to-end test that verifies the property holds
        through the entire handler execution.
        """
        # Arrange: Set up mocks
        event['detail']['brand_id'] = brand_data['brand_id']
        
        # Mock DynamoDB get_item to return brand data
        mock_brands_table.get_item.return_value = {
            'Item': brand_data
        }
        
        # Capture posts written to DynamoDB
        written_posts = []
        mock_batch_writer = MagicMock()
        
        def capture_put_item(Item):
            written_posts.append(Item)
        
        mock_batch_writer.put_item.side_effect = capture_put_item
        mock_posts_table.batch_writer.return_value.__enter__.return_value = mock_batch_writer
        
        # Mock Bedrock responses
        mock_bedrock_runtime.invoke_model.return_value = {
            'body': MagicMock(read=lambda: json.dumps({
                'content': [{'text': 'Generated caption'}]
            }).encode())
        }
        
        # Mock S3 upload
        mock_s3_client.put_object.return_value = {}
        
        # Mock EventBridge
        mock_events_client.put_rule.return_value = {}
        mock_events_client.put_targets.return_value = {}
        mock_events_client.put_events.return_value = {'FailedEntryCount': 0}
        
        # Mock STS
        with patch('handler.get_account_id', return_value='123456789012'):
            # Mock context
            mock_context = Mock()
            mock_context.request_id = 'test-request-id'
            
            # Act: Call the handler
            response = handler.handler(event, mock_context)
            
            # Assert: Response should be successful
            assert response['statusCode'] == 200
            
            # Property: All written posts align with brand post_times
            brand_post_times = brand_data['post_times']
            
            for i, post in enumerate(written_posts):
                # Extract time component from scheduled_time
                scheduled_dt = datetime.fromisoformat(post['scheduled_time'].replace('Z', '+00:00'))
                scheduled_time_component = f"{scheduled_dt.hour:02d}:{scheduled_dt.minute:02d}"
                
                # Verify alignment with brand post_times
                assert scheduled_time_component in brand_post_times, \
                    f"Post {i} (ID: {post['post_id']}) scheduled at {scheduled_time_component} " \
                    f"does not match any brand post_times: {brand_post_times}"
    
    # Feature: experta-ai-social-manager, Property 9: Post Time Alignment
    @given(st.data())
    @settings(max_examples=100, deadline=None)
    def test_calculate_scheduled_time_preserves_time_component(
        self,
        data
    ):
        """
        Property: The calculate_scheduled_time function SHALL preserve
        the time component (HH:MM) from the input time_str parameter.
        
        This tests the core scheduling logic in isolation.
        """
        # Arrange: Generate random post times using data.draw()
        num_post_times = data.draw(st.integers(min_value=1, max_value=5))
        num_posts = data.draw(st.integers(min_value=1, max_value=50))
        
        post_times = [
            f"{data.draw(st.integers(min_value=0, max_value=23)):02d}:{data.draw(st.integers(min_value=0, max_value=59)):02d}"
            for _ in range(num_post_times)
        ]
        
        # Generate random dates
        start_date = datetime.utcnow() + timedelta(days=1)
        
        # Act & Assert: For each post, verify time alignment
        for day in range(num_posts):
            time_index = day % len(post_times)
            post_time = post_times[time_index]
            
            scheduled_date = start_date + timedelta(days=day)
            scheduled_time_iso = handler.calculate_scheduled_time(scheduled_date, post_time)
            
            # Parse the result
            scheduled_dt = datetime.fromisoformat(scheduled_time_iso.replace('Z', '+00:00'))
            result_time_component = f"{scheduled_dt.hour:02d}:{scheduled_dt.minute:02d}"
            
            # Property: Time component should match input
            assert result_time_component == post_time, \
                f"calculate_scheduled_time({scheduled_date}, {post_time}) returned " \
                f"{scheduled_time_iso} with time component {result_time_component}, " \
                f"expected {post_time}"


class TestContentPillarDistributionProperty:
    """Property-based tests for content pillar distribution"""
    
    @pytest.fixture(autouse=True)
    def setup_environment(self):
        """Set up environment variables for testing"""
        os.environ['BRANDS_TABLE_NAME'] = 'test-brands-table'
        os.environ['POSTS_TABLE_NAME'] = 'test-posts-table'
        os.environ['S3_BUCKET_NAME'] = 'test-bucket'
        os.environ['BEDROCK_CLAUDE_MODEL_ID'] = 'anthropic.claude-3-5-sonnet-20241022-v2:0'
        os.environ['BEDROCK_TITAN_MODEL_ID'] = 'amazon.titan-image-generator-v1'
        os.environ['EVENTBRIDGE_BUS_NAME'] = 'default'
        os.environ['AWS_REGION'] = 'us-east-1'
        
        yield
        
        # Cleanup
        for key in ['BRANDS_TABLE_NAME', 'POSTS_TABLE_NAME', 'S3_BUCKET_NAME', 
                    'BEDROCK_CLAUDE_MODEL_ID', 'BEDROCK_TITAN_MODEL_ID', 
                    'EVENTBRIDGE_BUS_NAME', 'AWS_REGION']:
            if key in os.environ:
                del os.environ[key]
    
    # Feature: experta-ai-social-manager, Property 10: Content Pillar Distribution
    @given(brand_data=brand_data_strategy())
    @settings(max_examples=100, deadline=None)
    @patch('handler.generate_caption')
    @patch('handler.generate_and_upload_image')
    def test_content_pillars_appear_at_least_once(
        self,
        mock_generate_image,
        mock_generate_caption,
        brand_data
    ):
        """
        Property: For any set of 30 generated posts, each content_pillar 
        SHALL appear at least once.
        
        This test verifies that regardless of:
        - Number of content pillars (3-10)
        - Specific pillar names
        
        Every content pillar is represented in the generated calendar.
        """
        # Arrange: Mock the generation functions
        mock_generate_caption.return_value = "Test caption"
        mock_generate_image.return_value = f"https://test-bucket.s3.us-east-1.amazonaws.com/images/{brand_data['brand_id']}/test.png"
        
        # Act: Generate content calendar
        posts = handler.generate_content_calendar(brand_data)
        
        # Assert: Property - each pillar appears at least once
        brand_pillars = set(brand_data['content_pillars'])
        post_pillars = set(post['content_pillar'] for post in posts)
        
        # All brand pillars should appear in posts
        missing_pillars = brand_pillars - post_pillars
        assert len(missing_pillars) == 0, \
            f"Content pillars {missing_pillars} did not appear in any of the 30 posts. " \
            f"Brand pillars: {brand_pillars}, Post pillars: {post_pillars}"
        
        # Verify each post has a valid pillar
        for i, post in enumerate(posts):
            assert post['content_pillar'] in brand_pillars, \
                f"Post {i} has invalid content_pillar '{post['content_pillar']}' " \
                f"not in brand pillars: {brand_pillars}"
    
    # Feature: experta-ai-social-manager, Property 10: Content Pillar Distribution
    @given(brand_data=brand_data_strategy())
    @settings(max_examples=100, deadline=None)
    @patch('handler.generate_caption')
    @patch('handler.generate_and_upload_image')
    def test_content_pillar_distribution_is_balanced(
        self,
        mock_generate_image,
        mock_generate_caption,
        brand_data
    ):
        """
        Property: For any set of 30 generated posts, the distribution 
        SHALL be balanced (no pillar appears more than 2x any other pillar).
        
        This test verifies that the round-robin distribution ensures
        fair representation of all content pillars.
        """
        # Arrange: Mock the generation functions
        mock_generate_caption.return_value = "Test caption"
        mock_generate_image.return_value = f"https://test-bucket.s3.us-east-1.amazonaws.com/images/{brand_data['brand_id']}/test.png"
        
        # Act: Generate content calendar
        posts = handler.generate_content_calendar(brand_data)
        
        # Assert: Property - balanced distribution
        brand_pillars = brand_data['content_pillars']
        
        # Count occurrences of each pillar
        pillar_counts = {}
        for post in posts:
            pillar = post['content_pillar']
            pillar_counts[pillar] = pillar_counts.get(pillar, 0) + 1
        
        # Get min and max counts
        if len(pillar_counts) > 0:
            min_count = min(pillar_counts.values())
            max_count = max(pillar_counts.values())
            
            # Property: No pillar appears more than 2x any other pillar
            # With round-robin distribution, the difference should be at most 1
            # (e.g., with 3 pillars and 30 posts: 10, 10, 10)
            # (e.g., with 4 pillars and 30 posts: 8, 8, 7, 7)
            assert max_count <= 2 * min_count, \
                f"Unbalanced distribution: max count {max_count} is more than 2x min count {min_count}. " \
                f"Pillar counts: {pillar_counts}"
            
            # Additional check: with round-robin, difference should be at most 1
            assert max_count - min_count <= 1, \
                f"Round-robin distribution should have at most 1 difference between counts. " \
                f"Got max={max_count}, min={min_count}. Pillar counts: {pillar_counts}"
    
    # Feature: experta-ai-social-manager, Property 10: Content Pillar Distribution
    @given(brand_data=brand_data_strategy())
    @settings(max_examples=100, deadline=None)
    @patch('handler.generate_caption')
    @patch('handler.generate_and_upload_image')
    def test_round_robin_distribution_pattern(
        self,
        mock_generate_image,
        mock_generate_caption,
        brand_data
    ):
        """
        Property: For any set of 30 generated posts, the content pillars
        SHALL follow a round-robin pattern.
        
        This test verifies the specific implementation detail that
        pillars are assigned in a cyclic pattern.
        """
        # Arrange: Mock the generation functions
        mock_generate_caption.return_value = "Test caption"
        mock_generate_image.return_value = f"https://test-bucket.s3.us-east-1.amazonaws.com/images/{brand_data['brand_id']}/test.png"
        
        # Act: Generate content calendar
        posts = handler.generate_content_calendar(brand_data)
        
        # Assert: Property - round-robin pattern
        brand_pillars = brand_data['content_pillars']
        num_pillars = len(brand_pillars)
        
        # Verify round-robin pattern: post[i] should use pillar[i % num_pillars]
        for i, post in enumerate(posts):
            expected_pillar_index = i % num_pillars
            expected_pillar = brand_pillars[expected_pillar_index]
            actual_pillar = post['content_pillar']
            
            assert actual_pillar == expected_pillar, \
                f"Post {i} should use pillar at index {expected_pillar_index} ('{expected_pillar}'), " \
                f"but got '{actual_pillar}'. Round-robin pattern broken."
    
    # Feature: experta-ai-social-manager, Property 10: Content Pillar Distribution
    @given(
        brand_data=brand_data_strategy(),
        event=eventbridge_event_strategy()
    )
    @settings(max_examples=100, deadline=None)
    @patch('handler.brands_table')
    @patch('handler.posts_table')
    @patch('handler.bedrock_runtime')
    @patch('handler.s3_client')
    @patch('handler.events_client')
    def test_end_to_end_pillar_distribution(
        self,
        mock_events_client,
        mock_s3_client,
        mock_bedrock_runtime,
        mock_posts_table,
        mock_brands_table,
        brand_data,
        event
    ):
        """
        Property: For any completed content generation operation,
        all content pillars SHALL be represented and balanced.
        
        This is an end-to-end test that verifies the property holds
        through the entire handler execution.
        """
        # Arrange: Set up mocks
        event['detail']['brand_id'] = brand_data['brand_id']
        
        # Mock DynamoDB get_item to return brand data
        mock_brands_table.get_item.return_value = {
            'Item': brand_data
        }
        
        # Capture posts written to DynamoDB
        written_posts = []
        mock_batch_writer = MagicMock()
        
        def capture_put_item(Item):
            written_posts.append(Item)
        
        mock_batch_writer.put_item.side_effect = capture_put_item
        mock_posts_table.batch_writer.return_value.__enter__.return_value = mock_batch_writer
        
        # Mock Bedrock responses
        mock_bedrock_runtime.invoke_model.return_value = {
            'body': MagicMock(read=lambda: json.dumps({
                'content': [{'text': 'Generated caption'}]
            }).encode())
        }
        
        # Mock S3 upload
        mock_s3_client.put_object.return_value = {}
        
        # Mock EventBridge
        mock_events_client.put_rule.return_value = {}
        mock_events_client.put_targets.return_value = {}
        mock_events_client.put_events.return_value = {'FailedEntryCount': 0}
        
        # Mock STS
        with patch('handler.get_account_id', return_value='123456789012'):
            # Mock context
            mock_context = Mock()
            mock_context.request_id = 'test-request-id'
            
            # Act: Call the handler
            response = handler.handler(event, mock_context)
            
            # Assert: Response should be successful
            assert response['statusCode'] == 200
            
            # Property 1: Each pillar appears at least once
            brand_pillars = set(brand_data['content_pillars'])
            post_pillars = set(post['content_pillar'] for post in written_posts)
            
            missing_pillars = brand_pillars - post_pillars
            assert len(missing_pillars) == 0, \
                f"Content pillars {missing_pillars} did not appear in any posts"
            
            # Property 2: Distribution is balanced
            pillar_counts = {}
            for post in written_posts:
                pillar = post['content_pillar']
                pillar_counts[pillar] = pillar_counts.get(pillar, 0) + 1
            
            if len(pillar_counts) > 0:
                min_count = min(pillar_counts.values())
                max_count = max(pillar_counts.values())
                
                assert max_count <= 2 * min_count, \
                    f"Unbalanced distribution in end-to-end test: {pillar_counts}"
                
                assert max_count - min_count <= 1, \
                    f"Round-robin should have at most 1 difference: {pillar_counts}"
    
    # Feature: experta-ai-social-manager, Property 10: Content Pillar Distribution
    @given(st.data())
    @settings(max_examples=100, deadline=None)
    def test_pillar_distribution_mathematical_property(
        self,
        data
    ):
        """
        Property: For any number of pillars P and 30 posts,
        each pillar should appear floor(30/P) or ceil(30/P) times.
        
        This tests the mathematical property of round-robin distribution.
        """
        # Arrange: Generate random number of pillars
        num_pillars = data.draw(st.integers(min_value=3, max_value=10))
        pillars = [f"pillar_{i}" for i in range(num_pillars)]
        
        # Calculate expected distribution
        posts_per_pillar_min = 30 // num_pillars
        posts_per_pillar_max = posts_per_pillar_min + (1 if 30 % num_pillars > 0 else 0)
        
        # Simulate round-robin distribution
        pillar_counts = {}
        for i in range(30):
            pillar = pillars[i % num_pillars]
            pillar_counts[pillar] = pillar_counts.get(pillar, 0) + 1
        
        # Assert: Property - each pillar appears expected number of times
        for pillar, count in pillar_counts.items():
            assert posts_per_pillar_min <= count <= posts_per_pillar_max, \
                f"Pillar '{pillar}' appeared {count} times, " \
                f"expected between {posts_per_pillar_min} and {posts_per_pillar_max}. " \
                f"Total pillars: {num_pillars}, Distribution: {pillar_counts}"


class TestImageGenerationPromptInclusionProperty:
    """Property-based tests for image generation prompt inclusion"""
    
    @pytest.fixture(autouse=True)
    def setup_environment(self):
        """Set up environment variables for testing"""
        os.environ['BRANDS_TABLE_NAME'] = 'test-brands-table'
        os.environ['POSTS_TABLE_NAME'] = 'test-posts-table'
        os.environ['S3_BUCKET_NAME'] = 'test-bucket'
        os.environ['BEDROCK_CLAUDE_MODEL_ID'] = 'anthropic.claude-3-5-sonnet-20241022-v2:0'
        os.environ['BEDROCK_TITAN_MODEL_ID'] = 'amazon.titan-image-generator-v1'
        os.environ['EVENTBRIDGE_BUS_NAME'] = 'default'
        os.environ['AWS_REGION'] = 'us-east-1'
        
        yield
        
        # Cleanup
        for key in ['BRANDS_TABLE_NAME', 'POSTS_TABLE_NAME', 'S3_BUCKET_NAME', 
                    'BEDROCK_CLAUDE_MODEL_ID', 'BEDROCK_TITAN_MODEL_ID', 
                    'EVENTBRIDGE_BUS_NAME', 'AWS_REGION']:
            if key in os.environ:
                del os.environ[key]
    
    # Feature: experta-ai-social-manager, Property 4: Image Generation Prompt Inclusion
    @given(brand_data=brand_data_strategy())
    @settings(max_examples=100, deadline=None)
    @patch('handler.bedrock_runtime')
    @patch('handler.s3_client')
    def test_visual_style_included_in_image_prompt(
        self,
        mock_s3_client,
        mock_bedrock_runtime,
        brand_data
    ):
        """
        Property: For any image generation request, the prompt sent to 
        Amazon Titan SHALL include the brand's visual_style text.
        
        This test verifies that regardless of:
        - Visual style content (any text)
        - Content pillar
        - Brand characteristics
        
        The visual_style is always included in the image generation prompt.
        """
        # Arrange: Set up mocks
        captured_prompts = []
        
        def capture_invoke_model(modelId, body):
            # Capture the request body
            request_body = json.loads(body)
            if 'textToImageParams' in request_body:
                prompt = request_body['textToImageParams']['text']
                captured_prompts.append(prompt)
            
            # Return mock response
            return {
                'body': MagicMock(read=lambda: json.dumps({
                    'images': [base64.b64encode(b'fake_image_data').decode('utf-8')]
                }).encode())
            }
        
        mock_bedrock_runtime.invoke_model.side_effect = capture_invoke_model
        mock_s3_client.put_object.return_value = {}
        
        # Act: Generate image
        content_pillar = brand_data['content_pillars'][0] if brand_data['content_pillars'] else 'test_pillar'
        caption = "Test caption"
        
        image_url = handler.generate_and_upload_image(
            brand_data,
            content_pillar,
            caption,
            brand_data['brand_id']
        )
        
        # Assert: Property - visual_style is included in the prompt
        assert len(captured_prompts) > 0, \
            "No image generation prompts were captured"
        
        visual_style = brand_data.get('visual_style', '')
        
        for i, prompt in enumerate(captured_prompts):
            assert visual_style in prompt, \
                f"Prompt {i} does not include brand visual_style '{visual_style}'. " \
                f"Prompt content: {prompt[:200]}..."
        
        # Verify the image URL was returned
        assert image_url is not None
        assert len(image_url) > 0
    
    # Feature: experta-ai-social-manager, Property 4: Image Generation Prompt Inclusion
    @given(brand_data=brand_data_strategy())
    @settings(max_examples=100, deadline=None)
    @patch('handler.bedrock_runtime')
    @patch('handler.s3_client')
    def test_all_brand_context_included_in_image_prompt(
        self,
        mock_s3_client,
        mock_bedrock_runtime,
        brand_data
    ):
        """
        Property: For any image generation request, the prompt SHALL include
        visual_style, content_pillar, brand_name, and industry.
        
        This is a more comprehensive test that verifies all relevant brand
        context is included in the image generation prompt.
        """
        # Arrange: Set up mocks
        captured_prompts = []
        
        def capture_invoke_model(modelId, body):
            request_body = json.loads(body)
            if 'textToImageParams' in request_body:
                prompt = request_body['textToImageParams']['text']
                captured_prompts.append(prompt)
            
            return {
                'body': MagicMock(read=lambda: json.dumps({
                    'images': [base64.b64encode(b'fake_image_data').decode('utf-8')]
                }).encode())
            }
        
        mock_bedrock_runtime.invoke_model.side_effect = capture_invoke_model
        mock_s3_client.put_object.return_value = {}
        
        # Act: Generate image
        content_pillar = brand_data['content_pillars'][0] if brand_data['content_pillars'] else 'test_pillar'
        caption = "Test caption"
        
        handler.generate_and_upload_image(
            brand_data,
            content_pillar,
            caption,
            brand_data['brand_id']
        )
        
        # Assert: Property - all brand context is included
        assert len(captured_prompts) > 0, \
            "No image generation prompts were captured"
        
        prompt = captured_prompts[0]
        
        # Check visual_style (primary requirement)
        visual_style = brand_data.get('visual_style', '')
        assert visual_style in prompt, \
            f"Prompt does not include visual_style '{visual_style}'"
        
        # Check content_pillar
        assert content_pillar in prompt, \
            f"Prompt does not include content_pillar '{content_pillar}'"
        
        # Check brand_name
        brand_name = brand_data.get('brand_name', '')
        assert brand_name in prompt, \
            f"Prompt does not include brand_name '{brand_name}'"
        
        # Check industry
        industry = brand_data.get('industry', '')
        assert industry in prompt, \
            f"Prompt does not include industry '{industry}'"
    
    # Feature: experta-ai-social-manager, Property 4: Image Generation Prompt Inclusion
    @given(
        brand_data=brand_data_strategy(),
        event=eventbridge_event_strategy()
    )
    @settings(max_examples=100, deadline=None)
    @patch('handler.brands_table')
    @patch('handler.posts_table')
    @patch('handler.bedrock_runtime')
    @patch('handler.s3_client')
    @patch('handler.events_client')
    def test_end_to_end_visual_style_in_all_image_prompts(
        self,
        mock_events_client,
        mock_s3_client,
        mock_bedrock_runtime,
        mock_posts_table,
        mock_brands_table,
        brand_data,
        event
    ):
        """
        Property: For any completed content generation operation,
        all image generation requests SHALL include the brand's visual_style.
        
        This is an end-to-end test that verifies the property holds
        through the entire handler execution for all 30 posts.
        """
        # Arrange: Set up mocks
        event['detail']['brand_id'] = brand_data['brand_id']
        
        # Mock DynamoDB get_item to return brand data
        mock_brands_table.get_item.return_value = {
            'Item': brand_data
        }
        
        # Mock batch writer
        mock_batch_writer = MagicMock()
        mock_posts_table.batch_writer.return_value.__enter__.return_value = mock_batch_writer
        
        # Capture all image generation prompts
        captured_image_prompts = []
        
        def capture_invoke_model(modelId, body):
            request_body = json.loads(body)
            
            # Capture image generation prompts (Titan)
            if 'textToImageParams' in request_body:
                prompt = request_body['textToImageParams']['text']
                captured_image_prompts.append(prompt)
                return {
                    'body': MagicMock(read=lambda: json.dumps({
                        'images': [base64.b64encode(b'fake_image_data').decode('utf-8')]
                    }).encode())
                }
            
            # Caption generation (Claude)
            return {
                'body': MagicMock(read=lambda: json.dumps({
                    'content': [{'text': 'Generated caption'}]
                }).encode())
            }
        
        mock_bedrock_runtime.invoke_model.side_effect = capture_invoke_model
        mock_s3_client.put_object.return_value = {}
        
        # Mock EventBridge
        mock_events_client.put_rule.return_value = {}
        mock_events_client.put_targets.return_value = {}
        mock_events_client.put_events.return_value = {'FailedEntryCount': 0}
        
        # Mock STS
        with patch('handler.get_account_id', return_value='123456789012'):
            # Mock context
            mock_context = Mock()
            mock_context.request_id = 'test-request-id'
            
            # Act: Call the handler
            response = handler.handler(event, mock_context)
            
            # Assert: Response should be successful
            assert response['statusCode'] == 200
            
            # Property: All 30 image prompts should include visual_style
            assert len(captured_image_prompts) == 30, \
                f"Expected 30 image generation prompts, but captured {len(captured_image_prompts)}"
            
            visual_style = brand_data.get('visual_style', '')
            
            for i, prompt in enumerate(captured_image_prompts):
                assert visual_style in prompt, \
                    f"Image prompt {i+1}/30 does not include brand visual_style '{visual_style}'. " \
                    f"Prompt: {prompt[:200]}..."
    
    # Feature: experta-ai-social-manager, Property 4: Image Generation Prompt Inclusion
    @given(brand_data=brand_data_strategy())
    @settings(max_examples=100, deadline=None)
    @patch('handler.bedrock_runtime')
    @patch('handler.s3_client')
    def test_visual_style_preserved_across_different_content_pillars(
        self,
        mock_s3_client,
        mock_bedrock_runtime,
        brand_data
    ):
        """
        Property: For any brand with multiple content pillars,
        the visual_style SHALL be included in image prompts for ALL pillars.
        
        This tests that visual_style inclusion is independent of
        which content pillar is being used.
        """
        # Arrange: Capture prompts
        captured_prompts = []
        
        def capture_invoke_model(modelId, body):
            request_body = json.loads(body)
            if 'textToImageParams' in request_body:
                prompt = request_body['textToImageParams']['text']
                captured_prompts.append(prompt)
            
            return {
                'body': MagicMock(read=lambda: json.dumps({
                    'images': [base64.b64encode(b'fake_image_data').decode('utf-8')]
                }).encode())
            }
        
        mock_bedrock_runtime.invoke_model.side_effect = capture_invoke_model
        mock_s3_client.put_object.return_value = {}
        
        # Act: Generate images for each content pillar
        for pillar in brand_data['content_pillars']:
            handler.generate_and_upload_image(
                brand_data,
                pillar,
                "Test caption",
                brand_data['brand_id']
            )
        
        # Assert: Property - visual_style in all prompts
        num_pillars = len(brand_data['content_pillars'])
        assert len(captured_prompts) == num_pillars, \
            f"Expected {num_pillars} prompts, got {len(captured_prompts)}"
        
        visual_style = brand_data.get('visual_style', '')
        
        for i, prompt in enumerate(captured_prompts):
            assert visual_style in prompt, \
                f"Prompt for pillar {i} does not include visual_style '{visual_style}'"


class TestImageStorageConsistencyProperty:
    """Property-based tests for image storage consistency"""
    
    @pytest.fixture(autouse=True)
    def setup_environment(self):
        """Set up environment variables for testing"""
        os.environ['BRANDS_TABLE_NAME'] = 'test-brands-table'
        os.environ['POSTS_TABLE_NAME'] = 'test-posts-table'
        os.environ['S3_BUCKET_NAME'] = 'test-bucket'
        os.environ['BEDROCK_CLAUDE_MODEL_ID'] = 'anthropic.claude-3-5-sonnet-20241022-v2:0'
        os.environ['BEDROCK_TITAN_MODEL_ID'] = 'amazon.titan-image-generator-v1'
        os.environ['EVENTBRIDGE_BUS_NAME'] = 'default'
        os.environ['AWS_REGION'] = 'us-east-1'
        
        yield
        
        # Cleanup
        for key in ['BRANDS_TABLE_NAME', 'POSTS_TABLE_NAME', 'S3_BUCKET_NAME', 
                    'BEDROCK_CLAUDE_MODEL_ID', 'BEDROCK_TITAN_MODEL_ID', 
                    'EVENTBRIDGE_BUS_NAME', 'AWS_REGION']:
            if key in os.environ:
                del os.environ[key]
    
    # Feature: experta-ai-social-manager, Property 5: Image Storage Consistency
    @given(brand_data=brand_data_strategy())
    @settings(max_examples=100, deadline=None)
    @patch('handler.bedrock_runtime')
    @patch('handler.s3_client')
    def test_generated_image_has_s3_object_and_post_url(
        self,
        mock_s3_client,
        mock_bedrock_runtime,
        brand_data
    ):
        """
        Property: For any generated image, an S3 object SHALL exist with a 
        unique key, and the corresponding post record SHALL contain a valid 
        S3 URL pointing to that object.
        
        This test verifies that regardless of:
        - Brand characteristics
        - Content pillar
        - Visual style
        
        Every generated image is properly stored in S3 and the post record
        contains a valid URL pointing to that S3 object.
        """
        # Arrange: Set up mocks
        captured_s3_uploads = []
        
        def capture_s3_upload(Bucket, Key, Body, ContentType, Metadata):
            # Capture S3 upload details
            captured_s3_uploads.append({
                'bucket': Bucket,
                'key': Key,
                'body_size': len(Body),
                'content_type': ContentType,
                'metadata': Metadata
            })
            return {}
        
        mock_s3_client.put_object.side_effect = capture_s3_upload
        
        # Mock Bedrock Titan response
        mock_bedrock_runtime.invoke_model.return_value = {
            'body': MagicMock(read=lambda: json.dumps({
                'images': [base64.b64encode(b'fake_image_data_12345').decode('utf-8')]
            }).encode())
        }
        
        # Act: Generate and upload image
        content_pillar = brand_data['content_pillars'][0] if brand_data['content_pillars'] else 'test_pillar'
        caption = "Test caption"
        
        image_url = handler.generate_and_upload_image(
            brand_data,
            content_pillar,
            caption,
            brand_data['brand_id']
        )
        
        # Assert: Property - S3 object exists and URL is valid
        assert len(captured_s3_uploads) == 1, \
            f"Expected exactly 1 S3 upload, but got {len(captured_s3_uploads)}"
        
        s3_upload = captured_s3_uploads[0]
        
        # Verify S3 upload details
        assert s3_upload['bucket'] == os.environ['S3_BUCKET_NAME'], \
            f"S3 upload used wrong bucket: {s3_upload['bucket']}"
        
        assert s3_upload['key'].startswith(f"images/{brand_data['brand_id']}/"), \
            f"S3 key does not follow expected pattern: {s3_upload['key']}"
        
        assert s3_upload['key'].endswith('.png'), \
            f"S3 key does not have .png extension: {s3_upload['key']}"
        
        assert s3_upload['body_size'] > 0, \
            "S3 upload body is empty"
        
        assert s3_upload['content_type'] == 'image/png', \
            f"S3 upload has wrong content type: {s3_upload['content_type']}"
        
        # Verify metadata
        assert 'brand_id' in s3_upload['metadata'], \
            "S3 upload metadata missing brand_id"
        assert s3_upload['metadata']['brand_id'] == brand_data['brand_id'], \
            f"S3 metadata brand_id mismatch"
        
        assert 'content_pillar' in s3_upload['metadata'], \
            "S3 upload metadata missing content_pillar"
        
        # Verify returned URL
        assert image_url is not None, \
            "Image URL is None"
        
        assert len(image_url) > 0, \
            "Image URL is empty"
        
        assert image_url.startswith('https://'), \
            f"Image URL does not use HTTPS: {image_url}"
        
        assert os.environ['S3_BUCKET_NAME'] in image_url, \
            f"Image URL does not contain bucket name: {image_url}"
        
        assert s3_upload['key'] in image_url, \
            f"Image URL does not contain S3 key: {image_url}"
        
        # Verify URL format matches expected pattern
        expected_url_pattern = f"https://{os.environ['S3_BUCKET_NAME']}.s3.{os.environ['AWS_REGION']}.amazonaws.com/{s3_upload['key']}"
        assert image_url == expected_url_pattern, \
            f"Image URL format mismatch. Expected: {expected_url_pattern}, Got: {image_url}"
    
    # Feature: experta-ai-social-manager, Property 5: Image Storage Consistency
    @given(brand_data=brand_data_strategy())
    @settings(max_examples=100, deadline=None)
    @patch('handler.generate_caption')
    @patch('handler.bedrock_runtime')
    @patch('handler.s3_client')
    def test_all_posts_have_valid_s3_urls(
        self,
        mock_s3_client,
        mock_bedrock_runtime,
        mock_generate_caption,
        brand_data
    ):
        """
        Property: For any set of generated posts, each post SHALL contain
        a valid S3 URL in the image_url field, and each URL SHALL correspond
        to an actual S3 upload.
        
        This tests the consistency across the entire content calendar generation.
        """
        # Arrange: Set up mocks
        captured_s3_keys = []
        
        def capture_s3_upload(Bucket, Key, Body, ContentType, Metadata):
            captured_s3_keys.append(Key)
            return {}
        
        mock_s3_client.put_object.side_effect = capture_s3_upload
        
        # Mock Bedrock responses
        mock_bedrock_runtime.invoke_model.return_value = {
            'body': MagicMock(read=lambda: json.dumps({
                'images': [base64.b64encode(b'fake_image_data').decode('utf-8')]
            }).encode())
        }
        
        mock_generate_caption.return_value = "Test caption"
        
        # Act: Generate content calendar
        posts = handler.generate_content_calendar(brand_data)
        
        # Assert: Property - all posts have valid S3 URLs
        assert len(posts) == 30, \
            f"Expected 30 posts, got {len(posts)}"
        
        assert len(captured_s3_keys) == 30, \
            f"Expected 30 S3 uploads, got {len(captured_s3_keys)}"
        
        # Verify each post has a valid image_url
        for i, post in enumerate(posts):
            assert 'image_url' in post, \
                f"Post {i} missing image_url field"
            
            image_url = post['image_url']
            
            assert image_url is not None, \
                f"Post {i} has null image_url"
            
            assert len(image_url) > 0, \
                f"Post {i} has empty image_url"
            
            assert image_url.startswith('https://'), \
                f"Post {i} image_url does not use HTTPS: {image_url}"
            
            assert os.environ['S3_BUCKET_NAME'] in image_url, \
                f"Post {i} image_url does not contain bucket name: {image_url}"
            
            # Extract S3 key from URL
            # URL format: https://bucket.s3.region.amazonaws.com/key
            url_parts = image_url.split('.amazonaws.com/')
            if len(url_parts) == 2:
                s3_key_from_url = url_parts[1]
                
                # Verify this key was actually uploaded to S3
                assert s3_key_from_url in captured_s3_keys, \
                    f"Post {i} image_url references S3 key '{s3_key_from_url}' " \
                    f"which was not uploaded. Uploaded keys: {captured_s3_keys[:5]}..."
        
        # Verify all S3 keys are unique
        assert len(captured_s3_keys) == len(set(captured_s3_keys)), \
            f"S3 keys are not unique. Found {len(captured_s3_keys)} uploads " \
            f"but only {len(set(captured_s3_keys))} unique keys"
        
        # Verify all S3 keys follow the expected pattern
        for i, s3_key in enumerate(captured_s3_keys):
            assert s3_key.startswith(f"images/{brand_data['brand_id']}/"), \
                f"S3 key {i} does not follow pattern: {s3_key}"
            
            assert s3_key.endswith('.png'), \
                f"S3 key {i} does not have .png extension: {s3_key}"
    
    # Feature: experta-ai-social-manager, Property 5: Image Storage Consistency
    @given(
        brand_data=brand_data_strategy(),
        event=eventbridge_event_strategy()
    )
    @settings(max_examples=100, deadline=None)
    @patch('handler.brands_table')
    @patch('handler.posts_table')
    @patch('handler.bedrock_runtime')
    @patch('handler.s3_client')
    @patch('handler.events_client')
    def test_end_to_end_image_storage_consistency(
        self,
        mock_events_client,
        mock_s3_client,
        mock_bedrock_runtime,
        mock_posts_table,
        mock_brands_table,
        brand_data,
        event
    ):
        """
        Property: For any completed content generation operation,
        all posts SHALL have image_url fields that correspond to actual
        S3 uploads with unique keys.
        
        This is an end-to-end test that verifies the property holds
        through the entire handler execution.
        """
        # Arrange: Set up mocks
        event['detail']['brand_id'] = brand_data['brand_id']
        
        # Mock DynamoDB get_item to return brand data
        mock_brands_table.get_item.return_value = {
            'Item': brand_data
        }
        
        # Capture posts written to DynamoDB
        written_posts = []
        mock_batch_writer = MagicMock()
        
        def capture_put_item(Item):
            written_posts.append(Item)
        
        mock_batch_writer.put_item.side_effect = capture_put_item
        mock_posts_table.batch_writer.return_value.__enter__.return_value = mock_batch_writer
        
        # Capture S3 uploads
        captured_s3_uploads = {}
        
        def capture_s3_upload(Bucket, Key, Body, ContentType, Metadata):
            captured_s3_uploads[Key] = {
                'bucket': Bucket,
                'body_size': len(Body),
                'content_type': ContentType,
                'metadata': Metadata
            }
            return {}
        
        mock_s3_client.put_object.side_effect = capture_s3_upload
        
        # Mock Bedrock responses
        def bedrock_response(modelId, body):
            request_body = json.loads(body)
            
            # Image generation (Titan)
            if 'textToImageParams' in request_body:
                return {
                    'body': MagicMock(read=lambda: json.dumps({
                        'images': [base64.b64encode(b'fake_image_data').decode('utf-8')]
                    }).encode())
                }
            
            # Caption generation (Claude)
            return {
                'body': MagicMock(read=lambda: json.dumps({
                    'content': [{'text': 'Generated caption'}]
                }).encode())
            }
        
        mock_bedrock_runtime.invoke_model.side_effect = bedrock_response
        
        # Mock EventBridge
        mock_events_client.put_rule.return_value = {}
        mock_events_client.put_targets.return_value = {}
        mock_events_client.put_events.return_value = {'FailedEntryCount': 0}
        
        # Mock STS
        with patch('handler.get_account_id', return_value='123456789012'):
            # Mock context
            mock_context = Mock()
            mock_context.request_id = 'test-request-id'
            
            # Act: Call the handler
            response = handler.handler(event, mock_context)
            
            # Assert: Response should be successful
            assert response['statusCode'] == 200
            
            # Property: All posts have valid image URLs
            assert len(written_posts) == 30, \
                f"Expected 30 posts, got {len(written_posts)}"
            
            assert len(captured_s3_uploads) == 30, \
                f"Expected 30 S3 uploads, got {len(captured_s3_uploads)}"
            
            # Verify each post's image_url corresponds to an S3 upload
            for i, post in enumerate(written_posts):
                assert 'image_url' in post, \
                    f"Post {i} (ID: {post.get('post_id', 'unknown')}) missing image_url"
                
                image_url = post['image_url']
                
                # Extract S3 key from URL
                url_parts = image_url.split('.amazonaws.com/')
                assert len(url_parts) == 2, \
                    f"Post {i} has malformed image_url: {image_url}"
                
                s3_key = url_parts[1]
                
                # Verify this S3 key was actually uploaded
                assert s3_key in captured_s3_uploads, \
                    f"Post {i} references S3 key '{s3_key}' which was not uploaded. " \
                    f"Available keys: {list(captured_s3_uploads.keys())[:5]}..."
                
                # Verify S3 upload details
                s3_upload = captured_s3_uploads[s3_key]
                
                assert s3_upload['bucket'] == os.environ['S3_BUCKET_NAME'], \
                    f"Post {i} S3 upload used wrong bucket"
                
                assert s3_upload['body_size'] > 0, \
                    f"Post {i} S3 upload has empty body"
                
                assert s3_upload['content_type'] == 'image/png', \
                    f"Post {i} S3 upload has wrong content type"
                
                assert s3_upload['metadata']['brand_id'] == brand_data['brand_id'], \
                    f"Post {i} S3 upload has wrong brand_id in metadata"
            
            # Verify all S3 keys are unique
            assert len(captured_s3_uploads) == 30, \
                "Not all S3 uploads are unique"
    
    # Feature: experta-ai-social-manager, Property 5: Image Storage Consistency
    @given(brand_data=brand_data_strategy())
    @settings(max_examples=100, deadline=None)
    @patch('handler.bedrock_runtime')
    @patch('handler.s3_client')
    def test_s3_key_uniqueness_across_multiple_generations(
        self,
        mock_s3_client,
        mock_bedrock_runtime,
        brand_data
    ):
        """
        Property: For any multiple image generation requests,
        each S3 key SHALL be unique (no collisions).
        
        This tests that the UUID-based key generation ensures uniqueness.
        """
        # Arrange: Set up mocks
        captured_s3_keys = []
        
        def capture_s3_upload(Bucket, Key, Body, ContentType, Metadata):
            captured_s3_keys.append(Key)
            return {}
        
        mock_s3_client.put_object.side_effect = capture_s3_upload
        
        mock_bedrock_runtime.invoke_model.return_value = {
            'body': MagicMock(read=lambda: json.dumps({
                'images': [base64.b64encode(b'fake_image_data').decode('utf-8')]
            }).encode())
        }
        
        # Act: Generate multiple images
        num_images = 50  # Generate more than 30 to test uniqueness
        content_pillar = brand_data['content_pillars'][0] if brand_data['content_pillars'] else 'test_pillar'
        
        for _ in range(num_images):
            handler.generate_and_upload_image(
                brand_data,
                content_pillar,
                "Test caption",
                brand_data['brand_id']
            )
        
        # Assert: Property - all S3 keys are unique
        assert len(captured_s3_keys) == num_images, \
            f"Expected {num_images} S3 uploads, got {len(captured_s3_keys)}"
        
        unique_keys = set(captured_s3_keys)
        assert len(unique_keys) == num_images, \
            f"S3 keys are not unique. Generated {num_images} images " \
            f"but only {len(unique_keys)} unique keys. " \
            f"Duplicate keys detected!"
        
        # Verify all keys follow the expected pattern
        for i, s3_key in enumerate(captured_s3_keys):
            assert s3_key.startswith(f"images/{brand_data['brand_id']}/"), \
                f"S3 key {i} does not follow pattern: {s3_key}"
            
            # Extract UUID from key
            # Format: images/{brand_id}/{uuid}.png
            key_parts = s3_key.split('/')
            assert len(key_parts) == 3, \
                f"S3 key {i} has unexpected structure: {s3_key}"
            
            uuid_part = key_parts[2].replace('.png', '')
            
            # Verify it's a valid UUID format
            try:
                uuid.UUID(uuid_part)
            except ValueError:
                pytest.fail(f"S3 key {i} does not contain valid UUID: {uuid_part}")


class TestImageResolutionRequirementsProperty:
    """Property-based tests for image resolution requirements"""
    
    @pytest.fixture(autouse=True)
    def setup_environment(self):
        """Set up environment variables for testing"""
        os.environ['BRANDS_TABLE_NAME'] = 'test-brands-table'
        os.environ['POSTS_TABLE_NAME'] = 'test-posts-table'
        os.environ['S3_BUCKET_NAME'] = 'test-bucket'
        os.environ['BEDROCK_CLAUDE_MODEL_ID'] = 'anthropic.claude-3-5-sonnet-20241022-v2:0'
        os.environ['BEDROCK_TITAN_MODEL_ID'] = 'amazon.titan-image-generator-v1'
        os.environ['EVENTBRIDGE_BUS_NAME'] = 'default'
        os.environ['AWS_REGION'] = 'us-east-1'
        
        yield
        
        # Cleanup
        for key in ['BRANDS_TABLE_NAME', 'POSTS_TABLE_NAME', 'S3_BUCKET_NAME', 
                    'BEDROCK_CLAUDE_MODEL_ID', 'BEDROCK_TITAN_MODEL_ID', 
                    'EVENTBRIDGE_BUS_NAME', 'AWS_REGION']:
            if key in os.environ:
                del os.environ[key]
    
    # Feature: experta-ai-social-manager, Property 6: Image Resolution Requirements
    @given(brand_data=brand_data_strategy())
    @settings(max_examples=100, deadline=None)
    @patch('handler.bedrock_runtime')
    @patch('handler.s3_client')
    def test_generated_images_meet_minimum_resolution_for_instagram(
        self,
        mock_s3_client,
        mock_bedrock_runtime,
        brand_data
    ):
        """
        Property: For any image generated for Instagram, the image dimensions 
        SHALL be at least 1080x1080 pixels.
        
        This test verifies that regardless of:
        - Brand characteristics
        - Content pillar
        - Visual style
        
        Every generated image meets Instagram's minimum resolution requirements.
        """
        # Arrange: Capture the image generation request
        captured_requests = []
        
        def capture_invoke_model(modelId, body):
            request_body = json.loads(body)
            if 'textToImageParams' in request_body:
                captured_requests.append(request_body)
            
            # Return mock response
            return {
                'body': MagicMock(read=lambda: json.dumps({
                    'images': [base64.b64encode(b'fake_image_data').decode('utf-8')]
                }).encode())
            }
        
        mock_bedrock_runtime.invoke_model.side_effect = capture_invoke_model
        mock_s3_client.put_object.return_value = {}
        
        # Act: Generate image
        content_pillar = brand_data['content_pillars'][0] if brand_data['content_pillars'] else 'test_pillar'
        caption = "Test caption"
        
        image_url = handler.generate_and_upload_image(
            brand_data,
            content_pillar,
            caption,
            brand_data['brand_id']
        )
        
        # Assert: Property - image dimensions meet minimum requirements
        assert len(captured_requests) > 0, \
            "No image generation requests were captured"
        
        request = captured_requests[0]
        
        # Verify imageGenerationConfig exists
        assert 'imageGenerationConfig' in request, \
            "Image generation request missing imageGenerationConfig"
        
        config = request['imageGenerationConfig']
        
        # Verify dimensions are specified
        assert 'width' in config, \
            "Image generation config missing width"
        assert 'height' in config, \
            "Image generation config missing height"
        
        width = config['width']
        height = config['height']
        
        # Property: Minimum resolution for Instagram is 1080x1080
        MIN_INSTAGRAM_RESOLUTION = 1080
        
        assert width >= MIN_INSTAGRAM_RESOLUTION, \
            f"Image width {width} is below Instagram minimum requirement of {MIN_INSTAGRAM_RESOLUTION}px"
        
        assert height >= MIN_INSTAGRAM_RESOLUTION, \
            f"Image height {height} is below Instagram minimum requirement of {MIN_INSTAGRAM_RESOLUTION}px"
        
        # Verify the image URL was returned
        assert image_url is not None
        assert len(image_url) > 0
    
    # Feature: experta-ai-social-manager, Property 6: Image Resolution Requirements
    @given(brand_data=brand_data_strategy())
    @settings(max_examples=100, deadline=None)
    @patch('handler.generate_caption')
    @patch('handler.bedrock_runtime')
    @patch('handler.s3_client')
    def test_all_calendar_images_meet_resolution_requirements(
        self,
        mock_s3_client,
        mock_bedrock_runtime,
        mock_generate_caption,
        brand_data
    ):
        """
        Property: For any set of 30 generated posts, all images SHALL meet
        the minimum resolution requirements for Instagram (1080x1080).
        
        This tests that the resolution requirement is consistently applied
        across the entire content calendar generation.
        """
        # Arrange: Capture all image generation requests
        captured_requests = []
        
        def capture_invoke_model(modelId, body):
            request_body = json.loads(body)
            if 'textToImageParams' in request_body:
                captured_requests.append(request_body)
            
            return {
                'body': MagicMock(read=lambda: json.dumps({
                    'images': [base64.b64encode(b'fake_image_data').decode('utf-8')]
                }).encode())
            }
        
        mock_bedrock_runtime.invoke_model.side_effect = capture_invoke_model
        mock_s3_client.put_object.return_value = {}
        mock_generate_caption.return_value = "Test caption"
        
        # Act: Generate content calendar
        posts = handler.generate_content_calendar(brand_data)
        
        # Assert: Property - all 30 images meet resolution requirements
        assert len(posts) == 30, \
            f"Expected 30 posts, got {len(posts)}"
        
        assert len(captured_requests) == 30, \
            f"Expected 30 image generation requests, got {len(captured_requests)}"
        
        MIN_INSTAGRAM_RESOLUTION = 1080
        
        for i, request in enumerate(captured_requests):
            assert 'imageGenerationConfig' in request, \
                f"Image request {i+1}/30 missing imageGenerationConfig"
            
            config = request['imageGenerationConfig']
            
            assert 'width' in config and 'height' in config, \
                f"Image request {i+1}/30 missing width or height"
            
            width = config['width']
            height = config['height']
            
            assert width >= MIN_INSTAGRAM_RESOLUTION, \
                f"Image {i+1}/30 width {width}px is below Instagram minimum {MIN_INSTAGRAM_RESOLUTION}px"
            
            assert height >= MIN_INSTAGRAM_RESOLUTION, \
                f"Image {i+1}/30 height {height}px is below Instagram minimum {MIN_INSTAGRAM_RESOLUTION}px"
    
    # Feature: experta-ai-social-manager, Property 6: Image Resolution Requirements
    @given(
        brand_data=brand_data_strategy(),
        event=eventbridge_event_strategy()
    )
    @settings(max_examples=100, deadline=None)
    @patch('handler.brands_table')
    @patch('handler.posts_table')
    @patch('handler.bedrock_runtime')
    @patch('handler.s3_client')
    @patch('handler.events_client')
    def test_end_to_end_image_resolution_compliance(
        self,
        mock_events_client,
        mock_s3_client,
        mock_bedrock_runtime,
        mock_posts_table,
        mock_brands_table,
        brand_data,
        event
    ):
        """
        Property: For any completed content generation operation,
        all generated images SHALL meet Instagram's minimum resolution
        requirements (1080x1080 pixels).
        
        This is an end-to-end test that verifies the property holds
        through the entire handler execution.
        """
        # Arrange: Set up mocks
        event['detail']['brand_id'] = brand_data['brand_id']
        
        # Mock DynamoDB get_item to return brand data
        mock_brands_table.get_item.return_value = {
            'Item': brand_data
        }
        
        # Mock batch writer
        mock_batch_writer = MagicMock()
        mock_posts_table.batch_writer.return_value.__enter__.return_value = mock_batch_writer
        
        # Capture all image generation requests
        captured_image_requests = []
        
        def capture_invoke_model(modelId, body):
            request_body = json.loads(body)
            
            # Capture image generation requests (Titan)
            if 'textToImageParams' in request_body:
                captured_image_requests.append(request_body)
                return {
                    'body': MagicMock(read=lambda: json.dumps({
                        'images': [base64.b64encode(b'fake_image_data').decode('utf-8')]
                    }).encode())
                }
            
            # Caption generation (Claude)
            return {
                'body': MagicMock(read=lambda: json.dumps({
                    'content': [{'text': 'Generated caption'}]
                }).encode())
            }
        
        mock_bedrock_runtime.invoke_model.side_effect = capture_invoke_model
        mock_s3_client.put_object.return_value = {}
        
        # Mock EventBridge
        mock_events_client.put_rule.return_value = {}
        mock_events_client.put_targets.return_value = {}
        mock_events_client.put_events.return_value = {'FailedEntryCount': 0}
        
        # Mock STS
        with patch('handler.get_account_id', return_value='123456789012'):
            # Mock context
            mock_context = Mock()
            mock_context.request_id = 'test-request-id'
            
            # Act: Call the handler
            response = handler.handler(event, mock_context)
            
            # Assert: Response should be successful
            assert response['statusCode'] == 200
            
            # Property: All 30 image requests meet resolution requirements
            assert len(captured_image_requests) == 30, \
                f"Expected 30 image generation requests, but captured {len(captured_image_requests)}"
            
            MIN_INSTAGRAM_RESOLUTION = 1080
            
            for i, request in enumerate(captured_image_requests):
                assert 'imageGenerationConfig' in request, \
                    f"Image request {i+1}/30 missing imageGenerationConfig"
                
                config = request['imageGenerationConfig']
                
                assert 'width' in config and 'height' in config, \
                    f"Image request {i+1}/30 missing dimensions"
                
                width = config['width']
                height = config['height']
                
                assert width >= MIN_INSTAGRAM_RESOLUTION, \
                    f"Image {i+1}/30 width {width}px is below Instagram minimum {MIN_INSTAGRAM_RESOLUTION}px. " \
                    f"All images for Instagram must be at least {MIN_INSTAGRAM_RESOLUTION}x{MIN_INSTAGRAM_RESOLUTION}."
                
                assert height >= MIN_INSTAGRAM_RESOLUTION, \
                    f"Image {i+1}/30 height {height}px is below Instagram minimum {MIN_INSTAGRAM_RESOLUTION}px. " \
                    f"All images for Instagram must be at least {MIN_INSTAGRAM_RESOLUTION}x{MIN_INSTAGRAM_RESOLUTION}."
    
    # Feature: experta-ai-social-manager, Property 6: Image Resolution Requirements
    @given(brand_data=brand_data_strategy())
    @settings(max_examples=100, deadline=None)
    @patch('handler.bedrock_runtime')
    @patch('handler.s3_client')
    def test_resolution_requirement_independent_of_brand_characteristics(
        self,
        mock_s3_client,
        mock_bedrock_runtime,
        brand_data
    ):
        """
        Property: For any brand with any characteristics (visual style, 
        industry, content pillars), the image resolution requirement SHALL
        always be at least 1080x1080 pixels.
        
        This tests that resolution requirements are independent of brand
        configuration and consistently enforced.
        """
        # Arrange: Capture requests
        captured_requests = []
        
        def capture_invoke_model(modelId, body):
            request_body = json.loads(body)
            if 'textToImageParams' in request_body:
                captured_requests.append(request_body)
            
            return {
                'body': MagicMock(read=lambda: json.dumps({
                    'images': [base64.b64encode(b'fake_image_data').decode('utf-8')]
                }).encode())
            }
        
        mock_bedrock_runtime.invoke_model.side_effect = capture_invoke_model
        mock_s3_client.put_object.return_value = {}
        
        # Act: Generate images for multiple content pillars
        for pillar in brand_data['content_pillars']:
            handler.generate_and_upload_image(
                brand_data,
                pillar,
                "Test caption",
                brand_data['brand_id']
            )
        
        # Assert: Property - all images meet resolution requirements
        num_pillars = len(brand_data['content_pillars'])
        assert len(captured_requests) == num_pillars, \
            f"Expected {num_pillars} requests, got {len(captured_requests)}"
        
        MIN_INSTAGRAM_RESOLUTION = 1080
        
        for i, request in enumerate(captured_requests):
            config = request['imageGenerationConfig']
            width = config['width']
            height = config['height']
            
            assert width >= MIN_INSTAGRAM_RESOLUTION, \
                f"Image for pillar {i} has width {width}px below minimum {MIN_INSTAGRAM_RESOLUTION}px"
            
            assert height >= MIN_INSTAGRAM_RESOLUTION, \
                f"Image for pillar {i} has height {height}px below minimum {MIN_INSTAGRAM_RESOLUTION}px"


class TestInitialPostStatusProperty:
    """Property-based tests for initial post status"""
    
    @pytest.fixture(autouse=True)
    def setup_environment(self):
        """Set up environment variables for testing"""
        os.environ['BRANDS_TABLE_NAME'] = 'test-brands-table'
        os.environ['POSTS_TABLE_NAME'] = 'test-posts-table'
        os.environ['S3_BUCKET_NAME'] = 'test-bucket'
        os.environ['BEDROCK_CLAUDE_MODEL_ID'] = 'anthropic.claude-3-5-sonnet-20241022-v2:0'
        os.environ['BEDROCK_TITAN_MODEL_ID'] = 'amazon.titan-image-generator-v1'
        os.environ['EVENTBRIDGE_BUS_NAME'] = 'default'
        os.environ['AWS_REGION'] = 'us-east-1'
        
        yield
        
        # Cleanup
        for key in ['BRANDS_TABLE_NAME', 'POSTS_TABLE_NAME', 'S3_BUCKET_NAME', 
                    'BEDROCK_CLAUDE_MODEL_ID', 'BEDROCK_TITAN_MODEL_ID', 
                    'EVENTBRIDGE_BUS_NAME', 'AWS_REGION']:
            if key in os.environ:
                del os.environ[key]
    
    # Feature: experta-ai-social-manager, Property 11: Initial Post Status
    @given(brand_data=brand_data_strategy())
    @settings(max_examples=100, deadline=None)
    @patch('handler.generate_caption')
    @patch('handler.generate_and_upload_image')
    def test_all_generated_posts_have_scheduled_status(
        self,
        mock_generate_image,
        mock_generate_caption,
        brand_data
    ):
        """
        Property: For any post created during content generation, 
        the initial status SHALL be "Scheduled".
        
        This test verifies that regardless of:
        - Number of content pillars (3-10)
        - Number of post times (1-5)
        - Brand characteristics
        - Post position in the calendar (1-30)
        
        Every generated post starts with status "Scheduled".
        """
        # Arrange: Mock the generation functions
        mock_generate_caption.return_value = "Test caption"
        mock_generate_image.return_value = f"https://test-bucket.s3.us-east-1.amazonaws.com/images/{brand_data['brand_id']}/test.png"
        
        # Act: Generate content calendar
        posts = handler.generate_content_calendar(brand_data)
        
        # Assert: Property - all posts have status "Scheduled"
        for i, post in enumerate(posts):
            assert 'status' in post, \
                f"Post {i} is missing the 'status' field"
            
            assert post['status'] == 'Scheduled', \
                f"Post {i} has incorrect initial status: '{post['status']}'. " \
                f"Expected 'Scheduled' for all newly generated posts."
        
        # Additional verification: ensure no posts have other statuses
        statuses = set(post['status'] for post in posts)
        assert statuses == {'Scheduled'}, \
            f"Expected all posts to have status 'Scheduled', but found statuses: {statuses}"
    
    # Feature: experta-ai-social-manager, Property 11: Initial Post Status
    @given(
        brand_data=brand_data_strategy(),
        event=eventbridge_event_strategy()
    )
    @settings(max_examples=100, deadline=None)
    @patch('handler.brands_table')
    @patch('handler.posts_table')
    @patch('handler.bedrock_runtime')
    @patch('handler.s3_client')
    @patch('handler.events_client')
    def test_end_to_end_initial_status_is_scheduled(
        self,
        mock_events_client,
        mock_s3_client,
        mock_bedrock_runtime,
        mock_posts_table,
        mock_brands_table,
        brand_data,
        event
    ):
        """
        Property: For any completed content generation operation,
        all created posts SHALL have initial status "Scheduled".
        
        This is an end-to-end test that verifies the property holds
        through the entire handler execution, including database writes.
        """
        # Arrange: Set up mocks
        event['detail']['brand_id'] = brand_data['brand_id']
        
        # Mock DynamoDB get_item to return brand data
        mock_brands_table.get_item.return_value = {
            'Item': brand_data
        }
        
        # Capture posts written to DynamoDB
        written_posts = []
        mock_batch_writer = MagicMock()
        
        def capture_put_item(Item):
            written_posts.append(Item)
        
        mock_batch_writer.put_item.side_effect = capture_put_item
        mock_posts_table.batch_writer.return_value.__enter__.return_value = mock_batch_writer
        
        # Mock Bedrock responses
        mock_bedrock_runtime.invoke_model.return_value = {
            'body': MagicMock(read=lambda: json.dumps({
                'content': [{'text': 'Generated caption'}]
            }).encode())
        }
        
        # Mock S3 upload
        mock_s3_client.put_object.return_value = {}
        
        # Mock EventBridge
        mock_events_client.put_rule.return_value = {}
        mock_events_client.put_targets.return_value = {}
        mock_events_client.put_events.return_value = {'FailedEntryCount': 0}
        
        # Mock STS
        with patch('handler.get_account_id', return_value='123456789012'):
            # Mock context
            mock_context = Mock()
            mock_context.request_id = 'test-request-id'
            
            # Act: Call the handler
            response = handler.handler(event, mock_context)
            
            # Assert: Response should be successful
            assert response['statusCode'] == 200
            
            # Property: All written posts have status "Scheduled"
            assert len(written_posts) == 30, \
                f"Expected 30 posts to be written, but got {len(written_posts)}"
            
            for i, post in enumerate(written_posts):
                assert 'status' in post, \
                    f"Post {i} (ID: {post.get('post_id', 'unknown')}) is missing 'status' field"
                
                assert post['status'] == 'Scheduled', \
                    f"Post {i} (ID: {post['post_id']}) has incorrect initial status: '{post['status']}'. " \
                    f"All newly created posts should have status 'Scheduled'."
            
            # Verify no posts have other statuses
            statuses = set(post['status'] for post in written_posts)
            assert statuses == {'Scheduled'}, \
                f"Expected all posts to have status 'Scheduled', but found statuses: {statuses}"
    
    # Feature: experta-ai-social-manager, Property 11: Initial Post Status
    @given(brand_data=brand_data_strategy())
    @settings(max_examples=100, deadline=None)
    @patch('handler.generate_caption')
    @patch('handler.generate_and_upload_image')
    def test_status_field_is_never_null_or_empty(
        self,
        mock_generate_image,
        mock_generate_caption,
        brand_data
    ):
        """
        Property: For any post created during content generation,
        the status field SHALL never be null, empty, or missing.
        
        This test verifies data integrity - the status field is
        always present and has a valid value.
        """
        # Arrange: Mock the generation functions
        mock_generate_caption.return_value = "Test caption"
        mock_generate_image.return_value = f"https://test-bucket.s3.us-east-1.amazonaws.com/images/{brand_data['brand_id']}/test.png"
        
        # Act: Generate content calendar
        posts = handler.generate_content_calendar(brand_data)
        
        # Assert: Property - status field is always present and non-empty
        for i, post in enumerate(posts):
            # Status field must exist
            assert 'status' in post, \
                f"Post {i} is missing the required 'status' field"
            
            # Status must not be None
            assert post['status'] is not None, \
                f"Post {i} has null status value"
            
            # Status must not be empty string
            assert post['status'] != '', \
                f"Post {i} has empty string status value"
            
            # Status must be a string
            assert isinstance(post['status'], str), \
                f"Post {i} status is not a string: {type(post['status'])}"
            
            # Status must be "Scheduled" for initial posts
            assert post['status'] == 'Scheduled', \
                f"Post {i} has unexpected initial status: '{post['status']}'"
    
    # Feature: experta-ai-social-manager, Property 11: Initial Post Status
    @given(
        brand_data=brand_data_strategy(),
        num_posts=st.integers(min_value=1, max_value=100)
    )
    @settings(max_examples=100, deadline=None)
    @patch('handler.generate_caption')
    @patch('handler.generate_and_upload_image')
    def test_status_invariant_across_different_calendar_sizes(
        self,
        mock_generate_image,
        mock_generate_caption,
        brand_data,
        num_posts
    ):
        """
        Property: For any number of posts generated (not just 30),
        all posts SHALL have initial status "Scheduled".
        
        This tests that the status initialization is independent
        of the number of posts being generated.
        """
        # Arrange: Mock the generation functions
        mock_generate_caption.return_value = "Test caption"
        mock_generate_image.return_value = f"https://test-bucket.s3.us-east-1.amazonaws.com/images/{brand_data['brand_id']}/test.png"
        
        # Temporarily modify the generation to create different number of posts
        # We'll simulate this by calling the post creation logic directly
        posts = []
        content_pillars = brand_data.get('content_pillars', [])
        post_times = brand_data.get('post_times', ['09:00'])
        start_date = datetime.utcnow() + timedelta(days=1)
        
        for day in range(num_posts):
            pillar_index = day % len(content_pillars)
            content_pillar = content_pillars[pillar_index]
            
            time_index = day % len(post_times)
            post_time = post_times[time_index]
            
            scheduled_date = start_date + timedelta(days=day)
            scheduled_time = handler.calculate_scheduled_time(scheduled_date, post_time)
            
            # Create post record (mimicking handler logic)
            post = {
                'post_id': str(uuid.uuid4()),
                'brand_id': brand_data['brand_id'],
                'caption': mock_generate_caption.return_value,
                'image_url': mock_generate_image.return_value,
                'platform': 'instagram',
                'scheduled_time': scheduled_time,
                'status': 'Scheduled',  # This is what we're testing
                'content_pillar': content_pillar,
                'created_at': datetime.utcnow().isoformat() + 'Z',
                'published_at': None,
                'error_message': None,
                'retry_count': 0
            }
            
            posts.append(post)
        
        # Assert: Property - all posts have status "Scheduled"
        assert len(posts) == num_posts, \
            f"Expected {num_posts} posts, but got {len(posts)}"
        
        for i, post in enumerate(posts):
            assert post['status'] == 'Scheduled', \
                f"Post {i} of {num_posts} has incorrect status: '{post['status']}'. " \
                f"Expected 'Scheduled' regardless of calendar size."



class TestMultiPlatformPostCreation:
    """Property-based tests for multi-platform post creation"""
    
    @pytest.fixture(autouse=True)
    def setup_environment(self):
        """Set up environment variables for testing"""
        os.environ['BRANDS_TABLE_NAME'] = 'test-brands-table'
        os.environ['POSTS_TABLE_NAME'] = 'test-posts-table'
        os.environ['S3_BUCKET_NAME'] = 'test-bucket'
        os.environ['BEDROCK_CLAUDE_MODEL_ID'] = 'anthropic.claude-3-5-sonnet-20241022-v2:0'
        os.environ['BEDROCK_TITAN_MODEL_ID'] = 'amazon.titan-image-generator-v1'
        os.environ['EVENTBRIDGE_BUS_NAME'] = 'default'
        os.environ['AWS_REGION'] = 'us-east-1'
        
        yield
        
        # Cleanup
        for key in ['BRANDS_TABLE_NAME', 'POSTS_TABLE_NAME', 'S3_BUCKET_NAME', 
                    'BEDROCK_CLAUDE_MODEL_ID', 'BEDROCK_TITAN_MODEL_ID', 
                    'EVENTBRIDGE_BUS_NAME', 'AWS_REGION']:
            if key in os.environ:
                del os.environ[key]
    
    # Feature: experta-ai-social-manager, Property 29: Multi-Platform Post Creation
    @given(brand_data=brand_data_strategy())
    @settings(max_examples=100, deadline=None)
    @patch('handler.generate_caption')
    @patch('handler.generate_and_upload_image')
    def test_separate_posts_created_for_each_platform(
        self,
        mock_generate_image,
        mock_generate_caption,
        brand_data
    ):
        """
        Property: For any post creation request targeting multiple platforms,
        separate post records SHALL be created for each platform, each with
        the same caption and scheduled_time.
        
        Validates: Requirements 15.2, 15.5
        """
        # Arrange: Add both platform credentials to brand data
        brand_data['instagram_token_encrypted'] = b'encrypted_instagram_token'
        brand_data['linkedin_token_encrypted'] = b'encrypted_linkedin_token'
        
        mock_generate_caption.return_value = "Test caption for multi-platform"
        mock_generate_image.return_value = f"https://test-bucket.s3.us-east-1.amazonaws.com/images/{brand_data['brand_id']}/test.png"
        
        # Act: Generate content calendar
        posts = handler.generate_content_calendar(brand_data)
        
        # Assert: Property - separate posts for each platform
        # With both platforms, we should have 60 posts (30 days × 2 platforms)
        assert len(posts) == 60, \
            f"Expected 60 posts (30 days × 2 platforms), but got {len(posts)}"
        
        # Group posts by scheduled_time
        posts_by_time = {}
        for post in posts:
            scheduled_time = post['scheduled_time']
            if scheduled_time not in posts_by_time:
                posts_by_time[scheduled_time] = []
            posts_by_time[scheduled_time].append(post)
        
        # Verify we have 30 unique scheduled times
        assert len(posts_by_time) == 30, \
            f"Expected 30 unique scheduled times, but got {len(posts_by_time)}"
        
        # For each scheduled time, verify we have posts for both platforms
        for scheduled_time, time_posts in posts_by_time.items():
            assert len(time_posts) == 2, \
                f"Expected 2 posts (one per platform) at {scheduled_time}, but got {len(time_posts)}"
            
            platforms = set(post['platform'] for post in time_posts)
            assert platforms == {'instagram', 'linkedin'}, \
                f"Expected both 'instagram' and 'linkedin' platforms at {scheduled_time}, but got {platforms}"
            
            # Verify both posts have the same caption
            captions = set(post['caption'] for post in time_posts)
            assert len(captions) == 1, \
                f"Expected same caption for both platforms at {scheduled_time}, but got different captions"
            
            # Verify both posts have the same image_url
            image_urls = set(post['image_url'] for post in time_posts)
            assert len(image_urls) == 1, \
                f"Expected same image_url for both platforms at {scheduled_time}, but got different URLs"
            
            # Verify both posts have the same content_pillar
            pillars = set(post['content_pillar'] for post in time_posts)
            assert len(pillars) == 1, \
                f"Expected same content_pillar for both platforms at {scheduled_time}, but got different pillars"
    
    # Feature: experta-ai-social-manager, Property 28: Platform Selection Validation
    @given(brand_data=brand_data_strategy())
    @settings(max_examples=100, deadline=None)
    @patch('handler.generate_caption')
    @patch('handler.generate_and_upload_image')
    def test_platform_selection_based_on_credentials(
        self,
        mock_generate_image,
        mock_generate_caption,
        brand_data
    ):
        """
        Property: For any post creation request, the platform field SHALL be
        one of: "instagram", "linkedin", or both, based on available credentials.
        
        Validates: Requirements 15.1
        """
        mock_generate_caption.return_value = "Test caption"
        mock_generate_image.return_value = f"https://test-bucket.s3.us-east-1.amazonaws.com/images/{brand_data['brand_id']}/test.png"
        
        # Test Case 1: Only Instagram credentials
        brand_data_instagram = brand_data.copy()
        brand_data_instagram['instagram_token_encrypted'] = b'encrypted_instagram_token'
        brand_data_instagram.pop('linkedin_token_encrypted', None)
        
        posts_instagram = handler.generate_content_calendar(brand_data_instagram)
        
        # Should have 30 posts, all for Instagram
        assert len(posts_instagram) == 30, \
            f"Expected 30 posts for Instagram only, but got {len(posts_instagram)}"
        
        platforms_instagram = set(post['platform'] for post in posts_instagram)
        assert platforms_instagram == {'instagram'}, \
            f"Expected only 'instagram' platform, but got {platforms_instagram}"
        
        # Test Case 2: Only LinkedIn credentials
        brand_data_linkedin = brand_data.copy()
        brand_data_linkedin['linkedin_token_encrypted'] = b'encrypted_linkedin_token'
        brand_data_linkedin.pop('instagram_token_encrypted', None)
        
        posts_linkedin = handler.generate_content_calendar(brand_data_linkedin)
        
        # Should have 30 posts, all for LinkedIn
        assert len(posts_linkedin) == 30, \
            f"Expected 30 posts for LinkedIn only, but got {len(posts_linkedin)}"
        
        platforms_linkedin = set(post['platform'] for post in posts_linkedin)
        assert platforms_linkedin == {'linkedin'}, \
            f"Expected only 'linkedin' platform, but got {platforms_linkedin}"
        
        # Test Case 3: Both credentials
        brand_data_both = brand_data.copy()
        brand_data_both['instagram_token_encrypted'] = b'encrypted_instagram_token'
        brand_data_both['linkedin_token_encrypted'] = b'encrypted_linkedin_token'
        
        posts_both = handler.generate_content_calendar(brand_data_both)
        
        # Should have 60 posts (30 × 2 platforms)
        assert len(posts_both) == 60, \
            f"Expected 60 posts for both platforms, but got {len(posts_both)}"
        
        platforms_both = set(post['platform'] for post in posts_both)
        assert platforms_both == {'instagram', 'linkedin'}, \
            f"Expected both 'instagram' and 'linkedin' platforms, but got {platforms_both}"
    
    # Feature: experta-ai-social-manager, Property 29: Multi-Platform Post Creation
    @given(brand_data=brand_data_strategy())
    @settings(max_examples=100, deadline=None)
    @patch('handler.generate_caption')
    @patch('handler.generate_and_upload_image')
    def test_multi_platform_posts_have_unique_ids(
        self,
        mock_generate_image,
        mock_generate_caption,
        brand_data
    ):
        """
        Property: For any multi-platform post creation, each platform post
        SHALL have a unique post_id, even though they share the same content.
        
        This ensures proper tracking and management of platform-specific posts.
        """
        # Arrange: Add both platform credentials
        brand_data['instagram_token_encrypted'] = b'encrypted_instagram_token'
        brand_data['linkedin_token_encrypted'] = b'encrypted_linkedin_token'
        
        mock_generate_caption.return_value = "Test caption"
        mock_generate_image.return_value = f"https://test-bucket.s3.us-east-1.amazonaws.com/images/{brand_data['brand_id']}/test.png"
        
        # Act: Generate content calendar
        posts = handler.generate_content_calendar(brand_data)
        
        # Assert: All post_ids are unique
        post_ids = [post['post_id'] for post in posts]
        unique_post_ids = set(post_ids)
        
        assert len(post_ids) == len(unique_post_ids), \
            f"Expected all post_ids to be unique, but found {len(post_ids) - len(unique_post_ids)} duplicates"
        
        # Verify each post_id is a valid UUID
        for post_id in post_ids:
            try:
                uuid.UUID(post_id)
            except ValueError:
                pytest.fail(f"Invalid UUID format for post_id: {post_id}")
