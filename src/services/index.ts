// Services Index - Central exports and service management
import { BabyAGIEngine } from './babyagiEngine';
import { DependencyInjector } from './dependencyInjector';
import { LearningSystem } from './learningSystem';
import { OpenRouterService } from './openRouterService';
import { ServiceContainer } from './serviceContainer';
import { ServiceFactory } from './serviceFactory';
import { SimulationManager } from './simulationManager';
import { TaskExecutionEngine } from './taskExecutionEngine';

export {
  BabyAGIEngine,
  DependencyInjector,
  LearningSystem,
  OpenRouterService,
  ServiceContainer,
  ServiceFactory,
  SimulationManager,
  TaskExecutionEngine
};

// Export types
export * from './serviceInterfaces';

/**
 * BabyAGI Service Manager - Central service coordination
 */
export class BabyAGIServiceManager {
  private static instance: BabyAGIServiceManager;
  private services = new Map<string, any>();
  private dependencyInjector: DependencyInjector;
  private serviceContainer: ServiceContainer;
  private isInitialized = false;

  private constructor() {
    this.dependencyInjector = new DependencyInjector();
    this.serviceContainer = new ServiceContainer();
    this.setupDefaultServices();
  }

  public static getInstance(): BabyAGIServiceManager {
    if (!BabyAGIServiceManager.instance) {
      BabyAGIServiceManager.instance = new BabyAGIServiceManager();
    }
    return BabyAGIServiceManager.instance;
  }

  /**
   * Setup default service registrations
   */
  private setupDefaultServices(): void {
    // Core services
    this.dependencyInjector.register('babyagiEngine', {
      target: BabyAGIEngine,
      singleton: true
    });

    this.dependencyInjector.register('learningSystem', {
      target: LearningSystem,
      singleton: true
    });

    this.dependencyInjector.register('taskExecutionEngine', {
      target: TaskExecutionEngine,
      singleton: true
    });

    this.dependencyInjector.register('simulationManager', {
      target: SimulationManager,
      singleton: true
    });

    // OpenRouter service is conditional based on configuration
  }

  /**
   * Initialize all services
   */
  public async initialize(config?: {
    useOpenRouter?: boolean;
    openRouterApiKey?: string;
    selectedModel?: string;
    simulationSpeed?: 'fast' | 'normal' | 'slow';
  }): Promise<void> {
    if (this.isInitialized) {
      console.warn('Services already initialized');
      return;
    }

    try {
      // Register OpenRouter service if configured
      if (config?.useOpenRouter && config.openRouterApiKey) {
        this.dependencyInjector.register('openRouterService', {
          target: OpenRouterService,
          singleton: true,
          factory: () => new OpenRouterService()
        });

        const openRouterService = this.getService('openRouterService');
        await openRouterService.initialize({
          apiKey: config.openRouterApiKey,
          model: config.selectedModel || 'qwen/qwen-2.5-7b-instruct'
        });
      }

      // Initialize core services
      const babyagiEngine = this.getService('babyagiEngine');
      await babyagiEngine.initialize(config);

      const learningSystem = this.getService('learningSystem');
      learningSystem.initialize();

      const taskExecutionEngine = this.getService('taskExecutionEngine');
      taskExecutionEngine.initialize();

      const simulationManager = this.getService('simulationManager');
      await simulationManager.initialize();

      this.isInitialized = true;
      console.log('BabyAGI Services initialized successfully');
    } catch (error) {
      console.error('Failed to initialize services:', error);
      throw error;
    }
  }

  /**
   * Get a service instance
   */
  public getService(name: string): any {
    if (!this.services.has(name)) {
      this.services.set(name, this.dependencyInjector.createInstance(name, {
        target: this.getServiceTarget(name),
        singleton: true
      }));
    }
    return this.services.get(name);
  }

  /**
   * Get service target class
   */
  private getServiceTarget(name: string): any {
    const serviceMap: Record<string, any> = {
      babyagiEngine: BabyAGIEngine,
      learningSystem: LearningSystem,
      taskExecutionEngine: TaskExecutionEngine,
      simulationManager: SimulationManager,
      openRouterService: OpenRouterService
    };
    return serviceMap[name];
  }

  /**
   * Check if service is registered
   */
  public hasService(name: string): boolean {
    return this.dependencyInjector.has(name);
  }

  /**
   * Get all service names
   */
  public getServiceNames(): string[] {
    return this.dependencyInjector.getRegisteredNames();
  }

  /**
   * Register a custom service
   */
  public registerService(name: string, factory: () => any, singleton = true): void {
    this.dependencyInjector.register(name, {
      factory,
      singleton,
      lazy: !singleton
    });
  }

  /**
   * Remove a service
   */
  public removeService(name: string): boolean {
    this.services.delete(name);
    return this.dependencyInjector.remove(name);
  }

  /**
   * Update service configuration
   */
  public updateService(name: string, updates: any): boolean {
    return this.dependencyInjector.update(name, updates);
  }

