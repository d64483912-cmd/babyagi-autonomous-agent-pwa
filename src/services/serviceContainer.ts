/**
 * Service Container for Dependency Injection and Service Management
 * Provides a centralized container for managing BabyAGI service dependencies
 */

import { ServiceFactory } from './serviceFactory';
import { ServiceHealth } from './serviceInterfaces';

export interface ServiceRegistration {
  name: string;
  factory: () => Promise<any>;
  config?: any;
  dependencies?: string[];
  singleton?: boolean;
  lazy?: boolean;
}

export interface ContainerConfig {
  autoWire: boolean;
  cacheInstances: boolean;
  validateDependencies: boolean;
  gracefulShutdown: boolean;
  healthCheckInterval: number;
}

export class ServiceContainer {
  private services: Map<string, any> = new Map();
  private registrations: Map<string, ServiceRegistration> = new Map();
  private config: ContainerConfig;
  private healthChecks: Map<string, NodeJS.Timeout> = new Map();
  private initialized = false;
  private startupTime = Date.now();

  constructor(config: Partial<ContainerConfig> = {}) {
    this.config = {
      autoWire: true,
      cacheInstances: true,
      validateDependencies: true,
      gracefulShutdown: true,
      healthCheckInterval: 30000, // 30 seconds
      ...config
    };

    this.initializeDefaultRegistrations();
  }

  /**
   * Initialize default service registrations
   */
  private initializeDefaultRegistrations(): void {
    // Register core services
    this.register('babyagiEngine', async () => {
      const { BabyAGIEngine } = await import('./babyagiEngine');
      return BabyAGIEngine.getInstance();
    });

    this.register('openRouterService', async () => {
      const { EnhancedOpenRouterService } = await import('./openRouterService');
      return null; // Optional service
    }, { dependencies: [] });

    this.register('taskExecutionEngine', async () => {
      const { TaskExecutionEngine } = await import('./taskExecutionEngine');
      const { default: appSettings } = await import('../types/babyagi');
      return new TaskExecutionEngine(appSettings);
    });

    this.register('learningSystem', async () => {
      const { LearningSystem } = await import('./learningSystem');
      return new LearningSystem();
    });

    this.register('simulationManager', async () => {
      const { SimulationManager } = await import('./simulationManager');
      const { default: appSettings } = await import('../types/babyagi');
      return new SimulationManager(appSettings);
    });
  }

  /**
   * Register a service in the container
   */
  register(
    name: string, 
    factory: () => Promise<any>, 
    options: Partial<ServiceRegistration> = {}
  ): void {
    const registration: ServiceRegistration = {
      name,
      factory,
      singleton: true,
      lazy: true,
      ...options
    };

    this.registrations.set(name, registration);
  }

  /**
   * Get a service from the container
   */
  async get<T = any>(name: string): Promise<T> {
    // Check if service is already cached
    if (this.services.has(name)) {
      return this.services.get(name);
    }

    // Get service registration
    const registration = this.registrations.get(name);
    if (!registration) {
      throw new Error(`Service ${name} is not registered`);
    }

    // Check dependencies
    if (this.config.validateDependencies && registration.dependencies) {
      await this.validateDependencies(registration.dependencies);
    }

    try {
      // Create service instance
      const service = await registration.factory();
      
      // Auto-wire dependencies if enabled
      if (this.config.autoWire && typeof service.updateSettings === 'function') {
        this.autoWireService(service);
      }

      // Cache service if singleton
      if (registration.singleton && this.config.cacheInstances) {
        this.services.set(name, service);
      }

      return service;
    } catch (error) {
      console.error(`Failed to create service ${name}:`, error);
      throw error;
    }
  }

  /**
   * Get service without creating (if already exists)
   */
  getExisting<T = any>(name: string): T | null {
    return this.services.get(name) || null;
  }

  /**
   * Remove service from container
   */
  remove(name: string): boolean {
    const removed = this.services.delete(name);
    
    // Stop health check if running
    if (this.healthChecks.has(name)) {
      clearInterval(this.healthChecks.get(name)!);
      this.healthChecks.delete(name);
    }
    
    return removed;
  }

