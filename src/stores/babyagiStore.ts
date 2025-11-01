import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { 
  Objective, 
  Task, 
  AgentMemory, 
  SimulationState, 
  SimulationStatistics,
  AppSettings 
} from '../types/babyagi';

interface BabyAGIStore {
  // Core simulation state
  simulation: SimulationState;
  objectives: Objective[];
  currentObjective: Objective | null;
  tasks: Task[];
  agentMemory: AgentMemory[];
  
  // UI state
  selectedObjectiveId: string | null;
  selectedTaskId: string | null;
  activeTab: 'dashboard' | 'objectives' | 'tasks' | 'memory' | 'analytics';
  
  // Settings
  settings: AppSettings;
  
  // Actions
  addObjective: (objective: Omit<Objective, 'id' | 'createdAt'>) => void;
  updateObjective: (id: string, updates: Partial<Objective>) => void;
  selectObjective: (id: string | null) => void;
  
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'attempts'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  selectTask: (id: string | null) => void;
  
  startSimulation: (objectiveId: string) => void;
  pauseSimulation: () => void;
  resetSimulation: () => void;
  
  addToMemory: (memory: Omit<AgentMemory, 'id' | 'timestamp'>) => void;
  updateMemory: (id: string, updates: Partial<AgentMemory>) => void;
  
  setActiveTab: (tab: 'dashboard' | 'objectives' | 'tasks' | 'memory' | 'analytics') => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  
  // Computed values
  getCurrentStatistics: () => SimulationStatistics;
  getTaskProgress: (objectiveId: string) => number;
  getExecutableTasks: (objectiveId: string) => Task[];
}

export const useBabyAGIStore = create<BabyAGIStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    simulation: {
      isRunning: false,
      currentIteration: 0,
      totalIterations: 0,
      executionQueue: [],
      agentMemory: [],
      statistics: {
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
      }
    },
    
    objectives: [],
    currentObjective: null,
    tasks: [],
    agentMemory: [],
    
    selectedObjectiveId: null,
    selectedTaskId: null,
    activeTab: 'dashboard',
    
    settings: {
      simulationSpeed: 'normal',
      autoExecute: false,
      showDetailedLogs: true,
      enableAnimations: true,
      maxIterations: 10,
      useOpenRouter: false,
      openRouterApiKey: undefined,
      selectedModel: 'qwen/qwen-2.5-7b-instruct',
      fallbackToSimulation: true
    },
    
    // Objective actions
    addObjective: (objectiveData) => {
      const objective: Objective = {
        ...objectiveData,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        subtasks: []
      };
      
      set((state) => ({
        objectives: [...state.objectives, objective],
        currentObjective: state.currentObjective || objective
      }));
    },
    
    updateObjective: (id, updates) => {
      set((state) => ({
        objectives: state.objectives.map(obj => 
          obj.id === id ? { ...obj, ...updates } : obj
        ),
        currentObjective: state.currentObjective?.id === id 
          ? { ...state.currentObjective, ...updates }
          : state.currentObjective
      }));
    },
    
    selectObjective: (id) => {
      const objective = id ? get().objectives.find(obj => obj.id === id) || null : null;
      set({ selectedObjectiveId: id, currentObjective: objective });
    },
    
    // Task actions
    addTask: (taskData) => {
      const task: Task = {
        ...taskData,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        attempts: 0
      };
      
      set((state) => ({
        tasks: [...state.tasks, task]
      }));
    },
    
    updateTask: (id, updates) => {
      set((state) => ({
        tasks: state.tasks.map(task => 
          task.id === id ? { ...task, ...updates } : task
        )
      }));
    },
    
    selectTask: (id) => {
      set({ selectedTaskId: id });
    },
    
    // Simulation actions
    startSimulation: (objectiveId) => {
      const objective = get().objectives.find(obj => obj.id === objectiveId);
      if (!objective) return;
      
      set((state) => ({
        simulation: {
          ...state.simulation,
          isRunning: true,
          currentIteration: 1,
          totalIterations: state.settings.maxIterations,
          currentObjective: objective
        },
        currentObjective: objective
      }));
    },
    
    pauseSimulation: () => {
      set((state) => ({
        simulation: {
          ...state.simulation,
          isRunning: false
        }
      }));
    },
    
    resetSimulation: () => {
      set((state) => ({
        simulation: {
          isRunning: false,
          currentIteration: 0,
          totalIterations: 0,
          executionQueue: [],
          agentMemory: state.agentMemory, // Keep memory
          statistics: state.simulation.statistics
        }
      }));
    },
    
    // Memory actions
    addToMemory: (memoryData) => {
      const memory: AgentMemory = {
        ...memoryData,
        id: crypto.randomUUID(),
        timestamp: new Date()
      };
      
      set((state) => ({
        agentMemory: [...state.agentMemory, memory]
      }));
    },
    
    updateMemory: (id, updates) => {
      set((state) => ({
        agentMemory: state.agentMemory.map(memory => 
          memory.id === id ? { ...memory, ...updates } : memory
        )
      }));
    },
    
    // UI actions
    setActiveTab: (tab) => {
      set({ activeTab: tab });
    },
    
    updateSettings: (newSettings) => {
      set((state) => ({
        settings: { ...state.settings, ...newSettings }
      }));
    },
    
    // Computed values
    getCurrentStatistics: () => {
      const { objectives, tasks, agentMemory } = get();
      
      const completedObjectives = objectives.filter(obj => obj.status === 'completed').length;
      const failedObjectives = objectives.filter(obj => obj.status === 'failed').length;
      const completedTasks = tasks.filter(task => task.status === 'completed').length;
      const failedTasks = tasks.filter(task => task.status === 'failed').length;
      
      const efficiencyScore = objectives.length > 0 
        ? Math.round((completedObjectives / objectives.length) * 100)
        : 0;
      
      return {
        totalObjectives: objectives.length,
        completedObjectives,
        failedObjectives,
        totalTasks: tasks.length,
        completedTasks,
        failedTasks,
        averageCompletionTime: 0, // TODO: Calculate from actual task durations
        learningInsights: agentMemory.filter(m => m.type === 'learning').length,
        strategyImprovements: agentMemory.filter(m => m.type === 'strategy').length,
        efficiencyScore
      };
    },
    
    getTaskProgress: (objectiveId) => {
      const { tasks } = get();
      const objectiveTasks = tasks.filter(task => task.objectiveId === objectiveId);
      
      if (objectiveTasks.length === 0) return 0;
      
      const totalProgress = objectiveTasks.reduce((sum, task) => sum + task.progress, 0);
      return Math.round(totalProgress / objectiveTasks.length);
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
    }
  }))
);
