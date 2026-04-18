"""
Content Generator Lambda Function
Generates 30-day content calendar with AI-generated captions and images
Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 10.2, 10.4
"""

import json
import os
import uuid
import boto3
import base64
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from decimal import Decimal

# Import error handler from shared library
import sys
sys.path.append('/opt/python')
from errors.error_handler import ErrorHandler, ValidationException

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
s3_client = boto3.client('s3')
bedrock_runtime = boto3.client('bedrock-runtime')
events_client = boto3.client('events')

# Environment variables
BRANDS_TABLE_NAME = os.environ['BRANDS_TABLE_NAME']
POSTS_TABLE_NAME = os.environ['POSTS_TABLE_NAME']
S3_BUCKET_NAME = os.environ['S3_BUCKET_NAME']
BEDROCK_CLAUDE_MODEL_ID = os.environ['BEDROCK_CLAUDE_MODEL_ID']
BEDROCK_TITAN_MODEL_ID = os.environ['BEDROCK_TITAN_MODEL_ID']
EVENTBRIDGE_BUS_NAME = os.environ['EVENTBRIDGE_BUS_NAME']
AWS_REGION = os.environ.get('AWS_REGION', 'us-east-1')

# DynamoDB tables
brands_table = dynamodb.Table(BRANDS_TABLE_NAME)
posts_table = dynamodb.Table(POSTS_TABLE_NAME)


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler for content generation
    Triggered by EventBridge BrandOnboardingComplete event
    
    Args:
        event: EventBridge event with brand_id in detail
        context: Lambda context
        
    Returns:
        Success response
    """
    start_time = datetime.utcnow()
    
    try:
        ErrorHandler.log_info("Content generation started", {
            "requestId": getattr(context, 'request_id', 'unknown'),
            "functionName": getattr(context, 'function_name', 'unknown'),
            "functionVersion": getattr(context, 'function_version', 'unknown'),
            "eventSource": event.get('source', 'unknown'),
            "eventDetailType": event.get('detail-type', 'unknown')
        })
        
        # Extract brand_id from EventBridge event
        brand_id = event.get('detail', {}).get('brand_id')
        if not brand_id:
            raise ValidationException("brand_id is required in event detail")
        
        # Fetch brand data from DynamoDB
        brand_data = get_brand_data(brand_id)
        
        # Generate 30 posts
        posts = generate_content_calendar(brand_data)
        
        # Save posts to DynamoDB and create EventBridge rules
        save_posts_and_schedule(posts, brand_id)
        
        # Publish ContentCalendarGenerated event
        publish_calendar_generated_event(brand_id, len(posts))
        
        execution_duration = (datetime.utcnow() - start_time).total_seconds() * 1000
        ErrorHandler.log_info("Content generation completed", {
            "brand_id": brand_id,
            "posts_created": len(posts),
            "executionDurationMs": execution_duration
        })
        
        return {
            "statusCode": 200,
            "body": json.dumps({
                "message": "Content calendar generated successfully",
                "brand_id": brand_id,
                "posts_created": len(posts)
            })
        }
        
    except Exception as error:
        execution_duration = (datetime.utcnow() - start_time).total_seconds() * 1000
        ErrorHandler.log_error(error, {
            "operation": "content_generator_handler",
            "requestId": getattr(context, 'request_id', 'unknown'),
            "executionDurationMs": execution_duration
        })
        raise


def get_brand_data(brand_id: str) -> Dict[str, Any]:
    """
    Fetch brand data from DynamoDB
    
    Args:
        brand_id: Brand identifier
        
    Returns:
        Brand data dictionary
    """
    try:
        response = brands_table.get_item(Key={'brand_id': brand_id})
        
        if 'Item' not in response:
            raise ValidationException(f"Brand not found: {brand_id}")
        
        return response['Item']
        
    except Exception as error:
        ErrorHandler.log_error(error, {"brand_id": brand_id})
        raise


def generate_content_calendar(brand_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Generate 30 posts with AI-generated captions and images
    Supports multi-platform posting (Instagram and LinkedIn)
    
    Args:
        brand_data: Brand information including content pillars, tone, visual style
        
    Returns:
        List of post dictionaries
    """
    posts = []
    content_pillars = brand_data.get('content_pillars', [])
    post_times = brand_data.get('post_times', ['09:00'])
    
    if not content_pillars:
        raise ValidationException("Brand must have at least one content pillar")
    
    # Determine target platforms based on connection status
    # Phase 2: Check connection flags instead of encrypted tokens
    # Requirements: 15.1, 16.6
    target_platforms = []
    if brand_data.get('has_instagram_connection'):
        target_platforms.append('instagram')
    if brand_data.get('has_linkedin_connection'):
        target_platforms.append('linkedin')
    
    if not target_platforms:
        ErrorHandler.log_warning("No platform connections found, defaulting to Instagram")
        target_platforms = ['instagram']
    
    ErrorHandler.log_info(f"Generating content for platforms: {target_platforms}")
    
    # Calculate start date (tomorrow)
    start_date = datetime.utcnow() + timedelta(days=1)
    
    # Generate 30 posts with round-robin content pillar distribution
    for day in range(30):
        # Select content pillar using round-robin
        pillar_index = day % len(content_pillars)
        content_pillar = content_pillars[pillar_index]
        
        # Select post time using round-robin
        time_index = day % len(post_times)
        post_time = post_times[time_index]
        
        # Calculate scheduled time
        scheduled_date = start_date + timedelta(days=day)
        scheduled_time = calculate_scheduled_time(scheduled_date, post_time)
        
        ErrorHandler.log_info(f"Generating post {day + 1}/30", {
            "content_pillar": content_pillar,
            "scheduled_time": scheduled_time,
            "platforms": target_platforms
        })
        
        # Generate caption using Claude
        caption = generate_caption(brand_data, content_pillar)
        
        # Generate image using Titan
        image_url = generate_and_upload_image(
            brand_data,
            content_pillar,
            caption,
            brand_data['brand_id']
        )
        
        # Create separate post records for each platform
        # Requirements: 15.2, 15.5
        for platform in target_platforms:
            post = {
                'post_id': str(uuid.uuid4()),
                'brand_id': brand_data['brand_id'],
                'caption': caption,
                'image_url': image_url,
                'platform': platform,
                'scheduled_time': scheduled_time,  # Same time for all platforms
                'status': 'Scheduled',
                'content_pillar': content_pillar,
                'created_at': datetime.utcnow().isoformat() + 'Z',
                'published_at': None,
                'error_message': None,
                'retry_count': 0
            }
            
            posts.append(post)
    
    return posts


