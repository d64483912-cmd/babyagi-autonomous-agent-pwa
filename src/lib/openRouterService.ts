import { OpenRouterConfig, OpenRouterResponse, OpenRouterModel, APIKeyValidationResult } from '../types/babyagi';

export class OpenRouterService {
  private config: OpenRouterConfig;

  constructor(config: OpenRouterConfig) {
    this.config = config;
  }

  /**
   * Update the configuration
   */
  updateConfig(config: Partial<OpenRouterConfig>) {
    this.config = { ...this.config, ...config };
  }

  /**
   * Validate API key and fetch available models
   */
  async validateApiKey(apiKey: string): Promise<APIKeyValidationResult> {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          return { isValid: false, error: 'Invalid API key' };
        }
        return { isValid: false, error: `API error: ${response.status}` };
      }

      const data = await response.json();
      const models = data.data || [];
      
      return { 
        isValid: true, 
        models: models.filter((model: OpenRouterModel) => 
          // Filter for free models and popular ones
          model.pricing.prompt === "0" || 
          model.id.includes('qwen') || 
          model.id.includes('wizardlm') ||
          model.id.includes('llama') ||
          model.id.includes('mistral')
        )
      };
    } catch (error) {
      return { 
        isValid: false, 
        error: error instanceof Error ? error.message : 'Network error' 
      };
    }
  }

  /**
   * Generate task decomposition using OpenRouter AI
   */
  async generateTaskDecomposition(objective: string, complexity: number): Promise<string[]> {
    const prompt = this.buildTaskDecompositionPrompt(objective, complexity);
    
    try {
      const response = await this.makeRequest(prompt);
      return this.parseTaskDecomposition(response.choices[0].message.content);
    } catch (error) {
      console.error('OpenRouter API error:', error);
      throw new Error('Failed to generate task decomposition');
    }
  }

  /**
   * Generate task execution strategy using OpenRouter AI
   */
  async generateExecutionStrategy(task: string, context: string[]): Promise<string> {
    const prompt = this.buildExecutionStrategyPrompt(task, context);
    
    try {
      const response = await this.makeRequest(prompt);
      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error('OpenRouter API error:', error);
      throw new Error('Failed to generate execution strategy');
    }
  }

  /**
   * Generate learning insights from task results
   */
  async generateLearningInsights(task: string, result: string, success: boolean): Promise<string> {
    const prompt = this.buildLearningInsightsPrompt(task, result, success);
    
    try {
      const response = await this.makeRequest(prompt);
      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error('OpenRouter API error:', error);
      throw new Error('Failed to generate learning insights');
    }
  }

  /**
   * Make a request to OpenRouter API
   */
  private async makeRequest(prompt: string): Promise<OpenRouterResponse> {
    const response = await fetch(this.config.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://babyagi-pwa.vercel.app',
        'X-Title': 'BabyAGI PWA',
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
    }

    return await response.json();
  }

  /**
   * Build prompt for task decomposition
   */
  private buildTaskDecompositionPrompt(objective: string, complexity: number): string {
    return `You are BabyAGI, an autonomous task management AI. Break down the following objective into specific, actionable subtasks.

Objective: ${objective}
Complexity Level: ${complexity}/10

Instructions:
- Create 3-8 subtasks depending on complexity
- Each task should be specific and measurable
- Order tasks logically based on dependencies
- Keep tasks focused and actionable
- Return only the task list, one task per line, without numbering

Example format:
Research target market and competitors
Define core features and requirements
Create wireframes and user flow diagrams
Set up development environment
Implement basic functionality`;
  }

  /**
   * Build prompt for execution strategy
   */
  private buildExecutionStrategyPrompt(task: string, context: string[]): string {
    const contextStr = context.length > 0 ? `\nContext from previous tasks:\n${context.join('\n')}` : '';
    
    return `You are BabyAGI executing a specific task. Provide a detailed execution strategy for this task.

Task: ${task}${contextStr}

Instructions:
- Provide a step-by-step execution plan
- Consider dependencies and prerequisites
- Estimate time and resources needed
- Identify potential challenges and solutions
- Keep the response concise but comprehensive (max 200 words)`;
  }

  /**
   * Build prompt for learning insights
   */
  private buildLearningInsightsPrompt(task: string, result: string, success: boolean): string {
    const outcome = success ? 'successful' : 'failed';
    
    return `You are BabyAGI analyzing a completed task. Generate learning insights from this ${outcome} task execution.

Task: ${task}
Result: ${result}
Success: ${success}

Instructions:
- Identify what worked well or what went wrong
- Extract actionable insights for future tasks
- Suggest improvements for similar tasks
- Focus on strategy, timing, or dependencies
- Keep the response concise (max 150 words)`;
  }

  /**
   * Parse task decomposition response into array
   */
  private parseTaskDecomposition(response: string): string[] {
    return response
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.match(/^\d+\.?\s*/))
      .map(line => line.replace(/^[-•*]\s*/, '').trim())
      .filter(line => line.length > 10); // Filter out very short responses
  }
}

/**
 * Default OpenRouter models for the app
 */
export const DEFAULT_MODELS = [
  {
    id: 'qwen/qwen-2.5-7b-instruct',
    name: 'Qwen 2.5 7B Instruct',
    description: 'High-quality free model from Alibaba',
    pricing: { prompt: '0', completion: '0' },
    context_length: 32768,
    architecture: { modality: 'text', tokenizer: 'qwen2' },
    top_provider: { is_moderated: false }
  },
  {
    id: 'microsoft/wizardlm-2-8x22b',
    name: 'WizardLM 2 8x22B',
    description: 'Advanced reasoning model from Microsoft',
    pricing: { prompt: '0', completion: '0' },
    context_length: 65536,
    architecture: { modality: 'text', tokenizer: 'llama' },
    top_provider: { is_moderated: false }
  },
  {
    id: 'meta-llama/llama-3.1-8b-instruct',
    name: 'Llama 3.1 8B Instruct',
    description: 'Meta\'s latest instruction-tuned model',
    pricing: { prompt: '0', completion: '0' },
    context_length: 131072,
    architecture: { modality: 'text', tokenizer: 'llama3' },
    top_provider: { is_moderated: false }
  }
];

/**
 * Default configuration for OpenRouter
 */
export const DEFAULT_OPENROUTER_CONFIG: Omit<OpenRouterConfig, 'apiKey'> = {
  baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
  model: 'qwen/qwen-2.5-7b-instruct',
  maxTokens: 1000,
  temperature: 0.7,
};