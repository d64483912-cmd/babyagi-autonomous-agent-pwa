/**
 * Dependency Injector for BabyAGI Services
 * Handles automatic dependency injection and circular dependency resolution
 */

import { ServiceContainer } from './serviceContainer';

export interface DependencyInjectionConfig {
  autoInject: boolean;
  validateTypes: boolean;
  circularDependencyDetection: boolean;
  lazyInjection: boolean;
  injectionDepth: number;
  maxRetries: number;
}

export interface InjectableProperty {
  name: string;
  type: string;
  required: boolean;
  optional: boolean;
  defaultValue?: any;
  factory?: () => any;
}

export interface InjectionTarget {
  instance: any;
  constructor: Function;
  properties: Map<string, InjectableProperty>;
  dependencies: string[];
}

export class DependencyInjector {
  private container: ServiceContainer;
  private config: DependencyInjectionConfig;
  private injectionCache: Map<string, any> = new Map();
  private circularDependencyStack: string[] = [];

  constructor(
    container: ServiceContainer,
    config: Partial<DependencyInjectionConfig> = {}
  ) {
    this.container = container;
    this.config = {
      autoInject: true,
      validateTypes: true,
      circularDependencyDetection: true,
      lazyInjection: true,
      injectionDepth: 10,
      maxRetries: 3,
      ...config
    };
  }

  /**
   * Inject dependencies into target instance
   */
  async inject<T = any>(
    target: T, 
    options: {
      force?: boolean;
      validate?: boolean;
      properties?: string[];
      exclude?: string[];
    } = {}
  ): Promise<T> {
    const targetInstance = target as any;
    const targetKey = this.getTargetKey(targetInstance);

    // Check cache unless forcing reinjection
    if (!options.force && this.injectionCache.has(targetKey)) {
      return this.injectionCache.get(targetKey);
    }

    // Analyze target for injectable properties
    const injectionTarget = await this.analyzeTarget(targetInstance);
    
    // Validate dependencies
    if (options.validate !== false && this.config.validateTypes) {
      this.validateDependencies(injectionTarget);
    }

    try {
      // Perform injection
      await this.performInjection(targetInstance, injectionTarget, options);
      
      // Cache result
      if (!options.force) {
        this.injectionCache.set(targetKey, targetInstance);
      }

      return targetInstance;
    } catch (error) {
      if (this.config.circularDependencyDetection) {
        this.circularDependencyStack = [];
      }
      throw new Error(`Dependency injection failed: ${error.message}`);
    }
  }

  /**
   * Analyze target for injectable properties
   */
  private async analyzeTarget(target: any): Promise<InjectionTarget> {
    const constructor = target.constructor;
    const properties = new Map<string, InjectableProperty>();

    // Analyze constructor parameters
    const constructorParams = this.extractConstructorParameters(constructor);
    
    // Analyze class properties
    const classProperties = this.extractClassProperties(constructor);
    
    // Analyze metadata (if available)
    const metadataProperties = this.extractMetadataProperties(target);

    // Combine all sources
    [...constructorParams, ...classProperties, ...metadataProperties].forEach(prop => {
      properties.set(prop.name, prop);
    });

    // Determine dependencies
    const dependencies = Array.from(properties.values())
      .filter(prop => this.isServiceProperty(prop))
      .map(prop => this.resolveServiceName(prop));

    return {
      instance: target,
      constructor,
      properties,
      dependencies
    };
  }

  /**
   * Extract constructor parameters with type information
   */
  private extractConstructorParameters(constructor: Function): InjectableProperty[] {
    const params: InjectableProperty[] = [];
    
    try {
      // Try to get parameter types from function.toString()
      const funcStr = constructor.toString();
      const paramMatch = funcStr.match(/\(([^)]*)\)/);
      
      if (paramMatch && paramMatch[1]) {
        const paramStr = paramMatch[1];
        const paramNames = paramStr.split(',').map(p => p.trim()).filter(p => p);
        
        paramNames.forEach((paramName, index) => {
          // Clean parameter name
          const cleanName = paramName.replace(/[{}:]/g, '').trim();
          
          if (cleanName && !cleanName.startsWith('_')) {
            params.push({
              name: cleanName,
              type: this.inferTypeFromName(cleanName),
              required: true,
              optional: false
            });
          }
        });
      }
    } catch (error) {
      console.warn('Could not extract constructor parameters:', error);
    }

