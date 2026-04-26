/**
 * FurnitureLayout.js - Department Furniture Layout Definitions
 * 
 * Defines furniture placement for each department in the office.
 * Each furniture item includes:
 * - type: Furniture sprite identifier
 * - gridX, gridY: Position in grid coordinates
 * - rotation: Rotation angle in degrees (0, 90, 180, 270)
 * - layer: Rendering layer ('furniture_back' or 'furniture_front')
 * 
 * Phase 2, Task 2.3: Furniture Layout System
 */

/**
 * Furniture type definitions
 * Maps furniture types to visual properties
 */
export const FurnitureTypes = {
  // Desks
  DESK_SIMPLE: {
    type: 'desk_simple',
    width: 1,
    height: 1,
    color: 0x8B4513, // Brown
    defaultLayer: 'furniture_back'
  },
  DESK_L_SHAPE: {
    type: 'desk_l_shape',
    width: 2,
    height: 2,
    color: 0x8B4513,
    defaultLayer: 'furniture_back'
  },
  
  // Chairs
  CHAIR: {
    type: 'chair',
    width: 0.5,
    height: 0.5,
    color: 0x4A5568,
    defaultLayer: 'furniture_back'
  },
  
  // Storage
  FILING_CABINET: {
    type: 'filing_cabinet',
    width: 0.5,
    height: 1,
    color: 0x718096,
    defaultLayer: 'furniture_back'
  },
  BOOKSHELF: {
    type: 'bookshelf',
    width: 1,
    height: 0.5,
    color: 0x8B4513,
    defaultLayer: 'furniture_back'
  },
  
  // Displays
  WHITEBOARD: {
    type: 'whiteboard',
    width: 2,
    height: 0.3,
    color: 0xF7FAFC,
    defaultLayer: 'furniture_back'
  },
  MONITOR_STAND: {
    type: 'monitor_stand',
    width: 1,
    height: 0.5,
    color: 0x2D3748,
    defaultLayer: 'furniture_back'
  },
  SCHEDULE_BOARD: {
    type: 'schedule_board',
    width: 1.5,
    height: 0.3,
    color: 0xE2E8F0,
    defaultLayer: 'furniture_back'
  },
  
  // Plants and Decorations
  PLANT_SMALL: {
    type: 'plant_small',
    width: 0.5,
    height: 0.5,
    color: 0x48BB78,
    defaultLayer: 'furniture_back'
  },
  PLANT_LARGE: {
    type: 'plant_large',
    width: 1,
    height: 1,
    color: 0x38A169,
    defaultLayer: 'furniture_back'
  },
  
  // Meeting/Collaboration
  MEETING_TABLE: {
    type: 'meeting_table',
    width: 2,
    height: 1.5,
    color: 0x8B4513,
    defaultLayer: 'furniture_back'
  },
  COFFEE_TABLE: {
    type: 'coffee_table',
    width: 1,
    height: 1,
    color: 0x8B4513,
    defaultLayer: 'furniture_back'
  },
  
  // Special Items
  WATER_COOLER: {
    type: 'water_cooler',
    width: 0.5,
    height: 0.5,
    color: 0x4299E1,
    defaultLayer: 'furniture_back'
  },
  PRINTER: {
    type: 'printer',
    width: 1,
    height: 0.8,
    color: 0xA0AEC0,
    defaultLayer: 'furniture_back'
  },
  
  // Decorations - Task 2.5
  COMPUTER: {
    type: 'computer',
    width: 0.4,
    height: 0.3,
    color: 0x2D3748,
    defaultLayer: 'furniture_back'
  },
  MONITOR: {
    type: 'monitor',
    width: 0.5,
    height: 0.4,
    color: 0x1A202C,
    defaultLayer: 'furniture_back'
  },
  COFFEE_MUG: {
    type: 'coffee_mug',
    width: 0.2,
    height: 0.2,
    color: 0x8B4513,
    defaultLayer: 'furniture_back'
  },
  WALL_POSTER: {
    type: 'wall_poster',
    width: 0.8,
    height: 1,
    color: 0xF7FAFC,
    defaultLayer: 'furniture_back'
  },
  WALL_CHART: {
    type: 'wall_chart',
    width: 1,
    height: 0.8,
    color: 0xFED7AA,
    defaultLayer: 'furniture_back'
  },
  DESK_LAMP: {
    type: 'desk_lamp',
    width: 0.3,
    height: 0.4,
    color: 0xFBBF24,
    defaultLayer: 'furniture_back'
  },
  KEYBOARD: {
    type: 'keyboard',
    width: 0.4,
    height: 0.2,
    color: 0x4A5568,
    defaultLayer: 'furniture_back'
  },
  NOTEBOOK: {
    type: 'notebook',
    width: 0.3,
    height: 0.2,
    color: 0x3B82F6,
    defaultLayer: 'furniture_back'
  },
  PENCIL_HOLDER: {
    type: 'pencil_holder',
    width: 0.2,
    height: 0.2,
    color: 0x6B7280,
    defaultLayer: 'furniture_back'
  },
  WALL_CLOCK: {
    type: 'wall_clock',
    width: 0.5,
    height: 0.5,
    color: 0xE5E7EB,
    defaultLayer: 'furniture_back'
  },
  INSPIRATION_BOARD: {
    type: 'inspiration_board',
    width: 1.5,
    height: 1,
    color: 0xFDE68A,
    defaultLayer: 'furniture_back'
  },
  TREND_CHART: {
    type: 'trend_chart',
    width: 1.2,
    height: 0.8,
    color: 0xFBBF24,
    defaultLayer: 'furniture_back'
  },
  FAQ_POSTER: {
    type: 'faq_poster',
    width: 1,
    height: 1.2,
    color: 0xC4B5FD,
    defaultLayer: 'furniture_back'
  },
  HEADSET: {
    type: 'headset',
    width: 0.3,
    height: 0.3,
    color: 0x6B7280,
    defaultLayer: 'furniture_back'
  },
  CALENDAR: {
    type: 'calendar',
    width: 0.6,
    height: 0.4,
    color: 0xF3F4F6,
    defaultLayer: 'furniture_back'
  }
};

