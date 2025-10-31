import { Objective, Task, LearningInsight, AgentMemory, AppSettings } from '../types/babyagi';
import { OpenRouterService, DEFAULT_OPENROUTER_CONFIG } from './openRouterService';

export class EnhancedBabyAGIEngine {
  private static instance: EnhancedBabyAGIEngine;
  private objectives: Objective[] = [];
  private tasks: Task[] = [];
  private agentMemory: AgentMemory[] = [];
  private callbacks: { [key: string]: Function[] } = {};
  private openRouterService: OpenRouterService | null = null;
  private settings: AppSettings;

  constructor(settings: AppSettings) {
    this.settings = settings;
    this.initializeOpenRouter();
  }

  static getInstance(settings?: AppSettings): EnhancedBabyAGIEngine {
    if (!EnhancedBabyAGIEngine.instance || settings) {
      EnhancedBabyAGIEngine.instance = new EnhancedBabyAGIEngine(settings || {
        simulationSpeed: 'normal',
        autoExecute: false,
        showDetailedLogs: true,
        enableAnimations: true,
        maxIterations: 10,
        useOpenRouter: false,
        selectedModel: 'qwen/qwen-2.5-7b-instruct',
        fallbackToSimulation: true
      });
    }
    return EnhancedBabyAGIEngine.instance;
  }

  updateSettings(newSettings: AppSettings) {
    this.settings = { ...this.settings, ...newSettings };
    this.initializeOpenRouter();
  }

  private initializeOpenRouter() {
    if (this.settings.useOpenRouter && this.settings.openRouterApiKey) {
      this.openRouterService = new OpenRouterService({
        ...DEFAULT_OPENROUTER_CONFIG,
        apiKey: this.settings.openRouterApiKey,
        model: this.settings.selectedModel,
      });
    } else {
      this.openRouterService = null;
    }
  }

  // Event system
  on(event: string, callback: Function) {
    if (!this.callbacks[event]) {
      this.callbacks[event] = [];
    }
    this.callbacks[event].push(callback);
  }

