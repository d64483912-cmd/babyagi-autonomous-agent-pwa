import { 
  OpenRouterConfig, 
  OpenRouterResponse, 
  OpenRouterModel, 
  APIKeyValidationResult,
  AppSettings 
} from '../types/babyagi';

/**
 * Enhanced OpenRouter service with sophisticated error handling, rate limiting,
 * and intelligent fallback mechanisms for BabyAGI simulation.
 */
export class EnhancedOpenRouterService {
  private config: OpenRouterConfig;
  private rateLimiter: RateLimiter;
  private errorHandler: ErrorHandler;
  private fallbackHandler: FallbackHandler;
  private healthMonitor: HealthMonitor;

  constructor(config: OpenRouterConfig) {
    this.config = config;
    this.rateLimiter = new RateLimiter();
    this.errorHandler = new ErrorHandler();
    this.fallbackHandler = new FallbackHandler();
    this.healthMonitor = new HealthMonitor();
  }

  /**
   * Update configuration with validation
   */
  updateConfig(newConfig: Partial<OpenRouterConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.validateConfig();
  }

  private validateConfig(): void {
    if (!this.config.apiKey?.startsWith('sk-')) {
      throw new Error('Invalid API key format');
    }
    
    if (this.config.maxTokens > 4000) {
      console.warn('High token limit may result in longer response times');
    }
    
    if (this.config.temperature > 1 || this.config.temperature < 0) {
      throw new Error('Temperature must be between 0 and 1');
    }
  }

