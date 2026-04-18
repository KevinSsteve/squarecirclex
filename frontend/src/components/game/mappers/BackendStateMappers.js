/**
 * Backend State Mappers - Maps backend data to game entities
 * 
 * Implements:
 * - DynamoDB posts → task entities mapper
 * - Lambda execution logs → agent state mapper (future)
 * - EventBridge events → visual feedback mapper (future)
 * - Brands table → agent configuration mapper
 * 
 * Requirements: 4.3, 11.1, 11.2, 11.3
 * Phase 4, Task 19
 */

import { api } from '../../../config/api.js';

/**
 * BackendStateMappers - Maps backend state to frontend entities
 */
class BackendStateMappers {
  /**
   * Fetch posts from backend API
   * Maps DynamoDB posts to task entities
   * 
   * @param {string} brandId - Brand ID to fetch posts for
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Posts data
   */
  static async fetchPosts(brandId, options = {}) {
    try {
      const params = {
        brand_id: brandId,
        ...options
      };
      
      const response = await api.getPosts(params);
      
      return {
        posts: response.data.posts || [],
        count: response.data.count || 0,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('BackendStateMappers: Failed to fetch posts:', error);
      throw new Error(`Failed to fetch posts: ${error.message || 'Unknown error'}`);
    }
  }
  
  /**
   * Fetch chat history from backend API
   * Maps chat history to conversation entities
   * 
   * @returns {Promise<Object>} Chat history data
   */
  static async fetchChatHistory() {
    try {
      const response = await api.getChatHistory();
      
      return {
        conversations: response.data.conversations || [],
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('BackendStateMappers: Failed to fetch chat history:', error);
      throw new Error(`Failed to fetch chat history: ${error.message || 'Unknown error'}`);
    }
  }
  
  /**
   * Fetch brand data from backend API
   * Maps brands table to agent configuration
   * 
   * @param {string} brandId - Brand ID to fetch
   * @returns {Promise<Object>} Brand data
   */
  static async fetchBrand(brandId) {
    try {
      const response = await api.getBrand(brandId);
      
      return {
        brand: response.data,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('BackendStateMappers: Failed to fetch brand:', error);
      throw new Error(`Failed to fetch brand: ${error.message || 'Unknown error'}`);
    }
  }
  
  /**
   * Map post to task entity
   * Converts DynamoDB post record to game task entity
   * 
   * @param {Object} post - Post from backend
   * @returns {Object} Task entity data
   */
  static mapPostToTask(post) {
    // Determine task type based on post status and content
    let taskType = 'generate_content';
    
    if (post.status === 'Published') {
      taskType = 'publish_post';
    } else if (post.status === 'Scheduled') {
      taskType = 'generate_content';
    }
    
    // Map status to task status
    const statusMap = {
      'Draft': 'queued',
      'Scheduled': 'queued',
      'Published': 'completed',
      'Failed': 'failed'
    };
    
    const taskStatus = statusMap[post.status] || 'queued';
    
    // Calculate progress based on status
    let progress = 0;
    if (post.status === 'Published') {
      progress = 100;
    } else if (post.status === 'Scheduled') {
      progress = 50; // Content generated, waiting to publish
    } else if (post.status === 'Failed') {
      progress = 0;
    }
    
    return {
      id: `task-${post.post_id}`,
      type: taskType,
      status: taskStatus,
      assignedAgent: this.determineAgentForTask(taskType, post.brand_id),
      visualState: this.mapStatusToVisualState(post.status),
      progress,
      startTime: post.created_at,
      estimatedDuration: this.estimateTaskDuration(taskType),
      backendReference: {
        postId: post.post_id,
        brandId: post.brand_id,
        platform: post.platform,
        scheduledTime: post.scheduled_time
      },
      metadata: {
        caption: post.caption,
        imageUrl: post.image_url,
        contentPillar: post.content_pillar,
        retryCount: post.retry_count || 0,
        errorMessage: post.error_message
      }
    };
  }
  
  /**
   * Map brand to agent configuration
   * Converts brand data to agent entity configuration
   * 
   * @param {Object} brand - Brand from backend
   * @returns {Object} Agent configuration data
   */
  static mapBrandToAgentConfig(brand) {
    return {
      brandId: brand.brand_id,
      brandName: brand.brand_name,
      agents: [
        {
          type: 'content_generator',
          name: `${brand.brand_name} Content Creator`,
          description: `Creates engaging content for ${brand.brand_name}`,
          capabilities: ['generate_content', 'create_captions', 'generate_images'],
          metadata: {
            industry: brand.industry,
            toneOfVoice: brand.tone_of_voice,
            visualStyle: brand.visual_style,
            contentPillars: brand.content_pillars
          }
        },
        {
          type: 'publisher',
          name: `${brand.brand_name} Publisher`,
          description: `Publishes content to social platforms for ${brand.brand_name}`,
          capabilities: ['publish_post', 'schedule_post', 'verify_publication'],
          metadata: {
            hasInstagram: brand.has_instagram_connection,
            hasLinkedIn: brand.has_linkedin_connection,
            postTimes: brand.post_times
          }
        },
        {
          type: 'trend_scraper',
          name: `${brand.brand_name} Trend Analyst`,
          description: `Analyzes trends for ${brand.brand_name}`,
          capabilities: ['scrape_trends', 'analyze_data', 'generate_insights'],
          metadata: {
            industry: brand.industry,
            targetAudience: brand.target_audience
          }
        },
        {
          type: 'chat_assistant',
          name: `${brand.brand_name} Assistant`,
          description: `Helps manage ${brand.brand_name}'s social presence`,
          capabilities: ['handle_chat', 'answer_questions', 'provide_guidance'],
          metadata: {
            brandName: brand.brand_name
          }
        }
      ]
    };
  }
  
  /**
   * Map chat conversation to agent state
   * Determines if chat assistant should be in working state
   * 
   * @param {Object} conversation - Conversation from backend
   * @returns {Object} Agent state update
   */
  static mapConversationToAgentState(conversation) {
    // Check if there are recent messages (within last 5 minutes)
    const recentMessages = conversation.messages?.filter(msg => {
      const messageTime = new Date(msg.timestamp).getTime();
      const now = Date.now();
      return (now - messageTime) < 5 * 60 * 1000; // 5 minutes
    }) || [];
    
    const isActive = recentMessages.length > 0;
    
    return {
      agentType: 'chat_assistant',
      state: isActive ? 'working' : 'idle',
      currentTask: isActive ? {
        type: 'handle_chat',
        conversationId: conversation.conversationId,
        messageCount: recentMessages.length
      } : null
    };
  }
  
  /**
   * Determine which agent should handle a task
   * 
   * @param {string} taskType - Type of task
   * @param {string} brandId - Brand ID
   * @returns {string} Agent ID
   */
  static determineAgentForTask(taskType, brandId) {
    // Generate consistent agent ID based on brand and type
    const agentTypeMap = {
      'generate_content': 'content_generator',
      'publish_post': 'publisher',
      'scrape_trends': 'trend_scraper',
      'handle_chat': 'chat_assistant',
      'oauth_flow': 'oauth_handler'
    };
    
    const agentType = agentTypeMap[taskType] || 'content_generator';
    return `agent-${agentType}-${brandId}`;
  }
  
  /**
   * Map post status to visual state
   * 
   * @param {string} status - Post status
   * @returns {string} Visual state
   */
  static mapStatusToVisualState(status) {
    const visualStateMap = {
      'Draft': 'pending',
      'Scheduled': 'in_progress',
      'Published': 'success',
      'Failed': 'error'
    };
    
    return visualStateMap[status] || 'pending';
  }
  
  /**
   * Estimate task duration in milliseconds
   * 
   * @param {string} taskType - Type of task
   * @returns {number} Estimated duration in ms
   */
  static estimateTaskDuration(taskType) {
    const durationMap = {
      'generate_content': 15000,  // 15 seconds
      'publish_post': 5000,       // 5 seconds
      'scrape_trends': 20000,     // 20 seconds
      'handle_chat': 8000,        // 8 seconds
      'oauth_flow': 3000          // 3 seconds
    };
    
    return durationMap[taskType] || 10000;
  }
  
  /**
   * Normalize backend state to game state
   * Combines all backend data into unified game state
   * 
   * @param {Object} backendData - Raw backend data
   * @returns {Object} Normalized game state
   */
  static normalizeBackendState(backendData) {
    const gameState = {
      tasks: {},
      agents: {},
      brands: {},
      timestamp: Date.now()
    };
    
    // Map posts to tasks
    if (backendData.posts) {
      backendData.posts.forEach(post => {
        const task = this.mapPostToTask(post);
        gameState.tasks[task.id] = task;
      });
    }
    
    // Map brands to agent configurations
    if (backendData.brands) {
      backendData.brands.forEach(brand => {
        const agentConfig = this.mapBrandToAgentConfig(brand);
        gameState.brands[brand.brand_id] = agentConfig;
        
        // Create agent entities
        agentConfig.agents.forEach(agentData => {
          const agentId = `agent-${agentData.type}-${brand.brand_id}`;
          gameState.agents[agentId] = {
            id: agentId,
            type: agentData.type,
            name: agentData.name,
            description: agentData.description,
            capabilities: agentData.capabilities,
            state: 'idle',
            currentTask: null,
            brandId: brand.brand_id,
            metadata: agentData.metadata
          };
        });
      });
    }
    
    // Map conversations to agent states
    if (backendData.conversations) {
      backendData.conversations.forEach(conversation => {
        const agentState = this.mapConversationToAgentState(conversation);
        
        // Find chat assistant agent and update state
        Object.keys(gameState.agents).forEach(agentId => {
          const agent = gameState.agents[agentId];
          if (agent.type === 'chat_assistant') {
            agent.state = agentState.state;
            agent.currentTask = agentState.currentTask;
          }
        });
      });
    }
    
    return gameState;
  }
  
  /**
   * Create change events from state diff
   * Compares old and new state to generate change events
   * 
   * @param {Object} oldState - Previous state
   * @param {Object} newState - New state
   * @returns {Array} Array of change events
   */
  static createChangeEvents(oldState, newState) {
    const changes = [];
    
    // Check for new/updated tasks
    Object.keys(newState.tasks || {}).forEach(taskId => {
      const newTask = newState.tasks[taskId];
      const oldTask = oldState.tasks?.[taskId];
      
      if (!oldTask) {
        // New task
        changes.push({
          type: 'task_created',
          entityType: 'task',
          entityId: taskId,
          data: newTask
        });
      } else if (JSON.stringify(oldTask) !== JSON.stringify(newTask)) {
        // Task updated
        changes.push({
          type: 'task_updated',
          entityType: 'task',
          entityId: taskId,
          data: newTask,
          previous: oldTask
        });
      }
    });
    
    // Check for removed tasks
    Object.keys(oldState.tasks || {}).forEach(taskId => {
      if (!newState.tasks?.[taskId]) {
        changes.push({
          type: 'task_removed',
          entityType: 'task',
          entityId: taskId,
          data: oldState.tasks[taskId]
        });
      }
    });
    
    // Check for new/updated agents
    Object.keys(newState.agents || {}).forEach(agentId => {
      const newAgent = newState.agents[agentId];
      const oldAgent = oldState.agents?.[agentId];
      
      if (!oldAgent) {
        // New agent
        changes.push({
          type: 'agent_created',
          entityType: 'agent',
          entityId: agentId,
          data: newAgent
        });
      } else if (JSON.stringify(oldAgent) !== JSON.stringify(newAgent)) {
        // Agent updated
        changes.push({
          type: 'agent_updated',
          entityType: 'agent',
          entityId: agentId,
          data: newAgent,
          previous: oldAgent
        });
      }
    });
    
    return changes;
  }
}

export default BackendStateMappers;
