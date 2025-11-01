import { 
  Objective, 
  Task, 
  LearningInsight, 
  AgentMemory, 
  TaskExecution, 
  ExecutionLog, 
  SimulationState,
  SimulationStatistics,
  AppSettings 
} from '../types/babyagi';

/**
 * Enhanced BabyAGI Engine with sophisticated simulation logic
 * Features:
 * - Realistic task execution timing
 * - Advanced learning system
 * - Dependency management
 * - Progress tracking
 * - Error handling and retry logic
 */
export class BabyAGIEngine {
  private static instance: BabyAGIEngine;
  private objectives: Objective[] = [];
  private tasks: Task[] = [];
  private agentMemory: AgentMemory[] = [];
  private callbacks: { [key: string]: Function[] } = {};
  private taskExecutions: Map<string, TaskExecution> = new Map();
  private settings: AppSettings;
  private executionHistory: Task[] = [];

  // Learning system configuration
  private readonly LEARNING_THRESHOLD = 0.7;
  private readonly MAX_RETRY_ATTEMPTS = 3;
  private readonly COMPLETION_RATE_THRESHOLD = 0.8;

  constructor(settings: AppSettings) {
    this.settings = settings;
  }

  static getInstance(settings?: AppSettings): BabyAGIEngine {
    if (!BabyAGIEngine.instance) {
      BabyAGIEngine.instance = new BabyAGIEngine(settings || {
        simulationSpeed: 'normal',
        autoExecute: true,
        showDetailedLogs: true,
        enableAnimations: true,
        maxIterations: 10,
        useOpenRouter: false,
        openRouterApiKey: undefined,
        selectedModel: 'qwen/qwen-2.5-7b-instruct',
        fallbackToSimulation: true
      });
    }
    return BabyAGIEngine.instance;
  }