/**
 * Department furniture layouts
 * Each department has a unique furniture arrangement
 */
export const DepartmentLayouts = {
  /**
   * Content Creation Department
   * Theme: Creative workspace with whiteboards, inspiration boards, plants
   * Focus: Brainstorming and content ideation
   */
  content_creation: [
    // Workstations (3 desks with chairs)
    { type: 'DESK_SIMPLE', gridX: 3, gridY: 3, rotation: 0, layer: 'furniture_back' },
    { type: 'CHAIR', gridX: 3, gridY: 3.8, rotation: 180, layer: 'furniture_back' },
    
    { type: 'DESK_SIMPLE', gridX: 5, gridY: 3, rotation: 0, layer: 'furniture_back' },
    { type: 'CHAIR', gridX: 5, gridY: 3.8, rotation: 180, layer: 'furniture_back' },
    
    { type: 'DESK_SIMPLE', gridX: 3, gridY: 5, rotation: 0, layer: 'furniture_back' },
    { type: 'CHAIR', gridX: 3, gridY: 5.8, rotation: 180, layer: 'furniture_back' },
    
    // Whiteboards for brainstorming
    { type: 'WHITEBOARD', gridX: 2.5, gridY: 2.2, rotation: 0, layer: 'furniture_back' },
    { type: 'WHITEBOARD', gridX: 5.5, gridY: 2.2, rotation: 0, layer: 'furniture_back' },
    
    // Plants for creative atmosphere
    { type: 'PLANT_LARGE', gridX: 7, gridY: 4, rotation: 0, layer: 'furniture_back' },
    { type: 'PLANT_SMALL', gridX: 2.5, gridY: 6, rotation: 0, layer: 'furniture_back' },
    { type: 'PLANT_SMALL', gridX: 6.5, gridY: 3, rotation: 0, layer: 'furniture_back' },
    
    // Coffee table for casual meetings
    { type: 'COFFEE_TABLE', gridX: 6, gridY: 5.5, rotation: 0, layer: 'furniture_back' },
    
    // Bookshelf with inspiration materials
    { type: 'BOOKSHELF', gridX: 2.5, gridY: 4, rotation: 0, layer: 'furniture_back' },
    
    // Desk decorations - Task 2.5
    { type: 'COMPUTER', gridX: 3, gridY: 2.8, rotation: 0, layer: 'furniture_back' },
    { type: 'KEYBOARD', gridX: 3, gridY: 3.1, rotation: 0, layer: 'furniture_back' },
    { type: 'COFFEE_MUG', gridX: 3.3, gridY: 2.9, rotation: 0, layer: 'furniture_back' },
    { type: 'NOTEBOOK', gridX: 2.7, gridY: 3, rotation: 0, layer: 'furniture_back' },
    
    { type: 'COMPUTER', gridX: 5, gridY: 2.8, rotation: 0, layer: 'furniture_back' },
    { type: 'KEYBOARD', gridX: 5, gridY: 3.1, rotation: 0, layer: 'furniture_back' },
    { type: 'DESK_LAMP', gridX: 5.4, gridY: 2.8, rotation: 0, layer: 'furniture_back' },
    { type: 'PENCIL_HOLDER', gridX: 4.7, gridY: 2.9, rotation: 0, layer: 'furniture_back' },
    
    { type: 'COMPUTER', gridX: 3, gridY: 4.8, rotation: 0, layer: 'furniture_back' },
    { type: 'KEYBOARD', gridX: 3, gridY: 5.1, rotation: 0, layer: 'furniture_back' },
    { type: 'COFFEE_MUG', gridX: 3.3, gridY: 4.9, rotation: 0, layer: 'furniture_back' },
    
    // Wall decorations
    { type: 'INSPIRATION_BOARD', gridX: 4, gridY: 2.1, rotation: 0, layer: 'furniture_back' },
    { type: 'WALL_POSTER', gridX: 6.5, gridY: 2.3, rotation: 0, layer: 'furniture_back' },
    { type: 'WALL_CLOCK', gridX: 2, gridY: 2.5, rotation: 0, layer: 'furniture_back' }
  ],
  
  /**
   * Publishing Department
   * Theme: Multiple monitor setups, publishing schedule boards
   * Focus: Content scheduling and publishing
   */
  publishing: [
    // Workstations with monitor stands (4 desks)
    { type: 'DESK_SIMPLE', gridX: 10, gridY: 3, rotation: 0, layer: 'furniture_back' },
    { type: 'MONITOR_STAND', gridX: 10, gridY: 2.7, rotation: 0, layer: 'furniture_back' },
    { type: 'CHAIR', gridX: 10, gridY: 3.8, rotation: 180, layer: 'furniture_back' },
    
    { type: 'DESK_SIMPLE', gridX: 12, gridY: 3, rotation: 0, layer: 'furniture_back' },
    { type: 'MONITOR_STAND', gridX: 12, gridY: 2.7, rotation: 0, layer: 'furniture_back' },
    { type: 'CHAIR', gridX: 12, gridY: 3.8, rotation: 180, layer: 'furniture_back' },
    
    { type: 'DESK_SIMPLE', gridX: 10, gridY: 5, rotation: 0, layer: 'furniture_back' },
    { type: 'MONITOR_STAND', gridX: 10, gridY: 4.7, rotation: 0, layer: 'furniture_back' },
    { type: 'CHAIR', gridX: 10, gridY: 5.8, rotation: 180, layer: 'furniture_back' },
    
    { type: 'DESK_SIMPLE', gridX: 12, gridY: 5, rotation: 0, layer: 'furniture_back' },
    { type: 'MONITOR_STAND', gridX: 12, gridY: 4.7, rotation: 0, layer: 'furniture_back' },
    { type: 'CHAIR', gridX: 12, gridY: 5.8, rotation: 180, layer: 'furniture_back' },
    
    // Publishing schedule boards
    { type: 'SCHEDULE_BOARD', gridX: 9.5, gridY: 2.2, rotation: 0, layer: 'furniture_back' },
    { type: 'SCHEDULE_BOARD', gridX: 11.5, gridY: 2.2, rotation: 0, layer: 'furniture_back' },
    
    // Printer for publishing materials
    { type: 'PRINTER', gridX: 13, gridY: 4, rotation: 0, layer: 'furniture_back' },
    
    // Small plant
    { type: 'PLANT_SMALL', gridX: 9.5, gridY: 6, rotation: 0, layer: 'furniture_back' },
    { type: 'PLANT_SMALL', gridX: 13, gridY: 6, rotation: 0, layer: 'furniture_back' },
    
    // Desk decorations - Task 2.5
    { type: 'KEYBOARD', gridX: 10, gridY: 3.1, rotation: 0, layer: 'furniture_back' },
    { type: 'COFFEE_MUG', gridX: 10.3, gridY: 2.9, rotation: 0, layer: 'furniture_back' },
    { type: 'CALENDAR', gridX: 9.7, gridY: 2.8, rotation: 0, layer: 'furniture_back' },
    
    { type: 'KEYBOARD', gridX: 12, gridY: 3.1, rotation: 0, layer: 'furniture_back' },
    { type: 'NOTEBOOK', gridX: 12.3, gridY: 3, rotation: 0, layer: 'furniture_back' },
    { type: 'PENCIL_HOLDER', gridX: 11.7, gridY: 2.9, rotation: 0, layer: 'furniture_back' },
    
    { type: 'KEYBOARD', gridX: 10, gridY: 5.1, rotation: 0, layer: 'furniture_back' },
    { type: 'COFFEE_MUG', gridX: 10.3, gridY: 4.9, rotation: 0, layer: 'furniture_back' },
    { type: 'DESK_LAMP', gridX: 9.7, gridY: 4.8, rotation: 0, layer: 'furniture_back' },
    
    { type: 'KEYBOARD', gridX: 12, gridY: 5.1, rotation: 0, layer: 'furniture_back' },
    { type: 'CALENDAR', gridX: 12.3, gridY: 4.8, rotation: 0, layer: 'furniture_back' },
    
    // Wall decorations
    { type: 'WALL_CLOCK', gridX: 13, gridY: 2.5, rotation: 0, layer: 'furniture_back' },
    { type: 'WALL_CHART', gridX: 9, gridY: 2.3, rotation: 0, layer: 'furniture_back' }
  ],
  
  /**
   * Trend Analysis Department
   * Theme: Data visualization displays, charts, research materials
   * Focus: Data analysis and trend research
   */
  trend_analysis: [
    // Workstations (3 desks with L-shape for data work)
    { type: 'DESK_L_SHAPE', gridX: 3, gridY: 9, rotation: 0, layer: 'furniture_back' },
    { type: 'CHAIR', gridX: 3.5, gridY: 10, rotation: 180, layer: 'furniture_back' },
    
    { type: 'DESK_SIMPLE', gridX: 5.5, gridY: 9, rotation: 0, layer: 'furniture_back' },
    { type: 'CHAIR', gridX: 5.5, gridY: 9.8, rotation: 180, layer: 'furniture_back' },
    
    { type: 'DESK_SIMPLE', gridX: 3, gridY: 11, rotation: 0, layer: 'furniture_back' },
    { type: 'CHAIR', gridX: 3, gridY: 11.8, rotation: 180, layer: 'furniture_back' },
    
    // Data visualization boards
    { type: 'WHITEBOARD', gridX: 2.5, gridY: 8.2, rotation: 0, layer: 'furniture_back' },
    { type: 'WHITEBOARD', gridX: 5, gridY: 8.2, rotation: 0, layer: 'furniture_back' },
    
    // Bookshelf with research materials
    { type: 'BOOKSHELF', gridX: 6, gridY: 10, rotation: 0, layer: 'furniture_back' },
    { type: 'BOOKSHELF', gridX: 6, gridY: 11, rotation: 0, layer: 'furniture_back' },
    
    // Coffee station for long analysis sessions
    { type: 'COFFEE_TABLE', gridX: 5.5, gridY: 11.5, rotation: 0, layer: 'furniture_back' },
    { type: 'WATER_COOLER', gridX: 6.2, gridY: 11.5, rotation: 0, layer: 'furniture_back' },
    
    // Plant
    { type: 'PLANT_SMALL', gridX: 2.5, gridY: 12, rotation: 0, layer: 'furniture_back' },
    { type: 'PLANT_SMALL', gridX: 6.5, gridY: 9, rotation: 0, layer: 'furniture_back' },
    
    // Desk decorations - Task 2.5
    { type: 'MONITOR', gridX: 3, gridY: 8.8, rotation: 0, layer: 'furniture_back' },
    { type: 'MONITOR', gridX: 4, gridY: 8.8, rotation: 0, layer: 'furniture_back' },
    { type: 'KEYBOARD', gridX: 3.5, gridY: 9.2, rotation: 0, layer: 'furniture_back' },
    { type: 'COFFEE_MUG', gridX: 4.3, gridY: 9, rotation: 0, layer: 'furniture_back' },
    { type: 'NOTEBOOK', gridX: 2.7, gridY: 9.1, rotation: 0, layer: 'furniture_back' },
    
    { type: 'MONITOR', gridX: 5.5, gridY: 8.8, rotation: 0, layer: 'furniture_back' },
    { type: 'KEYBOARD', gridX: 5.5, gridY: 9.1, rotation: 0, layer: 'furniture_back' },
    { type: 'COFFEE_MUG', gridX: 5.8, gridY: 8.9, rotation: 0, layer: 'furniture_back' },
    { type: 'PENCIL_HOLDER', gridX: 5.2, gridY: 8.9, rotation: 0, layer: 'furniture_back' },
    
    { type: 'COMPUTER', gridX: 3, gridY: 10.8, rotation: 0, layer: 'furniture_back' },
    { type: 'KEYBOARD', gridX: 3, gridY: 11.1, rotation: 0, layer: 'furniture_back' },
    { type: 'DESK_LAMP', gridX: 3.4, gridY: 10.8, rotation: 0, layer: 'furniture_back' },
    
    // Wall decorations - trend charts
    { type: 'TREND_CHART', gridX: 4, gridY: 8.1, rotation: 0, layer: 'furniture_back' },
    { type: 'WALL_CHART', gridX: 6.5, gridY: 8.3, rotation: 0, layer: 'furniture_back' },
    { type: 'WALL_CLOCK', gridX: 2, gridY: 8.5, rotation: 0, layer: 'furniture_back' }
  ],
  
  /**
   * Customer Support Department
   * Theme: Headset stations, support ticket boards, comfortable seating
   * Focus: Customer service and support
   */
  customer_support: [
    // Support workstations (4 desks)
    { type: 'DESK_SIMPLE', gridX: 9, gridY: 9, rotation: 0, layer: 'furniture_back' },
    { type: 'CHAIR', gridX: 9, gridY: 9.8, rotation: 180, layer: 'furniture_back' },
    
    { type: 'DESK_SIMPLE', gridX: 11, gridY: 9, rotation: 0, layer: 'furniture_back' },
    { type: 'CHAIR', gridX: 11, gridY: 9.8, rotation: 180, layer: 'furniture_back' },
    
    { type: 'DESK_SIMPLE', gridX: 9, gridY: 11, rotation: 0, layer: 'furniture_back' },
    { type: 'CHAIR', gridX: 9, gridY: 11.8, rotation: 180, layer: 'furniture_back' },
    
    { type: 'DESK_SIMPLE', gridX: 11, gridY: 11, rotation: 0, layer: 'furniture_back' },
    { type: 'CHAIR', gridX: 11, gridY: 11.8, rotation: 180, layer: 'furniture_back' },
    
    // Support ticket boards
    { type: 'SCHEDULE_BOARD', gridX: 8.5, gridY: 8.2, rotation: 0, layer: 'furniture_back' },
    { type: 'SCHEDULE_BOARD', gridX: 10.5, gridY: 8.2, rotation: 0, layer: 'furniture_back' },
    
    // Filing cabinets for documentation
    { type: 'FILING_CABINET', gridX: 13, gridY: 9, rotation: 0, layer: 'furniture_back' },
    { type: 'FILING_CABINET', gridX: 13, gridY: 10, rotation: 0, layer: 'furniture_back' },
    
    // Water cooler for breaks
    { type: 'WATER_COOLER', gridX: 12.5, gridY: 11.5, rotation: 0, layer: 'furniture_back' },
    
    // Plants for calming atmosphere
    { type: 'PLANT_SMALL', gridX: 8.5, gridY: 12, rotation: 0, layer: 'furniture_back' },
    { type: 'PLANT_SMALL', gridX: 12.5, gridY: 12, rotation: 0, layer: 'furniture_back' },
    { type: 'PLANT_SMALL', gridX: 12.5, gridY: 9, rotation: 0, layer: 'furniture_back' },
    
    // Desk decorations - Task 2.5 (headsets for support)
    { type: 'COMPUTER', gridX: 9, gridY: 8.8, rotation: 0, layer: 'furniture_back' },
    { type: 'KEYBOARD', gridX: 9, gridY: 9.1, rotation: 0, layer: 'furniture_back' },
    { type: 'HEADSET', gridX: 9.3, gridY: 8.9, rotation: 0, layer: 'furniture_back' },
    { type: 'COFFEE_MUG', gridX: 8.7, gridY: 8.9, rotation: 0, layer: 'furniture_back' },
    
    { type: 'COMPUTER', gridX: 11, gridY: 8.8, rotation: 0, layer: 'furniture_back' },
    { type: 'KEYBOARD', gridX: 11, gridY: 9.1, rotation: 0, layer: 'furniture_back' },
    { type: 'HEADSET', gridX: 11.3, gridY: 8.9, rotation: 0, layer: 'furniture_back' },
    { type: 'NOTEBOOK', gridX: 10.7, gridY: 9, rotation: 0, layer: 'furniture_back' },
    
    { type: 'COMPUTER', gridX: 9, gridY: 10.8, rotation: 0, layer: 'furniture_back' },
    { type: 'KEYBOARD', gridX: 9, gridY: 11.1, rotation: 0, layer: 'furniture_back' },
    { type: 'HEADSET', gridX: 9.3, gridY: 10.9, rotation: 0, layer: 'furniture_back' },
    { type: 'DESK_LAMP', gridX: 8.7, gridY: 10.8, rotation: 0, layer: 'furniture_back' },
    
    { type: 'COMPUTER', gridX: 11, gridY: 10.8, rotation: 0, layer: 'furniture_back' },
    { type: 'KEYBOARD', gridX: 11, gridY: 11.1, rotation: 0, layer: 'furniture_back' },
    { type: 'HEADSET', gridX: 11.3, gridY: 10.9, rotation: 0, layer: 'furniture_back' },
    { type: 'COFFEE_MUG', gridX: 10.7, gridY: 10.9, rotation: 0, layer: 'furniture_back' },
    
    // Wall decorations - FAQ posters
    { type: 'FAQ_POSTER', gridX: 12.5, gridY: 8.3, rotation: 0, layer: 'furniture_back' },
    { type: 'WALL_CLOCK', gridX: 8, gridY: 8.5, rotation: 0, layer: 'furniture_back' }
  ],
  
  /**
   * Administration Department
   * Theme: Executive desks, filing cabinets, meeting area
   * Focus: Management and administration
   */
  administration: [
    // Executive desk (L-shape)
    { type: 'DESK_L_SHAPE', gridX: 16, gridY: 3, rotation: 0, layer: 'furniture_back' },
    { type: 'CHAIR', gridX: 16.5, gridY: 4, rotation: 180, layer: 'furniture_back' },
    
    // Assistant desk
    { type: 'DESK_SIMPLE', gridX: 16, gridY: 6, rotation: 0, layer: 'furniture_back' },
    { type: 'CHAIR', gridX: 16, gridY: 6.8, rotation: 180, layer: 'furniture_back' },
    
    // Meeting table
    { type: 'MEETING_TABLE', gridX: 16, gridY: 9, rotation: 0, layer: 'furniture_back' },
    { type: 'CHAIR', gridX: 15.5, gridY: 9.5, rotation: 90, layer: 'furniture_back' },
    { type: 'CHAIR', gridX: 17.5, gridY: 9.5, rotation: 270, layer: 'furniture_back' },
    { type: 'CHAIR', gridX: 16.5, gridY: 8.5, rotation: 0, layer: 'furniture_back' },
    { type: 'CHAIR', gridX: 16.5, gridY: 10.5, rotation: 180, layer: 'furniture_back' },
    
    // Filing cabinets for records
    { type: 'FILING_CABINET', gridX: 18, gridY: 3, rotation: 0, layer: 'furniture_back' },
    { type: 'FILING_CABINET', gridX: 18, gridY: 4, rotation: 0, layer: 'furniture_back' },
    { type: 'FILING_CABINET', gridX: 18, gridY: 5, rotation: 0, layer: 'furniture_back' },
    
    // Bookshelf with professional materials
    { type: 'BOOKSHELF', gridX: 15.5, gridY: 11.5, rotation: 0, layer: 'furniture_back' },
    
    // Executive plant
    { type: 'PLANT_LARGE', gridX: 18, gridY: 11, rotation: 0, layer: 'furniture_back' },
    { type: 'PLANT_SMALL', gridX: 15.5, gridY: 6, rotation: 0, layer: 'furniture_back' },
    
    // Water cooler
    { type: 'WATER_COOLER', gridX: 15.5, gridY: 7, rotation: 0, layer: 'furniture_back' },
    
    // Desk decorations - Task 2.5 (executive setup)
    { type: 'MONITOR', gridX: 16, gridY: 2.8, rotation: 0, layer: 'furniture_back' },
    { type: 'MONITOR', gridX: 17, gridY: 2.8, rotation: 0, layer: 'furniture_back' },
    { type: 'KEYBOARD', gridX: 16.5, gridY: 3.2, rotation: 0, layer: 'furniture_back' },
    { type: 'DESK_LAMP', gridX: 17.3, gridY: 3, rotation: 0, layer: 'furniture_back' },
    { type: 'COFFEE_MUG', gridX: 15.7, gridY: 3, rotation: 0, layer: 'furniture_back' },
    { type: 'PENCIL_HOLDER', gridX: 16, gridY: 3.5, rotation: 0, layer: 'furniture_back' },
    
    { type: 'COMPUTER', gridX: 16, gridY: 5.8, rotation: 0, layer: 'furniture_back' },
    { type: 'KEYBOARD', gridX: 16, gridY: 6.1, rotation: 0, layer: 'furniture_back' },
    { type: 'CALENDAR', gridX: 16.3, gridY: 5.8, rotation: 0, layer: 'furniture_back' },
    { type: 'NOTEBOOK', gridX: 15.7, gridY: 6, rotation: 0, layer: 'furniture_back' },
    
    // Wall decorations - professional
    { type: 'WALL_CLOCK', gridX: 15, gridY: 2.5, rotation: 0, layer: 'furniture_back' },
    { type: 'WALL_CHART', gridX: 17.5, gridY: 2.3, rotation: 0, layer: 'furniture_back' },
    { type: 'WALL_POSTER', gridX: 15.5, gridY: 8.3, rotation: 0, layer: 'furniture_back' }
  ]
};

/**
 * Get furniture layout for a specific department
 * @param {string} departmentId - Department identifier
 * @returns {Array} Array of furniture items
 */
export function getLayoutForDepartment(departmentId) {
  return DepartmentLayouts[departmentId] || [];
}

/**
 * Get all department layouts
 * @returns {Object} All department layouts
 */
export function getAllLayouts() {
  return DepartmentLayouts;
}

/**
 * Get furniture type definition
 * @param {string} type - Furniture type identifier
 * @returns {Object} Furniture type definition
 */
export function getFurnitureType(type) {
  return FurnitureTypes[type] || null;
}

/**
 * Get all furniture types
 * @returns {Object} All furniture type definitions
 */
export function getAllFurnitureTypes() {
  return FurnitureTypes;
}

export default {
  FurnitureTypes,
  DepartmentLayouts,
  getLayoutForDepartment,
  getAllLayouts,
  getFurnitureType,
  getAllFurnitureTypes
};
