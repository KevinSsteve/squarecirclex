/**
 * DepartmentRenderer.js - Comprehensive Department Rendering System
 * 
 * Consolidates all department rendering logic into a single, maintainable class.
 * Handles floor rendering, furniture placement, decorations, and theme application.
 * 
 * Phase 2, Task 2.4: Department Renderer Implementation
 * 
 * Features:
 * - Floor tile and carpet rendering
 * - Wall and structure rendering
 * - Furniture placement using FurnitureLayout
 * - Department theme color application
 * - Optimized rendering with proper layer management
 * - Depth sorting for isometric view
 */

import * as PIXI from 'pixi.js';
import { getLayoutForDepartment, getFurnitureType } from '../layout/FurnitureLayout.js';

/**
 * Department theme definitions
 * Maps department IDs to their visual themes
 */
const DEPARTMENT_THEMES = {
  content_creation: {
    name: 'Content Creation',
    color: 0x4F46E5, // Indigo
    description: 'Creative workspace with whiteboards and inspiration'
  },
  publishing: {
    name: 'Publishing',
    color: 0x10B981, // Green
    description: 'Publishing schedule and content distribution'
  },
  trend_analysis: {
    name: 'Trend Analysis',
    color: 0xF59E0B, // Amber
    description: 'Data visualization and trend research'
  },
  customer_support: {
    name: 'Customer Support',
    color: 0x8B5CF6, // Purple
    description: 'Customer service and support operations'
  },
  administration: {
    name: 'Administration',
    color: 0x6B7280, // Gray
    description: 'Management and administrative functions'
  }
};

/**
 * Isometric projection constants
 */
const GRID_SIZE = 64; // pixels per grid cell
const ISO_RATIO = 2; // width:height ratio for isometric projection

/**
 * DepartmentRenderer Class
 * 
 * Manages rendering of all department visuals including floors, walls,
 * furniture, and decorations with proper depth sorting and theme application.
 */
class DepartmentRenderer {
  /**
   * Create a new DepartmentRenderer
   * @param {Scene} scene - The game scene
   * @param {Object} options - Rendering options
   */
  constructor(scene, options = {}) {
    this.scene = scene;
    this.options = {
      offsetX: options.offsetX || 400,
      offsetY: options.offsetY || 200,
      enableFloorTiles: options.enableFloorTiles !== false,
      enableCarpets: options.enableCarpets !== false,
      enableWalls: options.enableWalls !== false,
      enableFurniture: options.enableFurniture !== false,
      ...options
    };
    
    // Cache for rendered elements
    this.renderedElements = new Map();
    
    // Performance tracking
    this.renderStats = {
      floorsRendered: 0,
      carpetsRendered: 0,
      wallsRendered: 0,
      furnitureRendered: 0,
      totalRenderTime: 0
    };
  }
  
  /**
   * Convert grid coordinates to isometric screen coordinates
   * @param {number} gridX - Grid X coordinate
   * @param {number} gridY - Grid Y coordinate
   * @returns {{x: number, y: number}} Screen coordinates
   */
  gridToIso(gridX, gridY) {
    const x = (gridX - gridY) * (GRID_SIZE / ISO_RATIO);
    const y = (gridX + gridY) * (GRID_SIZE / (ISO_RATIO * 2));
    return { x, y };
  }
  
  /**
   * Render all departments
   * Main entry point for rendering the complete office environment
   * @param {Array} departments - Array of department definitions
   */
  renderAll(departments) {
    const startTime = performance.now();
    
    // Render floor tiles (covers entire office)
    if (this.options.enableFloorTiles) {
      this.renderFloorTiles(20, 15);
    }
    
    // Render each department
    departments.forEach(dept => {
      this.renderDepartment(dept);
    });
    
    // Render walls and structure
    if (this.options.enableWalls) {
      this.renderWalls(20, 15);
    }
    
    // Update performance stats
    this.renderStats.totalRenderTime = performance.now() - startTime;
    
    console.log('[DepartmentRenderer] Rendering complete:', this.renderStats);
  }
  
