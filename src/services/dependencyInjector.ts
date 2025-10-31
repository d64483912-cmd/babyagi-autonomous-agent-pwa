// Dependency Injector - Automatic dependency injection with advanced features
import { ServiceContainer } from './serviceContainer';
import { ServiceFactory } from './serviceFactory';

export interface InjectionTarget {
  constructor?: any;
  prototype?: any;
  [key: string]: any;
}

export interface DependencyConfig {
  target: InjectionTarget;
  dependencies?: string[];
  property?: string;
  lazy?: boolean;
  singleton?: boolean;
  required?: boolean;
  factory?: () => any;
}

export interface CircularDependencyInfo {
  path: string[];
  source: string;
  target: string;
}

/**
 * Advanced Dependency Injector with circular dependency detection
 * and lazy loading capabilities
 */
export class DependencyInjector {
  private container: ServiceContainer;
  private factory: ServiceFactory;
  private injections = new Map<string, DependencyConfig>();
  private circularDependencyMap = new Map<string, string[]>();
  private lazyProxies = new Map<string, any>();

  constructor() {
    this.container = new ServiceContainer();
    this.factory = new ServiceFactory();
  }

  /**
   * Register a dependency for injection
   */
  public register(name: string, config: DependencyConfig): void {
    this.injections.set(name, {
      required: true,
      lazy: false,
      singleton: true,
      ...config
    });
  }

  /**
   * Analyze target for dependency requirements
   */
  public analyzeTarget(target: InjectionTarget): {
    constructor?: any;
    properties: { name: string; type?: any }[];
    methods: { name: string; parameters: any[] }[];
  } {
    const result = {
      constructor: target.constructor,
      properties: [] as { name: string; type?: any }[],
      methods: [] as { name: string; parameters: any[] }[]
    };

    // Analyze constructor parameters
    if (target.constructor && target.constructor.length > 0) {
      // Constructor parameters would need reflection API or metadata
      // This is a simplified version
    }

    // Analyze properties with decorators or metadata
    const prototype = target.prototype || target;
    for (const key in prototype) {
      if (key !== 'constructor' && typeof prototype[key] === 'function') {
        // It's a method
        const method = prototype[key];
        const parameters = this.extractParameters(method);
        result.methods.push({ name: key, parameters });
      }
    }

    return result;
  }

  /**
   * Perform dependency injection
   */
  public async inject(target: InjectionTarget, options?: {
    force?: boolean;
    skipValidation?: boolean;
    context?: string;
  }): Promise<any> {
    const analysis = this.analyzeTarget(target);
    
    // Check for circular dependencies
    if (!options?.skipValidation) {
      await this.validateDependencies(target, options?.context);
    }

    // Inject into constructor if applicable
    if (analysis.constructor && !options?.force) {
      return this.injectConstructor(target);
    }

    // Inject into properties
    this.injectProperties(target);

    // Inject into methods
    this.injectMethods(target, analysis.methods);

    return target;
  }

  /**
   * Inject into constructor
   */
  private injectConstructor(target: InjectionTarget): any {
    const constructor = target.constructor;
    const dependencies = this.resolveDependencies(constructor);
    
    return new constructor(...dependencies);
  }

  /**
   * Inject into properties
   */
  private injectProperties(target: InjectionTarget): void {
    for (const [name, config] of this.injections) {
      if (config.property && target[config.property] === undefined) {
        const instance = this.createInstance(name, config);
        Object.defineProperty(target, config.property, {
          value: instance,
          writable: false,
          enumerable: true,
          configurable: false
        });
      }
    }
  }

  /**
   * Inject into methods
   */
  private injectMethods(target: InjectionTarget, methods: { name: string; parameters: any[] }[]): void {
    for (const method of methods) {
      if (typeof target[method.name] === 'function') {
        const originalMethod = target[method.name];
        target[method.name] = (...args: any[]) => {
          const dependencies = this.resolveDependencies(originalMethod, method.parameters);
          return originalMethod.apply(target, [...dependencies, ...args]);
        };
      }
    }
  }