  /**
   * Check if service is registered
   */
  has(name: string): boolean {
    return this.registrations.has(name);
  }

  /**
   * Get all registered service names
   */
  getServiceNames(): string[] {
    return Array.from(this.registrations.keys());
  }

  /**
   * Initialize container and all eager services
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // Initialize eager services
    const eagerServices = Array.from(this.registrations.entries())
      .filter(([, registration]) => !registration.lazy);

    await Promise.all(
      eagerServices.map(async ([name]) => {
        try {
          await this.get(name);
        } catch (error) {
          console.warn(`Failed to initialize service ${name}:`, error);
        }
      })
    );

    // Start health checks
    this.startHealthChecks();

    this.initialized = true;
    this.emit('container:initialized');
  }

  /**
   * Shutdown container gracefully
   */
  async shutdown(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    // Stop health checks
    this.stopHealthChecks();

    // Shutdown services in reverse dependency order
    const serviceNames = Array.from(this.services.keys()).reverse();
    
    await Promise.all(
      serviceNames.map(async (name) => {
        try {
          const service = this.services.get(name);
          await this.shutdownService(service);
        } catch (error) {
          console.warn(`Error shutting down service ${name}:`, error);
        }
      })
    );

    // Clear all services
    this.services.clear();
    this.registrations.clear();
    this.initialized = false;

    this.emit('container:shutdown');
  }

  /**
   * Auto-wire service dependencies
   */
  private autoWireService(service: any): void {
    // Check for common dependency patterns
    if (service.updateSettings && this.has('babyagiEngine')) {
      service.babyagiEngine = this.getExisting('babyagiEngine');
    }
    
    if (service.updateSettings && this.has('learningSystem')) {
      service.learningSystem = this.getExisting('learningSystem');
    }
  }

  /**
   * Validate that all dependencies are registered and can be resolved
   */
  private async validateDependencies(dependencies: string[]): Promise<void> {
    for (const depName of dependencies) {
      if (!this.has(depName)) {
        throw new Error(`Dependency ${depName} is not registered`);
      }
      
      // Try to resolve dependency
      try {
        await this.get(depName);
      } catch (error) {
        throw new Error(`Cannot resolve dependency ${depName}: ${error.message}`);
      }
    }
  }

  /**
   * Start health checks for all services
   */
  private startHealthChecks(): void {
    if (this.config.healthCheckInterval <= 0) {
      return;
    }

    for (const serviceName of this.services.keys()) {
      const interval = setInterval(async () => {
        try {
          const service = this.services.get(serviceName);
          if (service && typeof service.getHealthStatus === 'function') {
            const health = service.getHealthStatus();
            if (!health.isHealthy) {
              this.emit('service:unhealthy', { serviceName, health });
            }
          }
        } catch (error) {
          this.emit('service:healthcheck:error', { serviceName, error });
        }
      }, this.config.healthCheckInterval);

      this.healthChecks.set(serviceName, interval);
    }
  }

  /**
   * Stop all health checks
   */
  private stopHealthChecks(): void {
    for (const interval of this.healthChecks.values()) {
      clearInterval(interval);
    }
    this.healthChecks.clear();
  }

  /**
   * Shutdown individual service
   */
  private async shutdownService(service: any): Promise<void> {
    const shutdownMethods = ['shutdown', 'stop', 'cleanup', 'dispose'];
    
    for (const method of shutdownMethods) {
      if (typeof service[method] === 'function') {
        try {
          await service[method]();
          break; // Use first available shutdown method
        } catch (error) {
          console.warn(`Error calling ${method} on service:`, error);
        }
      }
    }
  }

