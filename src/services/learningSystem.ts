import { 
  LearningInsight, 
  AgentMemory, 
  Task, 
  Objective, 
  SimulationStatistics 
} from '../types/babyagi';

/**
 * Advanced Learning System for BabyAGI
 * Implements adaptive learning, pattern recognition, and knowledge management
 * to improve task execution strategies over time.
 */
export class LearningSystem {
  private memories: AgentMemory[] = [];
  private learningPatterns: Map<string, LearningPattern> = new Map();
  private adaptationRules: AdaptationRule[] = [];
  private performanceHistory: PerformanceRecord[] = [];
  private knowledgeBase: KnowledgeBase = new KnowledgeBase();
  private learningCallbacks: { [key: string]: Function[] } = {};

  // Learning configuration
  private readonly MIN_CONFIDENCE_THRESHOLD = 0.6;
  private readonly MEMORY_RETENTION_DAYS = 30;
  private readonly PATTERN_MIN_OCCURRENCES = 3;
  private readonly ADAPTATION_THRESHOLD = 0.7;

  constructor() {
    this.initializeDefaultRules();
    this.initializeKnowledgeBase();
  }

  // Event system
  on(event: string, callback: Function) {
    if (!this.learningCallbacks[event]) {
      this.learningCallbacks[event] = [];
    }
    this.learningCallbacks[event].push(callback);
  }