  /**
   * Get service health status
   */
  public async getServiceHealth(): Promise<Record<string, {
    status: 'healthy' | 'unhealthy' | 'degraded';
    lastCheck: Date;
    error?: string;
    uptime?: number;
  }>> {
    const health: Record<string, any> = {};
    const serviceNames = this.getServiceNames();

    for (const serviceName of serviceNames) {
      try {
        const service = this.getService(serviceName);
        const status = await this.checkServiceHealth(service, serviceName);
        health[serviceName] = status;
      } catch (error) {
        health[serviceName] = {
          status: 'unhealthy',
          lastCheck: new Date(),
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    return health;
  }

  /**
   * Check individual service health
   */
  private async checkServiceHealth(service: any, serviceName: string): Promise<{
    status: 'healthy' | 'unhealthy' | 'degraded';
    lastCheck: Date;
    error?: string;
    uptime?: number;
  }> {
    const lastCheck = new Date();

    try {
      // Check if service has health check method
      if (typeof service.getHealthStatus === 'function') {
        const healthStatus = service.getHealthStatus();
        return {
          status: healthStatus.isHealthy ? 'healthy' : 'unhealthy',
          lastCheck,
          error: healthStatus.error,
          uptime: healthStatus.uptime
        };
      }

      // Basic health check - try to access service methods
      if (service && typeof service === 'object') {
        return {
          status: 'healthy',
          lastCheck,
          uptime: Date.now() - (service.initializedAt?.getTime() || Date.now())
        };
      }

      return {
        status: 'unhealthy',
        lastCheck,
        error: 'Service not accessible'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        lastCheck,
        error: error instanceof Error ? error.message : 'Health check failed'
      };
    }
  }

  /**
   * Reset all services
   */
  public async reset(): Promise<void> {
    // Stop any running processes
    const babyagiEngine = this.getService('babyagiEngine');
    if (babyagiEngine.isRunning) {
      babyagiEngine.stopSimulation();
    }

    // Clear service instances
    this.services.clear();

    // Reset dependency injector
    this.dependencyInjector.clear();
    this.setupDefaultServices();

    this.isInitialized = false;
  }

  /**
   * Destroy all services
   */
  public destroy(): void {
    // Destroy service instances
    for (const [name, service] of this.services) {
      if (service && typeof service.destroy === 'function') {
        try {
          service.destroy();
        } catch (error) {
          console.error(`Error destroying service ${name}:`, error);
        }
      }
    }

    this.services.clear();
    this.dependencyInjector.destroy();
    this.serviceContainer.destroy();
    this.isInitialized = false;
  }

  /**
   * Get service statistics
   */
  public getStatistics(): {
    initialized: boolean;
    serviceCount: number;
    dependencyStats: any;
    healthSummary: {
      healthy: number;
      unhealthy: number;
      degraded: number;
    };
  } {
    const dependencyStats = this.dependencyInjector.getStatistics();
    
    return {
      initialized: this.isInitialized,
      serviceCount: this.services.size,
      dependencyStats,
      healthSummary: {
        healthy: 0,
        unhealthy: 0,
        degraded: 0
      }
    };
  }
}

// Export singleton instance
export const serviceManager = BabyAGIServiceManager.getInstance();

// Convenience functions for common operations
export const createSimulationEnvironment = async (config?: any) => {
  await serviceManager.initialize(config);
  return serviceManager.getService('babyagiEngine');
};

export const getBabyAGIEngine = () => {
  return serviceManager.getService('babyagiEngine');
};

export const getLearningSystem = () => {
  return serviceManager.getService('learningSystem');
};

export const getTaskExecutionEngine = () => {
  return serviceManager.getService('taskExecutionEngine');
};

export const getSimulationManager = () => {
  return serviceManager.getService('simulationManager');
};

export const getOpenRouterService = () => {
  return serviceManager.hasService('openRouterService') 
    ? serviceManager.getService('openRouterService')
    : null;
};

// Service presets for different environments
export const SERVICE_PRESETS = {
  DEVELOPMENT: {
    useOpenRouter: false,
    simulationSpeed: 'fast' as const,
    enableLogging: true
  },
  PRODUCTION: {
    useOpenRouter: true,
    simulationSpeed: 'normal' as const,
    enableLogging: false
  },
  TESTING: {
    useOpenRouter: false,
    simulationSpeed: 'fast' as const,
    enableLogging: true
  },
  DEBUG: {
    useOpenRouter: false,
    simulationSpeed: 'slow' as const,
    enableLogging: true
  }
};

// Default configurations
export const DEFAULT_CONFIGS = {
  SIMULATION: {
    maxIterations: 10,
    simulationSpeed: 'normal',
    autoExecute: false,
    showDetailedLogs: true,
    enableAnimations: true
  },
  OPENROUTER: {
    useOpenRouter: false,
    selectedModel: 'qwen/qwen-2.5-7b-instruct',
    fallbackToSimulation: true,
    maxRetries: 3,
    timeoutDuration: 30000
  },
  LEARNING: {
    enablePatternRecognition: true,
    storeExecutionData: true,
    adaptiveRecommendations: true,
    confidenceThreshold: 0.8
  }
};

export default {
  BabyAGIServiceManager,
  serviceManager,
  SERVICE_PRESETS,
  DEFAULT_CONFIGS,
  createSimulationEnvironment,
  getBabyAGIEngine,
  getLearningSystem,
  getTaskExecutionEngine,
  getSimulationManager,
  getOpenRouterService
};