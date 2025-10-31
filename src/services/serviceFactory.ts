import { ServiceConfig, ServiceHealth } from './serviceInterfaces';

/**
 * Service Factory for creating and managing BabyAGI services
 * Handles instantiation, configuration, and lifecycle management
 */
export class ServiceFactory {
  private static instances: Map<string, any> = new Map();
  private static configs: Map<string, any> = new Map();

  /**
   * Create or get existing service instance
   */
  static async createService<T>(
    serviceName: string, 
    config?: any,
    forceRecreate: boolean = false
  ): Promise<T> {
    // Check if service already exists and not forcing recreation
    if (!forceRecreate && this.instances.has(serviceName)) {
      return this.instances.get(serviceName);
    }

    // Validate configuration
    this.validateServiceConfig(serviceName, config);

    try {
      let serviceInstance: T;

      switch (serviceName) {
        case 'babyagiEngine':
          const { BabyAGIEngine } = await import('./babyagiEngine');
          serviceInstance = new BabyAGIEngine(config) as T;
          break;

        case 'openRouterService':
          if (!config?.apiKey) {
            throw new Error('OpenRouter service requires API key');
          }
          const { EnhancedOpenRouterService } = await import('./openRouterService');
          serviceInstance = new EnhancedOpenRouterService(config) as T;
          break;

        case 'taskExecutionEngine':
          const { TaskExecutionEngine } = await import('./taskExecutionEngine');
          serviceInstance = new TaskExecutionEngine(config) as T;
          break;

        case 'learningSystem':
          const { LearningSystem } = await import('./learningSystem');
          serviceInstance = new LearningSystem() as T;
          break;

        case 'simulationManager':
          const { SimulationManager } = await import('./simulationManager');
          serviceInstance = new SimulationManager(config) as T;
          break;

        default:
          throw new Error(`Unknown service: ${serviceName}`);
      }

      // Store instance and config
      this.instances.set(serviceName, serviceInstance);
      if (config) {
        this.configs.set(serviceName, config);
      }

      return serviceInstance;
    } catch (error) {
      console.error(`Failed to create service ${serviceName}:`, error);
      throw error;
    }
  }

  /**
   * Get existing service instance
   */
  static getService<T>(serviceName: string): T | null {
    return this.instances.get(serviceName) || null;
  }

  /**
   * Remove service instance
   */
  static removeService(serviceName: string): boolean {
    const removed = this.instances.delete(serviceName);
    this.configs.delete(serviceName);
    return removed;
  }

  /**
   * Clear all services
   */
  static clear(): void {
    this.instances.clear();
    this.configs.clear();
  }

  /**
   * Get service configuration
   */
  static getConfig(serviceName: string): any {
    return this.configs.get(serviceName);
  }

  /**
   * Update service configuration
   */
  static updateConfig(serviceName: string, config: any): void {
    this.configs.set(serviceName, config);
    
    // Update service instance if it exists
    const service = this.instances.get(serviceName);
    if (service && typeof service.updateSettings === 'function') {
      service.updateSettings(config);
    }
  }

  /**
   * Get all service names
   */
  static getServiceNames(): string[] {
    return Array.from(this.instances.keys());
  }

  /**
   * Check if service exists
   */
  static hasService(serviceName: string): boolean {
    return this.instances.has(serviceName);
  }

  /**
   * Validate service configuration
   */
  private static validateServiceConfig(serviceName: string, config?: any): void {
    if (!config && this.requiresConfig(serviceName)) {
      throw new Error(`Service ${serviceName} requires configuration`);
    }

    if (config) {
      switch (serviceName) {
        case 'babyagiEngine':
          if (!config.simulationSpeed || !config.maxIterations) {
            throw new Error('BabyAGI Engine requires simulationSpeed and maxIterations');
          }
          break;

        case 'openRouterService':
          if (!config.apiKey || !config.apiKey.startsWith('sk-')) {
            throw new Error('OpenRouter service requires valid API key');
          }
          if (!config.model) {
            throw new Error('OpenRouter service requires model configuration');
          }
          break;

        case 'simulationManager':
          if (!config.useOpenRouter && !config.fallbackToSimulation) {
            throw new Error('Simulation manager requires either OpenRouter or fallback simulation');
          }
          break;
      }
    }
  }

