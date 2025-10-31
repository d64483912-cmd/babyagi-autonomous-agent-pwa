import React from 'react';
import { motion } from 'framer-motion';
import { useBabyAGIStore } from '../stores/babyagiStore';
import { CheckSquare, Clock, ArrowRight, AlertCircle, CheckCircle, Play } from 'lucide-react';

export const TaskQueue: React.FC = () => {
  const { tasks, currentObjective, selectTask, selectedTaskId } = useBabyAGIStore();

  const objectiveTasks = currentObjective 
    ? tasks.filter(task => task.objectiveId === currentObjective.id)
    : [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      case 'in-progress':
        return <Play className="w-4 h-4 text-blue-400 animate-pulse" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-600/20 border-green-500/50';
      case 'failed':
        return 'bg-red-600/20 border-red-500/50';
      case 'in-progress':
        return 'bg-blue-600/20 border-blue-500/50';
      default:
        return 'bg-slate-600/20 border-slate-500/50';
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 8) return 'text-red-400';
    if (priority >= 6) return 'text-yellow-400';
    return 'text-slate-400';
  };

  const getDependencyStatus = (dependencies: string[]) => {
    const completedDeps = dependencies.filter(depId => 
      objectiveTasks.find(task => task.id === depId)?.status === 'completed'
    );
    return {
      completed: completedDeps.length,
      total: dependencies.length,
      isReady: completedDeps.length === dependencies.length
    };
  };

  const sortedTasks = [...objectiveTasks].sort((a, b) => {
    // Sort by status (pending first), then by priority (high first), then by creation time
    if (a.status !== b.status) {
      const statusOrder = { 'pending': 0, 'in-progress': 1, 'completed': 2, 'failed': 3 };
      return statusOrder[a.status as keyof typeof statusOrder] - statusOrder[b.status as keyof typeof statusOrder];
    }
    
    if (a.priority !== b.priority) {
      return b.priority - a.priority;
    }
    
    return a.createdAt.getTime() - b.createdAt.getTime();
  });

  if (!currentObjective) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
        <div className="text-center py-8 text-slate-400">
          <CheckSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No objective selected</p>
          <p className="text-sm">Select an objective to view its tasks</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <CheckSquare className="w-6 h-6 text-blue-400" />
          <h2 className="text-xl font-bold text-white">Task Execution Queue</h2>
        </div>
        <div className="text-sm text-slate-400">
          {objectiveTasks.length} task{objectiveTasks.length !== 1 ? 's' : ''}
        </div>
      </div>

      {objectiveTasks.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <CheckSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No tasks yet</p>
          <p className="text-sm">Tasks will appear when the simulation starts</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedTasks.map((task, index) => {
            const dependencyStatus = getDependencyStatus(task.dependencies);
            const isSelected = selectedTaskId === task.id;
            
            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  isSelected ? 'ring-2 ring-blue-500/50' : ''
                } ${getStatusColor(task.status)}`}
                onClick={() => selectTask(task.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {getStatusIcon(task.status)}
                      <h3 className="font-medium text-white">{task.title}</h3>
                      <span className={`text-sm font-medium ${getPriorityColor(task.priority)}`}>
                        P{task.priority}
                      </span>
                    </div>
                    
                    <p className="text-sm text-slate-400 mb-3">{task.description}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                      <div>
                        <span className="text-slate-500">Duration:</span>
                        <div className="text-white">{task.estimatedDuration}m</div>
                      </div>
                      
                      <div>
                        <span className="text-slate-500">Progress:</span>
                        <div className="text-white">{task.progress}%</div>
                        {task.progress > 0 && task.progress < 100 && (
                          <div className="w-full bg-slate-700 rounded-full h-1 mt-1">
                            <motion.div
                              className="bg-blue-500 h-1 rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${task.progress}%` }}
                            />
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <span className="text-slate-500">Attempts:</span>
                        <div className="text-white">{task.attempts}</div>
                      </div>
                      
                      <div>
                        <span className="text-slate-500">Dependencies:</span>
                        <div className="text-white">
                          {dependencyStatus.completed}/{dependencyStatus.total}
                        </div>
                        {!dependencyStatus.isReady && task.status === 'pending' && (
                          <div className="flex items-center space-x-1 mt-1">
                            <Clock className="w-3 h-3 text-yellow-400" />
                            <span className="text-yellow-400 text-xs">Waiting</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {task.dependencies.length > 0 && (
                      <div className="mt-3">
                        <span className="text-xs text-slate-500">Dependencies: </span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {task.dependencies.map(depId => {
                            const depTask = objectiveTasks.find(t => t.id === depId);
                            return (
                              <span
                                key={depId}
                                className={`px-2 py-1 text-xs rounded ${
                                  depTask?.status === 'completed' 
                                    ? 'bg-green-600/20 text-green-400'
                                    : 'bg-slate-600/20 text-slate-400'
                                }`}
                              >
                                {depTask?.title || 'Unknown'}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    {task.results && (
                      <div className="mt-3 p-2 bg-green-600/10 border border-green-600/20 rounded text-sm">
                        <span className="text-green-400 font-medium">Results:</span>
                        <p className="text-green-300 mt-1">{task.results}</p>
                      </div>
                    )}
                    
                    {task.learning && (
                      <div className="mt-3 p-2 bg-purple-600/10 border border-purple-600/20 rounded text-sm">
                        <span className="text-purple-400 font-medium">Learning:</span>
                        <p className="text-purple-300 mt-1">{task.learning.insight}</p>
                      </div>
                    )}
                  </div>
                  
                  {index < sortedTasks.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-slate-600 ml-4" />
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
      
      {/* Task Summary */}
      {objectiveTasks.length > 0 && (
        <div className="mt-6 pt-4 border-t border-slate-700/50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {objectiveTasks.filter(t => t.status === 'completed').length}
              </div>
              <div className="text-slate-400">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {objectiveTasks.filter(t => t.status === 'in-progress').length}
              </div>
              <div className="text-slate-400">In Progress</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-400">
                {objectiveTasks.filter(t => t.status === 'pending').length}
              </div>
              <div className="text-slate-400">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">
                {objectiveTasks.filter(t => t.status === 'failed').length}
              </div>
              <div className="text-slate-400">Failed</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};