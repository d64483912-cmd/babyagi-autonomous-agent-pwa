// BabyAGI Engine - Core simulation engine with task decomposition and execution
import { EventEmitter } from 'events';
import { Task, Objective, LearningInsight, SimulationConfig } from '../types/babyagi';
import { LearningSystem } from './learningSystem';
import { TaskExecutionEngine } from './taskExecutionEngine';
import { OpenRouterService } from './openRouterService';
import { SimulationManager } from './simulationManager';

/**
 * BabyAGI Engine - Singleton class that orchestrates the entire simulation
 * Manages task decomposition, execution, and learning processes
 */
export class BabyAGIEngine {
  private static instance: BabyAGIEngine;
  private isRunning = false;
  private currentIteration = 0;
  private eventEmitter: EventEmitter;
  private learningSystem: LearningSystem;
  private taskExecutionEngine: TaskExecutionEngine;
  private openRouterService: OpenRouterService;
  private simulationManager: SimulationManager;
  private config: SimulationConfig;

  private constructor() {
    this.eventEmitter = new EventEmitter();
    this.config = {
      maxIterations: 10,
      simulationSpeed: 'normal',
      useOpenRouter: false,
      openRouterApiKey: '',
      selectedModel: 'qwen/qwen-2.5-7b-instruct',
      fallbackToSimulation: true
    };
  }

  public static getInstance(): BabyAGIEngine {
    if (!BabyAGIEngine.instance) {
      BabyAGIEngine.instance = new BabyAGIEngine();
    }
    return BabyAGIEngine.instance;
  }

  /**
   * Initialize the BabyAGI engine with dependencies
   */
  public async initialize(config: Partial<SimulationConfig>): Promise<void> {
    this.config = { ...this.config, ...config };
    
    // Initialize services
    this.learningSystem = new LearningSystem();
    this.taskExecutionEngine = new TaskExecutionEngine();
    this.openRouterService = new OpenRouterService();
    this.simulationManager = new SimulationManager();

    if (this.config.useOpenRouter && this.config.openRouterApiKey) {
      await this.openRouterService.initialize({
        apiKey: this.config.openRouterApiKey,
        model: this.config.selectedModel
      });
    }

    this.emit('initialized');
  }

  /**
   * Start the BabyAGI simulation
   */
  public async startSimulation(objectives: Objective[]): Promise<void> {
    if (this.isRunning) {
      throw new Error('Simulation is already running');
    }

    this.isRunning = true;
    this.currentIteration = 0;
    
    this.emit('simulationStarted', { objectives });

    try {
      await this.simulationManager.initialize();
      
      for (const objective of objectives) {
        await this.runObjective(objective);
      }
    } catch (error) {
      this.emit('simulationError', { error });
      throw error;
    } finally {
      this.isRunning = false;
      this.emit('simulationCompleted');
    }
  }

  /**
   * Run a single objective through the BabyAGI loop
   */
  private async runObjective(objective: Objective): Promise<void> {
    this.emit('objectiveStarted', { objective });

    const maxIterations = this.config.maxIterations || 10;
    
    while (this.currentIteration < maxIterations && this.isRunning) {
      this.currentIteration++;
      
      try {
        await this.runIteration(objective);
        
        // Check if objective is completed
        const isCompleted = await this.checkObjectiveCompletion(objective);
        if (isCompleted) {
          this.emit('objectiveCompleted', { objective, iteration: this.currentIteration });
          break;
        }
      } catch (error) {
        this.emit('iterationError', { 
          objective, 
          iteration: this.currentIteration, 
          error 
        });
        
        if (this.config.fallbackToSimulation) {
          // Continue with simulation mode
          await this.runSimulationIteration(objective);
        } else {
          throw error;
        }
      }
    }

    this.emit('objectiveCompleted', { objective });
  }

  /**
   * Run a single iteration of the BabyAGI loop
   */
  private async runIteration(objective: Objective): Promise<void> {
    this.emit('iterationStarted', { 
      objective, 
      iteration: this.currentIteration 
    });

    try {
      // Phase 1: Analyze current situation and context
      const context = await this.analyzeContext(objective);
      
      // Phase 2: Generate or decompose tasks
      const tasks = await this.decomposeObjective(objective, context);
      
      // Phase 3: Execute tasks (if using OpenRouter)
      if (this.config.useOpenRouter) {
        await this.executeTasksWithOpenRouter(tasks, objective);
      } else {
        // Use simulation mode
        await this.runSimulationIteration(objective);
      }
      
      // Phase 4: Learn from results
      await this.processLearning(objective, tasks);
      
      // Phase 5: Assess progress
      await this.assessProgress(objective);
      
    } catch (error) {
      this.emit('iterationError', { 
        objective, 
        iteration: this.currentIteration, 
        error 
      });
      throw error;
    }
  }

