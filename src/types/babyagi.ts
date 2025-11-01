export interface Objective {
  id: string;
  title: string;
  description: string;
  complexity: number; // 1-10 scale
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  subtasks: Task[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  objectiveId: string;
  priority: number; // 1-10 scale
  complexity: number; // 1-10 scale
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  dependencies: string[]; // Task IDs this task depends on
  estimatedDuration: number; // in minutes
  actualDuration?: number; // in minutes
  progress: number; // 0-100
  results?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  attempts: number;
  learning?: LearningInsight;
}

export interface LearningInsight {
  category: 'strategy' | 'timing' | 'dependencies' | 'priority';
  insight: string;
  confidence: number; // 0-1
  appliedToNextTasks: boolean;
}

export interface AgentMemory {
  id: string;
  type: 'success' | 'failure' | 'learning' | 'strategy';
  content: string;
  taskId?: string;
  objectiveId?: string;
  timestamp: Date;
  confidence: number; // 0-1
  applicability: string[]; // Categories this memory applies to
}

export interface TaskExecution {
  taskId: string;
  startTime: Date;
  endTime?: Date;
  progress: number; // 0-100
  currentStep: string;
  logs: ExecutionLog[];
}

export interface ExecutionLog {
  timestamp: Date;
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
  details?: any;
}

export interface SimulationState {
  isRunning: boolean;
  currentIteration: number;
  totalIterations: number;
  currentObjective?: Objective;
  currentTask?: Task;
  executionQueue: TaskExecution[];
  agentMemory: AgentMemory[];
  statistics: SimulationStatistics;
  startTime?: Date;
}

export interface SimulationStatistics {
  totalObjectives: number;
  completedObjectives: number;
  failedObjectives: number;
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  averageCompletionTime: number;
  learningInsights: number;
  strategyImprovements: number;
  efficiencyScore: number; // 0-100
}

export interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  updateAvailable: boolean;
}

export interface AppSettings {
  simulationSpeed: 'slow' | 'normal' | 'fast';
  autoExecute: boolean;
  showDetailedLogs: boolean;
  enableAnimations: boolean;
  maxIterations: number;
  useOpenRouter: boolean;
  openRouterApiKey?: string;
  selectedModel: string;
  fallbackToSimulation: boolean;
}

export interface OpenRouterConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

export interface OpenRouterModel {
  id: string;
  name: string;
  description: string;
  pricing: {
    prompt: string;
    completion: string;
  };
  context_length: number;
  architecture: {
    modality: string;
    tokenizer: string;
    instruct_type?: string;
  };
  top_provider: {
    max_completion_tokens?: number;
    is_moderated: boolean;
  };
  per_request_limits?: {
    prompt_tokens: string;
    completion_tokens: string;
  };
}

export interface OpenRouterResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
}

export interface APIKeyValidationResult {
  isValid: boolean;
  error?: string;
  models?: OpenRouterModel[];
}

// =============================================================================
// UI AND NOTIFICATION TYPES
// =============================================================================

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  duration?: number;
  persistent?: boolean;
  actions?: NotificationAction[];
  data?: any;
}

export interface NotificationAction {
  label: string;
  action: () => void;
  variant?: 'primary' | 'secondary';
}

export interface ExecutionLog {
  timestamp: Date;
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
  details?: any;
  category?: string;
  taskId?: string;
  objectiveId?: string;
}

// =============================================================================
// FORM AND VALIDATION TYPES
// =============================================================================

export interface FormField {
  name: string;
  value: any;
  touched: boolean;
  valid: boolean;
  error?: string;
}

export interface FormState {
  isDirty: boolean;
  isValid: boolean;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
}

// =============================================================================
// PANEL AND LAYOUT TYPES
// =============================================================================

export interface PanelState {
  open: boolean;
  size: number;
  position: 'left' | 'right' | 'top' | 'bottom';
  resizable: boolean;
}

export interface LayoutConfig {
  sidebar: {
    open: boolean;
    collapsed: boolean;
    width: number;
  };
  panels: Record<string, PanelState>;
}

// =============================================================================
// SEARCH AND FILTER TYPES
// =============================================================================

export interface SearchFilter {
  searchQuery: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  filters: Record<string, any>;
}

export interface GlobalSearchResult {
  id: string;
  type: 'objective' | 'task' | 'result' | 'memory';
  title: string;
  description: string;
  relevance: number;
  data: any;
}

// =============================================================================
// PERFORMANCE AND ANALYTICS TYPES
// =============================================================================

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  trend: 'up' | 'down' | 'stable';
}

export interface AnalyticsReport {
  summary: string;
  metrics: Record<string, number>;
  trends: Array<{
    metric: string;
    change: number;
    direction: 'up' | 'down';
  }>;
  recommendations: string[];
  generatedAt: Date;
  timeframe: string;
}

// =============================================================================
// STRATEGY IMPROVEMENT TYPES
// =============================================================================

export interface StrategyImprovement {
  id: string;
  category: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  applied: boolean;
  appliedAt?: Date;
  effectiveness?: number; // 0-100
}

// =============================================================================
// TASK EXECUTION TYPES
// =============================================================================

export interface TaskExecutionState {
  isExecuting: boolean;
  currentStep: string;
  progress: number;
  startTime?: Date;
  logs: ExecutionLog[];
}

// =============================================================================
// USER PREFERENCE TYPES
// =============================================================================

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  dateFormat: string;
  numberFormat: string;
  confirmActions: boolean;
  showTooltips: boolean;
  autoRefresh: boolean;
  refreshInterval: number;
  keyboardShortcuts: boolean;
}

export interface NotificationPreferences {
  enabled: boolean;
  taskCompletion: boolean;
  objectiveCompletion: boolean;
  errors: boolean;
  learningInsights: boolean;
  soundEnabled: boolean;
  desktopNotifications: boolean;
}

export interface PrivacySettings {
  shareAnalytics: boolean;
  storeExecutionData: boolean;
  enableTelemetry: boolean;
  dataRetentionDays: number;
}

export interface PerformanceSettings {
  maxConcurrentTasks: number;
  autoSaveInterval: number;
  enableCaching: boolean;
  cacheSize: number;
  maxRetries: number;
  timeoutDuration: number;
}

// =============================================================================
// ACCESSIBILITY TYPES
// =============================================================================

export interface AccessibilitySettings {
  highContrast: boolean;
  reducedMotion: boolean;
  screenReaderOptimized: boolean;
  keyboardNavigation: boolean;
}

// =============================================================================
// DRAG AND DROP TYPES
// =============================================================================

export interface DragState {
  isDragging: boolean;
  draggedItem: any;
  dropTarget: string | null;
  dragOffset: { x: number; y: number };
}

// =============================================================================
// VIRTUALIZATION TYPES
// =============================================================================

export interface VirtualizationConfig {
  enabled: boolean;
  itemHeight: number;
  overscan: number;
}

// =============================================================================
// CHART AND VISUALIZATION TYPES
// =============================================================================

export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'area' | 'scatter';
  data: any;
  options: any;
  timestamp: Date;
}

// =============================================================================
// ERROR BOUNDARY TYPES
// =============================================================================

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
  retryAction?: () => void;
}

// =============================================================================
// BREADCRUMB TYPES
// =============================================================================

export interface Breadcrumb {
  label: string;
  view: string;
  id?: string;
}

// =============================================================================
// DIALOG AND MODAL TYPES
// =============================================================================

export interface Dialog {
  id: string;
  component: string;
  props?: any;
  persistent?: boolean;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type PickPartial<T, K extends keyof T> = Pick<T, K> & Partial<Omit<T, K>>;
