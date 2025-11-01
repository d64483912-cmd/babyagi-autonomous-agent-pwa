import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { Objective, Task } from '../types/babyagi';
import { immer } from 'zustand/middleware/immer';

// Types for objectives store state
interface ObjectivesState {
  objectives: Objective[];
  currentObjective: Objective | null;
  selectedObjectiveId: string | null;
  objectiveHistory: Objective[];
  objectivesByStatus: Record<string, Objective[]>;
  isLoading: boolean;
  error: string | null;
}

// Types for objectives store actions
interface ObjectivesActions {
  // CRUD operations
  addObjective: (objective: Omit<Objective, 'id' | 'createdAt'>) => void;
  updateObjective: (id: string, updates: Partial<Objective>) => Promise<void>;
  deleteObjective: (id: string) => void;
  
  // Selection and navigation
  selectObjective: (id: string | null) => void;
  setCurrentObjective: (objective: Objective | null) => void;
  
  // Status management
  markObjectiveCompleted: (id: string, results?: string) => Promise<void>;
  markObjectiveFailed: (id: string, error: string) => Promise<void>;
  resetObjectiveStatus: (id: string) => void;
  
  // Task management
  addTaskToObjective: (objectiveId: string, task: Omit<Task, 'id' | 'createdAt' | 'attempts'>) => void;
  updateObjectiveTask: (objectiveId: string, taskId: string, updates: Partial<Task>) => void;
  removeTaskFromObjective: (objectiveId: string, taskId: string) => void;
  
  // Utility actions
  clearError: () => void;
  setLoading: (isLoading: boolean) => void;
  reorderObjectives: (fromIndex: number, toIndex: number) => void;
  
  // Computed getters
  getObjectiveById: (id: string) => Objective | undefined;
  getObjectivesByStatus: (status: Objective['status']) => Objective[];
  getObjectivesByComplexity: (complexity: number) => Objective[];
  getCompletedObjectivesCount: () => number;
  getActiveObjectivesCount: () => number;
  getAverageCompletionTime: () => number;
}

// Combined store type
type ObjectivesStore = ObjectivesState & ObjectivesActions;

// Validation schema
const validateObjective = (objective: Omit<Objective, 'id' | 'createdAt'>): boolean => {
  if (!objective.title?.trim()) return false;
  if (!objective.description?.trim()) return false;
  if (objective.complexity < 1 || objective.complexity > 10) return false;
  return true;
};

// Default state
const createDefaultState = (): ObjectivesState => ({
  objectives: [],
  currentObjective: null,
  selectedObjectiveId: null,
  objectiveHistory: [],
  objectivesByStatus: {
    pending: [],
    'in-progress': [],
    completed: [],
    failed: []
  },
  isLoading: false,
  error: null
});