  /**
   * Analyze current context for the objective
   */
  private async analyzeContext(objective: Objective): Promise<any> {
    this.emit('analysisStarted', { objective });

    if (this.config.useOpenRouter) {
      try {
        const analysis = await this.openRouterService.generateContextAnalysis(
          objective.description,
          this.getCurrentMemory()
        );
        return analysis;
      } catch (error) {
        if (!this.config.fallbackToSimulation) {
          throw error;
        }
      }
    }

    // Fallback to simulation
    return {
      summary: `Context analysis for: ${objective.title}`,
      insights: ['This is a simulated analysis'],
      recommendations: ['Continue with task decomposition']
    };
  }

  /**
   * Decompose objective into tasks using AI or simulation
   */
  private async decomposeObjective(objective: Objective, context: any): Promise<Task[]> {
    this.emit('decompositionStarted', { objective });

    if (this.config.useOpenRouter) {
      try {
        const tasks = await this.openRouterService.generateTaskDecomposition(
          objective.description,
          context,
          this.getCurrentMemory()
        );
        return tasks;
      } catch (error) {
        if (!this.config.fallbackToSimulation) {
          throw error;
        }
      }
    }

    // Fallback to simulation
    return this.generateSimulationTasks(objective);
  }

  /**
   * Execute tasks using OpenRouter API
   */
  private async executeTasksWithOpenRouter(tasks: Task[], objective: Objective): Promise<void> {
    this.emit('executionStarted', { objective, tasks });

    for (const task of tasks) {
      try {
        const result = await this.taskExecutionEngine.executeTask(task, {
          objective,
          context: this.getCurrentMemory(),
          useAI: true
        });

        // Process results
        await this.processTaskResult(task, result);
      } catch (error) {
        this.emit('taskError', { task, error });
        
        // Retry logic
        if (task.attempts < 3) {
          task.attempts++;
          await this.executeTaskWithRetry(task, objective);
        }
      }
    }
  }