def calculate_scheduled_time(date: datetime, time_str: str) -> str:
    """
    Calculate scheduled time from date and time string
    
    Args:
        date: Date object
        time_str: Time string in HH:MM format
        
    Returns:
        ISO8601 formatted datetime string
    """
    try:
        hour, minute = map(int, time_str.split(':'))
        scheduled_datetime = date.replace(hour=hour, minute=minute, second=0, microsecond=0)
        return scheduled_datetime.isoformat() + 'Z'
    except Exception as error:
        ErrorHandler.log_error(error, {"time_str": time_str})
        # Default to 9 AM if parsing fails
        scheduled_datetime = date.replace(hour=9, minute=0, second=0, microsecond=0)
        return scheduled_datetime.isoformat() + 'Z'


def generate_caption(brand_data: Dict[str, Any], content_pillar: str) -> str:
    """
    Generate caption using Claude via Bedrock
    
    Args:
        brand_data: Brand information
        content_pillar: Content pillar for this post
        
    Returns:
        Generated caption text
    """
    try:
        # Build prompt for Claude
        prompt = f"""Generate an engaging social media caption for {brand_data['brand_name']}.

Brand Information:
- Industry: {brand_data.get('industry', 'N/A')}
- Target Audience: {brand_data.get('target_audience', 'N/A')}
- Tone of Voice: {brand_data.get('tone_of_voice', 'professional and friendly')}
- Content Pillar: {content_pillar}

Requirements:
- Write in the brand's tone of voice
- Focus on the content pillar theme
- Keep it engaging and authentic
- Include 2-3 relevant hashtags
- Maximum 2200 characters (Instagram limit)

Generate only the caption text, no additional commentary."""

        # Call Bedrock Claude
        request_body = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 500,
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.7
        }
        
        response = bedrock_runtime.invoke_model(
            modelId=BEDROCK_CLAUDE_MODEL_ID,
            body=json.dumps(request_body)
        )
        
        response_body = json.loads(response['body'].read())
        caption = response_body['content'][0]['text'].strip()
        
        # Ensure caption doesn't exceed Instagram limit
        if len(caption) > 2200:
            caption = caption[:2197] + "..."
        
        return caption
        
    except Exception as error:
        ErrorHandler.log_error(error, {
            "brand_id": brand_data.get('brand_id'),
            "content_pillar": content_pillar
        })
        # Return fallback caption
        return f"Check out our latest update about {content_pillar}! #brand #{content_pillar.replace(' ', '')}"