  /**
   * Enhanced API key validation with detailed error analysis
   */
  async validateApiKey(apiKey: string): Promise<APIKeyValidationResult> {
    try {
      await this.rateLimiter.waitForSlot('validation');
      
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorDetails = await this.errorHandler.analyzeError(response);
        return { 
          isValid: false, 
          error: errorDetails.message,
          models: [] 
        };
      }

      const data = await response.json();
      let models = data.data || [];
      
      // Enhanced model filtering with fallback options
      models = this.filterRecommendedModels(models);
      
      // Test API with a simple request
      const testResult = await this.testApiConnection(apiKey);
      if (!testResult.success) {
        return { 
          isValid: false, 
          error: testResult.error,
          models 
        };
      }
      
      this.healthMonitor.recordSuccessfulValidation();
      
      return { 
        isValid: true, 
        models,
        error: undefined
      };
      
    } catch (error) {
      const errorAnalysis = this.errorHandler.categorizeError(error);
      this.healthMonitor.recordFailedValidation(errorAnalysis);
      
      return { 
        isValid: false, 
        error: errorAnalysis.userMessage,
        models: [] 
      };
    }
  }

  /**
   * Generate task decomposition with intelligent fallback
   */
  async generateTaskDecomposition(
    objective: string, 
    complexity: number,
    context?: any
  ): Promise<string[]> {
    const prompt = this.buildEnhancedTaskDecompositionPrompt(objective, complexity, context);
    
    try {
      await this.rateLimiter.waitForSlot('task_generation');
      
      const response = await this.makeAuthenticatedRequest(prompt, {
        max_tokens: Math.min(this.config.maxTokens, 1500),
        temperature: Math.min(this.config.temperature, 0.8) // Lower temperature for more consistent results
      });
      
      const tasks = this.parseEnhancedTaskDecomposition(response.choices[0].message.content);
      
      this.healthMonitor.recordSuccessfulRequest('task_decomposition');
      this.validateGeneratedTasks(tasks, complexity);
      
      return tasks;
      
    } catch (error) {
      console.warn('AI task decomposition failed, using fallback:', error.message);
      
      this.healthMonitor.recordFailedRequest('task_decomposition', error);
      
      return this.fallbackHandler.generateTaskDecomposition(objective, complexity, context);
    }
  }

  /**
   * Generate execution strategy with contextual awareness
   */
  async generateExecutionStrategy(
    task: string, 
    context: string[],
    historicalData?: any
  ): Promise<string> {
    const prompt = this.buildEnhancedExecutionStrategyPrompt(task, context, historicalData);
    
    try {
      await this.rateLimiter.waitForSlot('strategy_generation');
      
      const response = await this.makeAuthenticatedRequest(prompt, {
        max_tokens: Math.min(this.config.maxTokens, 1000),
        temperature: this.config.temperature
      });
      
      const strategy = response.choices[0].message.content.trim();
      
      this.healthMonitor.recordSuccessfulRequest('strategy_generation');
      this.validateGeneratedStrategy(strategy);
      
      return strategy;
      
    } catch (error) {
      console.warn('AI strategy generation failed, using fallback:', error.message);
      
      this.healthMonitor.recordFailedRequest('strategy_generation', error);
      
      return this.fallbackHandler.generateExecutionStrategy(task, context);
    }
  }

  /**
   * Generate learning insights with pattern recognition
   */
  async generateLearningInsights(
    task: string, 
    result: string, 
    success: boolean,
    historicalInsights?: any[]
  ): Promise<string> {
    const prompt = this.buildEnhancedLearningInsightsPrompt(task, result, success, historicalInsights);
    
    try {
      await this.rateLimiter.waitForSlot('learning_insights');
      
      const response = await this.makeAuthenticatedRequest(prompt, {
        max_tokens: Math.min(this.config.maxTokens, 800),
        temperature: Math.max(this.config.temperature, 0.3) // Higher temperature for creative insights
      });
      
      const insights = response.choices[0].message.content.trim();
      
      this.healthMonitor.recordSuccessfulRequest('learning_insights');
      this.validateGeneratedInsights(insights);
      
      return insights;
      
    } catch (error) {
      console.warn('AI learning insights failed, using fallback:', error.message);
      
      this.healthMonitor.recordFailedRequest('learning_insights', error);
      
      return this.fallbackHandler.generateLearningInsights(task, result, success);
    }
  }

  /**
   * Enhanced API request with comprehensive error handling
   */
  private async makeAuthenticatedRequest(
    prompt: string, 
    options: Partial<OpenRouterConfig>
  ): Promise<OpenRouterResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const requestBody = {
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: 'You are BabyAGI, an autonomous AI agent that helps break down complex objectives into actionable tasks and provides strategic guidance.'
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: options.max_tokens || this.config.maxTokens,
        temperature: options.temperature || this.config.temperature,
        stream: false,
      };

      const response = await fetch(this.config.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://babyagi-pwa.minimax.chat',
          'X-Title': 'BabyAGI PWA',
          'User-Agent': 'BabyAGI-PWA/1.0'
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        const errorDetails = await this.errorHandler.analyzeApiError(response, errorText);
        throw new Error(errorDetails);
      }

      const data = await response.json();
      
      // Validate response structure
      if (!data.choices || data.choices.length === 0) {
        throw new Error('Invalid response structure from OpenRouter API');
      }

      return data;
      
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - the AI service is taking too long to respond');
      }
      
      throw error;
    }
  }

  /**
   * Build enhanced prompts with contextual awareness
   */
  private buildEnhancedTaskDecompositionPrompt(
    objective: string, 
    complexity: number,
    context?: any
  ): string {
    const complexityDescription = this.getComplexityDescription(complexity);
    const contextInfo = context ? `\nContext: ${JSON.stringify(context).slice(0, 200)}` : '';
    
    return `You are BabyAGI, an expert task decomposition AI. Break down the following objective into specific, actionable subtasks.

OBJECTIVE: ${objective}
COMPLEXITY: ${complexity}/10 - ${complexityDescription}
${contextInfo}

INSTRUCTIONS:
- Create 3-10 subtasks based on the complexity level
- Each task must be specific, measurable, and actionable
- Order tasks logically based on dependencies
- Consider task priorities (higher numbers = higher priority)
- Include estimated time requirements for each task
- Use clear, professional language
- Avoid overlapping or redundant tasks

FORMAT: Return only the task list, one task per line, without numbering or bullets.

EXAMPLE FORMAT:
Research target market demographics and preferences
Analyze competitor products and pricing strategies
Define unique value proposition and differentiation
Create detailed product requirements specification
Design user interface wireframes and mockups
Develop minimum viable product (MVP) features
Conduct user testing and gather feedback
Iterate based on testing results and feedback`;
  }

  private buildEnhancedExecutionStrategyPrompt(
    task: string, 
    context: string[],
    historicalData?: any
  ): string {
    const contextStr = context.length > 0 ? 
      `\nCONTEXT FROM PREVIOUS TASKS:\n${context.map(c => `• ${c}`).join('\n')}` : '';
    
    const historicalStr = historicalData ? 
      `\nHISTORICAL PERFORMANCE:\n${JSON.stringify(historicalData).slice(0, 300)}` : '';
    
    return `You are BabyAGI executing a specific task. Provide a detailed, actionable execution strategy.

TASK: ${task}${contextStr}${historicalStr}

INSTRUCTIONS:
- Provide a step-by-step execution plan
- Consider dependencies and prerequisites
- Estimate realistic time and resource requirements
- Identify potential challenges and mitigation strategies
- Focus on actionable steps with clear outcomes
- Keep the response concise but comprehensive (max 300 words)
- Use bullet points or numbered steps for clarity

FORMAT: Provide the strategy as a clear, structured plan with specific actions.`;
  }

  private buildEnhancedLearningInsightsPrompt(
    task: string, 
    result: string, 
    success: boolean,
    historicalInsights?: any[]
  ): string {
    const outcome = success ? 'successful' : 'failed';
    const outcomeEmoji = success ? '✅' : '❌';
    
    const historicalStr = historicalInsights && historicalInsights.length > 0 ?
      `\nPREVIOUS LEARNING INSIGHTS:\n${historicalInsights.map(i => `• ${i}`).join('\n')}` : '';
    
    return `You are BabyAGI analyzing task execution results to generate actionable learning insights.

TASK: ${task}
RESULT: ${result}
OUTCOME: ${outcomeEmoji} ${outcome.toUpperCase()}
${historicalStr}

INSTRUCTIONS:
- Identify what worked well or what went wrong
- Extract specific, actionable insights for future tasks
- Suggest concrete improvements for similar tasks
- Focus on strategy, timing, dependencies, or priority adjustments
- Consider patterns across multiple task executions
- Keep insights concise and practical (max 200 words)
- Use clear, professional language

FORMAT: Provide learning insights as bullet points with specific recommendations.`;
  }

  /**
   * Enhanced task parsing with validation
   */
  private parseEnhancedTaskDecomposition(response: string): string[] {
    const tasks = response
      .split('\n')
      .map(line => line.trim())
      .filter(line => {
        // Remove numbering, bullets, and other formatting
        return line.length > 10 && 
               !line.match(/^\d+\.?\s*/) && // Remove "1. ", "2. " etc.
               !line.match(/^[-•*]\s*/) && // Remove "- ", "• ", "* " etc.
               !line.match(/^[ivxlcdm]+\.?\s*/i); // Remove roman numerals
      })
      .map(line => line.replace(/^[-•*]\s*/, '').trim())
      .filter(line => {
        // Filter out very short or generic responses
        return line.length >= 10 && 
               !/^(task|step|item|phase)\s*\d*/i.test(line);
      });

    // Validate tasks and provide fallback if needed
    if (tasks.length < 2) {
      console.warn('Insufficient tasks generated, adding defaults');
      tasks.push('Analyze task requirements and constraints', 'Execute primary objective actions');
    }

    return tasks;
  }

  /**
   * Validate generated content
   */
  private validateGeneratedTasks(tasks: string[], complexity: number): void {
    if (tasks.length < 2) {
      throw new Error('Generated insufficient tasks for objective');
    }
    
    if (tasks.length > 10 && complexity < 8) {
      throw new Error('Generated too many tasks for complexity level');
    }
    
    const avgLength = tasks.reduce((sum, task) => sum + task.length, 0) / tasks.length;
    if (avgLength < 15) {
      throw new Error('Generated tasks are too generic or short');
    }
  }

  private validateGeneratedStrategy(strategy: string): void {
    if (strategy.length < 50) {
      throw new Error('Generated strategy is too brief');
    }
    
    if (!strategy.includes('\n') && strategy.length > 200) {
      throw new Error('Strategy should be structured with line breaks');
    }
  }

  private validateGeneratedInsights(insights: string): void {
    if (insights.length < 30) {
      throw new Error('Generated insights are too brief');
    }
    
    // Check for actionable content
    const actionableWords = ['should', 'consider', 'recommend', 'suggest', 'improve', 'adjust'];
    const hasActionableContent = actionableWords.some(word => 
      insights.toLowerCase().includes(word)
    );
    
    if (!hasActionableContent) {
      throw new Error('Generated insights lack actionable recommendations');
    }
  }

  /**
   * Filter models for recommendation
   */
  private filterRecommendedModels(models: OpenRouterModel[]): OpenRouterModel[] {
    return models.filter(model => {
      // Prioritize free or low-cost models
      const isFree = model.pricing.prompt === "0" && model.pricing.completion === "0";
      const isLowCost = parseFloat(model.pricing.prompt) < 0.001;
      
      // Prefer well-known model families
      const preferredModels = [
        'qwen', 'wizardlm', 'llama', 'mistral', 'gemma', 'phi', 'yi'
      ];
      
      const isPreferred = preferredModels.some(name => 
        model.id.toLowerCase().includes(name)
      );
      
      // Check context length (prefer longer context for complex tasks)
      const hasGoodContext = model.context_length >= 8192;
      
      return (isFree || isLowCost) && (isPreferred || hasGoodContext);
    }).slice(0, 20); // Limit to top 20 models
  }

  /**
   * Get complexity description
   */
  private getComplexityDescription(complexity: number): string {
    if (complexity <= 2) return 'Very Simple - straightforward tasks';
    if (complexity <= 4) return 'Simple - basic tasks with clear scope';
    if (complexity <= 6) return 'Moderate - standard tasks requiring planning';
    if (complexity <= 8) return 'Complex - advanced tasks with dependencies';
    return 'Very Complex - sophisticated multi-step processes';
  }

  /**
   * Test API connection with a simple request
   */
  private async testApiConnection(apiKey: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://babyagi-pwa.minimax.chat',
          'X-Title': 'BabyAGI PWA',
        },
        body: JSON.stringify({
          model: 'qwen/qwen-2.5-7b-instruct',
          messages: [{ role: 'user', content: 'Hello' }],
          max_tokens: 10,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        return { success: false, error: `API test failed: ${response.status}` };
      }

      return { success: true };
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get service health status
   */
  getHealthStatus() {
    return {
      isHealthy: this.healthMonitor.isHealthy(),
      recentSuccessRate: this.healthMonitor.getSuccessRate(),
      lastRequestTime: this.healthMonitor.getLastRequestTime(),
      errorCounts: this.healthMonitor.getErrorCounts()
    };
  }

  /**
   * Reset health monitor
   */
  resetHealthStatus() {
    this.healthMonitor.reset();
  }
}