  /**
   * Check if service requires configuration
   */
  private static requiresConfig(serviceName: string): boolean {
    const servicesRequiringConfig = ['babyagiEngine', 'openRouterService', 'simulationManager'];
    return servicesRequiringConfig.includes(serviceName);
  }

  /**
   * Get service health status
   */
  static async getServiceHealth(): Promise<ServiceHealth[]> {
    const healthPromises = Array.from(this.instances.entries()).map(
      async ([serviceName, service]): Promise<ServiceHealth> => {
        try {
          if (typeof service.getHealthStatus === 'function') {
            const status = service.getHealthStatus();
            return {
              serviceName,
              status: status.isHealthy ? 'healthy' : 'unhealthy',
              timestamp: new Date(),
              metrics: status
            };
          }

          if (typeof service.isHealthy === 'function') {
            const isHealthy = service.isHealthy();
            return {
              serviceName,
              status: isHealthy ? 'healthy' : 'unhealthy',
              timestamp: new Date()
            };
          }

          return {
            serviceName,
            status: 'healthy',
            timestamp: new Date(),
            note: 'No health check method available'
          };
        } catch (error) {
          return {
            serviceName,
            status: 'unhealthy',
            timestamp: new Date(),
            error: error.message
          };
        }
      }
    );

    return Promise.all(healthPromises);
  }

  /**
   * Create service dependencies
   */
  static async createServiceWithDependencies<T>(
    serviceName: string,
    config?: any,
    dependencyOverrides?: { [key: string]: any }
  ): Promise<T> {
    const dependencyMap: { [key: string]: string } = {
      babyagiEngine: 'none',
      openRouterService: 'none',
      taskExecutionEngine: 'appSettings',
      learningSystem: 'none',
      simulationManager: 'all'
    };

    const requiredDeps = dependencyMap[serviceName];
    if (requiredDeps === 'all') {
      // Create all dependencies
      const [babyagiEngine, taskExecutionEngine, learningSystem] = await Promise.all([
        this.createService('babyagiEngine', config),
        this.createService('taskExecutionEngine', config),
        this.createService('learningSystem')
      ]);

      // OpenRouter is optional
      let openRouterService = null;
      if (config?.useOpenRouter && config?.openRouterApiKey) {
        openRouterService = await this.createService('openRouterService', config);
      }

      // Create service with dependencies
      const finalConfig = {
        ...config,
        dependencies: {
          babyagiEngine,
          openRouterService,
          taskExecutionEngine,
          learningSystem
        }
      };

      return this.createService(serviceName, finalConfig);
    }

    return this.createService(serviceName, config);
  }

  /**
   * Batch create services
   */
  static async createServices(
    serviceNames: string[],
    configs?: { [key: string]: any }
  ): Promise<{ [key: string]: any }> {
    const servicePromises = serviceNames.map(async (name) => {
      const config = configs?.[name];
      const service = await this.createService(name, config);
      return [name, service] as [string, any];
    });

    const serviceEntries = await Promise.all(servicePromises);
    return Object.fromEntries(serviceEntries);
  }

  /**
   * Get service statistics
   */
  static getServiceStats(): {
    totalServices: number;
    healthyServices: number;
    serviceNames: string[];
    uptime: number;
  } {
    const serviceNames = this.getServiceNames();
    
    return {
      totalServices: serviceNames.length,
      healthyServices: serviceNames.length, // Would need actual health check
      serviceNames,
      uptime: Date.now() // Would track actual startup time
    };
  }

  /**
   * Graceful shutdown of all services
   */
  static async shutdown(): Promise<void> {
    const shutdownPromises = Array.from(this.instances.entries()).map(
      async ([serviceName, service]) => {
        try {
          if (typeof service.stop === 'function') {
            await service.stop();
          }
          if (typeof service.shutdown === 'function') {
            await service.shutdown();
          }
          if (typeof service.cleanup === 'function') {
            await service.cleanup();
          }
        } catch (error) {
          console.warn(`Error shutting down service ${serviceName}:`, error);
        }
      }
    );

    await Promise.allSettled(shutdownPromises);
    this.clear();
  }
}

export default ServiceFactory;