import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBabyAGIStore } from '../stores/babyagiStore';
import { OpenRouterService, DEFAULT_MODELS, DEFAULT_OPENROUTER_CONFIG } from '../lib/openRouterService';
import { APIKeyValidationResult, OpenRouterModel } from '../types/babyagi';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const Settings: React.FC<SettingsProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings } = useBabyAGIStore();
  const [localSettings, setLocalSettings] = useState(settings);
  const [apiKey, setApiKey] = useState(settings.openRouterApiKey || '');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<APIKeyValidationResult | null>(null);
  const [availableModels, setAvailableModels] = useState<OpenRouterModel[]>(DEFAULT_MODELS);
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
    setApiKey(settings.openRouterApiKey || '');
  }, [settings]);

  const handleValidateApiKey = async () => {
    if (!apiKey.trim()) {
      setValidationResult({ isValid: false, error: 'API key is required' });
      return;
    }

    setIsValidating(true);
    setValidationResult(null);

    try {
      const service = new OpenRouterService({
        ...DEFAULT_OPENROUTER_CONFIG,
        apiKey: apiKey.trim(),
      });

      const result = await service.validateApiKey(apiKey.trim());
      setValidationResult(result);

      if (result.isValid && result.models) {
        setAvailableModels([...DEFAULT_MODELS, ...result.models]);
      }
    } catch (error) {
      setValidationResult({
        isValid: false,
        error: error instanceof Error ? error.message : 'Validation failed',
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleSave = () => {
    const updatedSettings = {
      ...localSettings,
      openRouterApiKey: validationResult?.isValid ? apiKey.trim() : undefined,
    };
    
    updateSettings(updatedSettings);
    onClose();
  };

  const handleReset = () => {
    setLocalSettings(settings);
    setApiKey(settings.openRouterApiKey || '');
    setValidationResult(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-4 md:inset-8 lg:inset-16 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              
              {/* OpenRouter API Configuration */}
              <section className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI Integration</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Connect to OpenRouter for real AI-powered task generation</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="useOpenRouter"
                      checked={localSettings.useOpenRouter}
                      onChange={(e) => setLocalSettings({ ...localSettings, useOpenRouter: e.target.checked })}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <label htmlFor="useOpenRouter" className="text-sm font-medium text-gray-900 dark:text-white">
                      Enable OpenRouter AI Integration
                    </label>
                  </div>

                  {localSettings.useOpenRouter && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4 pl-7"
                    >
                      {/* API Key Input */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          OpenRouter API Key
                        </label>
                        <div className="relative">
                          <input
                            type={showApiKey ? 'text' : 'password'}
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="sk-or-..."
                            className="w-full px-3 py-2 pr-20 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center space-x-1 pr-3">
                            <button
                              type="button"
                              onClick={() => setShowApiKey(!showApiKey)}
                              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                              {showApiKey ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Get your free API key from{' '}
                            <a
                              href="https://openrouter.ai/keys"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              OpenRouter
                            </a>
                          </p>
                          <button
                            onClick={handleValidateApiKey}
                            disabled={isValidating || !apiKey.trim()}
                            className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isValidating ? 'Validating...' : 'Validate'}
                          </button>
                        </div>

                        {/* Validation Result */}
                        {validationResult && (
                          <div className={`mt-2 p-3 rounded-lg text-sm ${
                            validationResult.isValid
                              ? 'bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800'
                              : 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800'
                          }`}>
                            {validationResult.isValid ? (
                              <div className="flex items-center space-x-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>API key is valid! {validationResult.models?.length || 0} models available.</span>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                <span>{validationResult.error}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Model Selection */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          AI Model
                        </label>
                        <select
                          value={localSettings.selectedModel}
                          onChange={(e) => setLocalSettings({ ...localSettings, selectedModel: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                        >
                          {availableModels.map((model) => (
                            <option key={model.id} value={model.id}>
                              {model.name} {model.pricing.prompt === '0' && '(Free)'}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Fallback Option */}
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="fallbackToSimulation"
                          checked={localSettings.fallbackToSimulation}
                          onChange={(e) => setLocalSettings({ ...localSettings, fallbackToSimulation: e.target.checked })}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                        />
                        <label htmlFor="fallbackToSimulation" className="text-sm text-gray-700 dark:text-gray-300">
                          Fall back to simulation if API fails
                        </label>
                      </div>
                    </motion.div>
                  )}
                </div>
              </section>

              {/* General Settings */}
              <section className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Simulation Settings</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Configure BabyAGI behavior and preferences</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Simulation Speed */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Simulation Speed
                    </label>
                    <select
                      value={localSettings.simulationSpeed}
                      onChange={(e) => setLocalSettings({ ...localSettings, simulationSpeed: e.target.value as 'slow' | 'normal' | 'fast' })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                    >
                      <option value="slow">Slow (3s per task)</option>
                      <option value="normal">Normal (2s per task)</option>
                      <option value="fast">Fast (1s per task)</option>
                    </select>
                  </div>

                  {/* Max Iterations */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Max Iterations
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={100}
                      value={localSettings.maxIterations}
                      onChange={(e) => setLocalSettings({ ...localSettings, maxIterations: parseInt(e.target.value) || 10 })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                </div>

                {/* Toggle Settings */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Auto-execute tasks
                    </label>
                    <button
                      type="button"
                      onClick={() => setLocalSettings({ ...localSettings, autoExecute: !localSettings.autoExecute })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        localSettings.autoExecute ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          localSettings.autoExecute ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Show detailed logs
                    </label>
                    <button
                      type="button"
                      onClick={() => setLocalSettings({ ...localSettings, showDetailedLogs: !localSettings.showDetailedLogs })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        localSettings.showDetailedLogs ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          localSettings.showDetailedLogs ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Enable animations
                    </label>
                    <button
                      type="button"
                      onClick={() => setLocalSettings({ ...localSettings, enableAnimations: !localSettings.enableAnimations })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        localSettings.enableAnimations ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          localSettings.enableAnimations ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </section>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <button
                onClick={handleReset}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Reset
              </button>
              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Settings;