/**
 * Rate Limiter to prevent API abuse
 */
class RateLimiter {
  private requests: { [key: string]: number[] } = {};

  async waitForSlot(operation: string): Promise<void> {
    const now = Date.now();
    const windowMs = 60000; // 1 minute window
    const maxRequests = this.getMaxRequests(operation);

    if (!this.requests[operation]) {
      this.requests[operation] = [];
    }

    // Clean old requests outside the window
    this.requests[operation] = this.requests[operation].filter(
      time => now - time < windowMs
    );

    // Check if we can make a request
    if (this.requests[operation].length >= maxRequests) {
      const oldestRequest = Math.min(...this.requests[operation]);
      const waitTime = windowMs - (now - oldestRequest);
      
      if (waitTime > 0) {
        console.log(`Rate limit reached for ${operation}, waiting ${waitTime}ms`);
        await this.delay(waitTime);
      }
    }

    this.requests[operation].push(now);
  }

  private getMaxRequests(operation: string): number {
    const limits: { [key: string]: number } = {
      'validation': 5,
      'task_generation': 10,
      'strategy_generation': 15,
      'learning_insights': 20
    };
    
    return limits[operation] || 10;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Error Handler for categorizing and managing API errors
 */
class ErrorHandler {
  async analyzeError(response: Response): Promise<{ message: string; type: string }> {
    const status = response.status;
    
    switch (status) {
      case 401:
        return { message: 'Invalid API key. Please check your OpenRouter API key.', type: 'authentication' };
      case 403:
        return { message: 'Access forbidden. Your API key may not have permission for this endpoint.', type: 'authorization' };
      case 429:
        return { message: 'Rate limit exceeded. Please wait before making more requests.', type: 'rate_limit' };
      case 500:
        return { message: 'OpenRouter service is temporarily unavailable. Please try again later.', type: 'server_error' };
      default:
        return { message: `API error: ${status} ${response.statusText}`, type: 'unknown' };
    }
  }

  async analyzeApiError(response: Response, errorText: string): Promise<string> {
    try {
      const errorData = JSON.parse(errorText);
      return errorData.error?.message || `API Error: ${response.status}`;
    } catch {
      return `API Error: ${response.status} - ${errorText}`;
    }
  }

  categorizeError(error: any): { userMessage: string; category: string } {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return { userMessage: 'Network error. Please check your internet connection.', category: 'network' };
    }
    
    if (error.message.includes('timeout')) {
      return { userMessage: 'Request timeout. The AI service is taking too long to respond.', category: 'timeout' };
    }
    
    return { userMessage: error.message || 'An unexpected error occurred', category: 'unknown' };
  }
}

/**
 * Fallback Handler for when AI services are unavailable
 */
class FallbackHandler {
  generateTaskDecomposition(objective: string, complexity: number, context?: any): string[] {
    const title = objective.toLowerCase();
    const tasks: string[] = [];

    if (title.includes('research') || title.includes('investigate')) {
      tasks.push('Gather relevant information and sources');
      tasks.push('Analyze collected data and identify key insights');
      tasks.push('Synthesize findings into actionable recommendations');
    } else if (title.includes('build') || title.includes('create') || title.includes('develop')) {
      tasks.push('Define requirements and specifications');
      tasks.push('Create design and architecture plan');
      tasks.push('Implement core functionality');
      tasks.push('Test and validate implementation');
    } else if (title.includes('optimize') || title.includes('improve')) {
      tasks.push('Assess current state and identify bottlenecks');
      tasks.push('Research optimization opportunities');
      tasks.push('Implement and test improvements');
    } else {
      tasks.push('Break down objective into manageable components');
      tasks.push('Execute primary tasks to achieve objective');
      tasks.push('Review and validate results');
    }

    return tasks;
  }

