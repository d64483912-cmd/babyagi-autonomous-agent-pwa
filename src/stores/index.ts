// =============================================================================
// STORE EXPORTS
// =============================================================================

// Individual stores
export { useObjectivesStore } from './objectivesStore';
export { useTasksStore } from './tasksStore';
export { useResultsStore } from './resultsStore';
export { useSettingsStore } from './settingsStore';
export { useUIStore } from './uiStore';

// Combined store hook
export { useAppStore } from './hooks';

// Specialized hooks
export {
  useObjectives,
  useTasks,
  useResults,
  useSettings,
  useUI,
  useDashboard,
  useAnalytics
} from './hooks';

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type {
  Objective,
  Task,
  AgentMemory,
  SimulationState,
  SimulationStatistics,
  PWAState,
  AppSettings,
  OpenRouterConfig,
  OpenRouterModel,
  OpenRouterResponse,
  APIKeyValidationResult
} from '../types/babyagi';

// =============================================================================
// STORE INSTANCES (for advanced usage)
// =============================================================================

import { useObjectivesStore } from './objectivesStore';
import { useTasksStore } from './tasksStore';
import { useResultsStore } from './resultsStore';
import { useSettingsStore } from './settingsStore';
import { useUIStore } from './uiStore';

// Export store instances for direct access if needed
export const storeInstances = {
  objectives: useObjectivesStore,
  tasks: useTasksStore,
  results: useResultsStore,
  settings: useSettingsStore,
  ui: useUIStore
} as const;

// =============================================================================
// STORE INITIALIZATION AND SETUP
// =============================================================================

/**
 * Initialize all stores with default configurations
 */
