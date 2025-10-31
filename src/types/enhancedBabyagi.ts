// Enhanced types for BabyAGI simulation system
import { 
  Objective, 
  Task, 
  LearningInsight, 
  AgentMemory, 
  TaskExecution,
  SimulationState,
  SimulationStatistics,
  AppSettings,
  OpenRouterConfig,
  OpenRouterModel,
  OpenRouterResponse,
  APIKeyValidationResult
} from './babyagi';

// Extended simulation types
export interface AdvancedTask extends Task {
  // Enhanced task properties
  executionStrategy?: string;
  resourceRequirements?: ResourceRequirements;
  riskFactors?: RiskFactor[];
  adaptationHistory?: AdaptationRecord[];
  aiGenerated?: boolean;
  context?: TaskContext;
  dependenciesResolved?: boolean;
  executionPlan?: ExecutionPlan;
  performanceMetrics?: TaskPerformanceMetrics;
  learningApplied?: boolean;
}

export interface ResourceRequirements {
  cpu: number; // 0-1 scale
  memory: number; // 0-1 scale
  network: number; // 0-1 scale
  storage: number; // 0-1 scale
  time: number; // estimated minutes
  expertise: string[]; // required skills/expertise
}

export interface RiskFactor {
  type: 'complexity' | 'dependency' | 'timing' | 'resource' | 'technical';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  probability: number; // 0-1
  mitigation?: string;
  detectedAt?: Date;
}

export interface AdaptationRecord {
  timestamp: Date;
  reason: string;
  changes: { [key: string]: any };
  success: boolean;
  performanceImpact?: number;
}

export interface TaskContext {
  objectiveType: string;
  domain: string;
  relatedTasks: string[];
  prerequisites: string[];
  successCriteria: string[];
  constraints: string[];
  environment?: ExecutionEnvironment;
}

export interface ExecutionEnvironment {
  tools: string[];
  dependencies: { [key: string]: string };
  configuration: { [key: string]: any };
  limitations: string[];
}

export interface ExecutionPlan {
  phases: ExecutionPhase[];
  totalDuration: number;
  criticalPath: string[];
  riskMitigation: string[];
  checkpoints: Checkpoint[];
}

export interface ExecutionPhase {
  name: string;
  description: string;
  tasks: string[];
  estimatedDuration: number;
  dependencies: string[];
  resources: ResourceRequirements;
  successCriteria: string[];
}

export interface Checkpoint {
  name: string;
  phase: string;
  criteria: string[];
  evaluationMethod: 'automatic' | 'manual' | 'hybrid';
  requiredForContinuation: boolean;
}

export interface TaskPerformanceMetrics {
  efficiency: number; // 0-1, actual vs estimated
  quality: number; // 0-1, based on output quality
  reliability: number; // 0-1, consistency across attempts
  adaptability: number; // 0-1, how well it adapts to changes
  learningContribution: number; // 0-1, how much it contributes to learning
}

// Enhanced objective types
export interface AdvancedObjective extends Objective {
  // Enhanced objective properties
  domain: string;
  successCriteria: string[];
  constraints: string[];
  stakeholders: string[];
  businessValue: number; // 0-1
  urgency: 'low' | 'medium' | 'high' | 'critical';
  complexityFactors: ComplexityFactor[];
  riskAssessment?: RiskAssessment;
  implementationPlan?: ImplementationPlan;
  qualityMetrics: QualityMetric[];
  learningObjectives?: string[];
  adaptiveParameters?: AdaptiveParameters;
}

export interface ComplexityFactor {
  name: string;
  description: string;
  impact: number; // 0-1
  mitigationStrategies: string[];
  measurementMethod: string;
}

export interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: RiskFactor[];
  mitigationPlan: string[];
  contingencyPlans: ContingencyPlan[];
  monitoringPoints: MonitoringPoint[];
}

export interface ContingencyPlan {
  trigger: string;
  action: string;
  resources: ResourceRequirements;
  timeline: number; // minutes
  successCriteria: string;
}

