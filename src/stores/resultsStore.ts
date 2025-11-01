import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { AgentMemory, SimulationStatistics, LearningInsight, TaskExecution } from '../types/babyagi';
import { immer } from 'zustand/middleware/immer';

// Types for results store state
interface ResultsState {
  // Execution results
  executionResults: Array<{
    id: string;
    taskId: string;
    objectiveId: string;
    startTime: Date;
    endTime?: Date;
    status: 'success' | 'failure' | 'partial';
    output: string;
    error?: string;
    duration: number;
    metadata: Record<string, any>;
  }>;
  
  // Learning data
  learningInsights: LearningInsight[];
  agentMemory: AgentMemory[];
  strategyImprovements: Array<{
    id: string;
    category: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    applied: boolean;
    appliedAt?: Date;
    effectiveness?: number; // 0-100
  }>;
  
  // Analytics data
  simulationStatistics: SimulationStatistics;
  performanceMetrics: {
    totalExecutionTime: number;
    averageTaskDuration: number;
    successRate: number;
    efficiencyScore: number;
    learningCurve: Array<{
      date: Date;
      successRate: number;
      averageDuration: number;
      tasksCompleted: number;
    }>;
    taskTypeAnalysis: Record<string, {
      count: number;
      successRate: number;
      averageDuration: number;
      commonFailures: string[];
    }>;
  };
  
  // Execution history and logs
  executionHistory: Array<{
    id: string;
    objectiveId: string;
    timestamp: Date;
    duration: number;
    tasksExecuted: number;
    successCount: number;
    failureCount: number;
    insightsGained: number;
  }>;
  
  detailedLogs: Array<{
    id: string;
    timestamp: Date;
    level: 'info' | 'success' | 'warning' | 'error';
    category: string;
    message: string;
    taskId?: string;
    objectiveId?: string;
    details?: any;
  }>;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  selectedResultId: string | null;
  analyticsTimeframe: 'day' | 'week' | 'month' | 'all';
  resultsFilter: {
    status?: 'success' | 'failure' | 'partial';
    objectiveId?: string;
    dateRange?: { start: Date; end: Date };
    searchQuery?: string;
  };
}

// Types for results store actions
interface ResultsActions {
  // Execution results management
  addExecutionResult: (result: Omit<ResultsState['executionResults'][0], 'id' | 'duration'>) => void;
  updateExecutionResult: (id: string, updates: Partial<ResultsState['executionResults'][0]>) => void;
  deleteExecutionResult: (id: string) => void;
  bulkDeleteResults: (ids: string[]) => void;
  
  // Learning data management
  addLearningInsight: (insight: Omit<LearningInsight, 'appliedToNextTasks'>) => void;
  addToAgentMemory: (memory: Omit<AgentMemory, 'id' | 'timestamp'>) => void;
  updateAgentMemory: (id: string, updates: Partial<AgentMemory>) => void;
  deleteAgentMemory: (id: string) => void;
  
  // Strategy improvements
  addStrategyImprovement: (improvement: Omit<ResultsState['strategyImprovements'][0], 'id'>) => void;
  applyStrategyImprovement: (id: string) => void;
  markImprovementEffectiveness: (id: string, effectiveness: number) => void;
  
  // Analytics and statistics
  updateSimulationStatistics: (stats: Partial<SimulationStatistics>) => void;
  recalculatePerformanceMetrics: () => void;
  generatePerformanceReport: (timeframe?: string) => Promise<{
    summary: string;
    metrics: Record<string, number>;
    trends: Array<{ metric: string; change: number; direction: 'up' | 'down' }>;
    recommendations: string[];
  }>;
  
  // Historical data
  addExecutionHistory: (history: Omit<ResultsState['executionHistory'][0], 'id'>) => void;
  clearExecutionHistory: () => void;
  
