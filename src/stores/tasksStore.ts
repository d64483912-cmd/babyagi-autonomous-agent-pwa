import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { Task, LearningInsight } from '../types/babyagi';
import { immer } from 'zustand/middleware/immer';

// Types for tasks store state
interface TasksState {
  // Core task data
  tasks: Task[];
  activeTasks: Task[];
  taskQueue: Task[];
  completedTasks: Task[];
  failedTasks: Task[];
  
  // Selection and navigation
  selectedTaskId: string | null;
  currentTask: Task | null;
  
  // Task organization
  tasksByPriority: Record<number, Task[]>;
  tasksByObjective: Record<string, Task[]>;
  tasksByStatus: Record<string, Task[]>;
  
  // Task execution state
  taskExecutionState: Record<string, {
    isExecuting: boolean;
    currentStep: string;
    progress: number;
    startTime?: Date;
    logs: Array<{
      timestamp: Date;
      level: 'info' | 'success' | 'warning' | 'error';
      message: string;
      details?: any;
    }>;
  }>;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  executionPaused: boolean;
  bulkOperationInProgress: boolean;
}

// Types for tasks store actions
interface TasksActions {
  // Task CRUD operations
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'attempts'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => void;
  cloneTask: (id: string) => void;
  
  // Task selection and navigation
  selectTask: (id: string | null) => void;
  setCurrentTask: (task: Task | null) => void;
  
  // Task status management
  startTaskExecution: (id: string) => void;
  pauseTaskExecution: (id: string) => void;
  completeTask: (id: string, results: string, duration?: number) => Promise<void>;
  failTask: (id: string, error: string) => Promise<void>;
  retryTask: (id: string) => void;
  
  // Task queue management
  addToQueue: (taskId: string, priority?: number) => void;
  removeFromQueue: (taskId: string) => void;
  reorderQueue: (fromIndex: number, toIndex: number) => void;
  clearQueue: () => void;
  prioritizeTask: (taskId: string, priority: number) => void;
  
  // Bulk operations
  bulkUpdateTasks: (taskIds: string[], updates: Partial<Task>) => Promise<void>;
  bulkCompleteTasks: (taskIds: string[], results: string) => Promise<void>;
  bulkDeleteTasks: (taskIds: string[]) => void;
  bulkReorderTasks: (taskIds: string[]) => void;
  
  // Learning and insights
  addLearningInsight: (taskId: string, insight: Omit<LearningInsight, 'appliedToNextTasks'>) => void;
  applyLearningInsight: (insightId: string) => void;
  
  // Task execution logging
  addExecutionLog: (taskId: string, level: 'info' | 'success' | 'warning' | 'error', message: string, details?: any) => void;
  updateExecutionProgress: (taskId: string, progress: number, currentStep?: string) => void;
  clearExecutionLogs: (taskId: string) => void;
  
  // Utility actions
  clearError: () => void;
  setLoading: (isLoading: boolean) => void;
  setExecutionPaused: (paused: boolean) => void;
  
  // Computed getters
  getTaskById: (id: string) => Task | undefined;
  getTasksByObjective: (objectiveId: string) => Task[];
  getTasksByStatus: (status: Task['status']) => Task[];
  getExecutableTasks: (objectiveId: string) => Task[];
  getTasksWithDependencies: () => Task[];
  getOverdueTasks: () => Task[];
  getNextExecutableTask: (objectiveId: string) => Task | null;
  
  // Analytics and statistics
  getTaskCompletionRate: (timeframe?: 'day' | 'week' | 'month') => number;
  getAverageTaskDuration: () => number;
  getTaskSuccessRate: () => number;
  getMostCommonFailureReasons: () => Array<{ reason: string; count: number }>;
  getTasksNeedingRetry: () => Task[];
}

// Combined store type
type TasksStore = TasksState & TasksActions;

// Validation schema
const validateTask = (task: Omit<Task, 'id' | 'createdAt' | 'attempts'>): boolean => {
  if (!task.title?.trim()) return false;
  if (!task.description?.trim()) return false;
  if (!task.objectiveId) return false;
  if (task.priority < 1 || task.priority > 10) return false;
  if (task.complexity < 1 || task.complexity > 10) return false;
  if (task.progress < 0 || task.progress > 100) return false;
  return true;
};

