/**
 * Service Interfaces for BabyAGI Service Layer
 * Defines common interfaces and types used across all services
 */

// Basic service health interfaces
export interface ServiceHealth {
  serviceName: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'critical';
  timestamp: Date;
  uptime?: number;
  metrics?: ServiceMetrics;
  error?: string;
  note?: string;
}

export interface ServiceMetrics {
  performance: {
    cpu: number;
    memory: number;
    responseTime: number;
    throughput: number;
  };
  reliability: {
    successRate: number;
    errorRate: number;
    availability: number;
  };
  resource: {
    memoryUsage: number;
    diskUsage: number;
    networkUsage: number;
  };
  custom?: { [key: string]: number };
}

// Service event system
export interface ServiceEvent {
  id: string;
  type: string;
  source: string;
  timestamp: Date;
  data: any;
  correlationId?: string;
  metadata?: {
    [key: string]: any;
  };
}

export interface EventSubscription {
  id: string;
  eventType: string;
  handler: (event: ServiceEvent) => void | Promise<void>;
  filter?: EventFilter;
  priority: number;
  active: boolean;
}

export interface EventFilter {
  source?: string;
  correlationId?: string;
  metadata?: { [key: string]: any };
}

// Service configuration interfaces
export interface ServiceConfiguration {
  name: string;
  version: string;
  enabled: boolean;
  dependencies: string[];
  configuration: { [key: string]: any };
  environment: ServiceEnvironment;
  security: ServiceSecurity;
  logging: ServiceLogging;
}

export interface ServiceEnvironment {
  type: 'development' | 'testing' | 'staging' | 'production';
  variables: { [key: string]: string };
  resources: {
    cpu: number;
    memory: number;
    disk: number;
  };
  network: {
    timeout: number;
    retries: number;
    backoff: number;
  };
}

export interface ServiceSecurity {
  authentication: {
    enabled: boolean;
    method: 'api_key' | 'oauth' | 'jwt' | 'basic';
    credentials?: any;
  };
  authorization: {
    enabled: boolean;
    roles: string[];
    permissions: string[];
  };
  encryption: {
    enabled: boolean;
    algorithm: string;
    keyRotation: boolean;
  };
}

export interface ServiceLogging {
  level: 'debug' | 'info' | 'warn' | 'error';
  format: 'json' | 'text' | 'structured';
  destinations: LogDestination[];
  sampling: number; // 0-1, percentage of logs to keep
  retention: {
    enabled: boolean;
    period: number; // days
    archive: boolean;
  };
}

export interface LogDestination {
  type: 'console' | 'file' | 'database' | 'external';
  config: {
    [key: string]: any;
  };
  enabled: boolean;
}

// Service lifecycle interfaces
export interface ServiceLifecycle {
  initialize(): Promise<void>;
  start(): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  stop(): Promise<void>;
  shutdown(): Promise<void>;
  reset(): Promise<void>;
}

export interface LifecycleState {
  current: 'uninitialized' | 'initializing' | 'initialized' | 'starting' | 'running' | 'paused' | 'stopping' | 'stopped' | 'error';
  previous?: string;
  timestamp: Date;
  reason?: string;
}

// Service communication interfaces
export interface ServiceRequest {
  id: string;
  type: string;
  source: string;
  target: string;
  timestamp: Date;
  timeout?: number;
  priority: 'low' | 'normal' | 'high' | 'critical';
  data: any;
  metadata?: { [key: string]: any };
}

export interface ServiceResponse {
  id: string;
  requestId: string;
  success: boolean;
  timestamp: Date;
  duration: number;
  data?: any;
  error?: ServiceError;
  metadata?: { [key: string]: any };
}

export interface ServiceError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  source: string;
  recoverable: boolean;
  context?: { [key: string]: any };
}

// Service registry interfaces
export interface ServiceRegistry {
  register(service: RegisteredService): Promise<void>;
  unregister(serviceName: string): Promise<void>;
  discover(query: ServiceQuery): Promise<RegisteredService[]>;
  getHealth(serviceName: string): Promise<ServiceHealth>;
  getMetrics(serviceName: string): Promise<ServiceMetrics>;
}

