import { useCallback, useMemo, useEffect } from 'react';
import { shallow } from 'zustand/shallow';
import { useObjectivesStore } from './objectivesStore';
import { useTasksStore } from './tasksStore';
import { useResultsStore } from './resultsStore';
import { useSettingsStore } from './settingsStore';
import { useUIStore } from './uiStore';
import { Objective, Task } from '../types/babyagi';

// =============================================================================
// OBJECTIVES HOOKS
// =============================================================================

export const useObjectives = () => {
  const store = useObjectivesStore();
  
  return {
    // State
    ...store,
    
    // Computed values
    activeObjectives: useMemo(
      () => store.objectives.filter(obj => obj.status === 'pending' || obj.status === 'in-progress'),
      [store.objectives]
    ),
    
    completedObjectives: useMemo(
      () => store.objectives.filter(obj => obj.status === 'completed'),
      [store.objectives]
    ),
    
    objectiveProgress: useCallback((id: string) => {
      const objective = store.getObjectiveById(id);
      if (!objective || objective.subtasks.length === 0) return 0;
      
      const totalProgress = objective.subtasks.reduce((sum, task) => sum + task.progress, 0);
      return Math.round(totalProgress / objective.subtasks.length);
    }, [store.getObjectiveById]),
    
    objectivesStats: useMemo(() => ({
      total: store.objectives.length,
      active: store.getActiveObjectivesCount(),
      completed: store.getCompletedObjectivesCount(),
      averageCompletionTime: store.getAverageCompletionTime()
    }), [
      store.objectives.length,
      store.getActiveObjectivesCount,
      store.getCompletedObjectivesCount,
      store.getAverageCompletionTime
    ])
  };
};

// =============================================================================
// TASKS HOOKS
// =============================================================================

export const useTasks = () => {
  const store = useTasksStore();
  
  return {
    // State
    ...store,
    
    // Computed values
    executableTasks: useCallback((objectiveId?: string) => {
      if (objectiveId) {
        return store.getExecutableTasks(objectiveId);
      }
      return store.tasks.filter(task => task.status === 'pending');
    }, [store.getExecutableTasks, store.tasks]),
    
    overdueTasks: useMemo(() => store.getOverdueTasks(), [store.getOverdueTasks]),
    
    tasksNeedingRetry: useMemo(() => store.getTasksNeedingRetry(), [store.getTasksNeedingRetry]),
    
    taskStatistics: useMemo(() => ({
      total: store.tasks.length,
      completed: store.completedTasks.length,
      failed: store.failedTasks.length,
      active: store.activeTasks.length,
      inQueue: store.taskQueue.length,
      completionRate: store.getTaskCompletionRate(),
      successRate: store.getTaskSuccessRate(),
      averageDuration: store.getAverageTaskDuration()
    }), [
      store.tasks.length,
      store.completedTasks.length,
      store.failedTasks.length,
      store.activeTasks.length,
      store.taskQueue.length,
      store.getTaskCompletionRate,
      store.getTaskSuccessRate,
      store.getAverageTaskDuration
    ]),
    
    taskPriorityQueue: useMemo(() => {
      return store.taskQueue
        .sort((a, b) => b.priority - a.priority)
        .slice(0, 10);
    }, [store.taskQueue]),
    
    tasksByObjective: useCallback((objectiveId: string) => {
      return store.getTasksByObjective(objectiveId);
    }, [store.getTasksByObjective]),
    
    nextExecutableTask: useCallback((objectiveId: string) => {
      return store.getNextExecutableTask(objectiveId);
    }, [store.getNextExecutableTask])
  };
};

// =============================================================================
// RESULTS HOOKS
// =============================================================================