export interface MonitoringPoint {
  name: string;
  metric: string;
  threshold: number;
  action: string;
  frequency: string;
}

export interface ImplementationPlan {
  phases: ImplementationPhase[];
  milestones: Milestone[];
  resourceAllocation: ResourceAllocation;
  timeline: Timeline;
  qualityGates: QualityGate[];
}

export interface ImplementationPhase {
  name: string;
  description: string;
  objectives: string[];
  tasks: string[];
  duration: number; // days
  resources: ResourceRequirements;
  dependencies: string[];
  deliverables: string[];
}

export interface Milestone {
  name: string;
  description: string;
  date: Date;
  successCriteria: string[];
  deliverables: string[];
  approvalRequired: boolean;
}

export interface ResourceAllocation {
  human: { [role: string]: number }; // hours
  computational: { [resource: string]: number };
  financial: { [category: string]: number };
  temporal: { [phase: string]: number }; // days
}

export interface Timeline {
  startDate: Date;
  endDate: Date;
  phases: { [phase: string]: { start: Date; end: Date } };
  criticalPath: string[];
  bufferTime: number; // days
}

export interface QualityGate {
  name: string;
  criteria: string[];
  evaluationMethod: string;
  approvalRequired: boolean;
  automatedChecks: string[];
}

export interface QualityMetric {
  name: string;
  target: number;
  measurement: string;
  frequency: string;
  threshold: number;
}

export interface AdaptiveParameters {
  complexityAdjustment: number;
  timeMultiplier: number;
  resourceMultiplier: number;
  qualityThreshold: number;
  learningRate: number;
}

// Enhanced learning system types
export interface AdvancedLearningInsight extends LearningInsight {
  // Enhanced learning properties
  evidence: string[];
  patterns: LearningPattern[];
  recommendations: Recommendation[];
  confidenceFactors: ConfidenceFactor[];
  applicability: ApplicabilityContext[];
  implementationGuidance: ImplementationGuidance;
  historicalValidation?: HistoricalValidation[];
}

export interface LearningPattern {
  name: string;
  description: string;
  frequency: number;
  successCorrelation: number;
  conditions: string[];
  examples: string[];
}

export interface Recommendation {
  type: 'strategy' | 'process' | 'tool' | 'resource' | 'timing';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  implementation: string;
  expectedImpact: number;
  effort: 'low' | 'medium' | 'high';
  dependencies: string[];
  risks: string[];
}

export interface ConfidenceFactor {
  factor: string;
  impact: number; // 0-1
  evidence: string[];
  uncertainty: number; // 0-1
}

export interface ApplicabilityContext {
  domain: string;
  conditions: string[];
  constraints: string[];
  adaptations: string[];
}

export interface ImplementationGuidance {
  steps: ImplementationStep[];
  checkpoints: ImplementationCheckpoint[];
  resources: string[];
  timeline: string;
  successCriteria: string[];
}

export interface ImplementationStep {
  order: number;
  description: string;
  dependencies: string[];
  resources: string[];
  duration: number; // minutes
  validation: string;
}

export interface ImplementationCheckpoint {
  name: string;
  criteria: string[];
  validation: string;
  rollback: string;
}

export interface HistoricalValidation {
  date: Date;
  application: string;
  result: 'success' | 'partial' | 'failure';
  performance: number; // 0-1
  lessons: string[];
}

// Enhanced memory types
export interface AdvancedAgentMemory extends AgentMemory {
  // Enhanced memory properties
  tags: string[];
  strength: number; // 0-1, how strongly this memory affects behavior
  decayRate: number; // 0-1, how quickly this memory loses relevance
  reinforcementCount: number;
  crossReferences: string[];
  relatedMemories: string[];
  usage: UsageStats;
  validationStatus: 'pending' | 'validated' | 'contradicted' | 'obsolete';
}

