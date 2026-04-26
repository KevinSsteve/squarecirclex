/**
 * AssetManifest
 * 
 * Declarative asset management system for the 3D isometric game layer.
 * Defines all assets with metadata for efficient loading and organization.
 * 
 * Asset Categories:
 * - Furniture: Desks, chairs, shelves, cabinets
 * - Decorations: Plants, wall art, desk items
 * - Characters: Agent sprites with animations
 * - Environment: Floors, walls, carpets
 * - Shadows: Character and object shadows
 * 
 * Phase 1, Task 1.3
 * Game 3D Visual Upgrade Specification
 */

/**
 * Asset definition structure:
 * {
 *   id: string - Unique identifier
 *   name: string - Human-readable name
 *   type: 'image' | 'spritesheet' | 'json' | 'audio'
 *   category: 'furniture' | 'decorations' | 'characters' | 'environment' | 'shadows'
 *   url: string - Path to asset file
 *   definitionUrl: string - Path to JSON atlas (for spritesheets)
 *   atlasName: string - Atlas identifier (for spritesheets)
 *   critical: boolean - Must load before game starts
 *   metadata: {
 *     width: number - Asset width in pixels
 *     height: number - Asset height in pixels
 *     anchorX: number - Anchor point X (0-1)
 *     anchorY: number - Anchor point Y (0-1)
 *     frames: number - Animation frame count (for spritesheets)
 *     directions: number - Directional sprite count (for characters)
 *   }
 * }
 */