export interface RegisteredService {
  name: string;
  version: string;
  type: string;
  endpoint?: string;
  metadata: { [key: string]: any };
  capabilities: string[];
  dependencies: string[];
  health: ServiceHealth;
  registrationTime: Date;
  lastSeen: Date;
}

export interface ServiceQuery {
  name?: string;
  type?: string;
  capabilities?: string[];
  metadata?: { [key: string]: any };
  limit?: number;
  offset?: number;
}

// Service discovery interfaces
export interface ServiceDiscovery {
  findServices(criteria: DiscoveryCriteria): Promise<ServiceInstance[]>;
  registerService(instance: ServiceInstance): Promise<void>;
  deregisterService(instanceId: string): Promise<void>;
  monitorService(instanceId: string, callback: (health: ServiceHealth) => void): void;
}

export interface ServiceInstance {
  id: string;
  name: string;
  address: string;
  port: number;
  protocol: 'http' | 'https' | 'grpc' | 'websocket';
  metadata: { [key: string]: any };
  healthCheck: HealthCheckConfig;
  tags: string[];
  version: string;
}

export interface DiscoveryCriteria {
  name?: string;
  tags?: string[];
  version?: string;
  metadata?: { [key: string]: any };
  healthStatus?: 'healthy' | 'degraded' | 'unhealthy';
  limit?: number;
}

export interface HealthCheckConfig {
  path?: string;
  interval: number; // seconds
  timeout: number; // seconds
  retries: number;
  expectedStatus?: number;
  expectedResponse?: any;
}

// Service monitoring interfaces
export interface ServiceMonitor {
  startMonitoring(): Promise<void>;
  stopMonitoring(): Promise<void>;
  getMetrics(): Promise<MonitoringMetrics>;
  alert(config: AlertConfig): void;
}

export interface MonitoringMetrics {
  services: {
    [serviceName: string]: {
      status: ServiceHealth['status'];
      uptime: number;
      requests: number;
      errors: number;
      responseTime: number;
    };
  };
  system: {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
  };
  timestamp: Date;
}

export interface AlertConfig {
  id: string;
  service?: string;
  metric: string;
  condition: 'gt' | 'lt' | 'eq' | 'ne';
  threshold: number;
  duration: number; // seconds
  action: 'log' | 'email' | 'webhook' | 'restart';
  config: any;
  enabled: boolean;
}

// Service proxy interfaces
export interface ServiceProxy {
  invoke<T = any>(request: ServiceRequest): Promise<ServiceResponse<T>>;
  stream(request: ServiceRequest): AsyncIterableIterator<ServiceEvent>;
  getCapabilities(): string[];
  getHealth(): Promise<ServiceHealth>;
}

export interface ProxyConfig {
  timeout: number;
  retries: number;
  circuitBreaker: CircuitBreakerConfig;
  loadBalancer: LoadBalancerConfig;
  rateLimiter: RateLimiterConfig;
}

export interface CircuitBreakerConfig {
  enabled: boolean;
  failureThreshold: number;
  resetTimeout: number;
  halfOpenMaxCalls: number;
}

export interface LoadBalancerConfig {
  strategy: 'round_robin' | 'random' | 'least_connections' | 'weighted';
  healthCheck: boolean;
  failover: boolean;
}

export interface RateLimiterConfig {
  enabled: boolean;
  requestsPerSecond: number;
  burstSize: number;
  algorithm: 'token_bucket' | 'sliding_window' | 'fixed_window';
}

// Service factory interfaces
export interface ServiceFactory {
  create(config: ServiceConfiguration): Promise<any>;
  validate(config: ServiceConfiguration): ValidationResult;
  destroy(service: any): Promise<void>;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  code: string;
  message: string;
  details?: any;
}

export interface ValidationWarning {
  field: string;
  code: string;
  message: string;
  suggestion?: string;
}

// Service metadata interfaces
export interface ServiceMetadata {
  name: string;
  version: string;
  description: string;
  author: string;
  license: string;
  homepage?: string;
  repository?: string;
  keywords: string[];
  dependencies: ServiceDependency[];
  peerDependencies: ServiceDependency[];
  engines: { [engine: string]: string };
  scripts: { [script: string]: string };
}

export interface ServiceDependency {
  name: string;
  version: string;
  optional: boolean;
  peer: boolean;
}