export interface UsageStats {
  timesReferenced: number;
  lastUsed: Date;
  averageImpact: number;
  successfulApplications: number;
  failedApplications: number;
}

// Enhanced execution types
export interface AdvancedTaskExecution extends TaskExecution {
  // Enhanced execution properties
  executionId: string;
  strategy: string;
  environment: ExecutionEnvironment;
  checkpoints: ExecutionCheckpoint[];
  adaptations: ExecutionAdaptation[];
  resourceUsage: ResourceUsage;
  performance: ExecutionPerformance;
  logs: DetailedLog[];
  metrics: ExecutionMetrics;
}

export interface ExecutionCheckpoint {
  name: string;
  timestamp: Date;
  criteria: string[];
  result: 'passed' | 'failed' | 'skipped';
  details: string;
  nextAction?: string;
}

export interface ExecutionAdaptation {
  timestamp: Date;
  trigger: string;
  originalPlan: string;
  adaptedPlan: string;
  reason: string;
  success: boolean;
}

export interface ResourceUsage {
  peak: ResourceRequirements;
  average: ResourceRequirements;
  total: ResourceRequirements;
  efficiency: number; // 0-1
}

export interface ExecutionPerformance {
  speed: number; // vs estimated
  quality: number; // 0-1
  reliability: number; // 0-1
  adaptability: number; // 0-1
  overall: number; // 0-1
}

export interface DetailedLog extends ExecutionLog {
  // Enhanced logging
  source: string;
  category: 'progress' | 'error' | 'warning' | 'info' | 'debug' | 'performance';
  correlationId?: string;
  context?: { [key: string]: any };
  stackTrace?: string;
  recommendation?: string;
}

export interface ExecutionMetrics {
  throughput: number; // tasks per hour
  latency: number; // average task completion time
  successRate: number; // 0-1
  efficiency: number; // 0-1
  quality: number; // 0-1
  reliability: number; // 0-1
}

// Enhanced simulation state
export interface AdvancedSimulationState extends SimulationState {
  // Enhanced state properties
  mode: 'development' | 'production' | 'testing' | 'debug';
  environment: SimulationEnvironment;
  performance: SimulationPerformance;
  health: SimulationHealth;
  configuration: SimulationConfiguration;
  adaptiveParameters: AdaptiveParameters;
  learningMetrics: LearningMetrics;
  executionMetrics: ExecutionMetrics;
}

export interface SimulationEnvironment {
  version: string;
  capabilities: string[];
  limitations: string[];
  dependencies: { [key: string]: string };
  configuration: { [key: string]: any };
  health: EnvironmentHealth;
}

export interface EnvironmentHealth {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkLatency: number;
  serviceStatus: { [service: string]: 'healthy' | 'degraded' | 'unhealthy' };
}

export interface SimulationPerformance {
  throughput: number;
  latency: number;
  successRate: number;
  efficiency: number;
  learningRate: number;
  adaptationSpeed: number;
  resourceUtilization: number;
}

export interface SimulationHealth {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'critical';
  components: { [component: string]: ComponentHealth };
  alerts: Alert[];
  uptime: number; // milliseconds
  lastCheck: Date;
}

export interface ComponentHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  metrics: { [metric: string]: number };
  lastCheck: Date;
  issues: string[];
}

export interface Alert {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  resolved: boolean;
}

export interface SimulationConfiguration {
  execution: ExecutionConfig;
  learning: LearningConfig;
  adaptation: AdaptationConfig;
  monitoring: MonitoringConfig;
  optimization: OptimizationConfig;
}

export interface ExecutionConfig {
  maxConcurrency: number;
  timeoutMs: number;
  retryAttempts: number;
  batchSize: number;
  parallelExecution: boolean;
  resourceLimits: ResourceRequirements;
}

export interface LearningConfig {
  enabled: boolean;
  confidenceThreshold: number;
  retentionDays: number;
  adaptationRate: number;
  patternMatching: boolean;
  predictiveLearning: boolean;
}

