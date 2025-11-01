/**
 * BabyAGI Services Index
 * 
 * Centralized export point for all BabyAGI simulation services.
 * This module provides easy access to all enhanced services with proper
 * dependency injection and service management.
 */

// Core Engines
import { BabyAGIEngine } from './babyagiEngine';
import { EnhancedOpenRouterService, DEFAULT_ENHANCED_CONFIG, RECOMMENDED_MODELS } from './openRouterService';
import { TaskExecutionEngine } from './taskExecutionEngine';
import { LearningSystem } from './learningSystem';
import { SimulationManager } from './simulationManager';
export { BabyAGIEngine, EnhancedOpenRouterService, DEFAULT_ENHANCED_CONFIG, RECOMMENDED_MODELS, TaskExecutionEngine, LearningSystem, SimulationManager };

// Service factory and management
import { ServiceFactory } from './serviceFactory';
import { ServiceContainer } from './serviceContainer';
import { DependencyInjector } from './dependencyInjector';
export { ServiceFactory, ServiceContainer, DependencyInjector };

// Service interfaces and types
export type { 
  ServiceConfiguration as ServiceConfig,
  ServiceHealth, 
  ServiceMetrics,
  ServiceEvent 
} from './serviceInterfaces';

// Service manager for orchestration
export class BabyAGIServiceManager {
  private services: Map<string, any> = new Map();
  private configs: Map<string, any> = new Map();
  private initialized = false;

  constructor() {
    this.initializeServices();
  }

  private initializeServices(): void {
    // Register service factories
    this.services.set('babyagiEngine', () => import('./babyagiEngine'));
    this.services.set('openRouterService', () => import('./openRouterService'));
    this.services.set('taskExecutionEngine', () => import('./taskExecutionEngine'));
    this.services.set('learningSystem', () => import('./learningSystem'));
    this.services.set('simulationManager', () => import('./simulationManager'));
  }

  async getService<T>(serviceName: string, config?: any): Promise<T> {
    const factory = this.services.get(serviceName);
    if (!factory) {
      throw new Error(`Service ${serviceName} not found`);
    }

    if (typeof factory === 'function') {
      const module = await factory();
      return new module[serviceName](config);
    }

    return factory;
  }

  async initializeSimulationServices(settings: any): Promise<{
    babyagiEngine: any;
    openRouterService: any | null;
    taskExecutionEngine: any;
    learningSystem: any;
    simulationManager: any;
  }> {
    const babyagiEngine = await this.getService('babyagiEngine', settings);
    const taskExecutionEngine = await this.getService('taskExecutionEngine', settings);
    const learningSystem = await this.getService('learningSystem');
    
    let openRouterService = null;
    if (settings.useOpenRouter && settings.openRouterApiKey) {
      openRouterService = await this.getService('openRouterService', {
        ...settings,
        apiKey: settings.openRouterApiKey
      });
    }
    
    const simulationManager = await this.getService('simulationManager', settings);

    return {
      babyagiEngine,
      openRouterService,
      taskExecutionEngine,
      learningSystem,
      simulationManager
    };
  }

  getServiceHealth(): { [serviceName: string]: { status: string; metrics?: any } } {
    return {
      babyagiEngine: { status: 'healthy' },
      openRouterService: { status: 'available' },
      taskExecutionEngine: { status: 'healthy' },
      learningSystem: { status: 'active' },
      simulationManager: { status: 'ready' }
    };
  }

  async shutdown(): Promise<void> {
    // Cleanup services if needed
    this.initialized = false;
  }
}

// Convenience functions for common use cases
export async function createSimulationEnvironment(settings: any) {
  const manager = new BabyAGIServiceManager();
  
  try {
    const services = await manager.initializeSimulationServices(settings);
    
    return {
      services,
      health: manager.getServiceHealth(),
      manager
    };
  } catch (error) {
    await manager.shutdown();
    throw error;
  }
}

export async function createBasicSimulation() {
  const settings = {
    simulationSpeed: 'normal',
    autoExecute: true,
    showDetailedLogs: true,
    enableAnimations: true,
    maxIterations: 10,
    useOpenRouter: false,
    fallbackToSimulation: true
  };
  
  return createSimulationEnvironment(settings);
}

export async function createAdvancedSimulation(apiKey?: string, model?: string) {
  const settings = {
    simulationSpeed: 'normal',
    autoExecute: true,
    showDetailedLogs: true,
    enableAnimations: true,
    maxIterations: 15,
    useOpenRouter: !!apiKey,
    openRouterApiKey: apiKey,
    selectedModel: model || 'qwen/qwen-2.5-7b-instruct',
    fallbackToSimulation: true
  };
  
  return createSimulationEnvironment(settings);
}