  private emit(event: string, data?: any) {
    if (this.learningCallbacks[event]) {
      this.learningCallbacks[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in learning callback for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Main learning entry point - processes task results and generates insights
   */
  async processTaskCompletion(
    task: Task, 
    context: TaskContext,
    historicalData?: HistoricalData
  ): Promise<LearningInsight[]> {
    const insights: LearningInsight[] = [];
    
    try {
      // 1. Analyze task execution
      const executionAnalysis = await this.analyzeTaskExecution(task, context);
      
      // 2. Generate insights based on analysis
      insights.push(...this.generateExecutionInsights(task, executionAnalysis));
      
      // 3. Update performance patterns
      this.updatePerformancePatterns(task, executionAnalysis);
      
      // 4. Update knowledge base
      this.updateKnowledgeBase(task, executionAnalysis);
      
      // 5. Generate adaptive recommendations
      const adaptations = await this.generateAdaptiveRecommendations(task, executionAnalysis);
      insights.push(...adaptations);
      
      // 6. Store learned insights in memory
      insights.forEach(insight => this.storeLearningInsight(insight));
      
      // 7. Clean up old memories
      this.cleanupOldMemories();
      
      this.emit('learningCompleted', { task, insights });
      
      return insights;
      
    } catch (error) {
      console.error('Error in learning system:', error);
      return this.generateFallbackInsights(task, error);
    }
  }

  /**
   * Analyze task execution for patterns and insights
   */
  private async analyzeTaskExecution(task: Task, context: TaskContext): Promise<ExecutionAnalysis> {
    const analysis: ExecutionAnalysis = {
      task,
      context,
      executionMetrics: this.calculateExecutionMetrics(task),
      complexityAnalysis: this.analyzeComplexity(task),
      dependencyAnalysis: this.analyzeDependencies(task, context),
      timingAnalysis: this.analyzeTiming(task),
      successFactors: this.identifySuccessFactors(task),
      failureFactors: this.identifyFailureFactors(task),
      patterns: this.detectExecutionPatterns(task, context)
    };

    return analysis;
  }

  private calculateExecutionMetrics(task: Task): ExecutionMetrics {
    const actualDuration = task.actualDuration || 0;
    const estimatedDuration = task.estimatedDuration * 1000; // Convert to ms
    const durationRatio = actualDuration / estimatedDuration;
    
    const progressEfficiency = task.progress / 100;
    const attemptEfficiency = task.attempts === 1 ? 1 : Math.max(0.3, 1 - (task.attempts - 1) * 0.2);
    
    return {
      durationEfficiency: Math.min(1.5, durationRatio), // Cap at 150%
      progressEfficiency,
      attemptEfficiency,
      overallEfficiency: (durationRatio * 0.4 + progressEfficiency * 0.3 + attemptEfficiency * 0.3),
      complexityScore: this.calculateComplexityScore(task),
      successProbability: this.calculateSuccessProbability(task)
    };
  }

  private analyzeComplexity(task: Task): ComplexityAnalysis {
    const complexityFactors = {
      statedComplexity: task.complexity,
      executionComplexity: this.assessExecutionComplexity(task),
      dependencyComplexity: task.dependencies.length,
      scopeComplexity: this.assessScopeComplexity(task),
      technicalComplexity: this.assessTechnicalComplexity(task)
    };

    const effectiveComplexity = Object.values(complexityFactors)
      .reduce((sum, val) => sum + val, 0) / Object.keys(complexityFactors).length;

    return {
      factors: complexityFactors,
      effectiveComplexity,
      complexityMismatch: Math.abs(task.complexity - effectiveComplexity),
      recommendations: this.generateComplexityRecommendations(complexityFactors, effectiveComplexity)
    };
  }

  private analyzeDependencies(task: Task, context: TaskContext): DependencyAnalysis {
    const dependencyInfo = task.dependencies.map(depId => {
      const depTask = context.relatedTasks.find(t => t.id === depId);
      return {
        id: depId,
        task: depTask,
        completionTime: depTask?.completedAt ? 
          depTask.completedAt.getTime() - depTask.startedAt!.getTime() : 0,
        status: depTask?.status || 'unknown'
      };
    });

    const criticalDependencies = dependencyInfo.filter(dep => 
      dep.status !== 'completed' || dep.completionTime > task.estimatedDuration * 1000 * 0.3
    );

    return {
      totalDependencies: dependencyInfo.length,
      criticalDependencies: criticalDependencies.length,
      dependencyInfo,
      criticalDependenciesList: criticalDependencies,
      dependencyScore: this.calculateDependencyScore(dependencyInfo),
      recommendations: this.generateDependencyRecommendations(dependencyInfo)
    };
  }

  private analyzeTiming(task: Task): TimingAnalysis {
    const actualDuration = task.actualDuration || 0;
    const estimatedDuration = task.estimatedDuration * 1000;
    const durationVariance = Math.abs(actualDuration - estimatedDuration) / estimatedDuration;
    
    const timeEfficiency = estimatedDuration / actualDuration;
    const scheduleImpact = durationVariance > 0.3 ? 'high' : durationVariance > 0.15 ? 'medium' : 'low';

    return {
      actualDuration,
      estimatedDuration,
      durationVariance,
      timeEfficiency,
      scheduleImpact,
      timeCategory: timeEfficiency > 1.2 ? 'faster' : timeEfficiency < 0.8 ? 'slower' : 'on-time',
      recommendations: this.generateTimingRecommendations(durationVariance, timeEfficiency)
    };
  }

  private identifySuccessFactors(task: Task): string[] {
    const factors: string[] = [];
    
    if (task.status === 'completed') {
      if (task.complexity <= 5 && task.attempts === 1) {
        factors.push('Appropriate complexity level');
      }
      if (task.dependencies.length <= 2) {
        factors.push('Manageable dependency structure');
      }
      if (task.actualDuration && task.actualDuration <= task.estimatedDuration * 1000) {
        factors.push('Good time estimation');
      }
      if (task.learning?.confidence && task.learning.confidence > 0.7) {
        factors.push('Effective learning application');
      }
    }
    
    return factors;
  }

  private identifyFailureFactors(task: Task): string[] {
    const factors: string[] = [];
    
    if (task.status === 'failed') {
      if (task.complexity > 8) {
        factors.push('Overly complex task scope');
      }
      if (task.dependencies.length > 4) {
        factors.push('Too many dependencies');
      }
      if (task.attempts > 2) {
        factors.push('Multiple execution attempts required');
      }
      if (task.actualDuration && task.actualDuration > task.estimatedDuration * 1000 * 1.5) {
        factors.push('Significant time overrun');
      }
    }
    
    return factors;
  }

  private detectExecutionPatterns(task: Task, context: TaskContext): ExecutionPattern[] {
    const patterns: ExecutionPattern[] = [];
    
    // Complexity pattern
    if (task.complexity > 7 && task.status === 'failed') {
      patterns.push({
        type: 'complexity',
        description: 'High complexity tasks have higher failure rate',
        confidence: 0.8,
        evidence: [`Task complexity: ${task.complexity}`, `Status: ${task.status}`],
        recommendation: 'Break high complexity tasks into smaller components'
      });
    }
    
    // Dependency pattern
    if (task.dependencies.length > 3 && task.status === 'failed') {
      patterns.push({
        type: 'dependency',
        description: 'Tasks with many dependencies are more likely to fail',
        confidence: 0.7,
        evidence: [`Dependencies: ${task.dependencies.length}`, `Status: ${task.status}`],
        recommendation: 'Reduce task dependencies or sequence them better'
      });
    }
    
    // Timing pattern
    if (task.actualDuration && task.actualDuration > task.estimatedDuration * 1000 * 1.3) {
      patterns.push({
        type: 'timing',
        description: 'Time estimation tends to be optimistic',
        confidence: 0.9,
        evidence: [`Estimated: ${task.estimatedDuration}s`, `Actual: ${Math.round(task.actualDuration / 1000)}s`],
        recommendation: 'Increase time estimates by 30% for complex tasks'
      });
    }
    
    return patterns;
  }

  /**
   * Generate insights based on analysis
   */
  private generateExecutionInsights(task: Task, analysis: ExecutionAnalysis): LearningInsight[] {
    const insights: LearningInsight[] = [];
    
    // Strategy insights
    if (analysis.executionMetrics.overallEfficiency < 0.6) {
      insights.push({
        category: 'strategy',
        insight: `Task execution efficiency is low (${(analysis.executionMetrics.overallEfficiency * 100).toFixed(1)}%). Consider breaking down complex tasks or improving execution approach.`,
        confidence: 0.8,
        appliedToNextTasks: true
      });
    }
    
    // Complexity insights
    if (analysis.complexityAnalysis.complexityMismatch > 2) {
      insights.push({
        category: 'strategy',
        insight: `Complexity assessment mismatch detected. Actual execution complexity (${analysis.complexityAnalysis.effectiveComplexity.toFixed(1)}) differs significantly from estimated (${task.complexity}).`,
        confidence: 0.7,
        appliedToNextTasks: true
      });
    }
    
    // Timing insights
    if (analysis.timingAnalysis.durationVariance > 0.3) {
      insights.push({
        category: 'timing',
        insight: `Time estimation variance is ${(analysis.timingAnalysis.durationVariance * 100).toFixed(1)}%. Consider adjusting estimation methodology for ${task.complexity <= 5 ? 'simple' : 'complex'} tasks.`,
        confidence: 0.9,
        appliedToNextTasks: true
      });
    }
    
    // Dependency insights
    if (analysis.dependencyAnalysis.dependencyScore < 0.6) {
      insights.push({
        category: 'dependencies',
        insight: `Dependency management score is low (${(analysis.dependencyAnalysis.dependencyScore * 100).toFixed(1)}%). Review task sequencing and dependency resolution.`,
        confidence: 0.7,
        appliedToNextTasks: true
      });
    }
    
    return insights;
  }

  /**
   * Generate adaptive recommendations
   */
  private async generateAdaptiveRecommendations(
    task: Task, 
    analysis: ExecutionAnalysis
  ): Promise<LearningInsight[]> {
    const recommendations: LearningInsight[] = [];
    
    // Adaptive strategy based on task type
    const taskType = this.classifyTaskType(task.title);
    const historicalPerformance = this.getHistoricalPerformance(taskType);
    
    if (historicalPerformance.successRate < 0.7) {
      recommendations.push({
        category: 'strategy',
        insight: `Historical performance for ${taskType} tasks is ${(historicalPerformance.successRate * 100).toFixed(1)}%. Consider alternative approaches or increased time allocation.`,
        confidence: 0.8,
        appliedToNextTasks: true
      });
    }
    
    // Adaptive complexity adjustments
    if (analysis.complexityAnalysis.effectiveComplexity > task.complexity + 1) {
      recommendations.push({
        category: 'priority',
        insight: `Task complexity may have been underestimated. Allocate more resources or break into subtasks.`,
        confidence: 0.7,
        appliedToNextTasks: true
      });
    }
    
    return recommendations;
  }

  /**
   * Update performance patterns
   */
  private updatePerformancePatterns(task: Task, analysis: ExecutionAnalysis): void {
    const patternKey = this.generatePatternKey(task);
    
    if (!this.learningPatterns.has(patternKey)) {
      this.learningPatterns.set(patternKey, {
        taskType: this.classifyTaskType(task.title),
        occurrences: 0,
        successes: 0,
        totalDuration: 0,
        avgComplexity: 0,
        avgDependencies: 0,
        insights: []
      });
    }
    
    const pattern = this.learningPatterns.get(patternKey)!;
    pattern.occurrences++;
    
    if (task.status === 'completed') {
      pattern.successes++;
    }
    
    pattern.totalDuration += task.actualDuration || task.estimatedDuration * 1000;
    pattern.avgComplexity = (pattern.avgComplexity * (pattern.occurrences - 1) + task.complexity) / pattern.occurrences;
    pattern.avgDependencies = (pattern.avgDependencies * (pattern.occurrences - 1) + task.dependencies.length) / pattern.occurrences;
    
    // Add insights from analysis
    if (analysis.patterns.length > 0) {
      pattern.insights.push(...analysis.patterns);
    }
  }

  /**
   * Update knowledge base
   */
  private updateKnowledgeBase(task: Task, analysis: ExecutionAnalysis): void {
    const taskType = this.classifyTaskType(task.title);
    
    // Add task execution knowledge
    this.knowledgeBase.addKnowledge({
      type: 'task_execution',
      taskType,
      complexity: task.complexity,
      duration: task.actualDuration || task.estimatedDuration * 1000,
      success: task.status === 'completed',
      dependencies: task.dependencies.length,
      patterns: analysis.patterns,
      insights: analysis.successFactors.concat(analysis.failureFactors)
    });
    
    // Add complexity knowledge
    if (analysis.complexityAnalysis.complexityMismatch > 1) {
      this.knowledgeBase.addKnowledge({
        type: 'complexity_assessment',
        taskType,
        estimatedComplexity: task.complexity,
        actualComplexity: analysis.complexityAnalysis.effectiveComplexity,
        factors: analysis.complexityAnalysis.factors,
        recommendations: analysis.complexityAnalysis.recommendations
      });
    }
    
    // Add timing knowledge
    if (analysis.timingAnalysis.durationVariance > 0.2) {
      this.knowledgeBase.addKnowledge({
        type: 'timing_estimation',
        taskType,
        estimatedDuration: task.estimatedDuration,
        actualDuration: task.actualDuration || 0,
        variance: analysis.timingAnalysis.durationVariance,
        efficiency: analysis.timingAnalysis.timeEfficiency
      });
    }
  }

  /**
   * Store learning insight in memory
   */
  private storeLearningInsight(insight: LearningInsight): void {
    const memory: AgentMemory = {
      id: crypto.randomUUID(),
      type: 'learning',
      content: `[${insight.category.toUpperCase()}] ${insight.insight}`,
      timestamp: new Date(),
      confidence: insight.confidence,
      applicability: [insight.category]
    };
    
    this.memories.push(memory);
  }

  /**
   * Get relevant memories for a context
   */
  getRelevantMemories(context: TaskContext): AgentMemory[] {
    return this.memories
      .filter(memory => {
        // Filter by confidence threshold
        if (memory.confidence < this.MIN_CONFIDENCE_THRESHOLD) return false;
        
        // Filter by relevance to task type
        const taskType = this.classifyTaskType(context.taskTitle);
        const isRelevant = memory.applicability.includes(taskType) ||
                          memory.applicability.includes(context.objectiveType) ||
                          memory.content.toLowerCase().includes(taskType);
        
        return isRelevant;
      })
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10); // Top 10 most relevant memories
  }

  /**
   * Generate strategic recommendations
   */
  generateStrategicRecommendations(objective: Objective): StrategicRecommendation[] {
    const taskType = this.classifyTaskType(objective.title);
    const historicalData = this.knowledgeBase.getKnowledgeByType('task_execution', taskType);
    const patterns = Array.from(this.learningPatterns.values())
      .filter(p => p.taskType === taskType && p.occurrences >= this.PATTERN_MIN_OCCURRENCES);

    const recommendations: StrategicRecommendation[] = [];
    
    // Success rate recommendations
    const avgSuccessRate = patterns.length > 0 ?
      patterns.reduce((sum, p) => sum + (p.successes / p.occurrences), 0) / patterns.length : 1;
    
    if (avgSuccessRate < 0.7) {
      recommendations.push({
        type: 'success_rate',
        priority: 'high',
        description: `Historical success rate for ${taskType} tasks is ${(avgSuccessRate * 100).toFixed(1)}%. Consider breaking into smaller tasks or allocating more time.`,
        implementation: 'Increase task granularity or extend time estimates',
        expectedImpact: 'Improve success rate by 15-25%'
      });
    }
    
    // Complexity recommendations
    const avgComplexity = patterns.length > 0 ?
      patterns.reduce((sum, p) => sum + p.avgComplexity, 0) / patterns.length : objective.complexity;
    
    if (avgComplexity > objective.complexity + 1) {
      recommendations.push({
        type: 'complexity',
        priority: 'medium',
        description: `Average historical complexity for similar tasks is ${avgComplexity.toFixed(1)}, higher than estimated ${objective.complexity}.`,
        implementation: 'Increase complexity estimates or break down tasks further',
        expectedImpact: 'Better resource allocation and scheduling'
      });
    }
    
    // Timing recommendations
    const avgDuration = patterns.length > 0 ?
      patterns.reduce((sum, p) => sum + p.totalDuration / p.occurrences, 0) / patterns.length : 0;
    
    if (avgDuration > objective.complexity * 15 * 1000) { // Convert to milliseconds
      recommendations.push({
        type: 'timing',
        priority: 'medium',
        description: `Historical average duration is ${Math.round(avgDuration / 1000)}s, consider adjusting time estimates.`,
        implementation: 'Increase time estimates by 20-30% based on historical data',
        expectedImpact: 'Reduced deadline pressure and better execution quality'
      });
    }
    
    return recommendations;
  }

  /**
   * Apply learned strategies to new tasks
   */
  applyLearnedStrategies(task: Task): Task {
    const modifiedTask = { ...task };
    const taskType = this.classifyTaskType(task.title);
    const relevantPatterns = this.learningPatterns.get(this.generatePatternKey(task));
    
    if (!relevantPatterns) return modifiedTask;
    
    // Apply historical complexity adjustments
    if (relevantPatterns.avgComplexity > task.complexity + 0.5) {
      modifiedTask.complexity = Math.min(10, Math.round(relevantPatterns.avgComplexity));
    }
    
    // Apply historical duration adjustments
    if (relevantPatterns.totalDuration > 0) {
      const avgDurationMs = relevantPatterns.totalDuration / relevantPatterns.occurrences;
      modifiedTask.estimatedDuration = Math.round((avgDurationMs / 1000) * 1.1); // Add 10% buffer
    }
    
    // Apply dependency recommendations
    if (relevantPatterns.avgDependencies > task.dependencies.length + 0.5) {
      // This would require more complex logic to restructure dependencies
      // For now, just note it as a learning point
      modifiedTask.learning = {
        category: 'dependencies',
        insight: `Historical analysis suggests ${taskType} tasks typically have ${relevantPatterns.avgDependencies.toFixed(1)} dependencies. Consider this for future planning.`,
        confidence: 0.7,
        appliedToNextTasks: true
      };
    }
    
    return modifiedTask;
  }

  // Utility and helper methods
  private classifyTaskType(title: string): string {
    const lowerTitle = title.toLowerCase();
    
    if (lowerTitle.includes('research') || lowerTitle.includes('investigate')) return 'research';
    if (lowerTitle.includes('design') || lowerTitle.includes('plan') || lowerTitle.includes('architecture')) return 'design';
    if (lowerTitle.includes('implement') || lowerTitle.includes('build') || lowerTitle.includes('create')) return 'implementation';
    if (lowerTitle.includes('analyze') || lowerTitle.includes('evaluate') || lowerTitle.includes('assess')) return 'analysis';
    if (lowerTitle.includes('optimize') || lowerTitle.includes('improve') || lowerTitle.includes('enhance')) return 'optimization';
    if (lowerTitle.includes('test') || lowerTitle.includes('validate') || lowerTitle.includes('verify')) return 'testing';
    
    return 'general';
  }

  private generatePatternKey(task: Task): string {
    const taskType = this.classifyTaskType(task.title);
    const complexityRange = Math.floor(task.complexity / 2) * 2; // Group by ranges of 2
    const depRange = Math.floor(task.dependencies.length / 2) * 2;
    
    return `${taskType}_${complexityRange}_${depRange}`;
  }

  private calculateExecutionMetrics(task: Task): ExecutionMetrics {
    // Implementation details...
    return {
      durationEfficiency: 1,
      progressEfficiency: task.progress / 100,
      attemptEfficiency: 1,
      overallEfficiency: 0.8,
      complexityScore: task.complexity / 10,
      successProbability: task.status === 'completed' ? 1 : 0
    };
  }

  private assessExecutionComplexity(task: Task): number {
    // Analyze based on task characteristics
    let complexity = task.complexity;
    
    // Adjust based on dependencies
    if (task.dependencies.length > 3) complexity += 1;
    if (task.dependencies.length > 5) complexity += 1;
    
    // Adjust based on attempts
    if (task.attempts > 1) complexity += task.attempts * 0.5;
    
    return Math.min(10, complexity);
  }

  private assessScopeComplexity(task: Task): number {
    // Analyze based on estimated duration
    const durationComplexity = Math.min(5, task.estimatedDuration / 30); // 30 min = complexity 1
    return durationComplexity;
  }

  private assessTechnicalComplexity(task: Task): number {
    const title = task.title.toLowerCase();
    let complexity = 1;
    
    if (title.includes('algorithm') || title.includes('optimization')) complexity += 2;
    if (title.includes('integration') || title.includes('api')) complexity += 1.5;
    if (title.includes('machine learning') || title.includes('ai')) complexity += 2.5;
    
    return Math.min(10, complexity);
  }

  private calculateComplexityScore(task: Task): number {
    const factors = [task.complexity, task.dependencies.length * 0.5, task.attempts * 0.3];
    return factors.reduce((sum, factor) => sum + factor, 0) / factors.length;
  }

  private calculateSuccessProbability(task: Task): number {
    let probability = 1 - (task.complexity / 15); // Base probability
    
    // Adjust for dependencies
    probability -= task.dependencies.length * 0.05;
    
    // Adjust for attempts
    probability -= (task.attempts - 1) * 0.1;
    
    return Math.max(0.1, Math.min(0.9, probability));
  }

  private calculateDependencyScore(dependencyInfo: any[]): number {
    if (dependencyInfo.length === 0) return 1;
    
    const completedDependencies = dependencyInfo.filter(dep => dep.status === 'completed').length;
    const criticalDependencies = dependencyInfo.filter(dep => 
      dep.completionTime > 180000 // 3 minutes
    ).length;
    
    return (completedDependencies / dependencyInfo.length) * (1 - criticalDependencies * 0.1);
  }

  private generateComplexityRecommendations(factors: any, effectiveComplexity: number): string[] {
    const recommendations: string[] = [];
    
    if (factors.executionComplexity > factors.statedComplexity + 1) {
      recommendations.push('Execution complexity exceeds estimated complexity');
    }
    
    if (factors.dependencyComplexity > 3) {
      recommendations.push('High dependency complexity - consider task restructuring');
    }
    
    if (factors.technicalComplexity > 6) {
      recommendations.push('High technical complexity - allocate additional resources');
    }
    
    return recommendations;
  }

  private generateDependencyRecommendations(dependencyInfo: any[]): string[] {
    const recommendations: string[] = [];
    
    const unresolvedDependencies = dependencyInfo.filter(dep => dep.status !== 'completed');
    if (unresolvedDependencies.length > 0) {
      recommendations.push(`${unresolvedDependencies.length} dependencies are not completed`);
    }
    
    const longDependencies = dependencyInfo.filter(dep => dep.completionTime > 300000); // 5 minutes
    if (longDependencies.length > dependencyInfo.length * 0.5) {
      recommendations.push('Many dependencies took longer than expected');
    }
    
    return recommendations;
  }

  private generateTimingRecommendations(variance: number, efficiency: number): string[] {
    const recommendations: string[] = [];
    
    if (variance > 0.3) {
      recommendations.push('High timing variance - review estimation methodology');
    }
    
    if (efficiency < 0.8) {
      recommendations.push('Tasks are taking longer than estimated - consider buffer time');
    }
    
    if (efficiency > 1.2) {
      recommendations.push('Tasks completing faster than expected - opportunity for optimization');
    }
    
    return recommendations;
  }

  private getHistoricalPerformance(taskType: string): PerformanceStats {
    const patterns = Array.from(this.learningPatterns.values())
      .filter(p => p.taskType === taskType);
    
    if (patterns.length === 0) {
      return { successRate: 1, avgComplexity: 5, avgDuration: 900000, sampleSize: 0 };
    }
    
    const totalSuccesses = patterns.reduce((sum, p) => sum + p.successes, 0);
    const totalOccurrences = patterns.reduce((sum, p) => sum + p.occurrences, 0);
    const avgComplexity = patterns.reduce((sum, p) => sum + p.avgComplexity, 0) / patterns.length;
    const avgDuration = patterns.reduce((sum, p) => sum + (p.totalDuration / p.occurrences), 0) / patterns.length;
    
    return {
      successRate: totalSuccesses / totalOccurrences,
      avgComplexity,
      avgDuration,
      sampleSize: totalOccurrences
    };
  }

  private generateFallbackInsights(task: Task, error: Error): LearningInsight[] {
    return [{
      category: 'strategy',
      insight: `Task execution encountered an error: ${error.message}. This suggests potential issues with task complexity or dependency management.`,
      confidence: 0.5,
      appliedToNextTasks: true
    }];
  }

  private cleanupOldMemories(): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.MEMORY_RETENTION_DAYS);
    
    this.memories = this.memories.filter(memory => 
      memory.timestamp > cutoffDate || memory.confidence > 0.8
    );
  }

