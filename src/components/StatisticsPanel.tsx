import React from 'react';
import { motion } from 'framer-motion';
import { useBabyAGIStore } from '../stores/babyagiStore';
import { BarChart3, TrendingUp, Target, CheckCircle, XCircle, Clock, Brain } from 'lucide-react';

export const StatisticsPanel: React.FC = () => {
  const { getCurrentStatistics, objectives, tasks } = useBabyAGIStore();

  const stats = getCurrentStatistics();
  const recentObjectives = objectives.slice(-5).reverse();

  const getSuccessRate = () => {
    if (stats.totalObjectives === 0) return 0;
    return Math.round((stats.completedObjectives / stats.totalObjectives) * 100);
  };

  const getTaskSuccessRate = () => {
    const executableTasks = tasks.filter(t => t.status === 'completed' || t.status === 'failed');
    if (executableTasks.length === 0) return 0;
    return Math.round((stats.completedTasks / executableTasks.length) * 100);
  };

  const getEfficiencyColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const statCards = [
    {
      title: 'Objectives',
      value: `${stats.completedObjectives}/${stats.totalObjectives}`,
      subtitle: `${getSuccessRate()}% success rate`,
      icon: Target,
      color: 'blue'
    },
    {
      title: 'Tasks Completed',
      value: stats.completedTasks.toString(),
      subtitle: `${stats.failedTasks} failed`,
      icon: CheckCircle,
      color: 'green'
    },
    {
      title: 'Learning Insights',
      value: stats.learningInsights.toString(),
      subtitle: 'discoveries made',
      icon: Brain,
      color: 'purple'
    },
    {
      title: 'Efficiency Score',
      value: `${stats.efficiencyScore}%`,
      subtitle: 'overall performance',
      icon: TrendingUp,
      color: 'orange'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-600/20 border-blue-500/50 text-blue-400',
      green: 'bg-green-600/20 border-green-500/50 text-green-400',
      purple: 'bg-purple-600/20 border-purple-500/50 text-purple-400',
      orange: 'bg-orange-600/20 border-orange-500/50 text-orange-400'
    };
    return colors[color as keyof typeof colors];
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <BarChart3 className="w-6 h-6 text-blue-400" />
          <h2 className="text-xl font-bold text-white">Performance Analytics</h2>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 border rounded-lg ${getColorClasses(stat.color)}`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className="w-5 h-5" />
                <span className="text-2xl font-bold">{stat.value}</span>
              </div>
              <h3 className="font-medium text-white mb-1">{stat.title}</h3>
              <p className="text-sm opacity-80">{stat.subtitle}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Performance Trends */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
            <Target className="w-5 h-5 text-blue-400" />
            <span>Objective Completion</span>
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Completed</span>
              <span className="text-green-400 font-medium">{stats.completedObjectives}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Failed</span>
              <span className="text-red-400 font-medium">{stats.failedObjectives}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Success Rate</span>
              <span className={`font-medium ${getColorClasses(getSuccessRate() >= 70 ? 'green' : getSuccessRate() >= 50 ? 'orange' : 'red')}`}>
                {getSuccessRate()}%
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-slate-700 rounded-full h-2">
              <motion.div
                className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${getSuccessRate()}%` }}
                transition={{ duration: 1, delay: 0.5 }}
              />
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span>Task Execution</span>
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Completed Tasks</span>
              <span className="text-green-400 font-medium">{stats.completedTasks}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Failed Tasks</span>
              <span className="text-red-400 font-medium">{stats.failedTasks}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Task Success Rate</span>
              <span className={`font-medium ${getColorClasses(getTaskSuccessRate() >= 80 ? 'green' : getTaskSuccessRate() >= 60 ? 'orange' : 'red')}`}>
                {getTaskSuccessRate()}%
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-slate-700 rounded-full h-2">
              <motion.div
                className="bg-gradient-to-r from-green-500 to-purple-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${getTaskSuccessRate()}%` }}
                transition={{ duration: 1, delay: 0.7 }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Objectives */}
      <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
          <Clock className="w-5 h-5 text-slate-400" />
          <span>Recent Objectives</span>
        </h3>
        
        {recentObjectives.length === 0 ? (
          <div className="text-center py-4 text-slate-400">
            <p>No objectives yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentObjectives.map((objective, index) => (
              <motion.div
                key={objective.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
              >
                <div className="flex-1">
                  <h4 className="font-medium text-white mb-1">{objective.title}</h4>
                  <p className="text-sm text-slate-400">{objective.description}</p>
                </div>
                
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    objective.status === 'completed' ? 'bg-green-600/20 text-green-400' :
                    objective.status === 'failed' ? 'bg-red-600/20 text-red-400' :
                    objective.status === 'in-progress' ? 'bg-blue-600/20 text-blue-400' :
                    'bg-slate-600/20 text-slate-400'
                  }`}>
                    {objective.status}
                  </span>
                  
                  <span className="text-xs text-slate-500">
                    C{objective.complexity}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Learning Progress */}
      <div className="mt-6 p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
          <Brain className="w-5 h-5 text-purple-400" />
          <span>AI Learning Progress</span>
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">{stats.learningInsights}</div>
            <div className="text-sm text-slate-400">Insights Generated</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{stats.strategyImprovements}</div>
            <div className="text-sm text-slate-400">Strategy Updates</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${getEfficiencyColor(stats.efficiencyScore)}`}>
              {stats.efficiencyScore}%
            </div>
            <div className="text-sm text-slate-400">Overall Efficiency</div>
          </div>
        </div>
      </div>
    </div>
  );
};