  /**
   * Create an instance with dependency resolution
   */
  private createInstance(name: string, config: DependencyConfig): any {
    if (config.factory) {
      return config.factory();
    }

    if (config.lazy) {
      return this.createLazyProxy(name, config);
    }

    if (config.target) {
      return this.container.get(config.target as any) || this.inject(config.target);
    }

    throw new Error(`Cannot resolve dependency: ${name}`);
  }

  /**
   * Create a lazy proxy for deferred instantiation
   */
  private createLazyProxy(name: string, config: DependencyConfig): any {
    if (this.lazyProxies.has(name)) {
      return this.lazyProxies.get(name);
    }

    const proxy = new Proxy({}, {
      get: (target, prop) => {
        // Instantiate on first access
        const instance = this.createInstance(name, { ...config, lazy: false });
        
        // Cache the instance
        this.lazyProxies.set(name, instance);
        
        // Delegate all property access to the instance
        return instance[prop];
      },
      set: (target, prop, value) => {
        const instance = this.lazyProxies.get(name) || this.createInstance(name, { ...config, lazy: false });
        this.lazyProxies.set(name, instance);
        instance[prop] = value;
        return true;
      },
      apply: (target, thisArg, args) => {
        const instance = this.lazyProxies.get(name) || this.createInstance(name, { ...config, lazy: false });
        return instance.apply(thisArg, args);
      }
    });

    this.lazyProxies.set(name, proxy);
    return proxy;
  }

  /**
   * Resolve dependencies for a target
   */
  private resolveDependencies(target: any, parameterTypes?: any[]): any[] {
    const dependencies: any[] = [];
    
    if (parameterTypes && parameterTypes.length > 0) {
      // Use parameter type information
      for (const type of parameterTypes) {
        dependencies.push(this.resolveDependency(type));
      }
    } else {
      // Use default resolution strategy
      for (let i = 0; i < target.length; i++) {
        dependencies.push(this.resolveDependency(null));
      }
    }

    return dependencies;
  }

  /**
   * Resolve a single dependency
   */
  private resolveDependency(type?: any): any {
    // Simple strategy: look up by type name or use default resolver
    const typeName = type?.name || type;
    
    // Check registered injections
    for (const [name, config] of this.injections) {
      if (config.required && !config.lazy) {
        return this.createInstance(name, config);
      }
    }

    // Default fallback
    return this.container.get(typeName) || null;
  }

  /**
   * Extract parameter information from a function
   */
  private extractParameters(fn: Function): any[] {
    const fnStr = fn.toString();
    const paramMatch = fnStr.match(/\(([^)]*)\)/);
    if (!paramMatch) return [];