const AssetManifest = {
  // ============================================================================
  // ENVIRONMENT ASSETS (Critical - Load First)
  // ============================================================================
  
  environment: [
    {
      id: 'floor-tiles',
      name: 'Floor Tiles',
      type: 'spritesheet',
      category: 'environment',
      url: '/assets/sprites/environment/floors.png',
      definitionUrl: '/assets/sprites/environment/floors.json',
      atlasName: 'floors',
      critical: true,
      metadata: {
        width: 64,
        height: 32,
        anchorX: 0.5,
        anchorY: 1.0,
        frames: 8, // Different floor tile variations
        directions: 1
      }
    },
    {
      id: 'carpets',
      name: 'Department Carpets',
      type: 'spritesheet',
      category: 'environment',
      url: '/assets/sprites/environment/carpets.png',
      definitionUrl: '/assets/sprites/environment/carpets.json',
      atlasName: 'carpets',
      critical: true,
      metadata: {
        width: 128,
        height: 64,
        anchorX: 0.5,
        anchorY: 1.0,
        frames: 5, // One per department
        directions: 1
      }
    },
    {
      id: 'walls',
      name: 'Office Walls',
      type: 'spritesheet',
      category: 'environment',
      url: '/assets/sprites/environment/walls.png',
      definitionUrl: '/assets/sprites/environment/walls.json',
      atlasName: 'walls',
      critical: false,
      metadata: {
        width: 64,
        height: 96,
        anchorX: 0.5,
        anchorY: 1.0,
        frames: 6, // Different wall types
        directions: 1
      }
    }
  ],

  // ============================================================================
  // FURNITURE ASSETS (Critical - Load First)
  // ============================================================================
  
  furniture: [
    {
      id: 'desks',
      name: 'Office Desks',
      type: 'spritesheet',
      category: 'furniture',
      url: '/assets/sprites/furniture/desks.png',
      definitionUrl: '/assets/sprites/furniture/desks.json',
      atlasName: 'desks',
      critical: true,
      metadata: {
        width: 96,
        height: 64,
        anchorX: 0.5,
        anchorY: 0.8,
        frames: 8, // Different desk styles
        directions: 1
      }
    },
    {
      id: 'chairs',
      name: 'Office Chairs',
      type: 'spritesheet',
      category: 'furniture',
      url: '/assets/sprites/furniture/chairs.png',
      definitionUrl: '/assets/sprites/furniture/chairs.json',
      atlasName: 'chairs',
      critical: true,
      metadata: {
        width: 48,
        height: 48,
        anchorX: 0.5,
        anchorY: 0.8,
        frames: 4, // Different chair styles
        directions: 4 // 4 rotations for isometric
      }
    },
    {
      id: 'shelves',
      name: 'Bookshelves',
      type: 'spritesheet',
      category: 'furniture',
      url: '/assets/sprites/furniture/shelves.png',
      definitionUrl: '/assets/sprites/furniture/shelves.json',
      atlasName: 'shelves',
      critical: false,
      metadata: {
        width: 64,
        height: 96,
        anchorX: 0.5,
        anchorY: 0.9,
        frames: 4,
        directions: 1
      }
    },
    {
      id: 'cabinets',
      name: 'Filing Cabinets',
      type: 'spritesheet',
      category: 'furniture',
      url: '/assets/sprites/furniture/cabinets.png',
      definitionUrl: '/assets/sprites/furniture/cabinets.json',
      atlasName: 'cabinets',
      critical: false,
      metadata: {
        width: 48,
        height: 64,
        anchorX: 0.5,
        anchorY: 0.9,
        frames: 3,
        directions: 1
      }
    }
  ],

  // ============================================================================
  // CHARACTER ASSETS (Critical - Load First)
  // ============================================================================
  
  characters: [
    {
      id: 'agents-idle',
      name: 'Agent Idle Animations',
      type: 'spritesheet',
      category: 'characters',
      url: '/assets/sprites/characters/agents-idle.png',
      definitionUrl: '/assets/sprites/characters/agents-idle.json',
      atlasName: 'agents-idle',
      critical: true,
      metadata: {
        width: 64,
        height: 64,
        anchorX: 0.5,
        anchorY: 0.8,
        frames: 4, // 4 frames per direction
        directions: 8 // N, NE, E, SE, S, SW, W, NW
      }
    },
    {
      id: 'agents-walking',
      name: 'Agent Walking Animations',
      type: 'spritesheet',
      category: 'characters',
      url: '/assets/sprites/characters/agents-walking.png',
      definitionUrl: '/assets/sprites/characters/agents-walking.json',
      atlasName: 'agents-walking',
      critical: true,
      metadata: {
        width: 64,
        height: 64,
        anchorX: 0.5,
        anchorY: 0.8,
        frames: 8, // 8 frames per direction
        directions: 8
      }
    },
    {
      id: 'agents-working',
      name: 'Agent Working Animations',
      type: 'spritesheet',
      category: 'characters',
      url: '/assets/sprites/characters/agents-working.png',
      definitionUrl: '/assets/sprites/characters/agents-working.json',
      atlasName: 'agents-working',
      critical: false,
      metadata: {
        width: 64,
        height: 64,
        anchorX: 0.5,
        anchorY: 0.8,
        frames: 6, // 6 frames animation
        directions: 1 // Working is stationary
      }
    },
    {
      id: 'agents-celebrating',
      name: 'Agent Celebration Animations',
      type: 'spritesheet',
      category: 'characters',
      url: '/assets/sprites/characters/agents-celebrating.png',
      definitionUrl: '/assets/sprites/characters/agents-celebrating.json',
      atlasName: 'agents-celebrating',
      critical: false,
      metadata: {
        width: 64,
        height: 64,
        anchorX: 0.5,
        anchorY: 0.8,
        frames: 8, // 8 frames animation
        directions: 1
      }
    }
  ],

  // ============================================================================
  // SHADOW ASSETS (Critical - Load First)
  // ============================================================================
  
  shadows: [
    {
      id: 'character-shadows',
      name: 'Character Shadows',
      type: 'spritesheet',
      category: 'shadows',
      url: '/assets/sprites/shadows/character-shadows.png',
      definitionUrl: '/assets/sprites/shadows/character-shadows.json',
      atlasName: 'character-shadows',
      critical: true,
      metadata: {
        width: 48,
        height: 24,
        anchorX: 0.5,
        anchorY: 0.5,
        frames: 3, // Small, medium, large
        directions: 1
      }
    },
    {
      id: 'object-shadows',
      name: 'Object Shadows',
      type: 'spritesheet',
      category: 'shadows',
      url: '/assets/sprites/shadows/object-shadows.png',
      definitionUrl: '/assets/sprites/shadows/object-shadows.json',
      atlasName: 'object-shadows',
      critical: false,
      metadata: {
        width: 64,
        height: 32,
        anchorX: 0.5,
        anchorY: 0.5,
        frames: 5, // Various sizes
        directions: 1
      }
    }
  ],

  // ============================================================================
  // DECORATION ASSETS (Non-Critical - Load in Background)
  // ============================================================================
  
  decorations: [
    {
      id: 'plants',
      name: 'Office Plants',
      type: 'spritesheet',
      category: 'decorations',
      url: '/assets/sprites/decorations/plants.png',
      definitionUrl: '/assets/sprites/decorations/plants.json',
      atlasName: 'plants',
      critical: false,
      metadata: {
        width: 48,
        height: 64,
        anchorX: 0.5,
        anchorY: 0.9,
        frames: 6, // Different plant types
        directions: 1
      }
    },
    {
      id: 'wall-art',
      name: 'Wall Decorations',
      type: 'spritesheet',
      category: 'decorations',
      url: '/assets/sprites/decorations/wall-art.png',
      definitionUrl: '/assets/sprites/decorations/wall-art.json',
      atlasName: 'wall-art',
      critical: false,
      metadata: {
        width: 64,
        height: 48,
        anchorX: 0.5,
        anchorY: 0.5,
        frames: 8, // Posters, whiteboards, charts
        directions: 1
      }
    },
    {
      id: 'desk-items',
      name: 'Desk Items',
      type: 'spritesheet',
      category: 'decorations',
      url: '/assets/sprites/decorations/desk-items.png',
      definitionUrl: '/assets/sprites/decorations/desk-items.json',
      atlasName: 'desk-items',
      critical: false,
      metadata: {
        width: 32,
        height: 32,
        anchorX: 0.5,
        anchorY: 0.8,
        frames: 12, // Monitors, coffee mugs, papers, etc.
        directions: 1
      }
    },
    {
      id: 'department-decorations',
      name: 'Department-Specific Decorations',
      type: 'spritesheet',
      category: 'decorations',
      url: '/assets/sprites/decorations/department-decorations.png',
      definitionUrl: '/assets/sprites/decorations/department-decorations.json',
      atlasName: 'department-decorations',
      critical: false,
      metadata: {
        width: 64,
        height: 64,
        anchorX: 0.5,
        anchorY: 0.8,
        frames: 15, // Unique items per department
        directions: 1
      }
    }
  ],

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Get all assets
   * @returns {Array} All asset definitions
   */
  getAllAssets() {
    return [
      ...this.environment,
      ...this.furniture,
      ...this.characters,
      ...this.shadows,
      ...this.decorations
    ];
  },

  /**
   * Get critical assets (must load before game starts)
   * @returns {Array} Critical asset definitions
   */
  getCriticalAssets() {
    return this.getAllAssets().filter(asset => asset.critical);
  },

  /**
   * Get non-critical assets (lazy load in background)
   * @returns {Array} Non-critical asset definitions
   */
  getNonCriticalAssets() {
    return this.getAllAssets().filter(asset => !asset.critical);
  },

  /**
   * Get assets by category
   * @param {string} category - Asset category
   * @returns {Array} Assets in category
   */
  getAssetsByCategory(category) {
    return this[category] || [];
  },

  /**
   * Get asset by ID
   * @param {string} id - Asset ID
   * @returns {object|null} Asset definition or null
   */
  getAssetById(id) {
    return this.getAllAssets().find(asset => asset.id === id) || null;
  },

  /**
   * Get asset statistics
   * @returns {object} Asset statistics
   */
  getStats() {
    const all = this.getAllAssets();
    const critical = this.getCriticalAssets();
    const nonCritical = this.getNonCriticalAssets();

    return {
      total: all.length,
      critical: critical.length,
      nonCritical: nonCritical.length,
      byCategory: {
        environment: this.environment.length,
        furniture: this.furniture.length,
        characters: this.characters.length,
        shadows: this.shadows.length,
        decorations: this.decorations.length
      },
      byType: {
        spritesheet: all.filter(a => a.type === 'spritesheet').length,
        image: all.filter(a => a.type === 'image').length,
        json: all.filter(a => a.type === 'json').length,
        audio: all.filter(a => a.type === 'audio').length
      }
    };
  },

  /**
   * Validate asset manifest
   * @returns {object} Validation result
   */
  validate() {
    const errors = [];
    const warnings = [];
    const all = this.getAllAssets();

    // Check for duplicate IDs
    const ids = new Set();
    all.forEach(asset => {
      if (ids.has(asset.id)) {
        errors.push(`Duplicate asset ID: ${asset.id}`);
      }
      ids.add(asset.id);
    });

    // Check for missing required fields
    all.forEach(asset => {
      if (!asset.id) errors.push('Asset missing ID');
      if (!asset.name) warnings.push(`Asset ${asset.id} missing name`);
      if (!asset.type) errors.push(`Asset ${asset.id} missing type`);
      if (!asset.category) errors.push(`Asset ${asset.id} missing category`);
      if (!asset.url) errors.push(`Asset ${asset.id} missing URL`);
      
      if (asset.type === 'spritesheet') {
        if (!asset.definitionUrl) {
          errors.push(`Spritesheet ${asset.id} missing definitionUrl`);
        }
        if (!asset.atlasName) {
          errors.push(`Spritesheet ${asset.id} missing atlasName`);
        }
      }
    });

    // Check critical asset balance
    const criticalCount = this.getCriticalAssets().length;
    const totalCount = all.length;
    const criticalRatio = criticalCount / totalCount;

    if (criticalRatio > 0.7) {
      warnings.push(`High critical asset ratio (${Math.round(criticalRatio * 100)}%). Consider marking some as non-critical.`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
};

export default AssetManifest;