  /**
   * Render floor tiles covering the entire office area
   * @param {number} gridWidth - Width in grid cells
   * @param {number} gridHeight - Height in grid cells
   */
  renderFloorTiles(gridWidth, gridHeight) {
    const floorTiles = new PIXI.Graphics();
    
    for (let gridY = 0; gridY <= gridHeight; gridY++) {
      for (let gridX = 0; gridX <= gridWidth; gridX++) {
        // Calculate isometric position
        const pos = this.gridToIso(gridX, gridY);
        const x = pos.x + this.options.offsetX;
        const y = pos.y + this.options.offsetY;
        
        // Create diamond-shaped floor tile
        const tileSize = GRID_SIZE / ISO_RATIO;
        const tileHeight = GRID_SIZE / (ISO_RATIO * 2);
        
        // Alternate tile colors for checkerboard pattern
        const isLight = (gridX + gridY) % 2 === 0;
        const tileColor = isLight ? 0xE5E7EB : 0xD1D5DB;
        
        // Draw diamond tile
        floorTiles.moveTo(x, y);
        floorTiles.lineTo(x + tileSize, y + tileHeight);
        floorTiles.lineTo(x, y + tileHeight * 2);
        floorTiles.lineTo(x - tileSize, y + tileHeight);
        floorTiles.lineTo(x, y);
        floorTiles.fill({ color: tileColor, alpha: 1.0 });
        
        // Add subtle tile border
        floorTiles.moveTo(x, y);
        floorTiles.lineTo(x + tileSize, y + tileHeight);
        floorTiles.lineTo(x, y + tileHeight * 2);
        floorTiles.lineTo(x - tileSize, y + tileHeight);
        floorTiles.lineTo(x, y);
        floorTiles.stroke({ width: 0.5, color: 0x9CA3AF, alpha: 0.3 });
      }
    }
    
    this.scene.addToLayer('floor', floorTiles);
    this.renderedElements.set('floor_tiles', floorTiles);
    this.renderStats.floorsRendered++;
  }
  
  /**
   * Render a single department with all its elements
   * @param {Object} dept - Department definition
   */
  renderDepartment(dept) {
    const theme = DEPARTMENT_THEMES[dept.id];
    
    if (!theme) {
      console.warn(`[DepartmentRenderer] Unknown department: ${dept.id}`);
      return;
    }
    
    // Render department carpet
    if (this.options.enableCarpets) {
      this.renderCarpet(dept, theme);
    }
    
    // Render furniture
    if (this.options.enableFurniture) {
      this.renderFurniture(dept.id);
    }
    
    // Render department label
    this.renderDepartmentLabel(dept, theme);
  }
  
  /**
   * Render department carpet with theme colors
   * @param {Object} dept - Department definition
   * @param {Object} theme - Department theme
   */
  renderCarpet(dept, theme) {
    const carpet = new PIXI.Graphics();
    
    // Calculate carpet corners in isometric space
    const topLeft = this.gridToIso(dept.gridX, dept.gridY);
    const topRight = this.gridToIso(dept.gridX + dept.gridWidth, dept.gridY);
    const bottomRight = this.gridToIso(dept.gridX + dept.gridWidth, dept.gridY + dept.gridHeight);
    const bottomLeft = this.gridToIso(dept.gridX, dept.gridY + dept.gridHeight);
    
    // Draw carpet as filled isometric rectangle
    carpet.moveTo(topLeft.x, topLeft.y);
    carpet.lineTo(topRight.x, topRight.y);
    carpet.lineTo(bottomRight.x, bottomRight.y);
    carpet.lineTo(bottomLeft.x, bottomLeft.y);
    carpet.lineTo(topLeft.x, topLeft.y);
    carpet.fill({ color: theme.color, alpha: 0.15 });
    
    // Add carpet border
    carpet.moveTo(topLeft.x, topLeft.y);
    carpet.lineTo(topRight.x, topRight.y);
    carpet.lineTo(bottomRight.x, bottomRight.y);
    carpet.lineTo(bottomLeft.x, bottomLeft.y);
    carpet.lineTo(topLeft.x, topLeft.y);
    carpet.stroke({ width: 2, color: theme.color, alpha: 0.4 });
    
    // Add carpet texture pattern (diagonal lines)
    for (let i = 0; i < dept.gridWidth + dept.gridHeight; i++) {
      const startX = dept.gridX + Math.max(0, i - dept.gridHeight);
      const startY = dept.gridY + Math.max(0, dept.gridHeight - i);
      const endX = dept.gridX + Math.min(dept.gridWidth, i);
      const endY = dept.gridY + Math.min(dept.gridHeight, dept.gridHeight - (i - dept.gridWidth));
      
      if (i % 2 === 0) {
        const start = this.gridToIso(startX, startY);
        const end = this.gridToIso(endX, endY);
        carpet.moveTo(start.x, start.y);
        carpet.lineTo(end.x, end.y);
        carpet.stroke({ width: 0.5, color: theme.color, alpha: 0.1 });
      }
    }
    
    // Apply offset
    carpet.x = this.options.offsetX;
    carpet.y = this.options.offsetY;
    
    this.scene.addToLayer('floor_decorations', carpet);
    this.renderedElements.set(`carpet_${dept.id}`, carpet);
    this.renderStats.carpetsRendered++;
  }
  