    const params = paramMatch[1].split(',').map(p => p.trim()).filter(p => p);
    return params.map(param => {
      // Simple type extraction - would be enhanced with proper parsing
      return { name: param };
    });
  }

  /**
   * Validate dependencies and detect circular references
   */
  private async validateDependencies(target: InjectionTarget, context?: string): Promise<void> {
    const visited = new Set<string>();
    const path: string[] = [];

    const checkCircular = (currentTarget: InjectionTarget, currentPath: string[]): void => {
      const targetKey = this.getTargetKey(currentTarget);
      
      if (currentPath.includes(targetKey)) {
        const circularInfo: CircularDependencyInfo = {
          path: [...currentPath, targetKey],
          source: targetKey,
          target: targetKey
        };
        throw new Error(`Circular dependency detected: ${circularInfo.path.join(' -> ')}`);
      }

      if (visited.has(targetKey)) return;

      visited.add(targetKey);
      currentPath.push(targetKey);

      // Recursively check dependencies
      const analysis = this.analyzeTarget(currentTarget);
      for (const method of analysis.methods) {
        const methodTarget = this.getDependencyForMethod(method.name);
        if (methodTarget) {
          checkCircular(methodTarget, [...currentPath]);
        }
      }

      currentPath.pop();
    };

    checkCircular(target, path);
  }

  /**
   * Get a unique key for a target
   */
  private getTargetKey(target: InjectionTarget): string {
    if (target.constructor) {
      return target.constructor.name;
    }
    return target.toString();
  }

  /**
   * Get dependency for a method name
   */
  private getDependencyForMethod(methodName: string): InjectionTarget | null {
    // Look up dependency configuration by method name
    for (const [name, config] of this.injections) {
      if (config.property === methodName || config.target?.prototype?.[methodName]) {
        return config.target;
      }
    }
    return null;
  }

  /**
   * Batch inject multiple targets
   */
  public async batchInject(targets: InjectionTarget[], options?: {
    force?: boolean;
    skipValidation?: boolean;
    parallel?: boolean;
  }): Promise<any[]> {
    if (options?.parallel) {
      return Promise.all(targets.map(target => this.inject(target, options)));
    } else {
      const results: any[] = [];
      for (const target of targets) {
        results.push(await this.inject(target, options));
      }
      return results;
    }
  }

  /**
   * Get dependency graph
   */
  public getDependencyGraph(): Map<string, string[]> {
    const graph = new Map<string, string[]>();

    for (const [name, config] of this.injections) {
      if (config.target) {
        const targetKey = this.getTargetKey(config.target);
        if (!graph.has(targetKey)) {
          graph.set(targetKey, []);
        }
        graph.get(targetKey)!.push(name);
      }
    }

    return graph;
  }

  /**
   * Get injection statistics
   */
  public getStatistics(): {
    totalInjections: number;
    lazyInjections: number;
    singletonInjections: number;
    circularDependencies: number;
  } {
    let lazyCount = 0;
    let singletonCount = 0;

    for (const config of this.injections.values()) {
      if (config.lazy) lazyCount++;
      if (config.singleton) singletonCount++;
    }

    return {
      totalInjections: this.injections.size,
      lazyInjections: lazyCount,
      singletonInjections: singletonCount,
      circularDependencies: this.circularDependencyMap.size
    };
  }

  /**
   * Clear all injections
   */
  public clear(): void {
    this.injections.clear();
    this.circularDependencyMap.clear();
    this.lazyProxies.clear();
  }

  /**
   * Remove a specific injection
   */
  public remove(name: string): boolean {
    const deleted = this.injections.delete(name);
    this.lazyProxies.delete(name);
    return deleted;
  }

  /**
   * Check if a dependency is registered
   */
  public has(name: string): boolean {
    return this.injections.has(name);
  }

  /**
   * Get all registered injection names
   */
  public getRegisteredNames(): string[] {
    return Array.from(this.injections.keys());
  }

  /**
   * Update injection configuration
   */
  public update(name: string, updates: Partial<DependencyConfig>): boolean {
    const config = this.injections.get(name);
    if (!config) return false;

    const updatedConfig = { ...config, ...updates };
    this.injections.set(name, updatedConfig);
    
    // Clear lazy proxy if configuration changed
    if (updates.lazy !== undefined && this.lazyProxies.has(name)) {
      this.lazyProxies.delete(name);
    }

    return true;
  }

  /**
   * Validate current injection configuration
   */
  public validateConfiguration(): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const [name, config] of this.injections) {
      if (config.required && !config.target && !config.factory) {
        errors.push(`Required injection '${name}' has no target or factory`);
      }

      if (config.lazy && config.required) {
        warnings.push(`Lazy injection '${name}' is marked as required`);
      }

      if (config.property && !config.target) {
        errors.push(`Property injection '${name}' requires a target`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Destroy the injector and clean up resources
   */
  public destroy(): void {
    this.clear();
    this.container.destroy();
    this.factory.destroy();
  }
}

export default DependencyInjector;