def generate_and_upload_image(
    brand_data: Dict[str, Any],
    content_pillar: str,
    caption: str,
    brand_id: str
) -> str:
    """
    Generate image using Titan and upload to S3
    
    Args:
        brand_data: Brand information
        content_pillar: Content pillar for this post
        caption: Generated caption for context
        brand_id: Brand identifier
        
    Returns:
        S3 URL of uploaded image
    """
    try:
        # Build image generation prompt
        visual_style = brand_data.get('visual_style', 'modern and professional')
        
        image_prompt = f"""Create a high-quality social media image with the following characteristics:

Visual Style: {visual_style}
Theme: {content_pillar}
Brand: {brand_data['brand_name']}
Industry: {brand_data.get('industry', 'N/A')}

The image should be visually appealing, on-brand, and suitable for Instagram.
Resolution: 1080x1080 pixels (square format)."""

        # Call Bedrock Titan Image Generator
        request_body = {
            "taskType": "TEXT_IMAGE",
            "textToImageParams": {
                "text": image_prompt
            },
            "imageGenerationConfig": {
                "numberOfImages": 1,
                "quality": "premium",
                "height": 1080,
                "width": 1080,
                "cfgScale": 8.0
            }
        }
        
        response = bedrock_runtime.invoke_model(
            modelId=BEDROCK_TITAN_MODEL_ID,
            body=json.dumps(request_body)
        )
        
        response_body = json.loads(response['body'].read())
        
        # Extract image data
        if 'images' not in response_body or len(response_body['images']) == 0:
            raise Exception("No image generated by Titan")
        
        image_base64 = response_body['images'][0]
        image_bytes = base64.b64decode(image_base64)
        
        # Generate unique S3 key
        post_id = str(uuid.uuid4())
        s3_key = f"images/{brand_id}/{post_id}.png"
        
        # Upload to S3
        s3_client.put_object(
            Bucket=S3_BUCKET_NAME,
            Key=s3_key,
            Body=image_bytes,
            ContentType='image/png',
            Metadata={
                'brand_id': brand_id,
                'content_pillar': content_pillar
            }
        )
        
        # Generate S3 URL
        s3_url = f"https://{S3_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/{s3_key}"
        
        return s3_url
        
    except Exception as error:
        ErrorHandler.log_error(error, {
            "brand_id": brand_id,
            "content_pillar": content_pillar
        })
        # Return placeholder image URL
        return f"https://{S3_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/placeholder.png"