  /**
   * Execute a task with retry logic
   */
  private async executeTaskWithRetry(task: Task, objective: Objective): Promise<void> {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const result = await this.taskExecutionEngine.executeTask(task, {
          objective,
          context: this.getCurrentMemory(),
          useAI: true,
          attemptNumber: attempt + 1
        });
        
        await this.processTaskResult(task, result);
        return; // Success, exit retry loop
      } catch (error) {
        if (attempt === 2) { // Last attempt
          throw error;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }

  /**
   * Run simulation iteration (when OpenRouter is not available)
   */
  private async runSimulationIteration(objective: Objective): Promise<void> {
    this.emit('simulationIterationStarted', { objective });

    // Generate simulated tasks
    const tasks = this.generateSimulationTasks(objective);
    
    // Execute simulated tasks
    for (const task of tasks) {
      const result = await this.simulateTaskExecution(task);
      await this.processTaskResult(task, result);
    }
  }

  /**
   * Generate simulation tasks based on objective
   */
  private generateSimulationTasks(objective: Objective): Task[] {
    const tasks: Task[] = [];
    const taskCount = Math.floor(Math.random() * 3) + 2; // 2-4 tasks

    for (let i = 0; i < taskCount; i++) {
      tasks.push({
        id: `sim_${Date.now()}_${i}`,
        title: `Simulated Task ${i + 1} for ${objective.title}`,
        description: `This is a simulated task that contributes to: ${objective.description}`,
        objectiveId: objective.id,
        priority: Math.floor(Math.random() * 10) + 1,
        complexity: Math.floor(Math.random() * 10) + 1,
        status: 'pending',
        progress: 0,
        dependencies: [],
        estimatedDuration: Math.floor(Math.random() * 60) + 15, // 15-75 minutes
        createdAt: new Date(),
        attempts: 0,
        tags: ['simulation']
      });
    }

    return tasks;
  }

  /**
   * Simulate task execution
   */
  private async simulateTaskExecution(task: Task): Promise<string> {
    // Simulate execution time
    const executionTime = Math.random() * 2000 + 1000; // 1-3 seconds
    await new Promise(resolve => setTimeout(resolve, executionTime));

    // Simulate success/failure (90% success rate)
    if (Math.random() > 0.1) {
      return `Simulated successful completion of: ${task.description}`;
    } else {
      throw new Error('Simulated task failure');
    }
  }

  /**
   * Process task execution result
   */
  private async processTaskResult(task: Task, result: string): Promise<void> {
    task.status = 'completed';
    task.results = result;
    task.completedAt = new Date();
    task.progress = 100;

    // Add to memory
    this.addToMemory({
      type: 'task_completion',
      content: {
        task,
        result,
        timestamp: new Date()
      }
    });

    this.emit('taskCompleted', { task, result });
  }

  /**
   * Process learning from task execution
   */
  private async processLearning(objective: Objective, tasks: Task[]): Promise<void> {
    for (const task of tasks) {
      if (task.status === 'completed') {
        const insight = await this.learningSystem.processTaskCompletion(task);
        
        // Store insight for future use
        this.addToMemory({
          type: 'learning_insight',
          content: insight
        });
      }
    }
  }

  /**
   * Assess progress towards objective
   */
  private async assessProgress(objective: Objective): Promise<void> {
    const completedTasks = this.getCompletedTasks(objective.id);
    const totalTasks = this.getAllTasks(objective.id).length;
    
    const progress = totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0;
    
    this.emit('progressAssessed', { 
      objective, 
      progress, 
      completedTasks: completedTasks.length,
      totalTasks 
    });
  }

  /**
   * Check if objective is completed
   */
  private async checkObjectiveCompletion(objective: Objective): Promise<boolean> {
    const completedTasks = this.getCompletedTasks(objective.id);
    const totalTasks = this.getAllTasks(objective.id).length;
    
    // Consider objective complete if we have at least 3 completed tasks
    // or if we've reached the max iterations
    return completedTasks.length >= 3 || this.currentIteration >= (this.config.maxIterations || 10);
  }

  /**
   * Get current memory state
   */
  private getCurrentMemory(): any[] {
    // This would integrate with the memory store
    return [];
  }

  /**
   * Add information to memory
   */
  private addToMemory(memoryItem: any): void {
    // This would integrate with the memory store
    this.emit('memoryAdded', memoryItem);
  }

  /**
   * Get completed tasks for an objective
   */
  private getCompletedTasks(objectiveId: string): Task[] {
    // This would integrate with the tasks store
    return [];
  }

  /**
   * Get all tasks for an objective
   */
  private getAllTasks(objectiveId: string): Task[] {
    // This would integrate with the tasks store
    return [];
  }

  /**
   * Emit events
   */
  private emit(event: string, data?: any): void {
    this.eventEmitter.emit(event, data);
  }

  /**
   * Subscribe to engine events
   */
  public on(event: string, listener: (data: any) => void): void {
    this.eventEmitter.on(event, listener);
  }

  /**
   * Unsubscribe from engine events
   */
  public off(event: string, listener: (data: any) => void): void {
    this.eventEmitter.off(event, listener);
  }

  /**
   * Stop the simulation
   */
  public stopSimulation(): void {
    this.isRunning = false;
    this.emit('simulationStopped');
  }

  /**
   * Get engine status
   */
  public getStatus(): {
    isRunning: boolean;
    currentIteration: number;
    config: SimulationConfig;
  } {
    return {
      isRunning: this.isRunning,
      currentIteration: this.currentIteration,
      config: this.config
    };
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<SimulationConfig>): void {
    this.config = { ...this.config, ...config };
    this.emit('configUpdated', this.config);
  }

  /**
   * Reset the engine
   */
  public reset(): void {
    this.isRunning = false;
    this.currentIteration = 0;
    this.eventEmitter.removeAllListeners();
    this.emit('reset');
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.stopSimulation();
    this.eventEmitter.removeAllListeners();
    this.learningSystem?.destroy();
    this.taskExecutionEngine?.destroy();
    this.openRouterService?.destroy();
    this.simulationManager?.destroy();
  }
}

export default BabyAGIEngine;