import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';
import type { Objective, Task } from '../types';
import type { LearningSystem } from '../services/learningSystem';

export interface ObjectivesState {
  objectives: Record<string, Objective>;
  selectedObjectiveId: string | null;
  filteredObjectives: Objective[];
  objectiveFilters: {
    status: 'all' | 'active' | 'completed' | 'failed';
    priority: 'all' | 'high' | 'medium' | 'low';
    category: string | null;
  };
  learningSystem: LearningSystem | null;
}

export interface ObjectivesActions {
  // Objective CRUD operations
  addObjective: (objective: Omit<Objective, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateObjective: (id: string, updates: Partial<Objective>) => void;
  deleteObjective: (id: string) => void;
  getObjective: (id: string) => Objective | null;
  
  // Status management
  updateObjectiveStatus: (id: string, status: Objective['status']) => void;
  markObjectiveComplete: (id: string, results?: any) => void;
  markObjectiveFailed: (id: string, error?: string) => void;
  
  // Task management
  addTaskToObjective: (objectiveId: string, task: Omit<Task, 'id' | 'objectiveId' | 'createdAt'>) => string;
  updateTask: (objectiveId: string, taskId: string, updates: Partial<Task>) => void;
  removeTaskFromObjective: (objectiveId: string, taskId: string) => void;
  completeTask: (objectiveId: string, taskId: string, results?: any) => void;
  
  // Filtering and selection
  setSelectedObjective: (id: string | null) => void;
  setObjectiveFilters: (filters: Partial<ObjectivesState['objectiveFilters']>) => void;
  clearObjectiveFilters: () => void;
  
  // Learning integration
  setLearningSystem: (learningSystem: LearningSystem) => void;
  applyLearningInsights: (objectiveId: string) => Promise<void>;
  
  // Analytics and insights
  getObjectiveProgress: (id: string) => number;
  getObjectiveMetrics: (id: string) => {
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
    progress: number;
    estimatedCompletion?: Date;
    actualCompletion?: Date;
  };
  
  // Bulk operations
  bulkUpdateObjectives: (ids: string[], updates: Partial<Objective>) => void;
  bulkDeleteObjectives: (ids: string[]) => void;
  duplicateObjective: (id: string) => string | null;
  
  // Import/Export
  exportObjectives: () => string;
  importObjectives: (data: string) => { success: number; failed: number; errors: string[] };
  
  // Cleanup
  clearCompletedObjectives: () => void;
  clearAllObjectives: () => void;
}

export type ObjectivesStore = ObjectivesState & ObjectivesActions;

export const createObjectivesStore = (initialData?: Partial<ObjectivesState>) =>
  create<ObjectivesStore>()(
    subscribeWithSelector(
      persist(
        immer((set, get) => ({
          // Initial state
          objectives: {},
          selectedObjectiveId: null,
          filteredObjectives: [],
          objectiveFilters: {
            status: 'all',
            priority: 'all',
            category: null,
          },
          learningSystem: null,
          ...initialData,

          // Objective CRUD operations
          addObjective: (objectiveData) => {
            const id = `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const now = new Date().toISOString();
            
            set((state) => {
              state.objectives[id] = {
                id,
                ...objectiveData,
                status: 'active',
                progress: 0,
                tasks: [],
                createdAt: now,
                updatedAt: now,
              };
            });
            
            return id;
          },

          updateObjective: (id, updates) => {
            set((state) => {
              if (state.objectives[id]) {
                Object.assign(state.objectives[id], {
                  ...updates,
                  updatedAt: new Date().toISOString(),
                });
              }
            });
          },

          deleteObjective: (id) => {
            set((state) => {
              delete state.objectives[id];
              if (state.selectedObjectiveId === id) {
                state.selectedObjectiveId = null;
              }
            });
          },

          getObjective: (id) => {
            return get().objectives[id] || null;
          },

          // Status management
          updateObjectiveStatus: (id, status) => {
            set((state) => {
              if (state.objectives[id]) {
                state.objectives[id].status = status;
                state.objectives[id].updatedAt = new Date().toISOString();
              }
            });
          },

          markObjectiveComplete: (id, results) => {
            set((state) => {
              if (state.objectives[id]) {
                state.objectives[id].status = 'completed';
                state.objectives[id].progress = 100;
                state.objectives[id].results = results;
                state.objectives[id].completedAt = new Date().toISOString();
                state.objectives[id].updatedAt = new Date().toISOString();
              }
            });
          },

          markObjectiveFailed: (id, error) => {
            set((state) => {
              if (state.objectives[id]) {
                state.objectives[id].status = 'failed';
                state.objectives[id].error = error;
                state.objectives[id].updatedAt = new Date().toISOString();
              }
            });
          },

          // Task management
          addTaskToObjective: (objectiveId, taskData) => {
            const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const now = new Date().toISOString();
            
            set((state) => {
              if (state.objectives[objectiveId]) {
                const newTask: Task = {
                  id: taskId,
                  objectiveId,
                  ...taskData,
                  status: 'pending',
                  progress: 0,
                  createdAt: now,
                  updatedAt: now,
                };
                
                state.objectives[objectiveId].tasks.push(newTask);
                state.objectives[objectiveId].updatedAt = now;
              }
            });
            
            return taskId;
          },

          updateTask: (objectiveId, taskId, updates) => {
            set((state) => {
              const objective = state.objectives[objectiveId];
              if (objective) {
                const taskIndex = objective.tasks.findIndex(task => task.id === taskId);
                if (taskIndex !== -1) {
                  Object.assign(objective.tasks[taskIndex], {
                    ...updates,
                    updatedAt: new Date().toISOString(),
                  });
                  objective.updatedAt = new Date().toISOString();
                }
              }
            });
          },

          removeTaskFromObjective: (objectiveId, taskId) => {
            set((state) => {
              const objective = state.objectives[objectiveId];
              if (objective) {
                objective.tasks = objective.tasks.filter(task => task.id !== taskId);
                objective.updatedAt = new Date().toISOString();
              }
            });
          },

          completeTask: (objectiveId, taskId, results) => {
            set((state) => {
              const objective = state.objectives[objectiveId];
              if (objective) {
                const task = objective.tasks.find(task => task.id === taskId);
                if (task) {
                  task.status = 'completed';
                  task.progress = 100;
                  task.results = results;
                  task.completedAt = new Date().toISOString();
                  task.updatedAt = new Date().toISOString();
                  
                  // Update objective progress
                  const totalTasks = objective.tasks.length;
                  const completedTasks = objective.tasks.filter(t => t.status === 'completed').length;
                  objective.progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
                  
                  if (completedTasks === totalTasks && totalTasks > 0) {
                    objective.status = 'completed';
                    objective.completedAt = new Date().toISOString();
                  }
                  
                  objective.updatedAt = new Date().toISOString();
                }
              }
            });
          },

          // Filtering and selection
          setSelectedObjective: (id) => {
            set((state) => {
              state.selectedObjectiveId = id;
            });
          },

          setObjectiveFilters: (filters) => {
            set((state) => {
              Object.assign(state.objectiveFilters, filters);
            });
          },

          clearObjectiveFilters: () => {
            set((state) => {
              state.objectiveFilters = {
                status: 'all',
                priority: 'all',
                category: null,
              };
            });
          },

          // Learning integration
          setLearningSystem: (learningSystem) => {
            set((state) => {
              state.learningSystem = learningSystem;
            });
          },

          applyLearningInsights: async (objectiveId) => {
            const { learningSystem, getObjective } = get();
            if (!learningSystem) return;
            
            const objective = getObjective(objectiveId);
            if (!objective) return;
            
            try {
              // This would integrate with the learning system
              // to provide insights and recommendations for the objective
              console.log('Applying learning insights for objective:', objectiveId);
            } catch (error) {
              console.error('Error applying learning insights:', error);
            }
          },

          // Analytics and insights
          getObjectiveProgress: (id) => {
            const objective = get().objectives[id];
            return objective?.progress || 0;
          },

          getObjectiveMetrics: (id) => {
            const objective = get().objectives[id];
            if (!objective) {
              return {
                totalTasks: 0,
                completedTasks: 0,
                failedTasks: 0,
                progress: 0,
              };
            }
            
            const totalTasks = objective.tasks.length;
            const completedTasks = objective.tasks.filter(task => task.status === 'completed').length;
            const failedTasks = objective.tasks.filter(task => task.status === 'failed').length;
            
            return {
              totalTasks,
              completedTasks,
              failedTasks,
              progress: objective.progress,
              estimatedCompletion: undefined, // Would calculate based on current progress
              actualCompletion: objective.completedAt ? new Date(objective.completedAt) : undefined,
            };
          },

          // Bulk operations
          bulkUpdateObjectives: (ids, updates) => {
            set((state) => {
              ids.forEach(id => {
                if (state.objectives[id]) {
                  Object.assign(state.objectives[id], {
                    ...updates,
                    updatedAt: new Date().toISOString(),
                  });
                }
              });
            });
          },

          bulkDeleteObjectives: (ids) => {
            set((state) => {
              ids.forEach(id => {
                delete state.objectives[id];
              });
              
              if (state.selectedObjectiveId && ids.includes(state.selectedObjectiveId)) {
                state.selectedObjectiveId = null;
              }
            });
          },

          duplicateObjective: (id) => {
            const original = get().objectives[id];
            if (!original) return null;
            
            const newId = `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const now = new Date().toISOString();
            
            set((state) => {
              state.objectives[newId] = {
                ...original,
                id: newId,
                title: `${original.title} (Copy)`,
                status: 'active',
                progress: 0,
                createdAt: now,
                updatedAt: now,
                completedAt: undefined,
                tasks: original.tasks.map(task => ({
                  ...task,
                  id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                  status: 'pending',
                  progress: 0,
                  createdAt: now,
                  updatedAt: now,
                  completedAt: undefined,
                })),
              };
            });
            
            return newId;
          },

          // Import/Export
          exportObjectives: () => {
            const { objectives } = get();
            return JSON.stringify({
              type: 'objectives',
              version: '1.0',
              exportedAt: new Date().toISOString(),
              data: Object.values(objectives),
            }, null, 2);
          },

          importObjectives: (data) => {
            try {
              const parsed = JSON.parse(data);
              if (parsed.type !== 'objectives' || !Array.isArray(parsed.data)) {
                return { success: 0, failed: 1, errors: ['Invalid file format'] };
              }
              
              let success = 0;
              const errors: string[] = [];
              
              parsed.data.forEach((objectiveData: any) => {
                try {
                  const id = `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                  const now = new Date().toISOString();
                  
                  set((state) => {
                    state.objectives[id] = {
                      ...objectiveData,
                      id,
                      createdAt: now,
                      updatedAt: now,
                    };
                  });
                  
                  success++;
                } catch (error) {
                  errors.push(`Failed to import objective: ${error}`);
                }
              });
              
              return { success, failed: parsed.data.length - success, errors };
            } catch (error) {
              return { success: 0, failed: 1, errors: [`Parse error: ${error}`] };
            }
          },

          // Cleanup
          clearCompletedObjectives: () => {
            set((state) => {
              Object.keys(state.objectives).forEach(id => {
                if (state.objectives[id].status === 'completed') {
                  delete state.objectives[id];
                }
              });
            });
          },

          clearAllObjectives: () => {
            set((state) => {
              state.objectives = {};
              state.selectedObjectiveId = null;
            });
          },
        })),
        {
          name: 'objectives-store',
          partialize: (state) => ({
            objectives: state.objectives,
            objectiveFilters: state.objectiveFilters,
          }),
        }
      ),
      {
        name: 'objectives-store',
      }
    )
  );

// Computed selectors
export const createObjectivesSelectors = (store: ObjectivesStore) => ({
  // Active objectives
  activeObjectives: () => {
    const { objectives } = store.getState();
    return Object.values(objectives).filter(obj => obj.status === 'active');
  },
  
  // Completed objectives
  completedObjectives: () => {
    const { objectives } = store.getState();
    return Object.values(objectives).filter(obj => obj.status === 'completed');
  },
  
  // Failed objectives
  failedObjectives: () => {
    const { objectives } = store.getState();
    return Object.values(objectives).filter(obj => obj.status === 'failed');
  },
  
  // High priority objectives
  highPriorityObjectives: () => {
    const { objectives } = store.getState();
    return Object.values(objectives).filter(obj => obj.priority === 'high');
  },
  
  // Objectives by category
  objectivesByCategory: (category: string) => {
    const { objectives } = store.getState();
    return Object.values(objectives).filter(obj => obj.category === category);
  },
  
  // Recent objectives (created within last 7 days)
  recentObjectives: () => {
    const { objectives } = store.getState();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return Object.values(objectives)
      .filter(obj => new Date(obj.createdAt) > sevenDaysAgo)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  
  // Objectives with overdue tasks
  objectivesWithOverdueTasks: () => {
    const { objectives } = store.getState();
    const now = new Date();
    
    return Object.values(objectives).filter(obj => {
      return obj.tasks.some(task => {
        if (!task.dueDate) return false;
        return new Date(task.dueDate) < now && task.status !== 'completed';
      });
    });
  },
  
  // Overall statistics
  objectivesStats: () => {
    const { objectives } = store.getState();
    const allObjectives = Object.values(objectives);
    
    return {
      total: allObjectives.length,
      active: allObjectives.filter(obj => obj.status === 'active').length,
      completed: allObjectives.filter(obj => obj.status === 'completed').length,
      failed: allObjectives.filter(obj => obj.status === 'failed').length,
      highPriority: allObjectives.filter(obj => obj.priority === 'high').length,
      averageProgress: allObjectives.length > 0 
        ? allObjectives.reduce((sum, obj) => sum + obj.progress, 0) / allObjectives.length 
        : 0,
    };
  },
});

// Filter and sort utilities
export const filterObjectives = (
  objectives: Objective[],
  filters: ObjectivesState['objectiveFilters']
): Objective[] => {
  return objectives.filter(objective => {
    // Status filter
    if (filters.status !== 'all') {
      if (filters.status === 'active' && objective.status !== 'active') return false;
      if (filters.status === 'completed' && objective.status !== 'completed') return false;
      if (filters.status === 'failed' && objective.status !== 'failed') return false;
    }
    
    // Priority filter
    if (filters.priority !== 'all' && objective.priority !== filters.priority) {
      return false;
    }
    
    // Category filter
    if (filters.category && objective.category !== filters.category) {
      return false;
    }
    
    return true;
  });
};

export const sortObjectives = (
  objectives: Objective[],
  sortBy: 'createdAt' | 'updatedAt' | 'priority' | 'progress' | 'title',
  sortOrder: 'asc' | 'desc' = 'desc'
): Objective[] => {
  return [...objectives].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'createdAt':
      case 'updatedAt':
        comparison = new Date(a[sortBy]).getTime() - new Date(b[sortBy]).getTime();
        break;
      case 'priority':
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
        break;
      case 'progress':
        comparison = a.progress - b.progress;
        break;
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      default:
        comparison = 0;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });
};

// Default export for easy importing
export const objectivesStore = createObjectivesStore();

// Export the store creator for testing
export { createObjectivesStore };