  generateExecutionStrategy(task: string, context: string[]): string {
    return `Fallback execution strategy for: ${task}

1. Analyze task requirements and constraints
2. Break down into smaller, manageable steps
3. Identify dependencies and potential blockers
4. Execute steps systematically with progress monitoring
5. Validate results and iterate as needed

Context consideration: ${context.join(', ')}`;
  }

  generateLearningInsights(task: string, result: string, success: boolean): string {
    if (success) {
      return `✅ Successful completion of "${task}" demonstrates effective task planning and execution.

Key learnings:
• Current task decomposition approach is working well
• Execution strategy needs minor refinements for efficiency
• Consider applying similar methods to future tasks`;
    } else {
      return `❌ Task "${task}" encountered challenges requiring attention.

Key learnings:
• Task complexity may be underestimated - consider breaking into smaller steps
• Dependency management needs improvement
• Execution strategy requires revision for better success rate`;
    }
  }
}

/**
 * Health Monitor to track API performance and reliability
 */
class HealthMonitor {
  private requests: Array<{ timestamp: number; success: boolean; type: string; error?: string }> = [];
  private validationAttempts: number = 0;
  private validationSuccesses: number = 0;

  recordSuccessfulRequest(type: string): void {
    this.requests.push({ timestamp: Date.now(), success: true, type });
  }