  // Detailed logging
  addLogEntry: (entry: Omit<ResultsState['detailedLogs'][0], 'id' | 'timestamp'>) => void;
  clearLogs: (category?: string) => void;
  exportLogs: (format: 'json' | 'csv' | 'txt') => string;
  
  // Filtering and search
  setResultsFilter: (filter: Partial<ResultsState['resultsFilter']>) => void;
  clearResultsFilter: () => void;
  searchResults: (query: string) => ResultsState['executionResults'];
  
  // Data export and import
  exportResults: (format: 'json' | 'csv') => string;
  importResults: (data: string, format: 'json' | 'csv') => Promise<void>;
  
  // UI state
  setSelectedResult: (id: string | null) => void;
  setAnalyticsTimeframe: (timeframe: 'day' | 'week' | 'month' | 'all') => void;
  setLoading: (isLoading: boolean) => void;
  clearError: () => void;
  
  // Computed getters
  getFilteredResults: () => ResultsState['executionResults'];
  getResultsByObjective: (objectiveId: string) => ResultsState['executionResults'];
  getResultsByTimeRange: (startDate: Date, endDate: Date) => ResultsState['executionResults'];
  getAverageExecutionTime: (objectiveId?: string) => number;
  getSuccessRateByObjective: (objectiveId: string) => number;
  getMostRecentLearningInsights: (limit?: number) => LearningInsight[];
  getActiveStrategyImprovements: () => ResultsState['strategyImprovements'];
  
  // Real-time monitoring
  monitorExecution: (taskId: string, callback: (updates: Partial<TaskExecution>) => void) => void;
  getCurrentExecutionStatus: (taskId: string) => {
    isExecuting: boolean;
    progress: number;
    currentStep: string;
    logs: Array<{ timestamp: Date; level: string; message: string }>;
  } | null;
}

// Combined store type
type ResultsStore = ResultsState & ResultsActions;

// Default state
const createDefaultState = (): ResultsState => ({
  executionResults: [],
  learningInsights: [],
  agentMemory: [],
  strategyImprovements: [],
  simulationStatistics: {
    totalObjectives: 0,
    completedObjectives: 0,
    failedObjectives: 0,
    totalTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    averageCompletionTime: 0,
    learningInsights: 0,
    strategyImprovements: 0,
    efficiencyScore: 0
  },
  performanceMetrics: {
    totalExecutionTime: 0,
    averageTaskDuration: 0,
    successRate: 0,
    efficiencyScore: 0,
    learningCurve: [],
    taskTypeAnalysis: {}
  },
  executionHistory: [],
  detailedLogs: [],
  isLoading: false,
  error: null,
  selectedResultId: null,
  analyticsTimeframe: 'all',
  resultsFilter: {}
});

