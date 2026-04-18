/**
 * Entity System Index - Exports entity system classes and utilities
 * 
 * Provides centralized access to the entity system.
 * 
 * Phase 2, Tasks 7-11
 */

export { default as Entity } from './Entity.js';
export { default as EntityRegistry } from './EntityRegistry.js';
export { default as AgentEntity, AgentType, AgentState, createAgent } from './AgentEntity.js';
export { 
  default as EnvironmentEntity, 
  EnvironmentType, 
  WorkstationConfig,
  createEnvironment,
  createWorkstation,
  getAllEnvironmentTypes,
  getEnvironmentMetadata,
  getAllWorkstationTypes,
  getWorkstationConfig
} from './EnvironmentEntity.js';
export {
  default as DepartmentEntity,
  DepartmentType,
  DEFAULT_DEPARTMENT_LAYOUT,
  createDepartment,
  createAllDepartments,
  getAllDepartmentTypes,
  getDepartmentMetadata,
  getDepartmentLayout,
  findDepartmentAtPoint,
  findDepartmentAtGridCell
} from './DepartmentEntity.js';
export {
  default as TaskEntity,
  TaskType,
  TaskStatus,
  createTaskFromPost,
  createTaskFromConversation
} from './TaskEntity.js';
export * from './components/index.js';