export interface AdaptationConfig {
  enabled: boolean;
  adaptationThreshold: number;
  maxAdaptations: number;
  rollbackEnabled: boolean;
  safetyChecks: boolean;
}

export interface MonitoringConfig {
  enabled: boolean;
  interval: number; // milliseconds
  detailed: boolean;
  alerts: boolean;
  exportData: boolean;
}

export interface OptimizationConfig {
  enabled: boolean;
  targetMetrics: string[];
  optimizationInterval: number;
  autoOptimization: boolean;
  performanceThreshold: number;
}

export interface LearningMetrics {
  insightsGenerated: number;
  patternsIdentified: number;
  adaptationsApplied: number;
  successRate: number;
  learningVelocity: number;
  knowledgeRetention: number;
}

// Service interfaces for dependency injection
export interface ServiceContainer {
  babyagiEngine: BabyAGIEngine;
  openRouterService: EnhancedOpenRouterService | null;
  taskExecutionEngine: TaskExecutionEngine;
  learningSystem: LearningSystem;
  simulationManager: SimulationManager;
}

export interface ServiceConfig {
  [serviceName: string]: {
    enabled: boolean;
    config: any;
    dependencies: string[];
  };
}

// API interfaces
export interface APIRequest<T = any> {
  id: string;
  type: string;
  data: T;
  timestamp: Date;
  priority: 'low' | 'normal' | 'high' | 'critical';
  timeout?: number;
  retries?: number;
  callback?: string;
}

export interface APIResponse<T = any> {
  id: string;
  success: boolean;
  data?: T;
  error?: APIError;
  timestamp: Date;
  duration: number; // milliseconds
}

export interface APIError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  requestId?: string;
}

// Event system types
export interface SimulationEvent {
  type: string;
  source: string;
  timestamp: Date;
  data: any;
  correlationId?: string;
  metadata?: { [key: string]: any };
}

export interface EventHandler {
  eventType: string;
  handler: (event: SimulationEvent) => void | Promise<void>;
  priority: number;
  filters?: { [key: string]: any };
}

// Configuration types
export interface SimulationConfiguration {
  objectives: ObjectiveConfig[];
  execution: ExecutionConfig;
  learning: LearningConfig;
  adaptation: AdaptationConfig;
  monitoring: MonitoringConfig;
  optimization: OptimizationConfig;
}

export interface ObjectiveConfig {
  id: string;
  type: string;
  parameters: { [key: string]: any };
  constraints: string[];
  successCriteria: string[];
  priority: number;
}

// Utility types
export type SimulationMode = 'development' | 'production' | 'testing' | 'debug';
export type LearningMode = 'passive' | 'active' | 'adaptive' | 'predictive';
export type ExecutionStrategy = 'sequential' | 'parallel' | 'adaptive' | 'ai_guided';
export type AdaptationTrigger = 'performance' | 'error' | 'time' | 'complexity' | 'manual';

// Type guards
export function isAdvancedTask(task: Task): task is AdvancedTask {
  return 'executionStrategy' in task || 'aiGenerated' in task;
}

export function isAdvancedObjective(objective: Objective): objective is AdvancedObjective {
  return 'domain' in objective || 'businessValue' in objective;
}

export function isAdvancedLearningInsight(insight: LearningInsight): insight is AdvancedLearningInsight {
  return 'evidence' in insight || 'patterns' in insight;
}

export function isAdvancedAgentMemory(memory: AgentMemory): memory is AdvancedAgentMemory {
  return 'tags' in memory || 'strength' in memory;
}

export function isAdvancedTaskExecution(execution: TaskExecution): execution is AdvancedTaskExecution {
  return 'executionId' in execution || 'strategy' in execution;
}

// Re-export all original types
export {
  Objective,
  Task,
  LearningInsight,
  AgentMemory,
  TaskExecution,
  SimulationState,
  SimulationStatistics,
  AppSettings,
  OpenRouterConfig,
  OpenRouterModel,
  OpenRouterResponse,
  APIKeyValidationResult
};