  /**
   * Render furniture for a department
   * @param {string} departmentId - Department identifier
   */
  renderFurniture(departmentId) {
    const furnitureLayout = getLayoutForDepartment(departmentId);
    
    furnitureLayout.forEach((item, index) => {
      const furnitureType = getFurnitureType(item.type);
      
      if (!furnitureType) {
        console.warn(`[DepartmentRenderer] Unknown furniture type: ${item.type}`);
        return;
      }
      
      // Calculate isometric position
      const pos = this.gridToIso(item.gridX, item.gridY);
      const x = pos.x + this.options.offsetX;
      const y = pos.y + this.options.offsetY;
      
      // Create furniture sprite
      const furniture = this.createFurnitureSprite(furnitureType);
      
      // Position furniture
      furniture.x = x;
      furniture.y = y;
      
      // Apply rotation if specified
      if (item.rotation) {
        furniture.rotation = (item.rotation * Math.PI) / 180;
      }
      
      // Set zIndex for depth sorting
      furniture.zIndex = y;
      
      // Add to appropriate layer
      const layer = item.layer || furnitureType.defaultLayer;
      this.scene.addToLayer(layer, furniture);
      
      // Cache reference
      this.renderedElements.set(`furniture_${departmentId}_${index}`, furniture);
      this.renderStats.furnitureRendered++;
    });
  }
  
  /**
   * Create a furniture sprite based on type
   * @param {Object} furnitureType - Furniture type definition
   * @returns {PIXI.Graphics} Furniture sprite
   */
  createFurnitureSprite(furnitureType) {
    const furniture = new PIXI.Graphics();
    const width = furnitureType.width * (GRID_SIZE / ISO_RATIO);
    const height = furnitureType.height * (GRID_SIZE / (ISO_RATIO * 2));
    
    // Render based on furniture type
    switch (furnitureType.type) {
      case 'desk_simple':
      case 'desk_l_shape':
        this.drawFurnitureRect(furniture, 0, 0, width, height, furnitureType.color, 0x654321);
        break;
        
      case 'chair':
        furniture.circle(0, 0, 8);
        furniture.fill({ color: furnitureType.color, alpha: 0.9 });
        furniture.circle(0, 0, 8);
        furniture.stroke({ width: 1, color: 0x2D3748 });
        break;
        
      case 'whiteboard':
      case 'schedule_board':
        furniture.rect(-width / 2, -height / 2, width, height);
        furniture.fill({ color: furnitureType.color, alpha: 0.95 });
        furniture.rect(-width / 2, -height / 2, width, height);
        furniture.stroke({ width: 2, color: 0x2D3748 });
        break;
        
      case 'plant_small':
      case 'plant_large':
        const plantRadius = furnitureType.width * 10;
        furniture.circle(0, 0, plantRadius);
        furniture.fill({ color: furnitureType.color, alpha: 0.8 });
        furniture.circle(0, 0, plantRadius * 0.6);
        furniture.fill({ color: 0x2F855A, alpha: 0.9 });
        break;
        
      case 'filing_cabinet':
        furniture.rect(-width / 2, -height / 2, width, height);
        furniture.fill({ color: furnitureType.color, alpha: 0.9 });
        furniture.rect(-width / 2, -height / 2, width, height);
        furniture.stroke({ width: 1, color: 0x4A5568 });
        for (let i = 1; i < 3; i++) {
          const drawerY = -height / 2 + (height / 3) * i;
          furniture.moveTo(-width / 2, drawerY);
          furniture.lineTo(width / 2, drawerY);
          furniture.stroke({ width: 1, color: 0x2D3748 });
        }
        break;
        
      case 'bookshelf':
        furniture.rect(-width / 2, -height / 2, width, height);
        furniture.fill({ color: furnitureType.color, alpha: 0.9 });
        furniture.rect(-width / 2, -height / 2, width, height);
        furniture.stroke({ width: 1, color: 0x654321 });
        for (let i = 1; i < 4; i++) {
          const shelfY = -height / 2 + (height / 4) * i;
          furniture.moveTo(-width / 2, shelfY);
          furniture.lineTo(width / 2, shelfY);
          furniture.stroke({ width: 1, color: 0x654321 });
        }
        break;
        
      case 'monitor_stand':
        furniture.rect(-width / 2, -height / 2, width, height * 0.7);
        furniture.fill({ color: furnitureType.color, alpha: 0.95 });
        furniture.rect(-width / 2, -height / 2, width, height * 0.7);
        furniture.stroke({ width: 1, color: 0x1A202C });
        furniture.rect(-width / 4, height * 0.2, width / 2, height * 0.3);
        furniture.fill({ color: 0x4A5568, alpha: 0.9 });
        break;
        
      case 'meeting_table':
      case 'coffee_table':
        this.drawFurnitureRect(furniture, 0, 0, width, height, furnitureType.color, 0x654321);
        break;
        
      case 'water_cooler':
        furniture.circle(0, 0, 10);
        furniture.fill({ color: furnitureType.color, alpha: 0.8 });
        furniture.rect(-8, -5, 16, 10);
        furniture.fill({ color: 0xFFFFFF, alpha: 0.6 });
        furniture.circle(0, 0, 10);
        furniture.stroke({ width: 1, color: 0x2C5282 });
        break;
        
      case 'printer':
        furniture.rect(-width / 2, -height / 2, width, height);
        furniture.fill({ color: furnitureType.color, alpha: 0.9 });
        furniture.rect(-width / 2, -height / 2, width, height);
        furniture.stroke({ width: 1, color: 0x718096 });
        furniture.rect(-width / 3, height / 4, width * 0.6, height / 4);
        furniture.fill({ color: 0xFFFFFF, alpha: 0.8 });
        break;
        
      default:
        this.drawFurnitureRect(furniture, 0, 0, width, height, furnitureType.color, 0x2D3748);
    }
    
    return furniture;
  }
  