  recordFailedRequest(type: string, error: any): void {
    this.requests.push({ 
      timestamp: Date.now(), 
      success: false, 
      type, 
      error: error.message 
    });
  }

  recordSuccessfulValidation(): void {
    this.validationAttempts++;
    this.validationSuccesses++;
  }

  recordFailedValidation(error: any): void {
    this.validationAttempts++;
  }

  isHealthy(): boolean {
    if (this.validationAttempts === 0) return true;
    const validationRate = this.validationSuccesses / this.validationAttempts;
    return validationRate > 0.5; // At least 50% validation success rate
  }

  getSuccessRate(): number {
    const recent = this.requests.filter(r => 
      Date.now() - r.timestamp < 300000 // Last 5 minutes
    );
    
    if (recent.length === 0) return 1;
    
    const successes = recent.filter(r => r.success).length;
    return successes / recent.length;
  }

  getLastRequestTime(): number | null {
    return this.requests.length > 0 ? 
      Math.max(...this.requests.map(r => r.timestamp)) : null;
  }

  getErrorCounts(): { [key: string]: number } {
    const counts: { [key: string]: number } = {};
    
    this.requests
      .filter(r => !r.success)
      .forEach(r => {
        const errorType = r.error?.includes('timeout') ? 'timeout' : 
                         r.error?.includes('rate limit') ? 'rate_limit' : 
                         r.error?.includes('network') ? 'network' : 'other';
        counts[errorType] = (counts[errorType] || 0) + 1;
      });
    
    return counts;
  }

  reset(): void {
    this.requests = [];
    this.validationAttempts = 0;
    this.validationSuccesses = 0;
  }
}

/**
 * Default configuration for enhanced OpenRouter service
 */
export const DEFAULT_ENHANCED_CONFIG: Omit<OpenRouterConfig, 'apiKey'> = {
  baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
  model: 'qwen/qwen-2.5-7b-instruct',
  maxTokens: 1000,
  temperature: 0.7,
};

/**
 * Recommended models for different use cases
 */
export const RECOMMENDED_MODELS = {
  task_decomposition: [
    'qwen/qwen-2.5-7b-instruct',
    'microsoft/wizardlm-2-8x22b',
    'meta-llama/llama-3.1-8b-instruct'
  ],
  strategy_generation: [
    'microsoft/wizardlm-2-8x22b',
    'qwen/qwen-2.5-7b-instruct',
    'meta-llama/llama-3.1-8b-instruct'
  ],
  learning_insights: [
    'qwen/qwen-2.5-7b-instruct',
    'meta-llama/llama-3.1-8b-instruct',
    'microsoft/wizardlm-2-8x22b'
  ]
};

export default EnhancedOpenRouterService;