  private emit(event: string, data?: any) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach(callback => callback(data));
    }
  }

  // Add data management methods
  addObjective(objective: Objective) {
    this.objectives.push(objective);
  }

  addTask(task: Task) {
    this.tasks.push(task);
  }

  updateTask(taskId: string, updates: Partial<Task>) {
    const index = this.tasks.findIndex(t => t.id === taskId);
    if (index !== -1) {
      this.tasks[index] = { ...this.tasks[index], ...updates };
    }
  }

  addToMemory(memory: AgentMemory) {
    this.agentMemory.push(memory);
  }

  // Main simulation loop with AI/simulation toggle
  async startSimulation(objectiveId: string): Promise<void> {
    const objective = this.objectives.find(obj => obj.id === objectiveId);
    if (!objective) {
      throw new Error('Objective not found');
    }

    this.emit('simulationStarted', objective);
    
    for (let iteration = 1; iteration <= this.settings.maxIterations; iteration++) {
      this.emit('iterationStart', iteration);
      
      try {
        // 1. Analyze objective and decompose into tasks
        const newTasks = await this.decomposeObjective(objective, iteration);
        newTasks.forEach(task => this.addTask(task));
        
        // 2. Execute available tasks
        const executableTasks = this.getExecutableTasks(objectiveId);
        for (const task of executableTasks) {
          await this.executeTask(task);
        }
        
        // 3. Evaluate progress and learn
        const learningInsights = await this.generateInsights(objective, iteration);
        learningInsights.forEach(insight => this.addLearning(insight));
        
        // 4. Check if objective is completed
        if (await this.checkObjectiveCompletion(objective)) {
          this.completeObjective(objective);
          this.emit('simulationCompleted', objective);
          break;
        }
        
        this.emit('iterationEnd', iteration);
        
        // Add delay based on simulation speed
        const delays = { slow: 3000, normal: 2000, fast: 1000 };
        await this.delay(delays[this.settings.simulationSpeed]);
        
      } catch (error) {
        console.error('Error in simulation iteration:', error);
        if (this.settings.fallbackToSimulation && this.openRouterService) {
          // Fallback to simulation if AI fails
          this.emit('fallbackToSimulation', { iteration, error: error.message });
          await this.runSimulationIteration(objective, iteration);
        } else {
          throw error;
        }
      }
    }
    
    if (objective.status !== 'completed') {
      this.failObjective(objective, 'Maximum iterations reached');
    }
  }

  // Enhanced objective decomposition with AI integration
  private async decomposeObjective(objective: Objective, iteration: number): Promise<Task[]> {
    const tasks: Task[] = [];
    
    try {
      if (this.openRouterService) {
        // Use AI for task decomposition
        const taskTitles = await this.openRouterService.generateTaskDecomposition(
          objective.description,
          objective.complexity
        );
        
        for (let i = 0; i < taskTitles.length; i++) {
          const title = taskTitles[i];
          const task: Task = {
            id: crypto.randomUUID(),
            title,
            description: `AI-generated task: ${title}`,
            objectiveId: objective.id,
            priority: Math.max(10 - i, 1), // Higher priority for earlier tasks
            complexity: Math.min(objective.complexity + Math.floor(Math.random() * 3) - 1, 10),
            status: 'pending',
            dependencies: i > 0 ? [tasks[i - 1]?.id].filter(Boolean) : [],
            estimatedDuration: 20 + (objective.complexity * 5) + Math.floor(Math.random() * 30),
            progress: 0,
            attempts: 0,
            createdAt: new Date()
          };
          
          tasks.push(task);
        }
        
        this.emit('aiTaskDecomposition', { objective, tasks, iteration });
      } else {
        // Fallback to simulation
        return this.simulateTaskDecomposition(objective, iteration);
      }
    } catch (error) {
      console.error('AI decomposition failed:', error);
      if (this.settings.fallbackToSimulation) {
        this.emit('fallbackToSimulation', { context: 'decomposition', error: error.message });
        return this.simulateTaskDecomposition(objective, iteration);
      }
      throw error;
    }
    
    return tasks;
  }

  // Enhanced task execution with AI strategy
  private async executeTask(task: Task): Promise<void> {
    task.startedAt = new Date();
    task.status = 'in-progress';
    task.attempts += 1;
    
    this.emit('taskStarted', task);
    
    try {
      let executionStrategy = 'Simulated execution strategy';
      
      if (this.openRouterService) {
        // Get AI-powered execution strategy
        const context = this.getTaskContext(task);
        executionStrategy = await this.openRouterService.generateExecutionStrategy(
          task.description,
          context
        );
      }
      
      // Simulate task execution with AI-enhanced logic
      const executionResult = await this.simulateTaskExecution(task, executionStrategy);
      
      task.results = executionResult.results;
      task.actualDuration = executionResult.duration;
      task.progress = 100;
      task.status = executionResult.success ? 'completed' : 'failed';
      task.completedAt = new Date();
      
      // Generate learning insights if AI is available
      if (this.openRouterService && (executionResult.success || task.attempts >= 3)) {
        try {
          const learningInsight = await this.openRouterService.generateLearningInsights(
            task.title,
            task.results || '',
            executionResult.success
          );
          
          task.learning = {
            category: this.determineLearningCategory(learningInsight),
            insight: learningInsight,
            confidence: executionResult.success ? 0.8 : 0.6,
            appliedToNextTasks: false
          };
        } catch (error) {
          console.error('Failed to generate learning insights:', error);
        }
      }
      
      this.emit('taskCompleted', task);
      
    } catch (error) {
      console.error('Task execution failed:', error);
      task.status = 'failed';
      task.results = `Execution failed: ${error.message}`;
      task.completedAt = new Date();
      this.emit('taskFailed', task);
    }
  }

  // Simulation fallback methods
  private async simulateTaskDecomposition(objective: Objective, iteration: number): Promise<Task[]> {
    const tasks: Task[] = [];
    const relevantMemories = this.getRelevantMemories(objective.title, iteration);
    const taskTemplates = this.generateTaskTemplates(objective);
    
    for (const template of taskTemplates) {
      const enhancedTemplate = this.applyLearning(template, relevantMemories);
      
      const task: Task = {
        id: crypto.randomUUID(),
        title: enhancedTemplate.title,
        description: enhancedTemplate.description,
        objectiveId: objective.id,
        priority: enhancedTemplate.priority,
        complexity: enhancedTemplate.complexity,
        status: 'pending',
        dependencies: enhancedTemplate.dependencies || [],
        estimatedDuration: enhancedTemplate.estimatedDuration,
        progress: 0,
        attempts: 0,
        createdAt: new Date()
      };
      
      tasks.push(task);
    }
    
    return tasks;
  }

  private async simulateTaskExecution(task: Task, strategy: string): Promise<{
    success: boolean;
    results: string;
    duration: number;
  }> {
    // Simulate execution time
    const baseTime = task.estimatedDuration || 30;
    const variation = Math.random() * 0.4 + 0.8; // 80% to 120% of estimated time
    const duration = Math.round(baseTime * variation);
    
    await this.delay(Math.min(duration * 100, 2000)); // Speed up for demo
    
    // Success rate based on complexity and attempts
    const complexityFactor = (11 - task.complexity) / 10;
    const attemptPenalty = Math.max(0, 1 - (task.attempts - 1) * 0.2);
    const successRate = complexityFactor * attemptPenalty * 0.85;
    
    const success = Math.random() < successRate;
    
    const results = success
      ? `Successfully completed: ${task.title}. ${strategy}`
      : `Failed to complete: ${task.title}. Encountered complexity level ${task.complexity} challenges.`;
    
    return { success, results, duration };
  }

  private async runSimulationIteration(objective: Objective, iteration: number): Promise<void> {
    // Basic simulation iteration as fallback
    const newTasks = await this.simulateTaskDecomposition(objective, iteration);
    newTasks.forEach(task => this.addTask(task));
    
    const executableTasks = this.getExecutableTasks(objective.id);
    for (const task of executableTasks) {
      const result = await this.simulateTaskExecution(task, 'Fallback simulation strategy');
      this.updateTask(task.id, {
        status: result.success ? 'completed' : 'failed',
        results: result.results,
        actualDuration: result.duration,
        progress: 100,
        completedAt: new Date()
      });
    }
  }

  // Utility methods
  private getTaskContext(task: Task): string[] {
    const relatedTasks = this.tasks.filter(t => 
      t.objectiveId === task.objectiveId && 
      t.status === 'completed'
    );
    return relatedTasks.map(t => `${t.title}: ${t.results}`).slice(-3);
  }

  private determineLearningCategory(insight: string): 'strategy' | 'timing' | 'dependencies' | 'priority' {
    const lowerInsight = insight.toLowerCase();
    if (lowerInsight.includes('strategy') || lowerInsight.includes('approach')) return 'strategy';
    if (lowerInsight.includes('timing') || lowerInsight.includes('schedule')) return 'timing';
    if (lowerInsight.includes('depend') || lowerInsight.includes('prerequisite')) return 'dependencies';
    return 'priority';
  }

  private getExecutableTasks(objectiveId: string): Task[] {
    return this.tasks.filter(task => 
      task.objectiveId === objectiveId && 
      task.status === 'pending' &&
      task.dependencies.every(depId => 
        this.tasks.find(t => t.id === depId)?.status === 'completed'
      )
    );
  }

  private async checkObjectiveCompletion(objective: Objective): Promise<boolean> {
    const objectiveTasks = this.tasks.filter(t => t.objectiveId === objective.id);
    const completedTasks = objectiveTasks.filter(t => t.status === 'completed');
    
    // Objective is complete if 80% of tasks are completed
    return objectiveTasks.length > 0 && completedTasks.length / objectiveTasks.length >= 0.8;
  }

  private completeObjective(objective: Objective) {
    objective.status = 'completed';
    objective.completedAt = new Date();
    this.emit('objectiveCompleted', objective);
  }

  private failObjective(objective: Objective, reason: string) {
    objective.status = 'failed';
    objective.completedAt = new Date();
    this.emit('objectiveFailed', { objective, reason });
  }

  private async generateInsights(objective: Objective, iteration: number): Promise<LearningInsight[]> {
    const insights: LearningInsight[] = [];
    
    // Generate insights based on current progress
    const objectiveTasks = this.tasks.filter(t => t.objectiveId === objective.id);
    const completedTasks = objectiveTasks.filter(t => t.status === 'completed');
    const failedTasks = objectiveTasks.filter(t => t.status === 'failed');
    
    if (failedTasks.length > 0) {
      insights.push({
        category: 'strategy',
        insight: `Failed tasks detected. Consider breaking down complex tasks further.`,
        confidence: 0.7,
        appliedToNextTasks: true
      });
    }
    
    if (completedTasks.length > objectiveTasks.length * 0.5) {
      insights.push({
        category: 'timing',
        insight: `Good progress on objective. Current strategy is effective.`,
        confidence: 0.8,
        appliedToNextTasks: true
      });
    }
    
    return insights;
  }

  private addLearning(insight: LearningInsight) {
    const memory: AgentMemory = {
      id: crypto.randomUUID(),
      type: 'learning',
      content: insight.insight,
      timestamp: new Date(),
      confidence: insight.confidence,
      applicability: [insight.category]
    };
    
    this.addToMemory(memory);
  }

  private getRelevantMemories(objectiveTitle: string, iteration: number): AgentMemory[] {
    return this.agentMemory
      .filter(memory => memory.confidence > 0.6)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 5);
  }

  private generateTaskTemplates(objective: Objective): Array<{
    title: string;
    description: string;
    priority: number;
    complexity: number;
    dependencies?: string[];
    estimatedDuration: number;
  }> {
    const templates = [];
    const complexity = objective.complexity;
    
    // Base templates for different objective types
    if (objective.title.toLowerCase().includes('research')) {
      templates.push({
        title: 'Research and gather information',
        description: 'Collect relevant data and resources',
        priority: 9,
        complexity: Math.min(complexity, 6),
        estimatedDuration: 30
      });
    }
    
    if (objective.title.toLowerCase().includes('build') || objective.title.toLowerCase().includes('create')) {
      templates.push({
        title: 'Design and plan structure',
        description: 'Create detailed plans and specifications',
        priority: 9,
        complexity: Math.min(complexity, 7),
        estimatedDuration: 60
      });
    }
    
    // Generic fallback
    if (templates.length === 0) {
      templates.push({
        title: 'Analyze objective requirements',
        description: 'Break down the objective into actionable components',
        priority: 8,
        complexity: Math.min(complexity, 6),
        estimatedDuration: 25
      });
    }
    
    return templates;
  }

  private applyLearning(template: any, memories: AgentMemory[]): any {
    // Apply relevant learning insights to task templates
    const strategyMemories = memories.filter(m => m.applicability.includes('strategy'));
    
    if (strategyMemories.length > 0) {
      template.priority = Math.min(template.priority + 1, 10);
    }
    
    return template;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}