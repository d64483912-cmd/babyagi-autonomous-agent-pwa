import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { AppSettings, OpenRouterModel, APIKeyValidationResult } from '../types/babyagi';
import { immer } from 'zustand/middleware/immer';

// Types for settings store state
interface SettingsState {
  // Core settings
  settings: AppSettings;
  
  // API and model configuration
  availableModels: OpenRouterModel[];
  selectedModel: OpenRouterModel | null;
  apiKeyValidation: APIKeyValidationResult | null;
  
  // Validation and connection status
  isValidatingKey: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'validating' | 'error';
  lastValidationTime: Date | null;
  validationError: string | null;
  
  // UI preferences
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  dateFormat: string;
  numberFormat: string;
  
  // Notification preferences
  notifications: {
    enabled: boolean;
    taskCompletion: boolean;
    objectiveCompletion: boolean;
    errors: boolean;
    learningInsights: boolean;
    soundEnabled: boolean;
    desktopNotifications: boolean;
  };
  
  // Privacy and data settings
  privacy: {
    shareAnalytics: boolean;
    storeExecutionData: boolean;
    enableTelemetry: boolean;
    dataRetentionDays: number;
  };
  
  // Performance settings
  performance: {
    maxConcurrentTasks: number;
    autoSaveInterval: number; // in seconds
    enableCaching: boolean;
    cacheSize: number; // in MB
    maxRetries: number;
    timeoutDuration: number; // in seconds
  };
  
  // UI state
  isLoading: boolean;
  error: string | null;
  hasUnsavedChanges: boolean;
  settingsVersion: string;
}

// Types for settings store actions
interface SettingsActions {
  // Core settings management
  updateSettings: (updates: Partial<AppSettings>) => void;
  resetSettings: () => void;
  importSettings: (settings: Partial<AppSettings>) => void;
  exportSettings: () => string;
  
  // API and model management
  setApiKey: (apiKey: string) => Promise<void>;
  validateApiKey: () => Promise<APIKeyValidationResult>;
  setSelectedModel: (modelId: string) => void;
  loadAvailableModels: () => Promise<void>;
  testConnection: () => Promise<boolean>;
  
  // Model configuration
  updateModelSettings: (settings: {
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
  }) => void;
  resetModelSettings: () => void;
  
  // UI preferences
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setLanguage: (language: string) => void;
  setTimezone: (timezone: string) => void;
  setDateFormat: (format: string) => void;
  setNumberFormat: (format: string) => void;
  
  // Notification management
  updateNotificationSettings: (settings: Partial<SettingsState['notifications']>) => void;
  testNotification: (type: keyof SettingsState['notifications']) => void;
  requestNotificationPermission: () => Promise<boolean>;
  
  // Privacy and data settings
  updatePrivacySettings: (settings: Partial<SettingsState['privacy']>) => void;
  clearUserData: (dataTypes: ('tasks' | 'objectives' | 'results' | 'memory')[]) => Promise<void>;
  exportUserData: (dataTypes: ('tasks' | 'objectives' | 'results' | 'memory')[]) => Promise<string>;
  
  // Performance optimization
  updatePerformanceSettings: (settings: Partial<SettingsState['performance']>) => void;
  optimizePerformance: () => Promise<void>;
  clearCache: () => void;
  
  // Validation and error handling
  validateSettings: () => { isValid: boolean; errors: string[] };
  clearError: () => void;
  setLoading: (isLoading: boolean) => void;
  
  // State management
  markAsSaved: () => void;
  markAsModified: () => void;
  revertChanges: () => void;
  
  // Computed getters
  getSettings: () => AppSettings;
  getValidationStatus: () => {
    isValid: boolean;
    needsValidation: boolean;
    lastChecked: Date | null;
  };
  getEffectiveSettings: () => AppSettings & {
    resolvedTheme: 'light' | 'dark';
  };
  
  // Preset management
  savePreset: (name: string, preset: Partial<AppSettings>) => void;
  loadPreset: (name: string) => void;
  deletePreset: (name: string) => void;
  getPresets: () => Record<string, Partial<AppSettings>>;
}

// Combined store type
type SettingsStore = SettingsState & SettingsActions;

// Default settings
const createDefaultSettings = (): AppSettings => ({
  simulationSpeed: 'normal',
  autoExecute: false,
  showDetailedLogs: true,
  enableAnimations: true,
  maxIterations: 10,
  useOpenRouter: false,
  openRouterApiKey: undefined,
  selectedModel: 'qwen/qwen-2.5-7b-instruct',
  fallbackToSimulation: true
});