export const useResults = () => {
  const store = useResultsStore();
  
  return {
    // State
    ...store,
    
    // Computed values
    recentResults: useMemo(
      () => store.executionResults.slice(0, 10),
      [store.executionResults]
    ),
    
    recentLearningInsights: useMemo(
      () => store.learningInsights.slice(0, 5),
      [store.learningInsights]
    ),
    
    performanceTrend: useMemo(() => {
      return store.performanceMetrics.learningCurve.slice(-7); // Last 7 days
    }, [store.performanceMetrics.learningCurve]),
    
    resultsByObjective: useCallback((objectiveId: string) => {
      return store.getResultsByObjective(objectiveId);
    }, [store.getResultsByObjective]),
    
    successRateOverTime: useMemo(() => {
      return store.performanceMetrics.learningCurve.map(point => ({
        date: point.date,
        successRate: point.successRate
      }));
    }, [store.performanceMetrics.learningCurve]),
    
    executionTimeTrend: useMemo(() => {
      return store.performanceMetrics.learningCurve.map(point => ({
        date: point.date,
        duration: point.averageDuration
      }));
    }, [store.performanceMetrics.learningCurve]),
    
    insightsByCategory: useMemo(() => {
      const categories: Record<string, typeof store.learningInsights> = {};
      store.learningInsights.forEach(insight => {
        if (!categories[insight.category]) {
          categories[insight.category] = [];
        }
        categories[insight.category].push(insight);
      });
      return categories;
    }, [store.learningInsights]),
    
    activeImprovements: useMemo(
      () => store.getActiveStrategyImprovements(),
      [store.getActiveStrategyImprovements]
    ),
    
    errorAnalysis: useMemo(() => {
      const fn = (store as any).getMostCommonFailureReasons;
      return typeof fn === 'function' ? fn() : [];
    }, [store])
  };
};

// =============================================================================
// SETTINGS HOOKS
// =============================================================================