  /**
   * Draw furniture as isometric rectangle
   * @param {PIXI.Graphics} graphics - Graphics object
   * @param {number} centerX - Center X position
   * @param {number} centerY - Center Y position
   * @param {number} width - Width in pixels
   * @param {number} height - Height in pixels
   * @param {number} color - Fill color
   * @param {number} strokeColor - Stroke color
   */
  drawFurnitureRect(graphics, centerX, centerY, width, height, color, strokeColor) {
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    
    graphics.moveTo(centerX, centerY - halfHeight);
    graphics.lineTo(centerX + halfWidth, centerY);
    graphics.lineTo(centerX, centerY + halfHeight);
    graphics.lineTo(centerX - halfWidth, centerY);
    graphics.lineTo(centerX, centerY - halfHeight);
    graphics.fill({ color, alpha: 0.9 });
    
    graphics.moveTo(centerX, centerY - halfHeight);
    graphics.lineTo(centerX + halfWidth, centerY);
    graphics.lineTo(centerX, centerY + halfHeight);
    graphics.lineTo(centerX - halfWidth, centerY);
    graphics.lineTo(centerX, centerY - halfHeight);
    graphics.stroke({ width: 1, color: strokeColor });
  }
  
  /**
   * Render department label
   * @param {Object} dept - Department definition
   * @param {Object} theme - Department theme
   */
  renderDepartmentLabel(dept, theme) {
    const topLeft = this.gridToIso(dept.gridX, dept.gridY);
    
    // Department label
    const label = new PIXI.Text({
      text: theme.name,
      style: {
        fontFamily: 'Arial',
        fontSize: 14,
        fill: 0x1F2937,
        fontWeight: 'bold',
      }
    });
    label.x = topLeft.x + this.options.offsetX + 10;
    label.y = topLeft.y + this.options.offsetY + 10;
    this.scene.addToLayer('ui_world', label);
    
    // Department indicator
    const indicator = new PIXI.Graphics();
    indicator.circle(topLeft.x + this.options.offsetX + 5, topLeft.y + this.options.offsetY + 5, 4);
    indicator.fill({ color: theme.color });
    this.scene.addToLayer('ui_world', indicator);
    
    this.renderedElements.set(`label_${dept.id}`, label);
    this.renderedElements.set(`indicator_${dept.id}`, indicator);
  }
  