  /**
   * Get container health status
   */
  getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    uptime: number;
    services: number;
    healthyServices: number;
    lastCheck: Date;
  } {
    const now = Date.now();
    const uptime = now - this.startupTime;
    const totalServices = this.services.size;
    
    // This would need actual health checking logic
    const healthyServices = totalServices; // Placeholder
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (healthyServices < totalServices * 0.8) {
      status = 'unhealthy';
    } else if (healthyServices < totalServices) {
      status = 'degraded';
    }

    return {
      status,
      uptime,
      services: totalServices,
      healthyServices,
      lastCheck: new Date()
    };
  }

  /**
   * Get detailed service information
   */
  getServicesInfo(): Array<{
    name: string;
    status: 'initialized' | 'registered' | 'failed';
    healthy: boolean;
    dependencies: string[];
    singleton: boolean;
    lazy: boolean;
  }> {
    return Array.from(this.registrations.entries()).map(([name, registration]) => ({
      name,
      status: this.services.has(name) ? 'initialized' : 'registered',
      healthy: this.services.has(name),
      dependencies: registration.dependencies || [],
      singleton: registration.singleton || false,
      lazy: registration.lazy !== false
    }));
  }

  /**
   * Event system (simple implementation)
   */
  private eventHandlers: { [event: string]: Function[] } = {};

  on(event: string, handler: Function): void {
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = [];
    }
    this.eventHandlers[event].push(handler);
  }

  private emit(event: string, data?: any): void {
    const handlers = this.eventHandlers[event];
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Create child container
   */
  createChild(config?: Partial<ContainerConfig>): ServiceContainer {
    const child = new ServiceContainer({
      ...this.config,
      ...config
    });

    // Inherit some registrations (could be selective)
    for (const [name, registration] of this.registrations) {
      if (this.services.has(name)) {
        child.register(name, registration.factory, {
          config: registration.config,
          dependencies: registration.dependencies,
          singleton: registration.singleton,
          lazy: registration.lazy
        });
      }
    }

    return child;
  }

  /**
   * Clear all services (keep registrations)
   */
  clear(): void {
    this.services.clear();
    this.stopHealthChecks();
  }

  /**
   * Clear everything including registrations
   */
  reset(): void {
    this.clear();
    this.registrations.clear();
    this.initializeDefaultRegistrations();
  }
}

// Singleton container instance
let globalContainer: ServiceContainer | null = null;

/**
 * Get global service container instance
 */
export function getGlobalContainer(): ServiceContainer {
  if (!globalContainer) {
    globalContainer = new ServiceContainer();
  }
  return globalContainer;
}

/**
 * Reset global container
 */
export function resetGlobalContainer(): void {
  globalContainer = null;
}

/**
 * Container utilities
 */
export const ContainerUtils = {
  /**
   * Create container with specific configuration
   */
  createConfigured(config: Partial<ContainerConfig>): ServiceContainer {
    return new ServiceContainer(config);
  },

  /**
   * Create development container with debugging enabled
   */
  createDevelopment(): ServiceContainer {
    return new ServiceContainer({
      validateDependencies: true,
      gracefulShutdown: true,
      healthCheckInterval: 10000, // More frequent checks
      autoWire: true
    });
  },

  /**
   * Create production container optimized for performance
   */
  createProduction(): ServiceContainer {
    return new ServiceContainer({
      validateDependencies: false,
      gracefulShutdown: true,
      healthCheckInterval: 60000, // Less frequent checks
      autoWire: true
    });
  },

  /**
   * Create test container with mocks
   */
  createTest(): ServiceContainer {
    const container = new ServiceContainer({
      validateDependencies: false,
      gracefulShutdown: false,
      healthCheckInterval: 0 // No health checks
    });

    // Register mock services for testing
    container.register('mockAI', async () => ({
      generateTaskDecomposition: () => Promise.resolve(['Mock task 1', 'Mock task 2']),
      generateExecutionStrategy: () => Promise.resolve('Mock strategy'),
      generateLearningInsights: () => Promise.resolve('Mock insights')
    }));

    return container;
  },

  /**
   * Check if service supports health monitoring
   */
  supportsHealthCheck(service: any): boolean {
    return typeof service.getHealthStatus === 'function' ||
           typeof service.isHealthy === 'function' ||
           typeof service.health === 'function';
  }
};

export default ServiceContainer;