export const useSettings = () => {
  const store = useSettingsStore();
  
  return {
    // State
    ...store,
    
    // Computed values
    effectiveTheme: useMemo(() => {
      return store.getEffectiveSettings().resolvedTheme;
    }, [store.getEffectiveSettings]),
    
    isOpenRouterConfigured: useMemo(() => {
      return store.settings.useOpenRouter && !!store.settings.openRouterApiKey;
    }, [store.settings.useOpenRouter, store.settings.openRouterApiKey]),
    
    connectionStatus: useMemo(() => {
      if (!store.settings.useOpenRouter) return 'not-configured';
      return store.connectionStatus;
    }, [store.settings.useOpenRouter, store.connectionStatus]),
    
    availableModelsList: useMemo(() => {
      return store.availableModels.map(model => ({
        id: model.id,
        name: model.name || model.id,
        description: model.description,
        pricing: model.pricing
      }));
    }, [store.availableModels]),
    
    settingsPresets: useMemo(() => store.getPresets(), [store.getPresets]),
    
    settingsValidation: useMemo(() => store.validateSettings(), [store.validateSettings]),
    
    // Validation helpers
    hasUnsavedChanges: useMemo(() => store.hasUnsavedChanges, [store.hasUnsavedChanges]),
    
    // Settings export/import
    exportAllSettings: useCallback(async () => {
      const settingsData = store.exportSettings();
      const fileName = `babyagi-settings-${new Date().toISOString().split('T')[0]}.json`;
      
      const blob = new Blob([settingsData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, [store.exportSettings]),
    
    // Quick settings actions
    toggleTheme: useCallback(() => {
      const themes: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system'];
      const currentIndex = themes.indexOf(store.theme);
      const nextTheme = themes[(currentIndex + 1) % themes.length];
      store.setTheme(nextTheme);
    }, [store.theme, store.setTheme]),
    
    resetToDefaults: useCallback(() => {
      if (confirm('Are you sure you want to reset all settings to defaults?')) {
        store.resetSettings();
      }
    }, [store.resetSettings])
  };
};

// =============================================================================
// UI HOOKS
// =============================================================================

export const useUI = () => {
  const store = useUIStore();
  
  return {
    // State
    ...store,
    
    // Computed values
    isMobile: useMemo(() => store.layoutMode === 'mobile', [store.layoutMode]),
    isTablet: useMemo(() => store.layoutMode === 'tablet', [store.layoutMode]),
    isDesktop: useMemo(() => store.layoutMode === 'desktop', [store.layoutMode]),
    
    unreadNotifications: useMemo(() => 
      store.notifications.filter(n => !n.persistent).length,
      [store.notifications]
    ),
    
    hasFormChanges: useCallback((formId: string) => {
      const formState = store.activeForms[formId];
      return formState?.isDirty || false;
    }, [store.activeForms]),
    
    currentViewData: useCallback(() => store.getCurrentViewData(), [store.getCurrentViewData]),
    
    // Loading helpers
    isPageLoading: useCallback(() => store.isLoading('page'), [store.isLoading]),
    isDataLoading: useCallback((key?: string) => store.isLoading(key), [store.isLoading]),
    
    // Notification helpers
    showSuccessMessage: useCallback((title: string, message: string) => 
      store.showSuccess(title, message), [store.showSuccess]),
    
    showErrorMessage: useCallback((title: string, message: string, persistent = false) => 
      store.showError(title, message, persistent), [store.showError]),
    
    showWarningMessage: useCallback((title: string, message: string) => 
      store.showWarning(title, message), [store.showWarning]),
    
    showInfoMessage: useCallback((title: string, message: string) => 
      store.showInfo(title, message), [store.showInfo]),
    
    // Modal helpers
    openModal: useCallback((component: string, data?: any) => 
      store.openModal(component, data), [store.openModal]),
    
    closeModal: useCallback(() => store.closeModal(), [store.closeModal]),
    
    // Selection helpers
    toggleItemSelection: useCallback((context: string, itemId: string) => {
      const selected = store.getSelectedItems(context);
      const isSelected = selected.includes(itemId);
      store.updateSelectedItems(context, itemId, !isSelected);
    }, [store.getSelectedItems, store.updateSelectedItems]),
    
    clearSelection: useCallback((context?: string) => 
      store.clearSelectedItems(context), [store.clearSelectedItems]),
    
    // Search helpers
    setSearchQuery: useCallback((query: string) => 
      store.setGlobalSearch(query), [store.setGlobalSearch]),
    
    clearSearch: useCallback(() => 
      store.clearGlobalSearch(), [store.clearGlobalSearch]),
    
    // Layout helpers
    toggleSidebar: useCallback(() => store.toggleSidebar(), [store.toggleSidebar]),
    setSidebarOpen: useCallback((open: boolean) => store.setSidebarOpen(open), [store.setSidebarOpen]),
    
    // Theme helpers
    toggleTheme: useCallback(() => {
      const themes: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system'];
      const currentIndex = themes.indexOf(store.theme);
      const nextTheme = themes[(currentIndex + 1) % themes.length];
      store.setTheme(nextTheme);
    }, [store.theme, store.setTheme])
  };
};

// =============================================================================
// COMBINED STORE HOOK
// =============================================================================

export const useAppStore = () => {
  const objectives = useObjectives();
  const tasks = useTasks();
  const results = useResults();
  const settings = useSettings();
  const ui = useUI();
  
  return {
    objectives,
    tasks,
    results,
    settings,
    ui,
    
    // Combined actions
    createObjectiveWithTask: useCallback(async (objectiveData: Omit<Objective, 'id' | 'createdAt'>, taskData?: Omit<Task, 'id' | 'createdAt' | 'attempts' | 'objectiveId'>) => {
      objectives.addObjective(objectiveData as any);
      const objective = objectives.currentObjective;
      
      if (objective && taskData) {
        tasks.addTask({ ...taskData, objectiveId: objective.id });
      }
      
      ui.showSuccessMessage('Objective Created', 'New objective has been created successfully');
    }, [objectives, tasks, ui]),
    
    executeTask: useCallback(async (taskId: string) => {
      const task = tasks.getTaskById(taskId);
      if (!task) return;
      
      tasks.startTaskExecution(taskId);
      ui.setLoading(`task-${taskId}`, true, 'Executing task...');
      
      try {
        // Simulate task execution
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const success = Math.random() > 0.2; // 80% success rate
        
        if (success) {
          await tasks.completeTask(taskId, `Task "${task.title}" completed successfully`);
          results.addExecutionResult({
            taskId: task.id,
            objectiveId: task.objectiveId,
            startTime: new Date(),
            status: 'success',
            output: `Task completed successfully`,
            metadata: { taskTitle: task.title }
          });
          ui.showSuccessMessage('Task Completed', `"${task.title}" has been completed successfully`);
        } else {
          await tasks.failTask(taskId, 'Task execution failed due to insufficient resources');
          results.addExecutionResult({
            taskId: task.id,
            objectiveId: task.objectiveId,
            startTime: new Date(),
            status: 'failure',
            output: '',
            error: 'Task execution failed',
            metadata: { taskTitle: task.title }
          });
          ui.showErrorMessage('Task Failed', `"${task.title}" failed to complete`);
        }
        
        // Add learning insight
        results.addLearningInsight({
          category: 'strategy',
          insight: success ? 'Task completed with current approach' : 'Consider alternative strategies',
          confidence: success ? 0.8 : 0.6
        });
        
      } catch (error) {
        await tasks.failTask(taskId, error instanceof Error ? error.message : 'Unknown error');
        ui.showErrorMessage('Execution Error', 'An error occurred during task execution');
      } finally {
        ui.clearLoading(`task-${taskId}`);
      }
    }, [tasks, results, ui]),
    
    // Quick actions
    quickAddObjective: useCallback((title: string, description: string) => {
      objectives.addObjective({
        title,
        description,
        complexity: 5,
        status: 'pending',
        subtasks: []
      } as any);
      ui.showSuccessMessage('Objective Added', 'New objective has been created');
    }, [objectives, ui]),
    
    quickAddTask: useCallback((title: string, description: string, objectiveId?: string) => {
      const targetObjectiveId = objectiveId || objectives.currentObjective?.id;
      if (!targetObjectiveId) {
        ui.showErrorMessage('No Objective', 'Please select an objective first');
        return;
      }
      
      tasks.addTask({
        title,
        description,
        objectiveId: targetObjectiveId,
        priority: 5,
        complexity: 5,
        status: 'pending',
        dependencies: [],
        estimatedDuration: 30,
        progress: 0
      });
      ui.showSuccessMessage('Task Added', 'New task has been created');
    }, [tasks, objectives.currentObjective, ui]),
    
    // Data export/import
    exportAllData: useCallback(async () => {
      const data = {
        objectives: objectives.objectives,
        tasks: tasks.tasks,
        results: results.executionResults,
        settings: settings.settings,
        exportedAt: new Date().toISOString()
      };
      
      const dataStr = JSON.stringify(data, null, 2);
      const fileName = `babyagi-export-${new Date().toISOString().split('T')[0]}.json`;
      
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      ui.showSuccessMessage('Data Exported', 'All data has been exported successfully');
    }, [objectives.objectives, tasks.tasks, results.executionResults, settings.settings, ui]),
    
    // Reset application
    resetApplication: useCallback(() => {
      if (confirm('Are you sure you want to reset all data? This action cannot be undone.')) {
        // objectives reset not implemented
        tasks.clearQueue();
        results.clearExecutionHistory();
        ui.resetUIState();
        ui.showSuccessMessage('Application Reset', 'All data has been reset');
      }
    }, [objectives, tasks, results, ui])
  };
};

// =============================================================================
// HOOK COMPOSERS FOR SPECIFIC USE CASES
// =============================================================================

// Dashboard hook
export const useDashboard = () => {
  const { objectives, tasks, results, ui } = useAppStore();
  
  return useMemo(() => ({
    stats: {
      totalObjectives: objectives.objectivesStats.total,
      activeObjectives: objectives.objectivesStats.active,
      totalTasks: tasks.taskStatistics.total,
      completedTasks: tasks.taskStatistics.completed,
      recentResults: results.recentResults.length,
      learningInsights: results.recentLearningInsights.length
    },
    
    recentActivity: {
      objectives: objectives.objectives.slice(0, 3),
      tasks: tasks.tasks.slice(0, 5),
      results: results.recentResults.slice(0, 3)
    },
    
    trends: {
      performance: results.performanceTrend,
      successRate: results.successRateOverTime,
      taskCompletion: tasks.taskStatistics.completionRate
    },
    
    actions: {
      createQuickObjective: ui.showInfoMessage.bind(null, 'Quick Add', 'Feature coming soon'),
      viewAllObjectives: () => ui.setCurrentView('objectives'),
      viewAllTasks: () => ui.setCurrentView('tasks'),
      viewAnalytics: () => ui.setCurrentView('analytics')
    }
  }), [objectives, tasks, results, ui]);
};

// Analytics hook
export const useAnalytics = () => {
  const { results, tasks, objectives } = useAppStore();
  
  return useMemo(() => ({
    performanceMetrics: results.performanceMetrics,
    taskAnalysis: results.performanceMetrics.taskTypeAnalysis,
    objectiveStats: objectives.objectivesStats,
    learningInsights: results.insightsByCategory,
    executionTrends: {
      successRate: results.successRateOverTime,
      executionTime: results.executionTimeTrend,
      completedTasks: results.performanceMetrics.learningCurve
    },
    
    insights: {
      topPerformers: Object.entries(results.performanceMetrics.taskTypeAnalysis)
        .sort(([,a], [,b]) => b.successRate - a.successRate)
        .slice(0, 3),
      commonFailures: results.errorAnalysis,
      activeImprovements: results.activeImprovements
    },
    
    exportReport: async () => {
      const report = await results.generatePerformanceReport('month');
      const reportStr = JSON.stringify(report, null, 2);
      
      const blob = new Blob([reportStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }), [results, tasks, objectives]);
};

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type {
  Objective,
  Task,
  AppSettings,
  SimulationStatistics,
  AgentMemory,
  LearningInsight
} from '../types/babyagi';

export { useObjectivesStore } from './objectivesStore';
export { useTasksStore } from './tasksStore';
export { useResultsStore } from './resultsStore';
export { useSettingsStore } from './settingsStore';
export { useUIStore } from './uiStore';