  private initializeDefaultRules(): void {
    this.adaptationRules = [
      {
        condition: { complexity: { gt: 8 }, failures: { gte: 2 } },
        action: 'break_into_subtasks',
        confidence: 0.8
      },
      {
        condition: { duration_variance: { gt: 0.4 } },
        action: 'increase_time_estimates',
        confidence: 0.9
      },
      {
        condition: { dependencies: { gt: 4 } },
        action: 'restructure_dependencies',
        confidence: 0.7
      }
    ];
  }

  private initializeKnowledgeBase(): void {
    // Initialize with common task patterns
    this.knowledgeBase.addKnowledge({
      type: 'task_pattern',
      taskType: 'research',
      commonSteps: ['gather_sources', 'analyze_data', 'synthesize_findings'],
      avgComplexity: 5,
      successRate: 0.85
    });
    
    this.knowledgeBase.addKnowledge({
      type: 'task_pattern',
      taskType: 'implementation',
      commonSteps: ['design', 'code', 'test', 'deploy'],
      avgComplexity: 7,
      successRate: 0.75
    });
  }

  // Public API methods
  getMemories(): AgentMemory[] {
    return [...this.memories];
  }

  getPatterns(): LearningPattern[] {
    return Array.from(this.learningPatterns.values());
  }