// Store implementation
export const useResultsStore = create<ResultsStore>()(
  persist(
    immer((set, get) => ({
      ...createDefaultState(),

      // Execution results management
      addExecutionResult: (resultData) => {
        const endTime = resultData.endTime || new Date();
        const duration = endTime.getTime() - resultData.startTime.getTime();

        const newResult = {
          ...resultData,
          id: crypto.randomUUID(),
          duration: Math.round(duration / 1000) // Convert to seconds
        };

        set((state) => {
          state.executionResults.unshift(newResult);
          
          // Add to logs
          state.detailedLogs.unshift({
            id: crypto.randomUUID(),
            timestamp: new Date(),
            level: resultData.status === 'success' ? 'success' : 
                   resultData.status === 'failure' ? 'error' : 'warning',
            category: 'execution',
            message: `Task execution ${resultData.status}: ${resultData.output.substring(0, 100)}...`,
            taskId: resultData.taskId,
            objectiveId: resultData.objectiveId,
            details: resultData.metadata
          });
        });

        // Recalculate metrics
        get().recalculatePerformanceMetrics();
      },

      updateExecutionResult: (id, updates) => {
        set((state) => {
          const resultIndex = state.executionResults.findIndex(r => r.id === id);
          if (resultIndex !== -1) {
            state.executionResults[resultIndex] = {
              ...state.executionResults[resultIndex],
              ...updates
            };
            
            // Recalculate duration if end time changed
            if (updates.endTime) {
              const result = state.executionResults[resultIndex];
              result.duration = Math.round(
                (updates.endTime.getTime() - result.startTime.getTime()) / 1000
              );
            }
          }
        });
      },

      deleteExecutionResult: (id) => {
        set((state) => {
          state.executionResults = state.executionResults.filter(r => r.id !== id);
          state.detailedLogs = state.detailedLogs.filter(log => log.taskId !== id);
        });
      },

      bulkDeleteResults: (ids) => {
        set((state) => {
          state.executionResults = state.executionResults.filter(r => !ids.includes(r.id));
          
          // Clean up logs
          ids.forEach(id => {
            state.detailedLogs = state.detailedLogs.filter(log => log.taskId !== id);
          });
        });
      },

      // Learning data management
      addLearningInsight: (insightData) => {
        const insight: LearningInsight = {
          ...insightData,
          appliedToNextTasks: false
        };

        set((state) => {
          state.learningInsights.unshift(insight);
          state.simulationStatistics.learningInsights += 1;
          
          // Add to logs
          state.detailedLogs.unshift({
            id: crypto.randomUUID(),
            timestamp: new Date(),
            level: 'info',
            category: 'learning',
            message: `New learning insight: ${insight.insight}`,
            details: insight
          });
        });
      },

      addToAgentMemory: (memoryData) => {
        const memory: AgentMemory = {
          ...memoryData,
          id: crypto.randomUUID(),
          timestamp: new Date()
        };

        set((state) => {
          state.agentMemory.unshift(memory);
          
          // Add to logs
          state.detailedLogs.unshift({
            id: crypto.randomUUID(),
            timestamp: new Date(),
            level: 'info',
            category: 'memory',
            message: `Memory stored: ${memory.content.substring(0, 100)}...`,
            taskId: memory.taskId,
            objectiveId: memory.objectiveId,
            details: memory
          });
        });
      },

      updateAgentMemory: (id, updates) => {
        set((state) => {
          const memoryIndex = state.agentMemory.findIndex(m => m.id === id);
          if (memoryIndex !== -1) {
            state.agentMemory[memoryIndex] = {
              ...state.agentMemory[memoryIndex],
              ...updates
            };
          }
        });
      },

      deleteAgentMemory: (id) => {
        set((state) => {
          state.agentMemory = state.agentMemory.filter(m => m.id !== id);
        });
      },

      // Strategy improvements
      addStrategyImprovement: (improvementData) => {
        const improvement = {
          ...improvementData,
          id: crypto.randomUUID()
        };

        set((state) => {
          state.strategyImprovements.unshift(improvement);
          state.simulationStatistics.strategyImprovements += 1;
        });
      },

      applyStrategyImprovement: (id) => {
        set((state) => {
          const improvementIndex = state.strategyImprovements.findIndex(i => i.id === id);
          if (improvementIndex !== -1) {
            state.strategyImprovements[improvementIndex] = {
              ...state.strategyImprovements[improvementIndex],
              applied: true,
              appliedAt: new Date()
            };
          }
        });
      },

      markImprovementEffectiveness: (id, effectiveness) => {
        set((state) => {
          const improvementIndex = state.strategyImprovements.findIndex(i => i.id === id);
          if (improvementIndex !== -1) {
            state.strategyImprovements[improvementIndex].effectiveness = effectiveness;
          }
        });
      },

      // Analytics and statistics
      updateSimulationStatistics: (stats) => {
        set((state) => {
          state.simulationStatistics = {
            ...state.simulationStatistics,
            ...stats
          };
        });
      },

      recalculatePerformanceMetrics: () => {
        const { executionResults, learningInsights, agentMemory } = get();
        
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // Calculate success rate
        const successfulResults = executionResults.filter(r => r.status === 'success');
        const successRate = executionResults.length > 0 ? 
          (successfulResults.length / executionResults.length) * 100 : 0;

        // Calculate average duration
        const totalDuration = executionResults.reduce((sum, r) => sum + r.duration, 0);
        const averageDuration = executionResults.length > 0 ? 
          Math.round(totalDuration / executionResults.length) : 0;

        // Calculate efficiency score (combination of success rate and speed)
        const efficiencyScore = Math.round(
          (successRate * 0.7) + ((100 - Math.min(averageDuration / 60, 100)) * 0.3)
        );

        // Calculate learning curve
        const learningCurveData = [];
        const timeSegments = [];
        
        for (let i = 6; i >= 0; i--) {
          const segmentStart = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          const segmentEnd = new Date(now.getTime() - (i - 1) * 24 * 60 * 60 * 1000);
          
          const segmentResults = executionResults.filter(r => 
            r.startTime >= segmentStart && r.startTime < segmentEnd
          );
          
          const segmentSuccessRate = segmentResults.length > 0 ? 
            (segmentResults.filter(r => r.status === 'success').length / segmentResults.length) * 100 : 0;
          
          const segmentAvgDuration = segmentResults.length > 0 ? 
            segmentResults.reduce((sum, r) => sum + r.duration, 0) / segmentResults.length : 0;
          
          learningCurveData.push({
            date: segmentStart,
            successRate: segmentSuccessRate,
            averageDuration: Math.round(segmentAvgDuration),
            tasksCompleted: segmentResults.length
          });
        }

        // Task type analysis
        const taskTypeAnalysis: Record<string, any> = {};
        executionResults.forEach(result => {
          const taskType = result.metadata?.taskType || 'unknown';
          if (!taskTypeAnalysis[taskType]) {
            taskTypeAnalysis[taskType] = {
              count: 0,
              successRate: 0,
              averageDuration: 0,
              commonFailures: []
            };
          }
          
          const analysis = taskTypeAnalysis[taskType];
          analysis.count += 1;
          
          if (result.status === 'success') {
            analysis.successRate = ((analysis.successRate * (analysis.count - 1)) + 100) / analysis.count;
          } else {
            analysis.successRate = (analysis.successRate * (analysis.count - 1)) / analysis.count;
          }
          
          analysis.averageDuration = ((analysis.averageDuration * (analysis.count - 1)) + result.duration) / analysis.count;
          
          if (result.status === 'failure' && result.error) {
            const errorCategory = result.error.substring(0, 50);
            if (!analysis.commonFailures.includes(errorCategory)) {
              analysis.commonFailures.push(errorCategory);
              if (analysis.commonFailures.length > 5) {
                analysis.commonFailures.shift();
              }
            }
          }
        });

        set((state) => {
          state.performanceMetrics = {
            totalExecutionTime: totalDuration,
            averageTaskDuration: averageDuration,
            successRate,
            efficiencyScore,
            learningCurve: learningCurveData,
            taskTypeAnalysis
          };
        });
      },

      generatePerformanceReport: async (timeframe) => {
        const { executionResults, learningInsights, strategyImprovements } = get();
        const now = new Date();
        
        let filteredResults = executionResults;
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
          filteredResults = executionResults.filter(r => r.startTime >= timeLimit);
        }

        const summary = `Performance report for ${timeframe || 'all time'} period. ` +
          `Analyzed ${filteredResults.length} execution results with ` +
          `${Math.round((filteredResults.filter(r => r.status === 'success').length / filteredResults.length) * 100) || 0}% success rate.`;

        const metrics = {
          totalExecutions: filteredResults.length,
          successfulExecutions: filteredResults.filter(r => r.status === 'success').length,
          failedExecutions: filteredResults.filter(r => r.status === 'failure').length,
          averageDuration: filteredResults.length > 0 ? 
            Math.round(filteredResults.reduce((sum, r) => sum + r.duration, 0) / filteredResults.length) : 0,
          totalLearningInsights: learningInsights.length,
          appliedImprovements: strategyImprovements.filter(i => i.applied).length
        };

        const trends = []; // Would calculate trends compared to previous period

        const recommendations = [];
        
        if (metrics.successfulExecutions / metrics.totalExecutions < 0.8) {
          recommendations.push("Consider reviewing task strategies to improve success rate");
        }
        
        if (metrics.averageDuration > 300) { // 5 minutes
          recommendations.push("Optimize task execution time");
        }
        
        if (metrics.totalLearningInsights === 0) {
          recommendations.push("Focus on learning from completed tasks");
        }

        return { summary, metrics, trends, recommendations };
      },

      // Historical data
      addExecutionHistory: (historyData) => {
        const history = {
          ...historyData,
          id: crypto.randomUUID()
        };

        set((state) => {
          state.executionHistory.unshift(history);
          
          // Keep only last 100 history entries
          if (state.executionHistory.length > 100) {
            state.executionHistory = state.executionHistory.slice(0, 100);
          }
        });
      },

      clearExecutionHistory: () => {
        set((state) => {
          state.executionHistory = [];
        });
      },

      // Detailed logging
      addLogEntry: (entryData) => {
        const logEntry = {
          ...entryData,
          id: crypto.randomUUID(),
          timestamp: new Date()
        };

        set((state) => {
          state.detailedLogs.unshift(logEntry);
          
          // Keep only last 1000 log entries
          if (state.detailedLogs.length > 1000) {
            state.detailedLogs = state.detailedLogs.slice(0, 1000);
          }
        });
      },

      clearLogs: (category) => {
        set((state) => {
          if (category) {
            state.detailedLogs = state.detailedLogs.filter(log => log.category !== category);
          } else {
            state.detailedLogs = [];
          }
        });
      },

      exportLogs: (format) => {
        const { detailedLogs } = get();
        
        switch (format) {
          case 'json':
            return JSON.stringify(detailedLogs, null, 2);
          case 'csv':
            const headers = ['timestamp', 'level', 'category', 'message', 'taskId', 'objectiveId'];
            const rows = detailedLogs.map(log => [
              log.timestamp.toISOString(),
              log.level,
              log.category,
              log.message,
              log.taskId || '',
              log.objectiveId || ''
            ]);
            return [headers, ...rows].map(row => row.join(',')).join('\n');
          case 'txt':
            return detailedLogs.map(log => 
              `[${log.timestamp.toISOString()}] ${log.level.toUpperCase()}: ${log.message}`
            ).join('\n');
          default:
            return '';
        }
      },

      // Filtering and search
      setResultsFilter: (filter) => {
        set((state) => {
          state.resultsFilter = { ...state.resultsFilter, ...filter };
        });
      },

      clearResultsFilter: () => {
        set((state) => {
          state.resultsFilter = {};
        });
      },

      searchResults: (query) => {
        const { executionResults } = get();
        const lowercaseQuery = query.toLowerCase();
        
        return executionResults.filter(result =>
          result.output.toLowerCase().includes(lowercaseQuery) ||
          (result.error && result.error.toLowerCase().includes(lowercaseQuery)) ||
          result.metadata && JSON.stringify(result.metadata).toLowerCase().includes(lowercaseQuery)
        );
      },

      // Data export and import
      exportResults: (format) => {
        const { executionResults, learningInsights, agentMemory } = get();
        
        const data = {
          executionResults,
          learningInsights,
          agentMemory,
          exportedAt: new Date().toISOString()
        };
        
        return JSON.stringify(data, null, 2);
      },

      importResults: async (data, format) => {
        set((state) => {
          state.isLoading = true;
        });

        try {
          if (format === 'json') {
            const parsed = JSON.parse(data);
            set((state) => {
              if (parsed.executionResults) {
                state.executionResults = [...parsed.executionResults, ...state.executionResults];
              }
              if (parsed.learningInsights) {
                state.learningInsights = [...parsed.learningInsights, ...state.learningInsights];
              }
              if (parsed.agentMemory) {
                state.agentMemory = [...parsed.agentMemory, ...state.agentMemory];
              }
            });
          }
          
          get().recalculatePerformanceMetrics();
        } catch (error) {
          set((state) => {
            state.error = 'Failed to import results';
          });
        } finally {
          set((state) => {
            state.isLoading = false;
          });
        }
      },

      // UI state
      setSelectedResult: (id) => {
        set({ selectedResultId: id });
      },

      setAnalyticsTimeframe: (timeframe) => {
        set({ analyticsTimeframe: timeframe });
      },

      setLoading: (isLoading) => {
        set({ isLoading });
      },

      clearError: () => {
        set({ error: null });
      },

      // Computed getters
      getFilteredResults: () => {
        const { executionResults, resultsFilter } = get();
        let filtered = executionResults;

        if (resultsFilter.status) {
          filtered = filtered.filter(r => r.status === resultsFilter.status);
        }

        if (resultsFilter.objectiveId) {
          filtered = filtered.filter(r => r.objectiveId === resultsFilter.objectiveId);
        }

        if (resultsFilter.dateRange) {
          filtered = filtered.filter(r => 
            r.startTime >= resultsFilter.dateRange!.start && 
            r.startTime <= resultsFilter.dateRange!.end
          );
        }

        if (resultsFilter.searchQuery) {
          const query = resultsFilter.searchQuery.toLowerCase();
          filtered = filtered.filter(r =>
            r.output.toLowerCase().includes(query) ||
            (r.error && r.error.toLowerCase().includes(query))
          );
        }

        return filtered;
      },

      getResultsByObjective: (objectiveId) => {
        return get().executionResults.filter(r => r.objectiveId === objectiveId);
      },

      getResultsByTimeRange: (startDate, endDate) => {
        return get().executionResults.filter(r => 
          r.startTime >= startDate && r.startTime <= endDate
        );
      },

      getAverageExecutionTime: (objectiveId) => {
        const results = objectiveId ? 
          get().getResultsByObjective(objectiveId) : 
          get().executionResults;
        
        if (results.length === 0) return 0;
        
        return Math.round(
          results.reduce((sum, r) => sum + r.duration, 0) / results.length
        );
      },

      getSuccessRateByObjective: (objectiveId) => {
        const results = get().getResultsByObjective(objectiveId);
        if (results.length === 0) return 0;
        
        const successful = results.filter(r => r.status === 'success').length;
        return Math.round((successful / results.length) * 100);
      },

      getMostRecentLearningInsights: (limit = 10) => {
        return get().learningInsights.slice(0, limit);
      },

      getActiveStrategyImprovements: () => {
        return get().strategyImprovements.filter(i => !i.applied);
      },

      // Real-time monitoring
      monitorExecution: (taskId, callback) => {
        // This would be used for real-time monitoring of task execution
        // Implementation would depend on the specific real-time system used
      },

      getCurrentExecutionStatus: (taskId) => {
        // This would return current execution status for a task
        return null;
      }
    })),
    {
      name: 'results-store',
      partialize: (state) => ({
        executionResults: state.executionResults.slice(0, 500), // Keep last 500 results
        learningInsights: state.learningInsights.slice(0, 100), // Keep last 100 insights
        agentMemory: state.agentMemory.slice(0, 200), // Keep last 200 memories
        strategyImprovements: state.strategyImprovements.slice(0, 50), // Keep last 50 improvements
        simulationStatistics: state.simulationStatistics,
        performanceMetrics: state.performanceMetrics,
        executionHistory: state.executionHistory.slice(0, 50), // Keep last 50 history entries
        detailedLogs: state.detailedLogs.slice(0, 500), // Keep last 500 logs
        selectedResultId: state.selectedResultId,
        analyticsTimeframe: state.analyticsTimeframe
      })
    }
  ),
  subscribeWithSelector
);