    return params;
  }

  /**
   * Extract class properties that might need injection
   */
  private extractClassProperties(constructor: Function): InjectableProperty[] {
    const properties: InjectableProperty[] = [];
    
    try {
      // Look for properties that match service patterns
      const propertyNames = Object.getOwnPropertyNames(constructor.prototype);
      
      propertyNames.forEach(propName => {
        if (this.looksLikeServiceProperty(propName)) {
          properties.push({
            name: propName,
            type: this.inferTypeFromName(propName),
            required: false,
            optional: true
          });
        }
      });
    } catch (error) {
      console.warn('Could not extract class properties:', error);
    }

    return properties;
  }

  /**
   * Extract metadata properties (decorator-based)
   */
  private extractMetadataProperties(target: any): InjectableProperty[] {
    const properties: InjectableProperty[] = [];
    
    // Check for metadata properties (could be enhanced with actual decorator support)
    if (target.constructor.__injectableProperties) {
      properties.push(...target.constructor.__injectableProperties);
    }
    
    return properties;
  }

  /**
   * Check if property looks like a service dependency
   */
  private looksLikeServiceProperty(name: string): boolean {
    const servicePatterns = [
      /engine$/i,
      /service$/i,
      /manager$/i,
      /system$/i,
      /^(babyagi|openrouter|taskexecution|learningsimulation)/i
    ];
    
    return servicePatterns.some(pattern => pattern.test(name));
  }

  /**
   * Check if property is a service property
   */
  private isServiceProperty(prop: InjectableProperty): boolean {
    return this.looksLikeServiceProperty(prop.name) ||
           this.isKnownServiceType(prop.type);
  }

  /**
   * Check if type matches known service types
   */
  private isKnownServiceType(type: string): boolean {
    const knownTypes = [
      'BabyAGIEngine',
      'OpenRouterService',
      'TaskExecutionEngine',
      'LearningSystem',
      'SimulationManager'
    ];
    
    return knownTypes.some(known => type.toLowerCase().includes(known.toLowerCase()));
  }

  /**
   * Resolve service name from property
   */
  private resolveServiceName(prop: InjectableProperty): string {
    // Try to map property name to service name
    const mappings: { [key: string]: string } = {
      'babyagiEngine': 'babyagiEngine',
      'openRouterService': 'openRouterService',
      'taskExecutionEngine': 'taskExecutionEngine',
      'learningSystem': 'learningSystem',
      'simulationManager': 'simulationManager',
      'engine': 'babyagiEngine',
      'ai': 'openRouterService',
      'execution': 'taskExecutionEngine',
      'learning': 'learningSystem',
      'manager': 'simulationManager'
    };
    
    const lowerName = prop.name.toLowerCase();
    
    // Try exact match first
    if (mappings[prop.name]) {
      return mappings[prop.name];
    }
    
    // Try partial matches
    for (const [key, serviceName] of Object.entries(mappings)) {
      if (lowerName.includes(key.toLowerCase())) {
        return serviceName;
      }
    }
    
    // Fall back to property name
    return prop.name;
  }

  /**
   * Infer type from property name
   */
  private inferTypeFromName(name: string): string {
    const lowerName = name.toLowerCase();
    
    if (lowerName.includes('engine')) return 'Engine';
    if (lowerName.includes('service')) return 'Service';
    if (lowerName.includes('manager')) return 'Manager';
    if (lowerName.includes('system')) return 'System';
    if (lowerName.includes('learning')) return 'LearningSystem';
    if (lowerName.includes('execution')) return 'TaskExecutionEngine';
    if (lowerName.includes('openrouter') || lowerName.includes('ai')) return 'OpenRouterService';
    if (lowerName.includes('babyagi')) return 'BabyAGIEngine';
    
    return 'Unknown';
  }

  /**
   * Validate dependencies before injection
   */
  private validateDependencies(target: InjectionTarget): void {
    const unavailableServices: string[] = [];
    
    target.dependencies.forEach(depName => {
      if (!this.container.has(depName)) {
        unavailableServices.push(depName);
      }
    });
    
    if (unavailableServices.length > 0) {
      throw new Error(`Unavailable services for injection: ${unavailableServices.join(', ')}`);
    }
  }

  /**
   * Perform the actual dependency injection
   */
  private async performInjection(
    target: any,
    injectionTarget: InjectionTarget,
    options: {
      force?: boolean;
      properties?: string[];
      exclude?: string[];
    }
  ): Promise<void> {
    const properties = Array.from(injectionTarget.properties.values());
    
    // Filter properties based on options
    const filteredProperties = properties.filter(prop => {
      if (options.properties && !options.properties.includes(prop.name)) {
        return false;
      }
      if (options.exclude && options.exclude.includes(prop.name)) {
        return false;
      }
      return true;
    });

    // Inject each property
    for (const prop of filteredProperties) {
      if (this.isServiceProperty(prop)) {
        await this.injectProperty(target, prop, options.force);
      }
    }
  }

  /**
   * Inject single property
   */
  private async injectProperty(
    target: any,
    prop: InjectableProperty,
    force: boolean = false
  ): Promise<void> {
    const serviceName = this.resolveServiceName(prop);
    
    // Check circular dependency
    if (this.config.circularDependencyDetection) {
      if (this.circularDependencyStack.includes(serviceName)) {
        throw new Error(`Circular dependency detected: ${this.circularDependencyStack.join(' -> ')} -> ${serviceName}`);
      }
      
      this.circularDependencyStack.push(serviceName);
    }

    try {
      // Get service from container
      let service = await this.container.get(serviceName);
      
      // If service doesn't exist and property is optional, skip
      if (!service && prop.optional) {
        return;
      }
      
      // Handle lazy injection
      if (this.config.lazyInjection && !force) {
        service = this.createLazyProxy(serviceName, service);
      }
      
      // Set property
      target[prop.name] = service;
      
    } finally {
      // Remove from circular dependency stack
      if (this.config.circularDependencyDetection) {
        const index = this.circularDependencyStack.indexOf(serviceName);
        if (index > -1) {
          this.circularDependencyStack.splice(index, 1);
        }
      }
    }
  }

  /**
   * Create lazy proxy for service
   */
  private createLazyProxy(serviceName: string, initialService: any): any {
    let actualService = initialService;
    let initialized = !!initialService;
    
    return new Proxy({}, {
      get: (target, prop) => {
        if (!initialized) {
          // Initialize service on first access
          this.container.get(serviceName).then(service => {
            actualService = service;
            initialized = true;
          });
        }
        
        return actualService ? actualService[prop] : undefined;
      },
      
      set: (target, prop, value) => {
        if (!initialized) {
          this.container.get(serviceName).then(service => {
            actualService = service;
            initialized = true;
            actualService[prop] = value;
          });
        } else {
          actualService[prop] = value;
        }
        return true;
      }
    });
  }

  /**
   * Get target key for caching
   */
  private getTargetKey(target: any): string {
    return `${target.constructor.name}_${target.constructor}`;
  }

  /**
   * Batch inject dependencies for multiple targets
   */
  async batchInject(
    targets: any[],
    options: {
      parallel?: boolean;
      validate?: boolean;
      onProgress?: (completed: number, total: number) => void;
    } = {}
  ): Promise<any[]> {
    const { parallel = false, validate = true, onProgress } = options;
    const results: any[] = [];
    
    if (parallel) {
      // Inject in parallel
      const promises = targets.map((target, index) => 
        this.inject(target, { validate })
          .then(result => {
            if (onProgress) {
              onProgress(index + 1, targets.length);
            }
            return result;
          })
      );
      
      return Promise.all(promises);
    } else {
      // Inject sequentially
      for (let i = 0; i < targets.length; i++) {
        const result = await this.inject(targets[i], { validate });
        results.push(result);
        
        if (onProgress) {
          onProgress(i + 1, targets.length);
        }
      }
      
      return results;
    }
  }

  /**
   * Clear injection cache
   */
  clearCache(): void {
    this.injectionCache.clear();
  }

  /**
   * Get injection statistics
   */
  getInjectionStats(): {
    cachedTargets: number;
    circularDependencies: number;
    failedInjections: number;
    successfulInjections: number;
  } {
    return {
      cachedTargets: this.injectionCache.size,
      circularDependencies: 0, // Would track actual circular dependencies
      failedInjections: 0, // Would track failed injections
      successfulInjections: this.injectionCache.size
    };
  }

  /**
   * Validate injection configuration
   */
  validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!this.container) {
      errors.push('Container is required');
    }
    
    if (this.config.injectionDepth <= 0) {
      errors.push('Injection depth must be positive');
    }
    
    if (this.config.maxRetries < 0) {
      errors.push('Max retries must be non-negative');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Create dependency graph for visualization
   */
  createDependencyGraph(): {
    nodes: Array<{ id: string; type: string; optional: boolean }>;
    edges: Array<{ from: string; to: string; type: string }>;
  } {
    const nodes: Array<{ id: string; type: string; optional: boolean }> = [];
    const edges: Array<{ from: string; to: string; type: string }> = [];
    
    const registeredServices = this.container.getServiceNames();
    
    registeredServices.forEach(serviceName => {
      nodes.push({
        id: serviceName,
        type: this.inferTypeFromName(serviceName),
        optional: false // Would need actual optional checking
      });
    });
    
    return { nodes, edges };
  }

  /**
   * Detect potential circular dependencies
   */
  detectCircularDependencies(): Array<{ 
    services: string[]; 
    depth: number; 
    severity: 'low' | 'medium' | 'high' 
  }> {
    // Simplified circular dependency detection
    // In a full implementation, this would analyze actual service dependencies
    
    return [];
  }
}