  getKnowledgeBase(): KnowledgeBase {
    return this.knowledgeBase;
  }

  clearMemories(): void {
    this.memories = [];
    this.learningPatterns.clear();
    this.performanceHistory = [];
  }

  exportLearning(): string {
    return JSON.stringify({
      memories: this.memories,
      patterns: Array.from(this.learningPatterns.entries()),
      knowledgeBase: this.knowledgeBase.export()
    }, null, 2);
  }

  importLearning(data: string): void {
    try {
      const parsed = JSON.parse(data);
      this.memories = parsed.memories || [];
      this.learningPatterns = new Map(parsed.patterns || []);
      this.knowledgeBase.import(parsed.knowledgeBase);
    } catch (error) {
      console.error('Failed to import learning data:', error);
    }
  }
}

// Supporting interfaces and classes
interface TaskContext {
  taskTitle: string;
  objectiveType: string;
  relatedTasks: Task[];
  objective: Objective;
}

interface HistoricalData {
  previousTasks: Task[];
  completedObjectives: number;
  failedObjectives: number;
}

interface ExecutionAnalysis {
  task: Task;
  context: TaskContext;
  executionMetrics: ExecutionMetrics;
  complexityAnalysis: ComplexityAnalysis;
  dependencyAnalysis: DependencyAnalysis;
  timingAnalysis: TimingAnalysis;
  successFactors: string[];
  failureFactors: string[];
  patterns: ExecutionPattern[];
}