  /**
   * Render walls and office structure
   * @param {number} gridWidth - Width in grid cells
   * @param {number} gridHeight - Height in grid cells
   */
  renderWalls(gridWidth, gridHeight) {
    this.renderBackWalls(gridWidth, gridHeight);
    this.renderFrontWalls(gridWidth, gridHeight);
    this.renderDividers();
    this.renderStats.wallsRendered += 3;
  }
  
  /**
   * Render back walls (behind agents)
   * @param {number} gridWidth - Width in grid cells
   * @param {number} gridHeight - Height in grid cells
   */
  renderBackWalls(gridWidth, gridHeight) {
    const backWalls = new PIXI.Graphics();
    const wallHeight = 80;
    const wallColor = 0x9CA3AF;
    const wallDarkColor = 0x6B7280;
    
    // Top wall
    for (let x = 0; x <= gridWidth; x++) {
      const topLeft = this.gridToIso(x, 0);
      const topRight = this.gridToIso(x + 1, 0);
      
      backWalls.moveTo(topLeft.x, topLeft.y);
      backWalls.lineTo(topRight.x, topRight.y);
      backWalls.lineTo(topRight.x, topRight.y + wallHeight);
      backWalls.lineTo(topLeft.x, topLeft.y + wallHeight);
      backWalls.lineTo(topLeft.x, topLeft.y);
      backWalls.fill({ color: wallColor, alpha: 0.8 });
      
      backWalls.moveTo(topLeft.x, topLeft.y);
      backWalls.lineTo(topLeft.x, topLeft.y + wallHeight);
      backWalls.stroke({ width: 2, color: wallDarkColor, alpha: 0.3 });
    }
    
    // Left wall
    for (let y = 0; y <= gridHeight; y++) {
      const topLeft = this.gridToIso(0, y);
      const bottomLeft = this.gridToIso(0, y + 1);
      
      backWalls.moveTo(topLeft.x, topLeft.y);
      backWalls.lineTo(bottomLeft.x, bottomLeft.y);
      backWalls.lineTo(bottomLeft.x, bottomLeft.y + wallHeight);
      backWalls.lineTo(topLeft.x, topLeft.y + wallHeight);
      backWalls.lineTo(topLeft.x, topLeft.y);
      backWalls.fill({ color: wallDarkColor, alpha: 0.7 });
    }
    
    // Add windows
    for (let x = 2; x <= gridWidth - 2; x += 3) {
      const windowPos = this.gridToIso(x, 0);
      const windowWidth = 30;
      const windowHeight = 40;
      const windowY = windowPos.y + 20;
      
      backWalls.rect(windowPos.x - windowWidth / 2, windowY, windowWidth, windowHeight);
      backWalls.fill({ color: 0x60A5FA, alpha: 0.6 });
      backWalls.rect(windowPos.x - windowWidth / 2, windowY, windowWidth, windowHeight);
      backWalls.stroke({ width: 2, color: 0x374151 });
      
      backWalls.moveTo(windowPos.x, windowY);
      backWalls.lineTo(windowPos.x, windowY + windowHeight);
      backWalls.stroke({ width: 1, color: 0x374151 });
      
      backWalls.moveTo(windowPos.x - windowWidth / 2, windowY + windowHeight / 2);
      backWalls.lineTo(windowPos.x + windowWidth / 2, windowY + windowHeight / 2);
      backWalls.stroke({ width: 1, color: 0x374151 });
    }
    
    backWalls.x = this.options.offsetX;
    backWalls.y = this.options.offsetY;
    this.scene.addToLayer('walls_back', backWalls);
    this.renderedElements.set('back_walls', backWalls);
  }
  
