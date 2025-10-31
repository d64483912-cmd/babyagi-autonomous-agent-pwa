import { Objective, Task, LearningInsight, AgentMemory } from '../types/babyagi';

export class BabyAGIEngine {
  private static instance: BabyAGIEngine;
  private objectives: Objective[] = [];
  private tasks: Task[] = [];
  private agentMemory: AgentMemory[] = [];
  private callbacks: { [key: string]: Function[] } = {};

  static getInstance(): BabyAGIEngine {
    if (!BabyAGIEngine.instance) {
      BabyAGIEngine.instance = new BabyAGIEngine();
    }
    return BabyAGIEngine.instance;
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

  // Main simulation loop
  async startSimulation(objectiveId: string): Promise<void> {
    const objective = this.objectives.find(obj => obj.id === objectiveId);
    if (!objective) {
      throw new Error('Objective not found');
    }

    this.emit('simulationStarted', objective);
    
    for (let iteration = 1; iteration <= 10; iteration++) {
      this.emit('iterationStart', iteration);
      
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
      await this.delay(1000);
    }
    
    if (objective.status !== 'completed') {
      this.failObjective(objective, 'Maximum iterations reached');
    }
  }

  // Objective decomposition logic
  private async decomposeObjective(objective: Objective, iteration: number): Promise<Task[]> {
    const tasks: Task[] = [];
    
    // Get relevant memories for this iteration
    const relevantMemories = this.getRelevantMemories(objective.title, iteration);
    
    // Generate tasks based on objective complexity and previous learnings
    const taskTemplates = this.generateTaskTemplates(objective);
    
    for (const template of taskTemplates) {
      // Apply learning from previous iterations
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
    
    // Base tasks based on objective type
    if (objective.title.toLowerCase().includes('research')) {
      templates.push({
        title: 'Research and gather information',
        description: 'Collect relevant data and resources for the research objective',
        priority: 9,
        complexity: Math.min(complexity, 6),
        estimatedDuration: 30
      });
      
      templates.push({
        title: 'Analyze and synthesize findings',
        description: 'Process the gathered information and identify key insights',
        priority: 8,
        complexity: Math.min(complexity + 1, 8),
        dependencies: ['research'],
        estimatedDuration: 45
      });
    }
    
    if (objective.title.toLowerCase().includes('build') || objective.title.toLowerCase().includes('create')) {
      templates.push({
        title: 'Design and plan structure',
        description: 'Create detailed plans and design specifications',
        priority: 9,
        complexity: Math.min(complexity, 7),
        estimatedDuration: 60
      });
      
      templates.push({
        title: 'Implement core components',
        description: 'Build the main functional components',
        priority: 8,
        complexity: Math.min(complexity + 1, 9),
        dependencies: ['design'],
        estimatedDuration: 120
      });
      
      templates.push({
        title: 'Test and validate functionality',
        description: 'Verify that all components work correctly',
        priority: 7,
        complexity: Math.min(complexity, 6),
        dependencies: ['implement'],
        estimatedDuration: 30
      });
    }
    
    if (objective.title.toLowerCase().includes('optimize') || objective.title.toLowerCase().includes('improve')) {
      templates.push({
        title: 'Assess current state',
        description: 'Evaluate the current system or process',
        priority: 9,
        complexity: Math.min(complexity, 6),
        estimatedDuration: 20
      });
      
      templates.push({
        title: 'Identify improvement opportunities',
        description: 'Find specific areas that can be enhanced',
        priority: 8,
        complexity: Math.min(complexity + 1, 8),
        dependencies: ['assess'],
        estimatedDuration: 40
      });
      
      templates.push({
        title: 'Implement optimizations',
        description: 'Apply the identified improvements',
        priority: 7,
        complexity: Math.min(complexity + 2, 9),
        dependencies: ['identify'],
        estimatedDuration: 90
      });
    }
    
    // Add generic tasks if none specific
    if (templates.length === 0) {
      templates.push({
        title: 'Break down the objective',
        description: 'Analyze and define clear sub-goals',
        priority: 9,
        complexity: Math.min(complexity, 5),
        estimatedDuration: 15
      });
      
      templates.push({
        title: 'Execute primary actions',
        description: 'Carry out the main tasks to achieve the objective',
        priority: 8,
        complexity: Math.min(complexity, 7),
        estimatedDuration: 60
      });
      
      templates.push({
        title: 'Review and finalize',
        description: 'Validate results and ensure objective completion',
        priority: 7,
        complexity: Math.min(complexity, 6),
        dependencies: ['execute'],
        estimatedDuration: 30
      });
    }
    
    return templates;
  }

  // Task execution
  private async executeTask(task: Task): Promise<void> {
    this.emit('taskStarted', task);
    
    // Simulate task execution with progress updates
    const steps = this.generateExecutionSteps(task);
    
    for (const step of steps) {
      await this.delay(500);
      this.emit('taskProgress', { taskId: task.id, progress: step.progress, currentStep: step.description });
    }
    
    // Simulate task completion
    task.status = Math.random() > 0.1 ? 'completed' : 'failed'; // 90% success rate
    task.completedAt = new Date();
    task.progress = task.status === 'completed' ? 100 : 0;
    task.attempts += 1;
    
    if (task.status === 'completed') {
      task.results = this.generateTaskResults(task);
      this.emit('taskCompleted', task);
    } else {
      this.emit('taskFailed', task);
    }
  }

  private generateExecutionSteps(task: Task): Array<{ progress: number; description: string }> {
    const steps = [];
    const totalSteps = 5;
    
    for (let i = 0; i < totalSteps; i++) {
      steps.push({
        progress: ((i + 1) / totalSteps) * 100,
        description: this.getExecutionStepDescription(task, i, totalSteps)
      });
    }
    
    return steps;
  }

  private getExecutionStepDescription(task: Task, stepIndex: number, totalSteps: number): string {
    const descriptions = [
      `Initializing ${task.title.toLowerCase()}`,
      `Processing ${task.title.toLowerCase()} requirements`,
      `Executing ${task.title.toLowerCase()} logic`,
      `Validating ${task.title.toLowerCase()} output`,
      `Finalizing ${task.title.toLowerCase()}`
    ];
    
    return descriptions[stepIndex] || `Step ${stepIndex + 1} of ${task.title}`;
  }

  private generateTaskResults(task: Task): string {
    const resultTemplates = {
      'Research and gather information': 'Comprehensive research report with key findings and sources',
      'Analyze and synthesize findings': 'Analytical summary with actionable insights and recommendations',
      'Design and plan structure': 'Detailed design document with specifications and implementation plan',
      'Implement core components': 'Functional implementation meeting all requirements',
      'Test and validate functionality': 'Test results confirming all features work correctly',
      'Assess current state': 'Current state assessment with strengths and weaknesses identified',
      'Identify improvement opportunities': 'Prioritized list of improvement opportunities with impact analysis',
      'Implement optimizations': 'Optimized system with measurable performance improvements'
    };
    
    return resultTemplates[task.title as keyof typeof resultTemplates] || 
           `Successfully completed: ${task.title}`;
  }

  // Learning system
  private async generateInsights(objective: Objective, iteration: number): Promise<LearningInsight[]> {
    const insights: LearningInsight[] = [];
    
    // Analyze task execution patterns
    const completedTasks = this.tasks.filter(t => 
      t.objectiveId === objective.id && t.status === 'completed'
    );
    
    const failedTasks = this.tasks.filter(t => 
      t.objectiveId === objective.id && t.status === 'failed'
    );
    
    // Generate strategy insights
    if (completedTasks.length > 0) {
      insights.push({
        category: 'strategy',
        insight: `Successfully completed ${completedTasks.length} tasks. Task decomposition strategy is effective.`,
        confidence: 0.8,
        appliedToNextTasks: true
      });
    }
    
    // Generate timing insights
    const avgDuration = completedTasks.reduce((sum, task) => 
      sum + (task.actualDuration || task.estimatedDuration), 0) / completedTasks.length;
    
    if (avgDuration > 0) {
      insights.push({
        category: 'timing',
        insight: `Average task completion time: ${Math.round(avgDuration)} minutes.${avgDuration > 60 ? ' Tasks are taking longer than expected.' : ''}`,
        confidence: 0.9,
        appliedToNextTasks: true
      });
    }
    
    // Generate dependency insights
    const complexTasks = this.tasks.filter(t => t.dependencies.length > 0);
    if (complexTasks.length > 0) {
      insights.push({
        category: 'dependencies',
        insight: `${complexTasks.length} tasks require dependencies. Managing task order is crucial for success.`,
        confidence: 0.7,
        appliedToNextTasks: true
      });
    }
    
    return insights;
  }

  private getRelevantMemories(objectiveTitle: string, iteration: number): AgentMemory[] {
    return this.agentMemory.filter(memory => {
      // Filter by relevance to objective
      const isRelevant = objectiveTitle.toLowerCase().includes('research') && 
                        memory.applicability.includes('research') ||
                       objectiveTitle.toLowerCase().includes('build') && 
                        memory.applicability.includes('development') ||
                       objectiveTitle.toLowerCase().includes('optimize') && 
                        memory.applicability.includes('optimization');
      
      return isRelevant && memory.confidence > 0.5;
    });
  }

  private applyLearning(template: any, memories: AgentMemory[]): any {
    // Apply insights from memories to improve task templates
    let enhancedTemplate = { ...template };
    
    memories.forEach(memory => {
      if (memory.type === 'strategy' && memory.confidence > 0.7) {
        // Adjust priority based on strategy insights
        if (memory.content.includes('high priority')) {
          enhancedTemplate.priority = Math.min(enhancedTemplate.priority + 1, 10);
        }
      }
      
      if (memory.applicability.includes('timing') || memory.content.toLowerCase().includes('timing')) {
        // Adjust estimated duration based on timing insights
        const durationMatch = memory.content.match(/(\d+) minutes/);
        if (durationMatch) {
          const learnedDuration = parseInt(durationMatch[1]);
          enhancedTemplate.estimatedDuration = Math.round(
            (enhancedTemplate.estimatedDuration + learnedDuration) / 2
          );
        }
      }
    });
    
    return enhancedTemplate;
  }

  private addLearning(insight: LearningInsight): void {
    const memory: AgentMemory = {
      id: crypto.randomUUID(),
      type: 'learning',
      content: `[${insight.category}] ${insight.insight}`,
      timestamp: new Date(),
      confidence: insight.confidence,
      applicability: [insight.category]
    };
    
    this.agentMemory.push(memory);
    this.emit('memoryAdded', memory);
  }

  // Objective completion check
  private async checkObjectiveCompletion(objective: Objective): Promise<boolean> {
    const objectiveTasks = this.tasks.filter(t => t.objectiveId === objective.id);
    const completedTasks = objectiveTasks.filter(t => t.status === 'completed');
    
    // Consider objective complete if all high-priority tasks are completed
    const highPriorityTasks = objectiveTasks.filter(t => t.priority >= 7);
    const completedHighPriority = highPriorityTasks.filter(t => t.status === 'completed');
    
    return completedHighPriority.length >= highPriorityTasks.length * 0.8; // 80% completion
  }

  private completeObjective(objective: Objective): void {
    objective.status = 'completed';
    objective.completedAt = new Date();
    
    const memory: AgentMemory = {
      id: crypto.randomUUID(),
      type: 'success',
      content: `Successfully completed objective: ${objective.title}`,
      objectiveId: objective.id,
      timestamp: new Date(),
      confidence: 1.0,
      applicability: ['success', 'general']
    };
    
    this.agentMemory.push(memory);
    this.emit('objectiveCompleted', objective);
  }

  private failObjective(objective: Objective, reason: string): void {
    objective.status = 'failed';
    
    const memory: AgentMemory = {
      id: crypto.randomUUID(),
      type: 'failure',
      content: `Failed to complete objective: ${objective.title}. Reason: ${reason}`,
      objectiveId: objective.id,
      timestamp: new Date(),
      confidence: 1.0,
      applicability: ['failure', 'general']
    };
    
    this.agentMemory.push(memory);
    this.emit('objectiveFailed', objective);
  }

  // Utility methods
  private getExecutableTasks(objectiveId: string): Task[] {
    return this.tasks.filter(task => 
      task.objectiveId === objectiveId && 
      task.status === 'pending' &&
      task.dependencies.every(depId => 
        this.tasks.find(t => t.id === depId)?.status === 'completed'
      )
    );
  }

  private addTask(task: Task): void {
    this.tasks.push(task);
    this.emit('taskAdded', task);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Public methods for external access
  getTasks(objectiveId?: string): Task[] {
    return objectiveId 
      ? this.tasks.filter(t => t.objectiveId === objectiveId)
      : this.tasks;
  }

  getAgentMemory(): AgentMemory[] {
    return this.agentMemory;
  }

  clearMemory(): void {
    this.agentMemory = [];
    this.emit('memoryCleared');
  }
}

export default BabyAGIEngine;