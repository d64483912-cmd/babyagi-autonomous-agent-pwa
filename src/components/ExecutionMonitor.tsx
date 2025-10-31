import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useBabyAGIStore } from '../stores/babyagiStore';
import { Play, Pause, Activity, Clock, CheckCircle, AlertCircle, Cpu } from 'lucide-react';

export const ExecutionMonitor: React.FC = () => {
  const { simulation, currentObjective } = useBabyAGIStore();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [executionLogs, setExecutionLogs] = useState<Array<{
    timestamp: Date;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
  }>>([]);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Simulate execution logs
  useEffect(() => {
    if (simulation.isRunning) {
      const interval = setInterval(() => {
        const messages = [
          'Analyzing objective complexity...',
          'Decomposing objective into tasks...',
          'Evaluating task dependencies...',
          'Executing next available task...',
          'Updating task progress...',
          'Generating learning insights...',
          'Checking objective completion...',
          'Adapting strategy based on results...'
        ];
        
        const types: ('info' | 'success' | 'warning' | 'error')[] = ['info', 'success', 'warning'];
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        const randomType = types[Math.floor(Math.random() * types.length)];
        
        setExecutionLogs(prev => [
          ...prev.slice(-9), // Keep only last 10 logs
          {
            timestamp: new Date(),
            message: randomMessage,
            type: randomType
          }
        ]);
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [simulation.isRunning]);

  // Clear logs when simulation stops
  useEffect(() => {
    if (!simulation.isRunning && executionLogs.length > 0) {
      setTimeout(() => {
        setExecutionLogs([]);
      }, 2000);
    }
  }, [simulation.isRunning]);

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-400" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Activity className="w-4 h-4 text-blue-400" />;
    }
  };

  const getLogColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-600/20 border-green-500/50 text-green-400';
      case 'warning':
        return 'bg-yellow-600/20 border-yellow-500/50 text-yellow-400';
      case 'error':
        return 'bg-red-600/20 border-red-500/50 text-red-400';
      default:
        return 'bg-blue-600/20 border-blue-500/50 text-blue-400';
    }
  };

  const getSimulationDuration = () => {
    if (!simulation.isRunning) return '00:00';
    
    const startTime = simulation.startTime || new Date();
    const duration = Math.floor((currentTime.getTime() - startTime.getTime()) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    if (simulation.totalIterations === 0) return 0;
    return Math.round((simulation.currentIteration / simulation.totalIterations) * 100);
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Activity className="w-6 h-6 text-blue-400" />
          <h2 className="text-xl font-bold text-white">Execution Monitor</h2>
        </div>
        
        <div className="flex items-center space-x-2">
          {simulation.isRunning ? (
            <div className="flex items-center space-x-2 text-green-400">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Active</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-slate-400">
              <Pause className="w-4 h-4" />
              <span className="text-sm font-medium">Paused</span>
            </div>
          )}
        </div>
      </div>

      {/* Current Objective Status */}
      <div className="mb-6 p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center space-x-2">
          <Cpu className="w-5 h-5 text-purple-400" />
          <span>Current Objective</span>
        </h3>
        
        {currentObjective ? (
          <div>
            <h4 className="font-medium text-white mb-2">{currentObjective.title}</h4>
            <p className="text-sm text-slate-400 mb-3">{currentObjective.description}</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-slate-500">Status:</span>
                <div className="text-white capitalize">{currentObjective.status}</div>
              </div>
              <div>
                <span className="text-slate-500">Complexity:</span>
                <div className="text-white">{currentObjective.complexity}/10</div>
              </div>
              <div>
                <span className="text-slate-500">Tasks:</span>
                <div className="text-white">{currentObjective.subtasks.length}</div>
              </div>
              <div>
                <span className="text-slate-500">Progress:</span>
                <div className="text-white">{getProgressPercentage()}%</div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-4">
              <div className="w-full bg-slate-700 rounded-full h-2">
                <motion.div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${getProgressPercentage()}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-slate-400">
            <p>No objective selected</p>
            <p className="text-sm">Select an objective to start monitoring</p>
          </div>
        )}
      </div>

      {/* Simulation Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-white">Simulation Progress</h3>
          <div className="text-sm text-slate-400">
            Iteration {simulation.currentIteration} of {simulation.totalIterations}
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Execution Time</span>
            <span className="text-white font-mono">{getSimulationDuration()}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Current Iteration</span>
            <span className="text-white">{simulation.currentIteration}/{simulation.totalIterations}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Tasks in Queue</span>
            <span className="text-white">{simulation.executionQueue.length}</span>
          </div>
        </div>
      </div>

      {/* Execution Logs */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center space-x-2">
          <Clock className="w-5 h-5 text-slate-400" />
          <span>Real-time Execution Log</span>
        </h3>
        
        <div className="max-h-64 overflow-y-auto space-y-2">
          {executionLogs.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No execution logs yet</p>
              <p className="text-sm">Start the simulation to see real-time activity</p>
            </div>
          ) : (
            executionLogs.map((log, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`p-3 border rounded-lg ${getLogColor(log.type)}`}
              >
                <div className="flex items-start space-x-3">
                  {getLogIcon(log.type)}
                  <div className="flex-1">
                    <p className="text-sm">{log.message}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {log.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
        
        {simulation.isRunning && (
          <div className="mt-4 flex items-center justify-center">
            <div className="flex items-center space-x-2 text-blue-400">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <span className="text-sm">Processing...</span>
            </div>
          </div>
        )}
      </div>

      {/* Performance Metrics */}
      <div className="mt-6 pt-6 border-t border-slate-700/50">
        <h3 className="text-lg font-semibold text-white mb-4">Performance Metrics</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">
              {simulation.executionQueue.length}
            </div>
            <div className="text-sm text-slate-400">Active Tasks</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">
              {Math.floor(Math.random() * 100)}%
            </div>
            <div className="text-sm text-slate-400">CPU Usage</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">
              {Math.floor(Math.random() * 50)}ms
            </div>
            <div className="text-sm text-slate-400">Avg Response</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-400">
              {Math.floor(Math.random() * 1000)}
            </div>
            <div className="text-sm text-slate-400">Memory (MB)</div>
          </div>
        </div>
      </div>
    </div>
  );
};