  /**
   * Render front walls (in front of agents)
   * @param {number} gridWidth - Width in grid cells
   * @param {number} gridHeight - Height in grid cells
   */
  renderFrontWalls(gridWidth, gridHeight) {
    const frontWalls = new PIXI.Graphics();
    const wallHeight = 80;
    const wallColor = 0x9CA3AF;
    const wallDarkColor = 0x6B7280;
    
    // Right wall
    for (let y = 0; y <= gridHeight; y++) {
      const topRight = this.gridToIso(gridWidth, y);
      const bottomRight = this.gridToIso(gridWidth, y + 1);
      
      frontWalls.moveTo(topRight.x, topRight.y);
      frontWalls.lineTo(bottomRight.x, bottomRight.y);
      frontWalls.lineTo(bottomRight.x, bottomRight.y + wallHeight);
      frontWalls.lineTo(topRight.x, topRight.y + wallHeight);
      frontWalls.lineTo(topRight.x, topRight.y);
      frontWalls.fill({ color: wallColor, alpha: 0.8 });
      
      frontWalls.moveTo(topRight.x, topRight.y);
      frontWalls.lineTo(topRight.x, topRight.y + wallHeight);
      frontWalls.stroke({ width: 2, color: 0xF3F4F6, alpha: 0.3 });
    }
    
    // Bottom wall
    for (let x = 0; x <= gridWidth; x++) {
      const bottomLeft = this.gridToIso(x, gridHeight);
      const bottomRight = this.gridToIso(x + 1, gridHeight);
      
      frontWalls.moveTo(bottomLeft.x, bottomLeft.y);
      frontWalls.lineTo(bottomRight.x, bottomRight.y);
      frontWalls.lineTo(bottomRight.x, bottomRight.y + wallHeight);
      frontWalls.lineTo(bottomLeft.x, bottomLeft.y + wallHeight);
      frontWalls.lineTo(bottomLeft.x, bottomLeft.y);
      frontWalls.fill({ color: wallDarkColor, alpha: 0.7 });
    }
    
    // Add entrance door
    const doorPos = this.gridToIso(gridWidth / 2, gridHeight);
    const doorWidth = 40;
    const doorHeight = 70;
    
    frontWalls.rect(doorPos.x - doorWidth / 2, doorPos.y + 10, doorWidth, doorHeight);
    frontWalls.fill({ color: 0x374151, alpha: 0.9 });
    
    frontWalls.circle(doorPos.x + doorWidth / 4, doorPos.y + doorHeight / 2 + 10, 3);
    frontWalls.fill({ color: 0xFBBF24 });
    
    frontWalls.x = this.options.offsetX;
    frontWalls.y = this.options.offsetY;
    this.scene.addToLayer('walls_front', frontWalls);
    this.renderedElements.set('front_walls', frontWalls);
  }
  
  /**
   * Render department dividers
   */
  renderDividers() {
    const dividers = new PIXI.Graphics();
    const dividerHeight = 60;
    const dividerColor = 0xD1D5DB;
    
    // Divider positions (hardcoded for now - could be made configurable)
    const dividerDefs = [
      { start: [8, 2], end: [8, 7] },
      { start: [2, 7], end: [7, 7] },
      { start: [14, 2], end: [14, 13] }
    ];
    
    dividerDefs.forEach(def => {
      const start = this.gridToIso(def.start[0], def.start[1]);
      const end = this.gridToIso(def.end[0], def.end[1]);
      
      dividers.moveTo(start.x, start.y);
      dividers.lineTo(end.x, end.y);
      dividers.lineTo(end.x, end.y + dividerHeight);
      dividers.lineTo(start.x, start.y + dividerHeight);
      dividers.lineTo(start.x, start.y);
      dividers.fill({ color: dividerColor, alpha: 0.6 });
      dividers.stroke({ width: 1, color: 0x9CA3AF });
    });
    
    dividers.x = this.options.offsetX;
    dividers.y = this.options.offsetY;
    this.scene.addToLayer('walls_back', dividers);
    this.renderedElements.set('dividers', dividers);
  }
  
  /**
   * Get department theme by ID
   * @param {string} departmentId - Department identifier
   * @returns {Object} Department theme
   */
  getDepartmentTheme(departmentId) {
    return DEPARTMENT_THEMES[departmentId] || null;
  }
  
  /**
   * Get all department themes
   * @returns {Object} All department themes
   */
  getAllThemes() {
    return DEPARTMENT_THEMES;
  }
  
  /**
   * Get rendering statistics
   * @returns {Object} Render stats
   */
  getStats() {
    return { ...this.renderStats };
  }
  
  /**
   * Clear all rendered elements
   */
  clear() {
    this.renderedElements.forEach((element, key) => {
      if (element.parent) {
        element.parent.removeChild(element);
      }
      element.destroy();
    });
    
    this.renderedElements.clear();
    
    // Reset stats
    this.renderStats = {
      floorsRendered: 0,
      carpetsRendered: 0,
      wallsRendered: 0,
      furnitureRendered: 0,
      totalRenderTime: 0
    };
  }
  
  /**
   * Destroy the renderer and clean up resources
   */
  destroy() {
    this.clear();
    this.scene = null;
    this.options = null;
  }
}

export default DepartmentRenderer;