  updateSettings(newSettings: AppSettings) {
    this.settings = { ...this.settings, ...newSettings };
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
      this.callbacks[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event callback for ${event}:`, error);
        }
      });
    }
  }

  // Data management
  addObjective(objective: Objective) {
    this.objectives.push(objective);
    this.emit('objectiveAdded', objective);
  }

  addTask(task: Task) {
    this.tasks.push(task);
    this.emit('taskAdded', task);
  }

  updateTask(taskId: string, updates: Partial<Task>) {
    const taskIndex = this.tasks.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
      this.tasks[taskIndex] = { ...this.tasks[taskIndex], ...updates };
      this.emit('taskUpdated', this.tasks[taskIndex]);
    }
  }

  addToMemory(memory: AgentMemory) {
    this.agentMemory.push(memory);
    this.emit('memoryAdded', memory);
  }

  getCurrentState(): SimulationState {
    const stats = this.calculateStatistics();
    const currentObjective = this.objectives.find(obj => obj.status === 'in-progress');
    const currentTask = this.getCurrentTask();
    
    return {
      isRunning: this.isSimulationRunning(),
      currentIteration: this.getCurrentIteration(),
      totalIterations: this.settings.maxIterations,
      currentObjective,
      currentTask,
      executionQueue: Array.from(this.taskExecutions.values()),
      agentMemory: this.agentMemory,
      statistics: stats,
      startTime: this.getSimulationStartTime()
    };
  }

  // Main simulation loop with sophisticated execution
  async startSimulation(objectiveId: string): Promise<void> {
    const objective = this.objectives.find(obj => obj.id === objectiveId);
    if (!objective) {
      throw new Error('Objective not found');
    }

    objective.status = 'in-progress';
    this.emit('simulationStarted', objective);

    try {
      for (let iteration = 1; iteration <= this.settings.maxIterations; iteration++) {
        await this.runIteration(objective, iteration);
        
        // Check for early completion
        if (await this.checkObjectiveCompletion(objective)) {
          this.completeObjective(objective);
          this.emit('simulationCompleted', objective);
          return;
        }

        // Adaptive iteration count based on progress
        if (iteration >= 5 && this.getProgressRate() < 0.3) {
          console.log('Low progress rate detected, considering early termination');
        }
      }

      // Final completion if not completed within iterations
      this.failObjective(objective, 'Maximum iterations reached');
    } catch (error) {
      console.error('Simulation error:', error);
      this.failObjective(objective, `Simulation failed: ${error.message}`);
    }
  }

  private async runIteration(objective: Objective, iteration: number): Promise<void> {
    this.emit('iterationStart', { iteration, objective });

    try {
      // 1. Analyze and decompose objective
      const newTasks = await this.decomposeObjective(objective, iteration);
      newTasks.forEach(task => this.addTask(task));

      // 2. Execute tasks with dependency management
      const executableTasks = this.getExecutableTasks(objective.id);
      for (const task of executableTasks.slice(0, 3)) { // Limit concurrent tasks
        await this.executeTaskWithRetry(task);
      }

      // 3. Generate and apply learning
      const learningInsights = await this.generateAdaptiveInsights(objective, iteration);
      learningInsights.forEach(insight => this.applyLearningInsight(insight));

      // 4. Analyze and optimize strategy
      await this.optimizeStrategy(objective, iteration);

      this.emit('iterationEnd', { iteration, objective });
      
      // Adaptive delay based on simulation speed
      await this.adaptiveDelay(iteration);

    } catch (error) {
      console.error(`Error in iteration ${iteration}:`, error);
      this.emit('iterationError', { iteration, error: error.message });
      
      // Continue with next iteration unless it's a critical error
      if (error.message.includes('critical')) {
        throw error;
      }
    }
  }

  // Advanced objective decomposition
  private async decomposeObjective(objective: Objective, iteration: number): Promise<Task[]> {
    const tasks: Task[] = [];
    const relevantMemories = this.getRelevantMemories(objective, iteration);
    const historicalPerformance = this.analyzeHistoricalPerformance();

    // Generate tasks based on objective complexity and learning
    const taskTemplates = this.generateIntelligentTemplates(objective, relevantMemories, historicalPerformance);

    for (const template of taskTemplates) {
      // Apply learning and adaptation
      const enhancedTemplate = this.applyAdaptiveLearning(template, relevantMemories, historicalPerformance);
      
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

    this.emit('objectiveDecomposed', { objective, tasks, iteration });
    return tasks;
  }

  // Sophisticated task execution with retry logic
  private async executeTaskWithRetry(task: Task): Promise<void> {
    const maxAttempts = this.MAX_RETRY_ATTEMPTS;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await this.executeTask(task, attempt);
        return; // Success, exit retry loop
      } catch (error) {
        console.warn(`Task attempt ${attempt} failed:`, error.message);
        
        if (attempt >= maxAttempts) {
          this.failTask(task, `Failed after ${maxAttempts} attempts: ${error.message}`);
          return;
        }

        // Learn from failure and adjust
        await this.learnFromFailure(task, error);
        
        // Exponential backoff for retries
        await this.delay(Math.pow(2, attempt) * 500);
        
        // Enhance task complexity estimate
        task.complexity = Math.min(task.complexity + 1, 10);
      }
    }
  }

  private async executeTask(task: Task, attempt: number): Promise<void> {
    task.startedAt = new Date();
    task.status = 'in-progress';
    task.attempts = attempt;

    this.emit('taskStarted', task);

    // Create execution context
    const execution: TaskExecution = {
      taskId: task.id,
      startTime: task.startedAt,
      progress: 0,
      currentStep: 'Initializing',
      logs: []
    };

    this.taskExecutions.set(task.id, execution);

    try {
      const executionPlan = this.createExecutionPlan(task);
      
      for (const step of executionPlan.steps) {
        await this.executeStep(task, execution, step);
        
        // Check for cancellation
        if (this.isSimulationRunning() === false) {
          throw new Error('Simulation cancelled');
        }
      }

      // Complete task
      this.completeTask(task);

    } catch (error) {
      this.logExecution(execution, 'error', `Execution failed: ${error.message}`);
      throw error;
    }
  }

  private async executeStep(task: Task, execution: TaskExecution, step: any): Promise<void> {
    // Update execution state
    execution.currentStep = step.description;
    execution.progress = step.progress;
    
    this.logExecution(execution, 'info', step.description);

    // Emit progress updates
    this.emit('taskProgress', {
      taskId: task.id,
      progress: step.progress,
      currentStep: step.description
    });

    // Realistic step timing
    const stepDuration = this.calculateStepDuration(task, step);
    await this.delay(stepDuration);

    // Simulate potential step failure based on complexity
    if (Math.random() < this.calculateStepFailureRate(task, step)) {
      throw new Error(`Step failed: ${step.description}`);
    }
  }

  private createExecutionPlan(task: Task): { steps: any[] } {
    const complexity = task.complexity;
    const totalSteps = Math.max(3, Math.min(8, complexity + 2));
    const steps = [];

    for (let i = 0; i < totalSteps; i++) {
      steps.push({
        progress: ((i + 1) / totalSteps) * 100,
        description: this.getExecutionStepDescription(task, i, totalSteps),
        duration: this.calculateStepDuration(task, { index: i, total: totalSteps })
      });
    }

    return { steps };
  }

  private getExecutionStepDescription(task: Task, stepIndex: number, totalSteps: number): string {
    const baseDescriptions = [
      `Initializing ${task.title.toLowerCase()}`,
      `Analyzing requirements for ${task.title.toLowerCase()}`,
      `Executing ${task.title.toLowerCase()} logic`,
      `Validating results for ${task.title.toLowerCase()}`,
      `Optimizing ${task.title.toLowerCase()} output`,
      `Finalizing ${task.title.toLowerCase()}`
    ];

    const taskSpecific = this.getTaskSpecificSteps(task);
    const descriptions = [...baseDescriptions, ...taskSpecific];

    return descriptions[stepIndex] || `Step ${stepIndex + 1}: ${task.title}`;
  }

  private getTaskSpecificSteps(task: Task): string[] {
    const title = task.title.toLowerCase();
    
    if (title.includes('research')) {
      return [
        'Gathering source materials',
        'Analyzing research data',
        'Synthesizing findings'
      ];
    }
    
    if (title.includes('design') || title.includes('plan')) {
      return [
        'Creating design specifications',
        'Reviewing design constraints',
        'Finalizing design documentation'
      ];
    }
    
    if (title.includes('implement') || title.includes('build')) {
      return [
        'Writing implementation code',
        'Testing functionality',
        'Refactoring for optimization'
      ];
    }
    
    return [];
  }

  // Advanced learning system
  private async generateAdaptiveInsights(objective: Objective, iteration: number): Promise<LearningInsight[]> {
    const insights: LearningInsight[] = [];
    const recentTasks = this.getRecentTasks(objective.id, 5);
    const historicalPerformance = this.analyzeTaskPerformance(recentTasks);

    // Strategy insights
    if (historicalPerformance.successRate < this.COMPLETION_RATE_THRESHOLD) {
      insights.push({
        category: 'strategy',
        insight: `Success rate ${(historicalPerformance.successRate * 100).toFixed(1)}% is below threshold. Consider breaking down complex tasks further.`,
        confidence: 0.8,
        appliedToNextTasks: true
      });
    }

    // Timing insights
    if (historicalPerformance.avgDuration > objective.complexity * 15) {
      insights.push({
        category: 'timing',
        insight: `Tasks are taking longer than estimated. Average duration: ${historicalPerformance.avgDuration.toFixed(1)} minutes.`,
        confidence: 0.9,
        appliedToNextTasks: true
      });
    }

    // Dependency insights
    const failedTasksWithDependencies = recentTasks.filter(t => 
      t.status === 'failed' && t.dependencies.length > 0
    );
    
    if (failedTasksWithDependencies.length > 0) {
      insights.push({
        category: 'dependencies',
        insight: `${failedTasksWithDependencies.length} tasks failed due to dependency issues. Review task ordering.`,
        confidence: 0.7,
        appliedToNextTasks: true
      });
    }

    // Priority insights
    const highPrioritySuccessRate = this.calculatePrioritySuccessRate(recentTasks);
    if (highPrioritySuccessRate < 0.7) {
      insights.push({
        category: 'priority',
        insight: 'High-priority tasks have lower success rate. Adjust priority assignment logic.',
        confidence: 0.6,
        appliedToNextTasks: true
      });
    }

    return insights;
  }

  private async learnFromFailure(task: Task, error: Error): Promise<void> {
    const learning: AgentMemory = {
      id: crypto.randomUUID(),
      type: 'failure',
      content: `Task "${task.title}" failed: ${error.message}. Complexity: ${task.complexity}, Attempts: ${task.attempts}`,
      taskId: task.id,
      timestamp: new Date(),
      confidence: 0.8,
      applicability: ['failure handling', 'complexity assessment']
    };

    this.addToMemory(learning);
  }

  private applyLearningInsight(insight: LearningInsight): void {
    const memory: AgentMemory = {
      id: crypto.randomUUID(),
      type: 'learning',
      content: `[${insight.category.toUpperCase()}] ${insight.insight}`,
      timestamp: new Date(),
      confidence: insight.confidence,
      applicability: [insight.category]
    };

    this.addToMemory(memory);

    // Apply immediate adjustments if confidence is high
    if (insight.confidence > this.LEARNING_THRESHOLD) {
      this.applyImmediateAdjustments(insight);
    }
  }

  private applyImmediateAdjustments(insight: LearningInsight): void {
    switch (insight.category) {
      case 'strategy':
        // Adjust task complexity estimates
        this.tasks.forEach(task => {
          if (task.complexity > 7) {
            task.estimatedDuration *= 1.2;
          }
        });
        break;
        
      case 'timing':
        // Adjust duration estimates
        this.tasks.forEach(task => {
          task.estimatedDuration = Math.round(task.estimatedDuration * 0.9);
        });
        break;
        
      case 'dependencies':
        // Simplify task dependencies
        this.tasks.forEach(task => {
          if (task.dependencies.length > 2) {
            task.dependencies = task.dependencies.slice(0, 2);
          }
        });
        break;
    }
  }

  // Utility and helper methods
  private async adaptiveDelay(iteration: number): Promise<void> {
    const baseDelays = { slow: 3000, normal: 2000, fast: 1000 };
    const baseDelay = baseDelays[this.settings.simulationSpeed];
    
    // Adapt delay based on progress
    const progressRate = this.getProgressRate();
    const adaptiveMultiplier = progressRate < 0.5 ? 0.7 : 1.3;
    
    await this.delay(Math.round(baseDelay * adaptiveMultiplier));
  }

  private calculateStepDuration(task: Task, step: any): number {
    const baseDuration = (task.estimatedDuration * 1000) / task.complexity;
    const complexityFactor = task.complexity / 10;
    const randomness = 0.8 + Math.random() * 0.4; // 80% to 120%
    
    return Math.round(baseDuration * complexityFactor * randomness);
  }

  private calculateStepFailureRate(task: Task, step: any): number {
    const baseRate = 0.05; // 5% base failure rate
    const complexityFactor = task.complexity / 10 * 0.1; // Up to 10% additional for complexity
    const attemptFactor = (task.attempts - 1) * 0.02; // Increases with attempts
    
    return Math.min(baseRate + complexityFactor + attemptFactor, 0.3);
  }

  private logExecution(execution: TaskExecution, level: 'info' | 'success' | 'warning' | 'error', message: string): void {
    const log: ExecutionLog = {
      timestamp: new Date(),
      level,
      message,
      details: { taskId: execution.taskId }
    };
    
    execution.logs.push(log);
    this.emit('executionLog', log);
  }

  private completeTask(task: Task): void {
    task.status = 'completed';
    task.progress = 100;
    task.completedAt = new Date();
    task.actualDuration = task.completedAt.getTime() - task.startedAt!.getTime();
    
    // Generate success results
    task.results = this.generateIntelligentResults(task);
    
    this.executionHistory.push(task);
    this.emit('taskCompleted', task);
    
    // Clean up execution tracking
    this.taskExecutions.delete(task.id);
  }

  private failTask(task: Task, reason: string): void {
    task.status = 'failed';
    task.results = `Failed: ${reason}`;
    task.completedAt = new Date();
    
    this.emit('taskFailed', { task, reason });
    this.taskExecutions.delete(task.id);
  }

  private generateIntelligentResults(task: Task): string {
    const performance = this.analyzeTaskPerformance([task]);
    const timeEfficiency = task.actualDuration! / task.estimatedDuration;
    
    let result = `Successfully completed: ${task.title}\n`;
    result += `Performance: ${(performance.successRate * 100).toFixed(0)}% success likelihood\n`;
    result += `Time efficiency: ${(timeEfficiency * 100).toFixed(0)}% of estimated time\n`;
    
    if (task.learning) {
      result += `Key learning: ${task.learning.insight}`;
    }
    
    return result;
  }

  // Analysis and optimization methods
  private analyzeHistoricalPerformance(): any {
    const completedTasks = this.executionHistory.filter(t => t.status === 'completed');
    
    return {
      totalTasks: this.executionHistory.length,
      successRate: this.executionHistory.length > 0 ? 
        completedTasks.length / this.executionHistory.length : 0,
      avgDuration: completedTasks.length > 0 ?
        completedTasks.reduce((sum, t) => sum + (t.actualDuration || 0), 0) / completedTasks.length : 0,
      complexityDistribution: this.getComplexityDistribution()
    };
  }

  private analyzeTaskPerformance(tasks: Task[]): any {
    const completed = tasks.filter(t => t.status === 'completed');
    const failed = tasks.filter(t => t.status === 'failed');
    
    return {
      successRate: tasks.length > 0 ? completed.length / tasks.length : 0,
      avgDuration: completed.length > 0 ?
        completed.reduce((sum, t) => sum + (t.actualDuration || 0), 0) / completed.length : 0,
      retryRate: tasks.filter(t => t.attempts > 1).length / tasks.length
    };
  }

  private calculatePrioritySuccessRate(tasks: Task[]): number {
    const highPriorityTasks = tasks.filter(t => t.priority >= 8);
    const successful = highPriorityTasks.filter(t => t.status === 'completed');
    
    return highPriorityTasks.length > 0 ? successful.length / highPriorityTasks.length : 0;
  }

  private getComplexityDistribution(): { [key: number]: number } {
    const distribution: { [key: number]: number } = {};
    
    this.executionHistory.forEach(task => {
      distribution[task.complexity] = (distribution[task.complexity] || 0) + 1;
    });
    
    return distribution;
  }

  private async optimizeStrategy(objective: Objective, iteration: number): Promise<void> {
    const recentTasks = this.getRecentTasks(objective.id, 3);
    const performance = this.analyzeTaskPerformance(recentTasks);
    
    // Adaptive strategy adjustments
    if (performance.successRate < 0.6 && iteration > 2) {
      // Reduce complexity of upcoming tasks
      this.adjustTaskComplexity(objective.id, -1);
    }
    
    if (performance.avgDuration > objective.complexity * 20) {
      // Increase time estimates for remaining tasks
      this.adjustDurationEstimates(objective.id, 1.2);
    }
  }

  private adjustTaskComplexity(objectiveId: string, adjustment: number): void {
    this.tasks
      .filter(t => t.objectiveId === objectiveId && t.status === 'pending')
      .forEach(task => {
        task.complexity = Math.max(1, Math.min(10, task.complexity + adjustment));
      });
  }

  private adjustDurationEstimates(objectiveId: string, multiplier: number): void {
    this.tasks
      .filter(t => t.objectiveId === objectiveId && t.status === 'pending')
      .forEach(task => {
        task.estimatedDuration = Math.round(task.estimatedDuration * multiplier);
      });
  }

  // Getters and utility methods
  private getRecentTasks(objectiveId: string, count: number): Task[] {
    return this.tasks
      .filter(t => t.objectiveId === objectiveId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, count);
  }

  private getRelevantMemories(objective: Objective, iteration: number): AgentMemory[] {
    const objectiveKeywords = this.extractKeywords(objective.title);
    
    return this.agentMemory
      .filter(memory => 
        memory.confidence > 0.6 &&
        this.isMemoryRelevant(memory, objectiveKeywords)
      )
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 5);
  }

  private extractKeywords(title: string): string[] {
    return title.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3)
      .slice(0, 5);
  }

  private isMemoryRelevant(memory: AgentMemory, keywords: string[]): boolean {
    return memory.content.toLowerCase().includes(keywords.join(' ')) ||
           memory.applicability.some(app => keywords.includes(app));
  }

  private generateIntelligentTemplates(
    objective: Objective, 
    memories: AgentMemory[], 
    performance: any
  ): Array<any> {
    // Start with base templates
    let templates = this.generateBaseTemplates(objective);
    
    // Apply learning from memories
    templates = templates.map(template => 
      this.applyAdaptiveLearning(template, memories, performance)
    );
    
    return templates;
  }

  private generateBaseTemplates(objective: Objective): Array<any> {
    const templates = [];
    const complexity = objective.complexity;
    const title = objective.title.toLowerCase();

    // Research objectives
    if (title.includes('research') || title.includes('investigate')) {
      templates.push(
        {
          title: 'Research and Data Collection',
          description: 'Gather relevant information and sources',
          priority: 9,
          complexity: Math.min(complexity, 7),
          estimatedDuration: 45
        },
        {
          title: 'Analysis and Synthesis',
          description: 'Analyze collected data and synthesize insights',
          priority: 8,
          complexity: Math.min(complexity + 1, 9),
          estimatedDuration: 60,
          dependencies: ['Research and Data Collection']
        }
      );
    }

    // Build/Create objectives
    if (title.includes('build') || title.includes('create') || title.includes('develop')) {
      templates.push(
        {
          title: 'Planning and Design',
          description: 'Create detailed plans and specifications',
          priority: 9,
          complexity: Math.min(complexity, 7),
          estimatedDuration: 60
        },
        {
          title: 'Implementation',
          description: 'Build core components and features',
          priority: 8,
          complexity: Math.min(complexity + 2, 10),
          estimatedDuration: 120,
          dependencies: ['Planning and Design']
        },
        {
          title: 'Testing and Validation',
          description: 'Test functionality and validate results',
          priority: 7,
          complexity: Math.min(complexity, 6),
          estimatedDuration: 45,
          dependencies: ['Implementation']
        }
      );
    }

    // Optimization objectives
    if (title.includes('optimize') || title.includes('improve') || title.includes('enhance')) {
      templates.push(
        {
          title: 'Current State Assessment',
          description: 'Evaluate existing system or process',
          priority: 9,
          complexity: Math.min(complexity, 6),
          estimatedDuration: 30
        },
        {
          title: 'Identify Improvement Opportunities',
          description: 'Find specific areas for enhancement',
          priority: 8,
          complexity: Math.min(complexity + 1, 8),
          estimatedDuration: 50,
          dependencies: ['Current State Assessment']
        },
        {
          title: 'Implement Optimizations',
          description: 'Apply identified improvements',
          priority: 7,
          complexity: Math.min(complexity + 2, 9),
          estimatedDuration: 90,
          dependencies: ['Identify Improvement Opportunities']
        }
      );
    }

    // Generic fallback
    if (templates.length === 0) {
      templates.push(
        {
          title: 'Objective Analysis',
          description: 'Break down objective into manageable components',
          priority: 9,
          complexity: Math.min(complexity, 5),
          estimatedDuration: 30
        },
        {
          title: 'Task Execution',
          description: 'Execute primary tasks to achieve objective',
          priority: 8,
          complexity: Math.min(complexity, 7),
          estimatedDuration: 90,
          dependencies: ['Objective Analysis']
        }
      );
    }

    return templates;
  }

  private applyAdaptiveLearning(template: any, memories: AgentMemory[], performance: any): any {
    const enhanced = { ...template };

    // Apply memory-based adjustments
    memories.forEach(memory => {
      if (memory.content.includes('complexity') && memory.confidence > 0.7) {
        enhanced.complexity = Math.min(enhanced.complexity + 1, 10);
      }
      
      if (memory.content.includes('timing') && memory.confidence > 0.7) {
        enhanced.estimatedDuration = Math.round(enhanced.estimatedDuration * 1.1);
      }
    });

    // Apply performance-based adjustments
    if (performance.successRate < 0.7) {
      enhanced.estimatedDuration = Math.round(enhanced.estimatedDuration * 1.2);
      enhanced.complexity = Math.max(1, enhanced.complexity - 1);
    }

    return enhanced;
  }

  private getExecutableTasks(objectiveId: string): Task[] {
    return this.tasks
      .filter(task => 
        task.objectiveId === objectiveId && 
        task.status === 'pending' &&
        task.dependencies.every(depId => 
          this.tasks.find(t => t.id === depId)?.status === 'completed'
        )
      )
      .sort((a, b) => b.priority - a.priority); // Sort by priority
  }

  private async checkObjectiveCompletion(objective: Objective): Promise<boolean> {
    const objectiveTasks = this.tasks.filter(t => t.objectiveId === objective.id);
    if (objectiveTasks.length === 0) return false;

    const completedTasks = objectiveTasks.filter(t => t.status === 'completed');
    const completionRate = completedTasks.length / objectiveTasks.length;

    // Consider objective complete if 80% of tasks are completed
    // OR if all high-priority tasks (priority >= 8) are completed
    const highPriorityTasks = objectiveTasks.filter(t => t.priority >= 8);
    const highPriorityCompleted = highPriorityTasks.filter(t => t.status === 'completed');

    return completionRate >= this.COMPLETION_RATE_THRESHOLD || 
           highPriorityCompleted.length === highPriorityTasks.length;
  }

  private completeObjective(objective: Objective): void {
    objective.status = 'completed';
    objective.completedAt = new Date();

    const successMemory: AgentMemory = {
      id: crypto.randomUUID(),
      type: 'success',
      content: `Successfully completed objective: ${objective.title}`,
      objectiveId: objective.id,
      timestamp: new Date(),
      confidence: 1.0,
      applicability: ['success', 'general']
    };

    this.addToMemory(successMemory);
    this.emit('objectiveCompleted', objective);
  }

  private failObjective(objective: Objective, reason: string): void {
    objective.status = 'failed';

    const failureMemory: AgentMemory = {
      id: crypto.randomUUID(),
      type: 'failure',
      content: `Failed objective: ${objective.title}. Reason: ${reason}`,
      objectiveId: objective.id,
      timestamp: new Date(),
      confidence: 1.0,
      applicability: ['failure', 'general']
    };

    this.addToMemory(failureMemory);
    this.emit('objectiveFailed', { objective, reason });
  }

  private calculateStatistics(): SimulationStatistics {
    const allTasks = this.tasks;
    const completedTasks = allTasks.filter(t => t.status === 'completed');
    const failedTasks = allTasks.filter(t => t.status === 'failed');
    
    const avgCompletionTime = completedTasks.length > 0 ?
      completedTasks.reduce((sum, t) => sum + (t.actualDuration || 0), 0) / completedTasks.length : 0;

    const learningInsights = this.agentMemory.filter(m => m.type === 'learning').length;
    const strategyImprovements = this.agentMemory.filter(m => m.type === 'strategy').length;

    return {
      totalObjectives: this.objectives.length,
      completedObjectives: this.objectives.filter(o => o.status === 'completed').length,
      failedObjectives: this.objectives.filter(o => o.status === 'failed').length,
      totalTasks: allTasks.length,
      completedTasks: completedTasks.length,
      failedTasks: failedTasks.length,
      averageCompletionTime: avgCompletionTime / 60000, // Convert to minutes
      learningInsights,
      strategyImprovements,
      efficiencyScore: this.calculateEfficiencyScore()
    };
  }

  private calculateEfficiencyScore(): number {
    const totalTasks = this.tasks.length;
    if (totalTasks === 0) return 0;

    const completedTasks = this.tasks.filter(t => t.status === 'completed').length;
    const successRate = completedTasks / totalTasks;
    
    const avgEfficiency = this.executionHistory.length > 0 ?
      this.executionHistory.reduce((sum, t) => {
        const efficiency = t.estimatedDuration / (t.actualDuration || t.estimatedDuration);
        return sum + efficiency;
      }, 0) / this.executionHistory.length : 1;

    return Math.round((successRate * 0.6 + avgEfficiency * 0.4) * 100);
  }

  private isSimulationRunning(): boolean {
    return this.objectives.some(o => o.status === 'in-progress');
  }

  private getCurrentIteration(): number {
    // This would need to be tracked properly in a real implementation
    return 1;
  }

  private getCurrentTask(): Task | undefined {
    return this.tasks.find(t => t.status === 'in-progress');
  }

  private getSimulationStartTime(): Date | undefined {
    // This would need to be tracked properly in a real implementation
    return undefined;
  }

  private getProgressRate(): number {
    const activeTasks = this.tasks.filter(t => t.status === 'in-progress' || t.status === 'pending');
    if (activeTasks.length === 0) return 1;
    
    const totalProgress = activeTasks.reduce((sum, t) => sum + t.progress, 0);
    return totalProgress / (activeTasks.length * 100);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Public API methods
  getTasks(objectiveId?: string): Task[] {
    return objectiveId 
      ? this.tasks.filter(t => t.objectiveId === objectiveId)
      : this.tasks;
  }

  getAgentMemory(): AgentMemory[] {
    return this.agentMemory;
  }

  getStatistics(): SimulationStatistics {
    return this.calculateStatistics();
  }

  clearMemory(): void {
    this.agentMemory = [];
    this.executionHistory = [];
    this.emit('memoryCleared');
  }

  stopSimulation(): void {
    // Cancel all running tasks
    this.tasks.forEach(task => {
      if (task.status === 'in-progress') {
        task.status = 'pending';
        task.progress = 0;
      }
    });
    
    this.taskExecutions.clear();
    this.emit('simulationStopped');
  }
}

export default BabyAGIEngine;