// Default state
const createDefaultState = (): TasksState => ({
  tasks: [],
  activeTasks: [],
  taskQueue: [],
  completedTasks: [],
  failedTasks: [],
  selectedTaskId: null,
  currentTask: null,
  tasksByPriority: {
    1: [], 2: [], 3: [], 4: [], 5: [],
    6: [], 7: [], 8: [], 9: [], 10: []
  },
  tasksByObjective: {},
  tasksByStatus: {
    pending: [],
    'in-progress': [],
    completed: [],
    failed: []
  },
  taskExecutionState: {},
  isLoading: false,
  error: null,
  executionPaused: false,
  bulkOperationInProgress: false
});

// Store implementation
export const useTasksStore = create<TasksStore>()(
  persist(
    immer((set, get) => ({
      ...createDefaultState(),

      // Task CRUD operations
      addTask: (taskData) => {
        if (!validateTask(taskData)) {
          set((state) => {
            state.error = 'Invalid task data';
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
          state.tasks.unshift(newTask);
          state.tasksByStatus.pending.unshift(newTask);
          
          // Add to objective grouping
          if (!state.tasksByObjective[taskData.objectiveId]) {
            state.tasksByObjective[taskData.objectiveId] = [];
          }
          state.tasksByObjective[taskData.objectiveId].unshift(newTask);
          
          // Add to priority grouping
          state.tasksByPriority[taskData.priority].unshift(newTask);
        });
      },

      updateTask: async (id, updates) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          set((state) => {
            const taskIndex = state.tasks.findIndex(task => task.id === id);
            if (taskIndex === -1) {
              state.error = 'Task not found';
              return;
            }

            const oldTask = state.tasks[taskIndex];
            const updatedTask = { ...oldTask, ...updates };
            
            // Update in main tasks array
            state.tasks[taskIndex] = updatedTask;
            
            // Update current task if it's the one being updated
            if (state.currentTask?.id === id) {
              state.currentTask = updatedTask;
            }
            
            // Update status grouping
            const oldStatus = oldTask.status;
            const newStatus = updates.status || oldStatus;
            
            if (oldStatus !== newStatus) {
              // Remove from old status group
              state.tasksByStatus[oldStatus] = state.tasksByStatus[oldStatus]
                .filter(task => task.id !== id);
              
              // Add to new status group
              state.tasksByStatus[newStatus].unshift(updatedTask);
            } else {
              // Update in same status group
              state.tasksByStatus[newStatus] = state.tasksByStatus[newStatus]
                .map(task => task.id === id ? updatedTask : task);
            }
            
            // Update priority grouping
            const oldPriority = oldTask.priority;
            const newPriority = updates.priority || oldPriority;
            
            if (oldPriority !== newPriority) {
              // Remove from old priority group
              state.tasksByPriority[oldPriority] = state.tasksByPriority[oldPriority]
                .filter(task => task.id !== id);
              
              // Add to new priority group
              state.tasksByPriority[newPriority].unshift(updatedTask);
            }
            
            // Update objective grouping
            const oldObjectiveId = oldTask.objectiveId;
            const newObjectiveId = updates.objectiveId || oldObjectiveId;
            
            if (oldObjectiveId !== newObjectiveId) {
              // Remove from old objective group
              if (state.tasksByObjective[oldObjectiveId]) {
                state.tasksByObjective[oldObjectiveId] = state.tasksByObjective[oldObjectiveId]
                  .filter(task => task.id !== id);
              }
              
              // Add to new objective group
              if (!state.tasksByObjective[newObjectiveId]) {
                state.tasksByObjective[newObjectiveId] = [];
              }
              state.tasksByObjective[newObjectiveId].unshift(updatedTask);
            }
          });
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Failed to update task';
          });
        } finally {
          set((state) => {
            state.isLoading = false;
          });
        }
      },

      deleteTask: (id) => {
        set((state) => {
          const task = state.tasks.find(t => t.id === id);
          if (!task) return;

          // Remove from all groupings
          state.tasks = state.tasks.filter(t => t.id !== id);
          state.tasksByStatus[task.status] = state.tasksByStatus[task.status].filter(t => t.id !== id);
          state.tasksByPriority[task.priority] = state.tasksByPriority[task.priority].filter(t => t.id !== id);
          
          if (state.tasksByObjective[task.objectiveId]) {
            state.tasksByObjective[task.objectiveId] = state.tasksByObjective[task.objectiveId].filter(t => t.id !== id);
          }
          
          // Remove from queues
          state.taskQueue = state.taskQueue.filter(t => t.id !== id);
          state.activeTasks = state.activeTasks.filter(t => t.id !== id);
          state.completedTasks = state.completedTasks.filter(t => t.id !== id);
          state.failedTasks = state.failedTasks.filter(t => t.id !== id);
          
          // Clear execution state
          delete state.taskExecutionState[id];
          
          // Clear selection if they reference deleted task
          if (state.currentTask?.id === id) {
            state.currentTask = null;
          }
          if (state.selectedTaskId === id) {
            state.selectedTaskId = null;
          }
        });
      },

      cloneTask: (id) => {
        const task = get().tasks.find(t => t.id === id);
        if (!task) return;

        const clonedTask: Task = {
          ...task,
          id: crypto.randomUUID(),
          title: `${task.title} (Copy)`,
          status: 'pending',
          progress: 0,
          attempts: 0,
          startedAt: undefined,
          completedAt: undefined,
          results: undefined,
          createdAt: new Date()
        };

        set((state) => {
          state.tasks.unshift(clonedTask);
          state.tasksByStatus.pending.unshift(clonedTask);
          
          if (!state.tasksByObjective[task.objectiveId]) {
            state.tasksByObjective[task.objectiveId] = [];
          }
          state.tasksByObjective[task.objectiveId].unshift(clonedTask);
          state.tasksByPriority[task.priority].unshift(clonedTask);
        });
      },

      // Task selection and navigation
      selectTask: (id) => {
        set((state) => {
          const task = id ? state.tasks.find(t => t.id === id) || null : null;
          state.selectedTaskId = id;
          state.currentTask = task;
        });
      },

      setCurrentTask: (task) => {
        set((state) => {
          state.currentTask = task;
          state.selectedTaskId = task?.id || null;
        });
      },

      // Task status management
      startTaskExecution: (id) => {
        set((state) => {
          const taskIndex = state.tasks.findIndex(task => task.id === id);
          if (taskIndex === -1) return;
          
          const task = state.tasks[taskIndex];
          
          // Update task status and timing
          state.tasks[taskIndex] = {
            ...task,
            status: 'in-progress',
            startedAt: new Date(),
            attempts: task.attempts + 1
          };
          
          // Update execution state
          state.taskExecutionState[id] = {
            isExecuting: true,
            currentStep: 'Initializing...',
            progress: 0,
            startTime: new Date(),
            logs: [{
              timestamp: new Date(),
              level: 'info',
              message: 'Task execution started'
            }]
          };
          
          // Add to active tasks if not already there
          if (!state.activeTasks.find(t => t.id === id)) {
            state.activeTasks.unshift(state.tasks[taskIndex]);
          }
        });
      },

      pauseTaskExecution: (id) => {
        set((state) => {
          if (state.taskExecutionState[id]) {
            state.taskExecutionState[id].isExecuting = false;
          }
          
          const taskIndex = state.tasks.findIndex(task => task.id === id);
          if (taskIndex !== -1) {
            const task = state.tasks[taskIndex];
            if (task.status === 'in-progress') {
              state.tasks[taskIndex] = { ...task, status: 'pending' };
            }
          }
        });
      },

      completeTask: async (id, results, duration) => {
        const completionTime = new Date();
        
        set((state) => {
          state.isLoading = true;
        });

        try {
          set((state) => {
            const taskIndex = state.tasks.findIndex(task => task.id === id);
            if (taskIndex === -1) return;
            
            const task = state.tasks[taskIndex];
            const actualDuration = duration || (task.startedAt ? 
              Math.round((completionTime.getTime() - task.startedAt.getTime()) / (1000 * 60)) : 
              task.estimatedDuration
            );
            
            const completedTask = {
              ...task,
              status: 'completed' as const,
              completedAt: completionTime,
              progress: 100,
              results,
              actualDuration
            };
            
            state.tasks[taskIndex] = completedTask;
            
            // Update execution state
            if (state.taskExecutionState[id]) {
              state.taskExecutionState[id].isExecuting = false;
              state.taskExecutionState[id].progress = 100;
            }
            
            // Move to completed tasks
            state.completedTasks.unshift(completedTask);
            state.activeTasks = state.activeTasks.filter(t => t.id !== id);
          });
        } catch (error) {
          set((state) => {
            state.error = 'Failed to complete task';
          });
        } finally {
          set((state) => {
            state.isLoading = false;
          });
        }
      },

      failTask: async (id, error) => {
        set((state) => {
          state.isLoading = true;
        });

        try {
          set((state) => {
            const taskIndex = state.tasks.findIndex(task => task.id === id);
            if (taskIndex === -1) return;
            
            const task = state.tasks[taskIndex];
            
            const failedTask = {
              ...task,
              status: 'failed' as const,
              results: error,
              completedAt: new Date()
            };
            
            state.tasks[taskIndex] = failedTask;
            
            // Update execution state
            if (state.taskExecutionState[id]) {
              state.taskExecutionState[id].isExecuting = false;
            }
            
            // Move to failed tasks
            state.failedTasks.unshift(failedTask);
            state.activeTasks = state.activeTasks.filter(t => t.id !== id);
          });
        } catch (error) {
          set((state) => {
            state.error = 'Failed to mark task as failed';
          });
        } finally {
          set((state) => {
            state.isLoading = false;
          });
        }
      },

      retryTask: (id) => {
        const task = get().getTaskById(id);
        if (!task) return;

        get().updateTask(id, {
          status: 'pending',
          progress: 0,
          results: undefined,
          completedAt: undefined,
          startedAt: undefined
        });
      },

      // Continue with remaining methods...
      // For brevity, I'll add the key methods and provide a placeholder for the rest

      // Task queue management
      addToQueue: (taskId, priority = 5) => {
        const task = get().getTaskById(taskId);
        if (!task) return;

        set((state) => {
          const existingIndex = state.taskQueue.findIndex(t => t.id === taskId);
          if (existingIndex === -1) {
            state.taskQueue.push({ ...task, priority });
          }
        });
      },

      removeFromQueue: (taskId) => {
        set((state) => {
          state.taskQueue = state.taskQueue.filter(t => t.id !== taskId);
        });
      },

      reorderQueue: (fromIndex, toIndex) => {
        set((state) => {
          const queue = [...state.taskQueue];
          const [movedTask] = queue.splice(fromIndex, 1);
          queue.splice(toIndex, 0, movedTask);
          state.taskQueue = queue;
        });
      },

      clearQueue: () => {
        set((state) => {
          state.taskQueue = [];
        });
      },

      prioritizeTask: (taskId, priority) => {
        get().updateTask(taskId, { priority });
      },

      // Bulk operations
      bulkUpdateTasks: async (taskIds, updates) => {
        set((state) => {
          state.bulkOperationInProgress = true;
        });

        try {
          for (const taskId of taskIds) {
            await get().updateTask(taskId, updates);
          }
        } finally {
          set((state) => {
            state.bulkOperationInProgress = false;
          });
        }
      },

      bulkCompleteTasks: async (taskIds, results) => {
        set((state) => {
          state.bulkOperationInProgress = true;
        });

        try {
          for (const taskId of taskIds) {
            await get().completeTask(taskId, results);
          }
        } finally {
          set((state) => {
            state.bulkOperationInProgress = false;
          });
        }
      },

      bulkDeleteTasks: (taskIds) => {
        set((state) => {
          state.bulkOperationInProgress = true;
        });

        try {
          taskIds.forEach(taskId => {
            get().deleteTask(taskId);
          });
        } finally {
          set((state) => {
            state.bulkOperationInProgress = false;
          });
        }
      },

      bulkReorderTasks: (taskIds) => {
        set((state) => {
          const reorderedTasks = taskIds.map(id => 
            state.tasks.find(t => t.id === id)
          ).filter(Boolean) as Task[];
          
          state.taskQueue = reorderedTasks;
        });
      },

      // Learning and insights
      addLearningInsight: (taskId, insight) => {
        set((state) => {
          const taskIndex = state.tasks.findIndex(task => task.id === taskId);
          if (taskIndex !== -1) {
            const task = state.tasks[taskIndex];
            const learningInsight: LearningInsight = {
              ...insight,
              appliedToNextTasks: false
            };
            
            state.tasks[taskIndex] = {
              ...task,
              learning: learningInsight
            };
          }
        });
      },

      applyLearningInsight: (insightId) => {
        // This would be implemented to apply insights across similar tasks
        // For now, just a placeholder
      },

      // Task execution logging
      addExecutionLog: (taskId, level, message, details) => {
        set((state) => {
          if (!state.taskExecutionState[taskId]) {
            state.taskExecutionState[taskId] = {
              isExecuting: false,
              currentStep: '',
              progress: 0,
              logs: []
            };
          }
          
          state.taskExecutionState[taskId].logs.push({
            timestamp: new Date(),
            level,
            message,
            details
          });
        });
      },

      updateExecutionProgress: (taskId, progress, currentStep) => {
        set((state) => {
          if (state.taskExecutionState[taskId]) {
            state.taskExecutionState[taskId].progress = progress;
            if (currentStep) {
              state.taskExecutionState[taskId].currentStep = currentStep;
            }
          }
          
          // Update task progress
          const taskIndex = state.tasks.findIndex(task => task.id === taskId);
          if (taskIndex !== -1) {
            state.tasks[taskIndex].progress = progress;
          }
        });
      },

      clearExecutionLogs: (taskId) => {
        set((state) => {
          if (state.taskExecutionState[taskId]) {
            state.taskExecutionState[taskId].logs = [];
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

      setExecutionPaused: (paused) => {
        set((state) => {
          state.executionPaused = paused;
        });
      },

      // Computed getters
      getTaskById: (id) => {
        return get().tasks.find(task => task.id === id);
      },

      getTasksByObjective: (objectiveId) => {
        return get().tasksByObjective[objectiveId] || [];
      },

      getTasksByStatus: (status) => {
        return get().tasksByStatus[status] || [];
      },

      getExecutableTasks: (objectiveId) => {
        const { tasks } = get();
        return tasks.filter(task => 
          task.objectiveId === objectiveId && 
          task.status === 'pending' &&
          task.dependencies.every(depId => 
            tasks.find(t => t.id === depId)?.status === 'completed'
          )
        );
      },

      getTasksWithDependencies: () => {
        return get().tasks.filter(task => task.dependencies.length > 0);
      },

      getOverdueTasks: () => {
        const now = new Date();
        return get().tasks.filter(task => {
          if (task.status === 'completed' || !task.estimatedDuration) return false;
          
          const estimatedEndTime = new Date(task.createdAt.getTime() + task.estimatedDuration * 60 * 1000);
          return now > estimatedEndTime && task.status !== 'completed';
        });
      },

      getNextExecutableTask: (objectiveId) => {
        const executableTasks = get().getExecutableTasks(objectiveId);
        return executableTasks.sort((a, b) => b.priority - a.priority)[0] || null;
      },

      // Analytics and statistics
      getTaskCompletionRate: (timeframe) => {
        const { tasks } = get();
        const now = new Date();
        let relevantTasks = tasks;
        
        if (timeframe) {
          const timeLimit = new Date();
          switch (timeframe) {
            case 'day':
              timeLimit.setDate(now.getDate() - 1);
              break;
            case 'week':
              timeLimit.setDate(now.getDate() - 7);
              break;
            case 'month':
              timeLimit.setMonth(now.getMonth() - 1);
              break;
          }
          relevantTasks = tasks.filter(task => task.createdAt >= timeLimit);
        }
        
        const completedTasks = relevantTasks.filter(task => task.status === 'completed');
        return relevantTasks.length > 0 ? (completedTasks.length / relevantTasks.length) * 100 : 0;
      },

      getAverageTaskDuration: () => {
        const completedTasks = get().tasks.filter(task => 
          task.status === 'completed' && task.actualDuration
        );
        
        if (completedTasks.length === 0) return 0;
        
        const totalDuration = completedTasks.reduce((sum, task) => sum + (task.actualDuration || 0), 0);
        return Math.round(totalDuration / completedTasks.length);
      },

      getTaskSuccessRate: () => {
        const { tasks } = get();
        const finishedTasks = tasks.filter(task => 
          task.status === 'completed' || task.status === 'failed'
        );
        
        if (finishedTasks.length === 0) return 0;
        
        const successfulTasks = finishedTasks.filter(task => task.status === 'completed');
        return (successfulTasks.length / finishedTasks.length) * 100;
      },

      getMostCommonFailureReasons: () => {
        const failedTasks = get().failedTasks;
        const reasons: Record<string, number> = {};
        
        failedTasks.forEach(task => {
          if (task.results) {
            const reason = task.results.length > 100 ? 
              task.results.substring(0, 100) + '...' : 
              task.results;
            reasons[reason] = (reasons[reason] || 0) + 1;
          }
        });
        
        return Object.entries(reasons)
          .map(([reason, count]) => ({ reason, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
      },

      getTasksNeedingRetry: () => {
        return get().tasks.filter(task => 
          task.status === 'failed' && task.attempts < 3
        );
      }
    })),
    {
      name: 'tasks-store',
      partialize: (state) => ({
        tasks: state.tasks,
        completedTasks: state.completedTasks.slice(0, 100), // Keep last 100 completed tasks
        failedTasks: state.failedTasks.slice(0, 50), // Keep last 50 failed tasks
        selectedTaskId: state.selectedTaskId
      })
    }
  ),
  subscribeWithSelector
);