// Service testing interfaces
export interface ServiceTest {
  setup(): Promise<void>;
  teardown(): Promise<void>;
  run(): Promise<TestResult>;
}

export interface TestResult {
  success: boolean;
  duration: number;
  tests: TestCaseResult[];
  coverage?: TestCoverage;
  metrics: TestMetrics;
}

export interface TestCaseResult {
  name: string;
  success: boolean;
  duration: number;
  error?: string;
  assertions: AssertionResult[];
}

export interface AssertionResult {
  expected: any;
  actual: any;
  passed: boolean;
  message?: string;
}

export interface TestCoverage {
  lines: number;
  branches: number;
  functions: number;
  statements: number;
}

export interface TestMetrics {
  assertions: number;
  passed: number;
  failed: number;
  skipped: number;
}

// Service documentation interfaces
export interface ServiceDocumentation {
  api: APIDocumentation;
  examples: Example[];
  deployment: DeploymentGuide;
  troubleshooting: TroubleshootingGuide;
}

export interface APIDocumentation {
  endpoints: EndpointDocumentation[];
  schemas: SchemaDocumentation[];
  authentication: AuthDocumentation;
}

export interface EndpointDocumentation {
  method: string;
  path: string;
  description: string;
  parameters: ParameterDocumentation[];
  requestBody?: BodyDocumentation;
  responses: ResponseDocumentation[];
}

export interface ParameterDocumentation {
  name: string;
  type: string;
  required: boolean;
  description: string;
  example?: any;
}

export interface BodyDocumentation {
  contentType: string;
  schema: string;
  example: any;
  description: string;
}

export interface ResponseDocumentation {
  statusCode: number;
  description: string;
  contentType: string;
  schema: string;
  example: any;
}

export interface SchemaDocumentation {
  name: string;
  type: string;
  properties: { [key: string]: any };
  required: string[];
  description: string;
}

export interface AuthDocumentation {
  type: string;
  description: string;
  parameters: ParameterDocumentation[];
  examples: any[];
}

export interface Example {
  name: string;
  description: string;
  code: string;
  language: string;
  output?: any;
}

export interface DeploymentGuide {
  requirements: string[];
  installation: InstallationStep[];
  configuration: ConfigurationOption[];
  verification: VerificationStep[];
}

export interface InstallationStep {
  order: number;
  description: string;
  command?: string;
  files?: string[];
}

export interface ConfigurationOption {
  name: string;
  type: string;
  default: any;
  description: string;
  required: boolean;
}

export interface VerificationStep {
  order: number;
  description: string;
  command?: string;
  expectedOutput?: string;
}

export interface TroubleshootingGuide {
  commonIssues: CommonIssue[];
  diagnostics: DiagnosticStep[];
  support: SupportInfo;
}

export interface CommonIssue {
  title: string;
  description: string;
  symptoms: string[];
  cause: string;
  resolution: string[];
  prevention: string[];
}

export interface DiagnosticStep {
  order: number;
  description: string;
  command?: string;
  expectedResult: string;
  troubleshooting?: string;
}

export interface SupportInfo {
  documentation: string[];
  community: string[];
  commercial: string;
  issues: string;
}

// Export type guards
export function isServiceHealth(obj: any): obj is ServiceHealth {
  return obj && 
         typeof obj.serviceName === 'string' &&
         typeof obj.status === 'string' &&
         obj.timestamp instanceof Date;
}

export function isServiceEvent(obj: any): obj is ServiceEvent {
  return obj &&
         typeof obj.id === 'string' &&
         typeof obj.type === 'string' &&
         obj.timestamp instanceof Date;
}

export function isServiceRequest(obj: any): obj is ServiceRequest {
  return obj &&
         typeof obj.id === 'string' &&
         typeof obj.type === 'string' &&
         typeof obj.source === 'string' &&
         typeof obj.target === 'string' &&
         obj.timestamp instanceof Date;
}

export function isServiceResponse(obj: any): obj is ServiceResponse {
  return obj &&
         typeof obj.id === 'string' &&
         typeof obj.requestId === 'string' &&
         typeof obj.success === 'boolean' &&
         obj.timestamp instanceof Date &&
         typeof obj.duration === 'number';
}