// Export enhanced engines (these would be the actual classes)
export { BabyAGIEngine } from './babyagiEngine';
export { EnhancedOpenRouterService } from './openRouterService';
export { TaskExecutionEngine } from './taskExecutionEngine';
export { LearningSystem } from './learningSystem';
export { SimulationManager } from './simulationManager';

// Export constants and utilities
export const SIMULATION_CONSTANTS = {
  VERSION: '2.0.0',
  MIN_CONFIDENCE_THRESHOLD: 0.6,
  MAX_CONCURRENT_TASKS: 3,
  DEFAULT_TIMEOUT: 300000, // 5 minutes
  LEARNING_RETENTION_DAYS: 30,
  ADAPTATION_THRESHOLD: 0.7,
  HEALTH_CHECK_INTERVAL: 30000, // 30 seconds
  ITERATION_DELAY: 2000, // 2 seconds
  PERFORMANCE_UPDATE_INTERVAL: 5000, // 5 seconds
} as const;

export const SIMULATION_MODES = {
  DEVELOPMENT: 'development' as const,
  PRODUCTION: 'production' as const,
  TESTING: 'testing' as const,
  DEBUG: 'debug' as const,
} as const;

export const LEARNING_MODES = {
  PASSIVE: 'passive' as const,
  ACTIVE: 'active' as const,
  ADAPTIVE: 'adaptive' as const,
  PREDICTIVE: 'predictive' as const,
} as const;

// Type helpers
export type WithId<T> = T & { id: string };
export type WithTimestamp<T> = T & { createdAt: Date; updatedAt?: Date };
export type WithStatus<T extends string> = T | 'pending' | 'in-progress' | 'completed' | 'failed';
export type WithPriority<T extends number> = T & { priority: number };

// Validation schemas (simplified)
export interface ValidationSchema {
  validate: (data: any) => boolean;
  sanitize: (data: any) => any;
  errors: string[];
}

// Common validation schemas
export const TASK_VALIDATION: ValidationSchema = {
  validate: (task: any) => {
    return task &&
           typeof task.title === 'string' &&
           typeof task.complexity === 'number' &&
           task.complexity >= 1 &&
           task.complexity <= 10;
  },
  sanitize: (task: any) => {
    return {
      ...task,
      title: String(task.title).trim(),
      complexity: Math.max(1, Math.min(10, Number(task.complexity))),
      priority: Math.max(1, Math.min(10, Number(task.priority || 5)))
    };
  },
  errors: []
};

export const OBJECTIVE_VALIDATION: ValidationSchema = {
  validate: (objective: any) => {
    return objective &&
           typeof objective.title === 'string' &&
           typeof objective.description === 'string' &&
           typeof objective.complexity === 'number';
  },
  sanitize: (objective: any) => {
    return {
      ...objective,
      title: String(objective.title).trim(),
      description: String(objective.description).trim(),
      complexity: Math.max(1, Math.min(10, Number(objective.complexity)))
    };
  },
  errors: []
};

// Performance benchmarks
export interface PerformanceBenchmark {
  name: string;
  category: string;
  target: number;
  current: number;
  unit: string;
  trend: 'improving' | 'stable' | 'declining';
  lastUpdate: Date;
}

export const DEFAULT_BENCHMARKS: PerformanceBenchmark[] = [
  {
    name: 'Task Success Rate',
    category: 'execution',
    target: 0.85,
    current: 0.8,
    unit: 'percentage',
    trend: 'stable',
    lastUpdate: new Date()
  },
  {
    name: 'Execution Efficiency',
    category: 'performance',
    target: 0.9,
    current: 0.85,
    unit: 'ratio',
    trend: 'improving',
    lastUpdate: new Date()
  },
  {
    name: 'Learning Rate',
    category: 'learning',
    target: 0.7,
    current: 0.6,
    unit: 'rate',
    trend: 'improving',
    lastUpdate: new Date()
  }
];