// Store implementation
export const useObjectivesStore = create<ObjectivesStore>()(
  persist(
    immer((set, get) => ({
      ...createDefaultState(),
      
      // CRUD operations
      addObjective: (objectiveData) => {
        if (!validateObjective(objectiveData)) {
          set((state) => {
            state.error = 'Invalid objective data';
          });
          return;
        }

        const newObjective: Objective = {
          ...objectiveData,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          subtasks: []
        };

        set((state) => {
          state.objectives.unshift(newObjective);
          state.objectiveHistory.unshift(newObjective);
          state.currentObjective = state.currentObjective || newObjective;
          state.selectedObjectiveId = newObjective.id;
          
          // Update status grouping
          state.objectivesByStatus.pending.unshift(newObjective);
        });
      },

      updateObjective: async (id, updates) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          set((state) => {
            const objectiveIndex = state.objectives.findIndex(obj => obj.id === id);
            if (objectiveIndex === -1) {
              state.error = 'Objective not found';
              return;
            }

            const oldObjective = state.objectives[objectiveIndex];
            const updatedObjective = { ...oldObjective, ...updates };
            
            // Update in main objectives array
            state.objectives[objectiveIndex] = updatedObjective;
            
            // Update current objective if it's the one being updated
            if (state.currentObjective?.id === id) {
              state.currentObjective = updatedObjective;
            }
            
            // Update status grouping
            const oldStatus = oldObjective.status;
            const newStatus = updates.status || oldStatus;
            
            if (oldStatus !== newStatus) {
              // Remove from old status group
              state.objectivesByStatus[oldStatus] = state.objectivesByStatus[oldStatus]
                .filter(obj => obj.id !== id);
              
              // Add to new status group
              state.objectivesByStatus[newStatus].unshift(updatedObjective);
            } else {
              // Update in same status group
              state.objectivesByStatus[newStatus] = state.objectivesByStatus[newStatus]
                .map(obj => obj.id === id ? updatedObjective : obj);
            }
          });
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Failed to update objective';
          });
        } finally {
          set((state) => {
            state.isLoading = false;
          });
        }
      },

      deleteObjective: (id) => {
        set((state) => {
          state.objectives = state.objectives.filter(obj => obj.id !== id);
          state.objectiveHistory = state.objectiveHistory.filter(obj => obj.id !== id);
          
          // Remove from status grouping
          Object.keys(state.objectivesByStatus).forEach(status => {
            state.objectivesByStatus[status] = state.objectivesByStatus[status]
              .filter(obj => obj.id !== id);
          });
          
          // Clear current and selected if they reference deleted objective
          if (state.currentObjective?.id === id) {
            state.currentObjective = null;
          }
          if (state.selectedObjectiveId === id) {
            state.selectedObjectiveId = null;
          }
        });
      },

      // Selection and navigation
      selectObjective: (id) => {
        set((state) => {
          const objective = id ? state.objectives.find(obj => obj.id === id) || null : null;
          state.selectedObjectiveId = id;
          state.currentObjective = objective;
        });
      },

      setCurrentObjective: (objective) => {
        set((state) => {
          state.currentObjective = objective;
          state.selectedObjectiveId = objective?.id || null;
        });
      },

      // Status management
      markObjectiveCompleted: async (id, results) => {
        const completionTime = new Date();
        
        set((state) => {
          state.isLoading = true;
        });

        try {
          await get().updateObjective(id, {
            status: 'completed',
            completedAt: completionTime,
            results
          });
        } catch (error) {
          set((state) => {
            state.error = 'Failed to mark objective as completed';
          });
        } finally {
          set((state) => {
            state.isLoading = false;
          });
        }
      },

      markObjectiveFailed: async (id, error) => {
        set((state) => {
          state.isLoading = true;
        });

        try {
          await get().updateObjective(id, {
            status: 'failed',
            results: error
          });
        } catch (error) {
          set((state) => {
            state.error = 'Failed to mark objective as failed';
          });
        } finally {
          set((state) => {
            state.isLoading = false;
          });
        }
      },

      resetObjectiveStatus: (id) => {
        get().updateObjective(id, {
          status: 'pending',
          completedAt: undefined,
          results: undefined
        });
      },

      // Task management
      addTaskToObjective: (objectiveId, taskData) => {
        const objective = get().objectives.find(obj => obj.id === objectiveId);
        if (!objective) {
          set((state) => {
            state.error = 'Objective not found';
          });
          return;
        }

        const newTask: Task = {
          ...taskData,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          attempts: 0
        };

        set((state) => {
          const objIndex = state.objectives.findIndex(obj => obj.id === objectiveId);
          if (objIndex !== -1) {
            state.objectives[objIndex].subtasks.push(newTask);
            
            // Update current objective if it matches
            if (state.currentObjective?.id === objectiveId) {
              state.currentObjective.subtasks.push(newTask);
            }
          }
        });
      },

      updateObjectiveTask: (objectiveId, taskId, updates) => {
        set((state) => {
          const objIndex = state.objectives.findIndex(obj => obj.id === objectiveId);
          if (objIndex !== -1) {
            const taskIndex = state.objectives[objIndex].subtasks.findIndex(task => task.id === taskId);
            if (taskIndex !== -1) {
              state.objectives[objIndex].subtasks[taskIndex] = {
                ...state.objectives[objIndex].subtasks[taskIndex],
                ...updates
              };
              
              // Update current objective if it matches
              if (state.currentObjective?.id === objectiveId) {
                const currentTaskIndex = state.currentObjective.subtasks.findIndex(task => task.id === taskId);
                if (currentTaskIndex !== -1) {
                  state.currentObjective.subtasks[currentTaskIndex] = {
                    ...state.currentObjective.subtasks[currentTaskIndex],
                    ...updates
                  };
                }
              }
            }
          }
        });
      },

      removeTaskFromObjective: (objectiveId, taskId) => {
        set((state) => {
          const objIndex = state.objectives.findIndex(obj => obj.id === objectiveId);
          if (objIndex !== -1) {
            state.objectives[objIndex].subtasks = state.objectives[objIndex].subtasks
              .filter(task => task.id !== taskId);
              
            // Update current objective if it matches
            if (state.currentObjective?.id === objectiveId) {
              state.currentObjective.subtasks = state.currentObjective.subtasks
                .filter(task => task.id !== taskId);
            }
          }
        });
      },

      // Utility actions
      clearError: () => {
        set((state) => {
          state.error = null;
        });
      },

      setLoading: (isLoading) => {
        set((state) => {
          state.isLoading = isLoading;
        });
      },

      reorderObjectives: (fromIndex, toIndex) => {
        set((state) => {
          const objectives = [...state.objectives];
          const [movedObjective] = objectives.splice(fromIndex, 1);
          objectives.splice(toIndex, 0, movedObjective);
          state.objectives = objectives;
        });
      },

      // Computed getters
      getObjectiveById: (id) => {
        return get().objectives.find(obj => obj.id === id);
      },

      getObjectivesByStatus: (status) => {
        return get().objectivesByStatus[status] || [];
      },

      getObjectivesByComplexity: (complexity) => {
        return get().objectives.filter(obj => obj.complexity === complexity);
      },

      getCompletedObjectivesCount: () => {
        return get().objectives.filter(obj => obj.status === 'completed').length;
      },

      getActiveObjectivesCount: () => {
        return get().objectives.filter(obj => 
          obj.status === 'pending' || obj.status === 'in-progress'
        ).length;
      },

      getAverageCompletionTime: () => {
        const completedObjectives = get().objectives.filter(obj => 
          obj.status === 'completed' && obj.completedAt
        );
        
        if (completedObjectives.length === 0) return 0;
        
        const totalTime = completedObjectives.reduce((sum, obj) => {
          if (obj.completedAt) {
            const duration = obj.completedAt.getTime() - obj.createdAt.getTime();
            return sum + duration;
          }
          return sum;
        }, 0);
        
        return Math.round(totalTime / completedObjectives.length / (1000 * 60)); // Convert to minutes
      }
    })),
    {
      name: 'objectives-store',
      partialize: (state) => ({
        objectives: state.objectives,
        objectiveHistory: state.objectiveHistory,
        currentObjective: state.currentObjective,
        selectedObjectiveId: state.selectedObjectiveId
      })
    }
  ),
  subscribeWithSelector
);