// Service configuration presets
export const SERVICE_PRESETS = {
  DEVELOPMENT: {
    simulationSpeed: 'slow',
    autoExecute: false,
    showDetailedLogs: true,
    enableAnimations: true,
    maxIterations: 5,
    useOpenRouter: false,
    fallbackToSimulation: true
  },
  
  PRODUCTION: {
    simulationSpeed: 'fast',
    autoExecute: true,
    showDetailedLogs: false,
    enableAnimations: false,
    maxIterations: 20,
    useOpenRouter: true,
    fallbackToSimulation: true
  },
  
  TESTING: {
    simulationSpeed: 'fast',
    autoExecute: true,
    showDetailedLogs: false,
    enableAnimations: false,
    maxIterations: 3,
    useOpenRouter: false,
    fallbackToSimulation: true
  },
  
  DEBUG: {
    simulationSpeed: 'slow',
    autoExecute: false,
    showDetailedLogs: true,
    enableAnimations: true,
    maxIterations: 10,
    useOpenRouter: true,
    fallbackToSimulation: true
  }
} as const;

// Default configurations
export const DEFAULT_CONFIGS = {
  OPENROUTER: {
    baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
    model: 'qwen/qwen-2.5-7b-instruct',
    maxTokens: 1000,
    temperature: 0.7
  },
  
  EXECUTION: {
    maxConcurrentTasks: 3,
    stepExecutionDelay: 200,
    progressUpdateInterval: 500,
    maxExecutionTime: 5 * 60 * 1000
  },
  
  LEARNING: {
    minConfidenceThreshold: 0.6,
    memoryRetentionDays: 30,
    patternMinOccurrences: 3,
    adaptationThreshold: 0.7
  },
  
  SIMULATION: {
    iterationDelay: 2000,
    healthCheckInterval: 30000,
    maxConcurrentObjectives: 1
  }
} as const;

// Export version and metadata
export const VERSION = '2.0.0';
export const BUILD_DATE = '2025-01-01';
export const COMPATIBILITY = {
  nodeVersion: '>=16.0.0',
  browserSupport: ['Chrome 90+', 'Firefox 88+', 'Safari 14+'],
  features: ['async_await', 'promises', 'fetch_api', 'web_workers']
};

// Service utility functions
export const ServiceUtils = {
  /**
   * Validate service configuration
   */
  validateConfig(config: any, serviceType: string): boolean {
    switch (serviceType) {
      case 'openrouter':
        return config.apiKey && config.apiKey.startsWith('sk-');
      case 'simulation':
        return config.maxIterations > 0 && config.simulationSpeed;
      case 'execution':
        return config.maxConcurrentTasks > 0;
      default:
        return true;
    }
  },

  /**
   * Create service health check
   */
  createHealthCheck(service: any, name: string) {
    return async () => {
      try {
        if (service.getHealthStatus) {
          const health = service.getHealthStatus();
          return {
            service: name,
            status: health.isHealthy ? 'healthy' : 'unhealthy',
            metrics: health,
            timestamp: new Date()
          };
        }
        
        return {
          service: name,
          status: 'healthy',
          timestamp: new Date()
        };
      } catch (error) {
        return {
          service: name,
          status: 'unhealthy',
          error: error.message,
          timestamp: new Date()
        };
      }
    };
  },

  /**
   * Create performance monitor
   */
  createPerformanceMonitor(services: any[]) {
    let startTime = Date.now();
    
    return {
      getMetrics: () => ({
        uptime: Date.now() - startTime,
        services: services.length,
        activeServices: services.filter(s => s.isRunning || s.isActive).length,
        timestamp: new Date()
      }),
      
      reset: () => {
        startTime = Date.now();
      }
    };
  },

  /**
   * Create error handler
   */
  createErrorHandler(serviceName: string) {
    return {
      handle: (error: Error, context?: any) => {
        console.error(`[${serviceName}] Error:`, error);
        
        return {
          service: serviceName,
          error: error.message,
          stack: (error as any).stack,
          context,
          timestamp: new Date(),
          recoverable: ServiceUtils.isRecoverableError(error)
        };
      },
      
      isRecoverable: (error: Error) => ServiceUtils.isRecoverableError(error)
    };
  },

  /**
   * Check if error is recoverable
   */
  isRecoverableError(error: Error): boolean {
    const recoverableErrors = [
      'timeout',
      'network',
      'rate_limit',
      'temporary'
    ];
    
    return recoverableErrors.some(type => 
      error.message.toLowerCase().includes(type)
    );
  },

  /**
   * Create retry logic
   */
  createRetryLogic(maxAttempts: number = 3, baseDelay: number = 1000) {
    return async <T>(fn: () => Promise<T>): Promise<T> => {
      let lastError: Error;
      
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          return await fn();
        } catch (error) {
          lastError = error as Error;
          
          if (attempt === maxAttempts) {
            throw error;
          }
          
          const delay = baseDelay * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      
      throw lastError;
    };
  }
};

// Export everything for easy importing
export default {
  // Core services
  BabyAGIEngine,
  EnhancedOpenRouterService,
  TaskExecutionEngine,
  LearningSystem,
  SimulationManager,
  
  // Management
  BabyAGIServiceManager,
  
  // Convenience functions
  createSimulationEnvironment,
  createBasicSimulation,
  createAdvancedSimulation,
  
  // Presets and configs
  SERVICE_PRESETS,
  DEFAULT_CONFIGS,
  
  // Utilities
  ServiceUtils,
  
  // Metadata
  VERSION,
  BUILD_DATE,
  COMPATIBILITY
};