interface ExecutionMetrics {
  durationEfficiency: number;
  progressEfficiency: number;
  attemptEfficiency: number;
  overallEfficiency: number;
  complexityScore: number;
  successProbability: number;
}

interface ComplexityAnalysis {
  factors: any;
  effectiveComplexity: number;
  complexityMismatch: number;
  recommendations: string[];
}

interface DependencyAnalysis {
  totalDependencies: number;
  criticalDependencies: number;
  dependencyInfo: any[];
  criticalDependenciesList: any[];
  dependencyScore: number;
  recommendations: string[];
}

interface TimingAnalysis {
  actualDuration: number;
  estimatedDuration: number;
  durationVariance: number;
  timeEfficiency: number;
  scheduleImpact: string;
  timeCategory: string;
  recommendations: string[];
}

interface ExecutionPattern {
  type: string;
  description: string;
  confidence: number;
  evidence: string[];
  recommendation: string;
}

interface StrategicRecommendation {
  type: string;
  priority: 'low' | 'medium' | 'high';
  description: string;
  implementation: string;
  expectedImpact: string;
}

interface PerformanceStats {
  successRate: number;
  avgComplexity: number;
  avgDuration: number;
  sampleSize: number;
}

interface LearningPattern {
  taskType: string;
  occurrences: number;
  successes: number;
  totalDuration: number;
  avgComplexity: number;
  avgDependencies: number;
  insights: ExecutionPattern[];
}

interface AdaptationRule {
  condition: any;
  action: string;
  confidence: number;
}

interface PerformanceRecord {
  timestamp: Date;
  taskId: string;
  success: boolean;
  duration: number;
  complexity: number;
}

class KnowledgeBase {
  private knowledge: any[] = [];

  addKnowledge(knowledge: any): void {
    this.knowledge.push({
      ...knowledge,
      timestamp: new Date(),
      id: crypto.randomUUID()
    });
  }

  getKnowledgeByType(type: string, subtype?: string): any[] {
    return this.knowledge.filter(k => 
      k.type === type && (subtype ? k.taskType === subtype : true)
    );
  }

  searchKnowledge(query: string): any[] {
    const lowerQuery = query.toLowerCase();
    return this.knowledge.filter(k => 
      JSON.stringify(k).toLowerCase().includes(lowerQuery)
    );
  }

  export(): string {
    return JSON.stringify(this.knowledge, null, 2);
  }

  import(data: string): void {
    try {
      this.knowledge = JSON.parse(data);
    } catch (error) {
      console.error('Failed to import knowledge base:', error);
    }
  }
}

export default LearningSystem;