// Factory function for creating injector
export function createDependencyInjector(
  container: ServiceContainer,
  config?: Partial<DependencyInjectionConfig>
): DependencyInjector {
  return new DependencyInjector(container, config);
}

// Singleton injector instance
let globalInjector: DependencyInjector | null = null;

/**
 * Get global dependency injector
 */
export function getGlobalInjector(): DependencyInjector | null {
  return globalInjector;
}

/**
 * Set global dependency injector
 */
export function setGlobalInjector(injector: DependencyInjector): void {
  globalInjector = injector;
}

/**
 * Utility functions for common injection patterns
 */
export const InjectorUtils = {
  /**
   * Auto-inject dependencies to class instance
   */
  autoInject: async (instance: any, container?: ServiceContainer): Promise<any> => {
    const injContainer = container || getGlobalInjector()?.container;
    if (!injContainer) {
      throw new Error('No container available for injection');
    }
    
    const injector = new DependencyInjector(injContainer);
    return injector.inject(instance);
  },

  /**
   * Create factory function with automatic injection
   */
  createInjectableFactory: <T extends Function>(
    factory: T,
    container?: ServiceContainer
  ): T => {
    return ((...args: any[]) => {
      const instance = factory.apply(null, args);
      return InjectorUtils.autoInject(instance, container);
    }) as T;
  },

  /**
   * Validate service compatibility with injection
   */
  validateServiceCompatibility: (service: any): {
    compatible: boolean;
    properties: string[];
    dependencies: string[];
    warnings: string[];
  } => {
    const properties: string[] = [];
    const dependencies: string[] = [];
    const warnings: string[] = [];
    
    // Analyze service for injection compatibility
    if (typeof service.updateSettings === 'function') {
      properties.push('updateSettings');
    }
    
    if (typeof service.getHealthStatus === 'function') {
      properties.push('getHealthStatus');
    }
    
    return {
      compatible: true,
      properties,
      dependencies,
      warnings
    };
  }
};

export default DependencyInjector;