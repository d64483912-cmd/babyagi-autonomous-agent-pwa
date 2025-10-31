import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useBabyAGIStore } from '../stores/babyagiStore';
import { ObjectiveInput } from './ObjectiveInput';
import { TaskQueue } from './TaskQueue';
import { AgentMemory } from './AgentMemory';
import { StatisticsPanel } from './StatisticsPanel';
import { ExecutionMonitor } from './ExecutionMonitor';
import Settings from './Settings';
import { 
  Brain, 
  Target, 
  CheckSquare, 
  MemoryStick, 
  BarChart3,
  Play,
  Pause,
  RotateCcw,
  Settings as SettingsIcon
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const {
    simulation,
    activeTab,
    setActiveTab,
    startSimulation,
    pauseSimulation,
    resetSimulation,
    currentObjective,
    getCurrentStatistics,
    settings
  } = useBabyAGIStore();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const statistics = getCurrentStatistics();

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Brain },
    { id: 'objectives', label: 'Objectives', icon: Target },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'memory', label: 'Memory', icon: MemoryStick },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <ObjectiveInput />
              <StatisticsPanel />
            </div>
            <div className="space-y-6">
              <ExecutionMonitor />
              <TaskQueue />
            </div>
          </div>
        );
      case 'objectives':
        return <div className="space-y-6"><ObjectiveInput /></div>;
      case 'tasks':
        return <div className="space-y-6"><TaskQueue /></div>;
      case 'memory':
        return <div className="space-y-6"><AgentMemory /></div>;
      case 'analytics':
        return <div className="space-y-6"><StatisticsPanel /></div>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">BabyAGI Simulator</h1>
                {settings.useOpenRouter && settings.openRouterApiKey && (
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-xs text-green-400">AI Powered</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Simulation Controls */}
            <div className="flex items-center space-x-4">
              {simulation.isRunning && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center space-x-2 text-green-400"
                >
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Simulation Running</span>
                </motion.div>
              )}
              
              <div className="flex items-center space-x-2">
                {simulation.isRunning ? (
                  <button
                    onClick={pauseSimulation}
                    className="flex items-center space-x-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
                  >
                    <Pause className="w-4 h-4" />
                    <span>Pause</span>
                  </button>
                ) : (
                  <button
                    onClick={() => currentObjective && startSimulation(currentObjective.id)}
                    disabled={!currentObjective || simulation.isRunning}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    <span>Start</span>
                  </button>
                )}
                
                <button
                  onClick={resetSimulation}
                  className="flex items-center space-x-2 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset</span>
                </button>

                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="flex items-center space-x-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                >
                  <SettingsIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-slate-800/30 backdrop-blur-sm border-b border-slate-700/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    isActive
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {renderTabContent()}
        </motion.div>
      </main>

      {/* Current Objective Banner */}
      {currentObjective && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-800/90 backdrop-blur-sm border border-slate-600 rounded-lg p-4 shadow-xl max-w-md"
        >
          <div className="flex items-center space-x-3">
            <Target className="w-5 h-5 text-blue-400" />
            <div>
              <p className="text-white font-medium">{currentObjective.title}</p>
              <p className="text-slate-400 text-sm">{currentObjective.description}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Settings Modal */}
      <Settings 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </div>
  );
};