// Default state
const createDefaultState = (): Omit<SettingsState, keyof SettingsActions> => ({
  settings: createDefaultSettings(),
  availableModels: [],
  selectedModel: null,
  apiKeyValidation: null,
  isValidatingKey: false,
  connectionStatus: 'disconnected',
  lastValidationTime: null,
  validationError: null,
  theme: 'system',
  language: 'en',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  dateFormat: 'MM/dd/yyyy',
  numberFormat: 'en-US',
  notifications: {
    enabled: true,
    taskCompletion: true,
    objectiveCompletion: true,
    errors: true,
    learningInsights: false,
    soundEnabled: true,
    desktopNotifications: false
  },
  privacy: {
    shareAnalytics: false,
    storeExecutionData: true,
    enableTelemetry: true,
    dataRetentionDays: 30
  },
  performance: {
    maxConcurrentTasks: 3,
    autoSaveInterval: 30,
    enableCaching: true,
    cacheSize: 50,
    maxRetries: 3,
    timeoutDuration: 300
  },
  isLoading: false,
  error: null,
  hasUnsavedChanges: false,
  settingsVersion: '1.0.0'
});

// Store implementation
export const useSettingsStore = create<SettingsStore>()(
  persist(
    immer((set, get) => ({
      ...createDefaultState(),

      // Core settings management
      updateSettings: (updates) => {
        set((state) => {
          state.settings = { ...state.settings, ...updates };
          state.hasUnsavedChanges = true;
        });
      },

      resetSettings: () => {
        set((state) => {
          state.settings = createDefaultSettings();
          state.hasUnsavedChanges = true;
        });
      },

      importSettings: (settingsData) => {
        set((state) => {
          state.settings = { ...createDefaultSettings(), ...settingsData };
          state.hasUnsavedChanges = true;
        });
      },

      exportSettings: () => {
        const { settings } = get();
        return JSON.stringify(settings, null, 2);
      },

      // API and model management
      setApiKey: async (apiKey) => {
        set((state) => {
          state.isValidatingKey = true;
          state.validationError = null;
        });

        try {
          const response = await fetch('/api/validate-key', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ apiKey })
          });

          if (!response.ok) {
            throw new Error(`Validation failed: ${response.statusText}`);
          }

          const validationResult: APIKeyValidationResult = await response.json();
          
          set((state) => {
            state.settings.openRouterApiKey = apiKey;
            state.apiKeyValidation = validationResult;
            state.lastValidationTime = new Date();
            state.connectionStatus = validationResult.isValid ? 'connected' : 'error';
            state.hasUnsavedChanges = true;
          });

          if (validationResult.isValid) {
            await get().loadAvailableModels();
          }
        } catch (error) {
          set((state) => {
            state.validationError = error instanceof Error ? error.message : 'Failed to validate API key';
            state.connectionStatus = 'error';
          });
        } finally {
          set((state) => {
            state.isValidatingKey = false;
          });
        }
      },

      validateApiKey: async () => {
        const { settings } = get();
        if (!settings.openRouterApiKey) {
          throw new Error('No API key provided');
        }

        set((state) => {
          state.isValidatingKey = true;
          state.validationError = null;
        });

        try {
          const response = await fetch('https://openrouter.ai/api/v1/models', {
            headers: {
              'Authorization': `Bearer ${settings.openRouterApiKey}`,
              'HTTP-Referer': window.location.origin,
              'X-Title': 'BabyAGI PWA'
            }
          });

          const validationResult: APIKeyValidationResult = {
            isValid: response.ok,
            error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`,
            models: response.ok ? await response.json() : undefined
          };

          set((state) => {
            state.apiKeyValidation = validationResult;
            state.lastValidationTime = new Date();
            state.connectionStatus = validationResult.isValid ? 'connected' : 'error';
          });

          return validationResult;
        } catch (error) {
          const validationResult: APIKeyValidationResult = {
            isValid: false,
            error: error instanceof Error ? error.message : 'Network error'
          };

          set((state) => {
            state.apiKeyValidation = validationResult;
            state.connectionStatus = 'error';
          });

          return validationResult;
        } finally {
          set((state) => {
            state.isValidatingKey = false;
          });
        }
      },

      setSelectedModel: (modelId) => {
        const { availableModels, selectedModel } = get();
        const model = availableModels.find(m => m.id === modelId);
        
        if (model) {
          set((state) => {
            state.selectedModel = model;
            state.settings.selectedModel = modelId;
            state.hasUnsavedChanges = true;
          });
        }
      },

      loadAvailableModels: async () => {
        const { settings } = get();
        if (!settings.openRouterApiKey) {
          throw new Error('API key required to load models');
        }

        set((state) => {
          state.isLoading = true;
        });

        try {
          const response = await fetch('https://openrouter.ai/api/v1/models', {
            headers: {
              'Authorization': `Bearer ${settings.openRouterApiKey}`,
              'HTTP-Referer': window.location.origin,
              'X-Title': 'BabyAGI PWA'
            }
          });

          if (!response.ok) {
            throw new Error(`Failed to load models: ${response.statusText}`);
          }

          const models: OpenRouterModel[] = await response.json();
          
          set((state) => {
            state.availableModels = models;
            
            // Auto-select a model if none is selected
            if (!state.selectedModel && models.length > 0) {
              const defaultModel = models.find(m => 
                m.id.includes('qwen') || m.id.includes('gpt')
              ) || models[0];
              
              state.selectedModel = defaultModel;
              state.settings.selectedModel = defaultModel.id;
            }
          });
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Failed to load models';
          });
        } finally {
          set((state) => {
            state.isLoading = false;
          });
        }
      },

      testConnection: async () => {
        const { settings } = get();
        if (!settings.openRouterApiKey) {
          return false;
        }

        try {
          const response = await fetch('https://openrouter.ai/api/v1/models', {
            headers: {
              'Authorization': `Bearer ${settings.openRouterApiKey}`,
              'HTTP-Referer': window.location.origin,
              'X-Title': 'BabyAGI PWA'
            }
          });

          const isConnected = response.ok;
          set((state) => {
            state.connectionStatus = isConnected ? 'connected' : 'error';
          });

          return isConnected;
        } catch (error) {
          set((state) => {
            state.connectionStatus = 'error';
          });
          return false;
        }
      },

      // Model configuration
      updateModelSettings: (modelSettings) => {
        set((state) => {
          // Update model-specific settings in metadata
          state.settings = {
            ...state.settings,
            // Store additional model settings in a metadata field
            // This would need to be added to the AppSettings type
          };
          state.hasUnsavedChanges = true;
        });
      },

      resetModelSettings: () => {
        set((state) => {
          // Reset model settings to defaults
          state.hasUnsavedChanges = true;
        });
      },

      // UI preferences
      setTheme: (theme) => {
        set((state) => {
          state.theme = theme;
          state.hasUnsavedChanges = true;
        });

        // Apply theme immediately
        const root = document.documentElement;
        if (theme === 'dark') {
          root.classList.add('dark');
        } else if (theme === 'light') {
          root.classList.remove('dark');
        } else {
          // System theme
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          if (prefersDark) {
            root.classList.add('dark');
          } else {
            root.classList.remove('dark');
          }
        }
      },

      setLanguage: (language) => {
        set((state) => {
          state.language = language;
          state.hasUnsavedChanges = true;
        });
      },

      setTimezone: (timezone) => {
        set((state) => {
          state.timezone = timezone;
          state.hasUnsavedChanges = true;
        });
      },

      setDateFormat: (format) => {
        set((state) => {
          state.dateFormat = format;
          state.hasUnsavedChanges = true;
        });
      },

      setNumberFormat: (format) => {
        set((state) => {
          state.numberFormat = format;
          state.hasUnsavedChanges = true;
        });
      },

      // Notification management
      updateNotificationSettings: (notificationSettings) => {
        set((state) => {
          state.notifications = { ...state.notifications, ...notificationSettings };
          state.hasUnsavedChanges = true;
        });
      },

      testNotification: (type) => {
        const { notifications } = get();
        if (!notifications.enabled) return;

        switch (type) {
          case 'taskCompletion':
            // Show test notification
            break;
          case 'objectiveCompletion':
            // Show test notification
            break;
          case 'errors':
            // Show test error notification
            break;
          case 'learningInsights':
            // Show test insight notification
            break;
        }
      },

      requestNotificationPermission: async () => {
        if (!('Notification' in window)) {
          return false;
        }

        if (Notification.permission === 'granted') {
          return true;
        }

        const permission = await Notification.requestPermission();
        const granted = permission === 'granted';
        
        set((state) => {
          state.notifications.desktopNotifications = granted;
        });

        return granted;
      },

      // Privacy and data settings
      updatePrivacySettings: (privacySettings) => {
        set((state) => {
          state.privacy = { ...state.privacy, ...privacySettings };
          state.hasUnsavedChanges = true;
        });
      },

      clearUserData: async (dataTypes) => {
        set((state) => {
          state.isLoading = true;
        });

        try {
          // Implementation would clear specified data types from storage
          // This would need to coordinate with other stores
        } catch (error) {
          set((state) => {
            state.error = 'Failed to clear user data';
          });
        } finally {
          set((state) => {
            state.isLoading = false;
          });
        }
      },

      exportUserData: async (dataTypes) => {
        set((state) => {
          state.isLoading = true;
        });

        try {
          // Implementation would gather and export specified data types
          const data = {
            exportedAt: new Date().toISOString(),
            dataTypes,
            // ... data from various stores
          };
          
          return JSON.stringify(data, null, 2);
        } finally {
          set((state) => {
            state.isLoading = false;
          });
        }
      },

      // Performance optimization
      updatePerformanceSettings: (performanceSettings) => {
        set((state) => {
          state.performance = { ...state.performance, ...performanceSettings };
          state.hasUnsavedChanges = true;
        });
      },

      optimizePerformance: async () => {
        set((state) => {
          state.isLoading = true;
        });

        try {
          // Implementation would optimize performance based on current usage
          await get().clearCache();
        } finally {
          set((state) => {
            state.isLoading = false;
          });
        }
      },

      clearCache: () => {
        // Implementation would clear caches and temporary data
      },

      // Validation and error handling
      validateSettings: () => {
        const { settings, availableModels, connectionStatus } = get();
        const errors: string[] = [];

        // Validate required fields
        if (!settings.selectedModel) {
          errors.push('No model selected');
        }

        if (settings.useOpenRouter && !settings.openRouterApiKey) {
          errors.push('OpenRouter API key required when using OpenRouter');
        }

        if (settings.maxIterations < 1 || settings.maxIterations > 1000) {
          errors.push('Max iterations must be between 1 and 1000');
        }

        // Validate connection if using OpenRouter
        if (settings.useOpenRouter && connectionStatus === 'error') {
          errors.push('OpenRouter connection failed');
        }

        // Validate model availability
        if (settings.useOpenRouter && availableModels.length === 0) {
          errors.push('No available models found');
        }

        return {
          isValid: errors.length === 0,
          errors
        };
      },

      clearError: () => {
        set((state) => {
          state.error = null;
        });
      },

      setLoading: (isLoading) => {
        set((state) => {
          state.isLoading = isLoading;
        });
      },

      // State management
      markAsSaved: () => {
        set((state) => {
          state.hasUnsavedChanges = false;
        });
      },

      markAsModified: () => {
        set((state) => {
          state.hasUnsavedChanges = true;
        });
      },

      revertChanges: () => {
        set((state) => {
          // Reset to last saved state
          state.hasUnsavedChanges = false;
        });
      },

      // Computed getters
      getSettings: () => {
        return get().settings;
      },

      getValidationStatus: () => {
        const { lastValidationTime, connectionStatus } = get();
        const now = new Date();
        const isRecent = lastValidationTime && 
          (now.getTime() - lastValidationTime.getTime()) < 5 * 60 * 1000; // 5 minutes

        return {
          isValid: connectionStatus === 'connected',
          needsValidation: !isRecent || connectionStatus === 'error',
          lastChecked: lastValidationTime
        };
      },

      getEffectiveSettings: () => {
        const { settings, theme } = get();
        const resolvedTheme = theme === 'system' 
          ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
          : theme;

        return {
          ...settings,
          resolvedTheme
        };
      },

      // Preset management
      savePreset: (name, preset) => {
        const presets = get().getPresets();
        set((state) => {
          // Store presets in localStorage or state
          localStorage.setItem(`settings-preset-${name}`, JSON.stringify(preset));
        });
      },

      loadPreset: (name) => {
        try {
          const presetData = localStorage.getItem(`settings-preset-${name}`);
          if (presetData) {
            const preset = JSON.parse(presetData);
            get().importSettings(preset);
          }
        } catch (error) {
          set((state) => {
            state.error = 'Failed to load preset';
          });
        }
      },

      deletePreset: (name) => {
        localStorage.removeItem(`settings-preset-${name}`);
      },

      getPresets: () => {
        const presets: Record<string, Partial<AppSettings>> = {};
        // Load presets from localStorage
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith('settings-preset-')) {
            const name = key.replace('settings-preset-', '');
            try {
              const presetData = localStorage.getItem(key);
              if (presetData) {
                presets[name] = JSON.parse(presetData);
              }
            } catch (error) {
              // Skip invalid presets
            }
          }
        }
        return presets;
      }
    })),
    {
      name: 'settings-store',
      partialize: (state) => ({
        settings: state.settings,
        theme: state.theme,
        language: state.language,
        timezone: state.timezone,
        dateFormat: state.dateFormat,
        numberFormat: state.numberFormat,
        notifications: state.notifications,
        privacy: state.privacy,
        performance: state.performance,
        settingsVersion: state.settingsVersion
      })
    }
  ),
  subscribeWithSelector
);