export const initializeStores = () => {
  // Set up store subscriptions and cross-store communication
  const objectivesStore = useObjectivesStore.getState();
  const tasksStore = useTasksStore.getState();
  const resultsStore = useResultsStore.getState();
  
  // Subscribe to objective changes and update related stores
  useObjectivesStore.subscribe(
    (state) => state.objectives,
    (objectives) => {
      // Update tasks when objectives change
      objectives.forEach(objective => {
        objective.subtasks.forEach(task => {
          const existingTask = tasksStore.getTaskById(task.id);
          if (!existingTask || existingTask.objectiveId !== objective.id) {
            // Handle task changes
          }
        });
      });
    }
  );
  
  // Subscribe to task completion and add to results
  useTasksStore.subscribe(
    (state) => state.completedTasks,
    (completedTasks) => {
      completedTasks.slice(0, 5).forEach(task => { // Process only recent completions
        if (!resultsStore.getTaskById?.(task.id)) { // Check if already added to results
          resultsStore.addExecutionResult({
            taskId: task.id,
            objectiveId: task.objectiveId,
            startTime: task.startedAt || task.createdAt,
            endTime: task.completedAt,
            status: 'success',
            output: task.results || 'Task completed',
            metadata: {
              taskTitle: task.title,
              duration: task.actualDuration,
              priority: task.priority,
              complexity: task.complexity
            }
          });
        }
      });
    }
  );
  
  // Subscribe to settings changes and apply them
  useSettingsStore.subscribe(
    (state) => state.theme,
    (theme) => {
      // Apply theme changes to document
      const root = document.documentElement;
      if (theme === 'dark') {
        root.classList.add('dark');
      } else if (theme === 'light') {
        root.classList.remove('dark');
      } else {
        // System theme
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    }
  );
  
  // Subscribe to UI state changes for responsive behavior
  useUIStore.subscribe(
    (state) => state.layoutMode,
    (layoutMode) => {
      // Handle layout mode changes
      const root = document.documentElement;
      root.classList.remove('mobile', 'tablet', 'desktop');
      root.classList.add(layoutMode);
    }
  );
  
  console.log('✅ BabyAGI PWA stores initialized');
};

/**
 * Reset all stores to their initial state
 */
export const resetAllStores = () => {
  useObjectivesStore.getState().resetSettings?.();
  useTasksStore.getState().clearQueue();
  useResultsStore.getState().clearExecutionHistory();
  useUIStore.getState().resetUIState();
  
  console.log('🔄 All stores reset to initial state');
};

/**
 * Export all store data for backup
 */
export const exportAllStoreData = () => {
  return {
    objectives: useObjectivesStore.getState().objectives,
    tasks: useTasksStore.getState().tasks,
    results: useResultsStore.getState().executionResults,
    settings: useSettingsStore.getState().settings,
    ui: useUIStore.getState().exportUIState(),
    exportedAt: new Date().toISOString(),
    version: '1.0.0'
  };
};

/**
 * Import store data from backup
 */
export const importStoreData = (data: any) => {
  try {
    if (data.objectives) {
      // Import objectives
      data.objectives.forEach((objective: any) => {
        useObjectivesStore.getState().addObjective(objective);
      });
    }
    
    if (data.tasks) {
      // Import tasks
      data.tasks.forEach((task: any) => {
        useTasksStore.getState().addTask(task);
      });
    }
    
    if (data.settings) {
      // Import settings
      useSettingsStore.getState().importSettings(data.settings);
    }
    
    if (data.ui) {
      // Import UI state
      useUIStore.getState().importUIState(data.ui);
    }
    
    console.log('✅ Store data imported successfully');
  } catch (error) {
    console.error('❌ Failed to import store data:', error);
    throw new Error('Failed to import store data');
  }
};

// =============================================================================
// DEVELOPMENT HELPERS
// =============================================================================

/**
 * Log store state for debugging (development only)
 */
export const debugStoreState = () => {
  if (process.env.NODE_ENV === 'development') {
    console.group('🔍 BabyAGI Store States');
    
    console.log('📋 Objectives:', useObjectivesStore.getState().objectives.length);
    console.log('📝 Tasks:', useTasksStore.getState().tasks.length);
    console.log('📊 Results:', useResultsStore.getState().executionResults.length);
    console.log('⚙️ Settings:', Object.keys(useSettingsStore.getState().settings).length);
    console.log('🖥️ UI State:', {
      currentView: useUIStore.getState().currentView,
      notifications: useUIStore.getState().notifications.length,
      sidebarOpen: useUIStore.getState().sidebarOpen
    });
    
    console.groupEnd();
  }
};

/**
 * Subscribe to all store changes for debugging (development only)
 */
export const debugStoreSubscriptions = () => {
  if (process.env.NODE_ENV === 'development') {
    const stores = [
      { name: 'objectives', store: useObjectivesStore },
      { name: 'tasks', store: useTasksStore },
      { name: 'results', store: useResultsStore },
      { name: 'settings', store: useSettingsStore },
      { name: 'ui', store: useUIStore }
    ];
    
    stores.forEach(({ name, store }) => {
      store.subscribe((state) => {
        console.log(`🔄 ${name} store updated:`, state);
      });
    });
  }
};

// =============================================================================
// CONSTANTS AND UTILITIES
// =============================================================================

/**
 * Store persistence keys
 */
export const PERSISTENCE_KEYS = {
  objectives: 'objectives-store',
  tasks: 'tasks-store',
  results: 'results-store',
  settings: 'settings-store'
} as const;

/**
 * Default store configurations
 */
export const STORE_CONFIGS = {
  objectives: {
    maxHistoryItems: 100,
    autoSave: true
  },
  tasks: {
    maxCompletedItems: 100,
    maxFailedItems: 50,
    autoCleanup: true
  },
  results: {
    maxExecutionResults: 500,
    maxLearningInsights: 100,
    maxAgentMemory: 200
  },
  settings: {
    includeSensitiveData: false,
    encryptApiKeys: true
  }
} as const;

/**
 * Store action prefixes for logging
 */
export const ACTION_PREFIXES = {
  create: 'CREATE_',
  update: 'UPDATE_',
  delete: 'DELETE_',
  select: 'SELECT_',
  execute: 'EXECUTE_',
  validate: 'VALIDATE_'
} as const;

// =============================================================================
// ERROR HANDLING
// =============================================================================

/**
 * Handle store errors globally
 */
export const handleStoreError = (error: Error, context: string) => {
  console.error(`❌ Store error in ${context}:`, error);
  
  // Show user-friendly error notification
  useUIStore.getState().showError(
    'Application Error',
    'An error occurred while performing the requested action. Please try again.',
    true
  );
  
  // Log detailed error for debugging
  if (process.env.NODE_ENV === 'development') {
    console.error('Detailed error info:', {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    });
  }
  
  // Reset error state after delay
  setTimeout(() => {
    useUIStore.getState().clearError();
  }, 5000);
};

// =============================================================================
// PERFORMANCE MONITORING
// =============================================================================

/**
 * Monitor store performance
 */
export const monitorStorePerformance = () => {
  const stores = [
    { name: 'objectives', store: useObjectivesStore },
    { name: 'tasks', store: useTasksStore },
    { name: 'results', store: useResultsStore },
    { name: 'settings', store: useSettingsStore },
    { name: 'ui', store: useUIStore }
  ];
  
  stores.forEach(({ name, store }) => {
    let operationCount = 0;
    let totalTime = 0;
    
    store.subscribe((state, prevState) => {
      if (state !== prevState) {
        const startTime = performance.now();
        
        // Track operation
        operationCount++;
        
        setTimeout(() => {
          const endTime = performance.now();
          const operationTime = endTime - startTime;
          totalTime += operationTime;
          
          if (process.env.NODE_ENV === 'development') {
            console.log(`⏱️ ${name} store operation: ${operationTime.toFixed(2)}ms`);
          }
        }, 0);
      }
    });
  });
};

// =============================================================================
// INITIALIZATION
// =============================================================================

// Auto-initialize stores when module is loaded
if (typeof window !== 'undefined') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeStores);
  } else {
    initializeStores();
  }
  
  // Development helpers
  if (process.env.NODE_ENV === 'development') {
    // Make debugging functions available globally
    (window as any).babyagiDebug = {
      state: debugStoreState,
      subscriptions: debugStoreSubscriptions,
      performance: monitorStorePerformance,
      reset: resetAllStores,
      export: exportAllStoreData,
      import: importStoreData
    };
    
    console.log('🔧 BabyAGI debugging tools available via window.babyagiDebug');
  }
}

export default {
  // Stores
  objectives: useObjectivesStore,
  tasks: useTasksStore,
  results: useResultsStore,
  settings: useSettingsStore,
  ui: useUIStore,
  
  // Combined hook
  store: useAppStore,
  
  // Specialized hooks
  hooks: {
    objectives: useObjectives,
    tasks: useTasks,
    results: useResults,
    settings: useSettings,
    ui: useUI,
    dashboard: useDashboard,
    analytics: useAnalytics
  },
  
  // Utilities
  utils: {
    initialize: initializeStores,
    reset: resetAllStores,
    export: exportAllStoreData,
    import: importStoreData,
    debug: debugStoreState,
    handleError: handleStoreError,
    monitor: monitorStorePerformance
  },
  
  // Constants
  constants: {
    persistence: PERSISTENCE_KEYS,
    config: STORE_CONFIGS,
    actions: ACTION_PREFIXES
  }
};