def save_posts_and_schedule(posts: List[Dict[str, Any]], brand_id: str) -> None:
    """
    Save posts to DynamoDB and create EventBridge scheduled rules
    
    Args:
        posts: List of post dictionaries
        brand_id: Brand identifier
    """
    try:
        # Save posts to DynamoDB in batches
        with posts_table.batch_writer() as batch:
            for post in posts:
                batch.put_item(Item=post)
        
        ErrorHandler.log_info(f"Saved {len(posts)} posts to DynamoDB", {
            "brand_id": brand_id
        })
        
        # Create EventBridge scheduled rules for each post
        for post in posts:
            create_eventbridge_rule(post)
        
        ErrorHandler.log_info(f"Created {len(posts)} EventBridge rules", {
            "brand_id": brand_id
        })
        
    except Exception as error:
        ErrorHandler.log_error(error, {"brand_id": brand_id})
        raise


def create_eventbridge_rule(post: Dict[str, Any]) -> None:
    """
    Create EventBridge scheduled rule for post publication
    
    Args:
        post: Post dictionary with scheduled_time
    """
    try:
        post_id = post['post_id']
        scheduled_time = post['scheduled_time']
        
        # Convert ISO8601 to cron expression
        dt = datetime.fromisoformat(scheduled_time.replace('Z', '+00:00'))
        cron_expression = f"cron({dt.minute} {dt.hour} {dt.day} {dt.month} ? {dt.year})"
        
        rule_name = f"experta-publish-{post_id}"
        
        # Create rule
        events_client.put_rule(
            Name=rule_name,
            ScheduleExpression=cron_expression,
            State='ENABLED',
            Description=f"Publish post {post_id} at {scheduled_time}",
            EventBusName='default'  # Use default bus for scheduled rules
        )
        
        # Add target (Auto Publisher Lambda)
        # Note: This assumes the Auto Publisher Lambda exists
        # The target ARN will need to be configured in the SAM template
        target_arn = f"arn:aws:lambda:{AWS_REGION}:{get_account_id()}:function:experta-auto-publisher-dev"
        
        events_client.put_targets(
            Rule=rule_name,
            EventBusName='default',
            Targets=[
                {
                    'Id': '1',
                    'Arn': target_arn,
                    'Input': json.dumps({
                        'post_id': post_id,
                        'brand_id': post['brand_id']
                    })
                }
            ]
        )
        
        ErrorHandler.log_info(f"Created EventBridge rule for post {post_id}", {
            "rule_name": rule_name,
            "cron_expression": cron_expression
        })
        
    except Exception as error:
        ErrorHandler.log_error(error, {
            "post_id": post.get('post_id'),
            "scheduled_time": post.get('scheduled_time')
        })
        # Don't raise - continue with other posts


def get_account_id() -> str:
    """Get AWS account ID from STS"""
    try:
        sts_client = boto3.client('sts')
        return sts_client.get_caller_identity()['Account']
    except Exception:
        return "123456789012"  # Fallback for local testing


def publish_calendar_generated_event(brand_id: str, posts_count: int) -> None:
    """
    Publish ContentCalendarGenerated event to EventBridge
    
    Args:
        brand_id: Brand identifier
        posts_count: Number of posts created
    """
    try:
        events_client.put_events(
            Entries=[
                {
                    'Source': 'experta.content-generator',
                    'DetailType': 'ContentCalendarGenerated',
                    'Detail': json.dumps({
                        'brand_id': brand_id,
                        'posts_count': posts_count,
                        'timestamp': datetime.utcnow().isoformat() + 'Z'
                    }),
                    'EventBusName': EVENTBRIDGE_BUS_NAME
                }
            ]
        )
        
        ErrorHandler.log_info("Published ContentCalendarGenerated event", {
            "brand_id": brand_id,
            "posts_count": posts_count
        })
        
    except Exception as error:
        ErrorHandler.log_error(error, {
            "brand_id": brand_id,
            "event_type": "ContentCalendarGenerated"
        })
        # Don't raise - event publishing failure shouldn't fail the entire operation
