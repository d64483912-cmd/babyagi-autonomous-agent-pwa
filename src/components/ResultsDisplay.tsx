import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Download, 
  Calendar,
  Filter,
  RefreshCw,
  Target,
  CheckCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';

interface ChartData {
  label: string;
  value: number;
  color: string;
  percentage?: number;
}

interface ResultsDisplayProps {
  className?: string;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ className }) => {
  const [timeRange, setTimeRange] = useState('7d');
  const [viewType, setViewType] = useState<'overview' | 'detailed' | 'trends'>('overview');

  // Sample data - in real implementation, this would come from the store
  const objectiveCompletionData: ChartData[] = [
    { label: 'Completed', value: 12, color: '#10B981', percentage: 60 },
    { label: 'In Progress', value: 5, color: '#3B82F6', percentage: 25 },
    { label: 'Pending', value: 2, color: '#6B7280', percentage: 10 },
    { label: 'Failed', value: 1, color: '#EF4444', percentage: 5 }
  ];

  const taskPerformanceData: ChartData[] = [
    { label: 'High Performance', value: 18, color: '#10B981', percentage: 45 },
    { label: 'Medium Performance', value: 15, color: '#F59E0B', percentage: 37.5 },
    { label: 'Low Performance', value: 7, color: '#EF4444', percentage: 17.5 }
  ];

  const timelineData = [
    { date: '2025-10-24', completed: 3, created: 2, efficiency: 85 },
    { date: '2025-10-25', completed: 5, created: 4, efficiency: 78 },
    { date: '2025-10-26', completed: 4, created: 3, efficiency: 92 },
    { date: '2025-10-27', completed: 6, created: 5, efficiency: 88 },
    { date: '2025-10-28', completed: 2, created: 4, efficiency: 65 },
    { date: '2025-10-29', completed: 8, created: 6, efficiency: 94 },
    { date: '2025-10-30', completed: 4, created: 3, efficiency: 89 }
  ];

  const renderOverview = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Objective Completion Chart */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
            <Target className="w-5 h-5 text-blue-400" />
            <span>Objective Status</span>
          </h3>
        </div>
        
        <div className="space-y-4">
          {objectiveCompletionData.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center space-x-3"
            >
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <div className="flex-1 flex justify-between items-center">
                <span className="text-slate-300">{item.label}</span>
                <div className="text-right">
                  <span className="text-white font-medium">{item.value}</span>
                  <span className="text-slate-400 ml-2">({item.percentage}%)</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Task Performance Chart */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span>Task Performance</span>
          </h3>
        </div>
        
        <div className="space-y-4">
          {taskPerformanceData.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center space-x-3"
            >
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <div className="flex-1 flex justify-between items-center">
                <span className="text-slate-300">{item.label}</span>
                <div className="text-right">
                  <span className="text-white font-medium">{item.value}</span>
                  <span className="text-slate-400 ml-2">({item.percentage}%)</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderDetailed = () => (
    <div className="space-y-6">
      {/* Timeline Chart */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            <span>Performance Timeline</span>
          </h3>
          <div className="flex items-center space-x-2">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1 text-sm text-white"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-2 h-40">
          {timelineData.map((day, index) => {
            const maxValue = Math.max(...timelineData.map(d => d.completed));
            const height = (day.completed / maxValue) * 100;
            
            return (
              <motion.div
                key={day.date}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex flex-col items-center"
              >
                <div className="flex-1 flex flex-col justify-end w-full">
                  <motion.div
                    className="bg-gradient-to-t from-blue-500 to-purple-500 rounded-t"
                    style={{ height: `${height}%` }}
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ delay: index * 0.1 }}
                  />
                </div>
                <div className="mt-2 text-xs text-slate-400 text-center">
                  <div>{new Date(day.date).getDate()}</div>
                  <div className="text-green-400">{day.completed}</div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Clock className="w-6 h-6 text-blue-400" />
            <h4 className="text-lg font-semibold text-white">Avg Completion Time</h4>
          </div>
          <div className="text-3xl font-bold text-white mb-2">2.4 hrs</div>
          <div className="text-sm text-green-400 flex items-center space-x-1">
            <TrendingUp className="w-4 h-4" />
            <span>+12% from last week</span>
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Target className="w-6 h-6 text-green-400" />
            <h4 className="text-lg font-semibold text-white">Success Rate</h4>
          </div>
          <div className="text-3xl font-bold text-white mb-2">87%</div>
          <div className="text-sm text-green-400 flex items-center space-x-1">
            <TrendingUp className="w-4 h-4" />
            <span>+5% from last week</span>
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-yellow-400" />
            <h4 className="text-lg font-semibold text-white">Efficiency Score</h4>
          </div>
          <div className="text-3xl font-bold text-white mb-2">84%</div>
          <div className="text-sm text-red-400 flex items-center space-x-1">
            <TrendingUp className="w-4 h-4 rotate-180" />
            <span>-3% from last week</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTrends = () => (
    <div className="space-y-6">
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Trend Analysis</h3>
        <div className="text-center py-12 text-slate-400">
          <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>Advanced trend analysis and predictions will appear here</p>
          <p className="text-sm mt-2">This feature is coming soon!</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Controls */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <h2 className="text-2xl font-bold text-white">Results & Analytics</h2>
            <p className="text-slate-400 mt-1">Detailed performance metrics and insights</p>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* View Type Selector */}
            <div className="flex bg-slate-700/50 rounded-lg p-1">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'detailed', label: 'Detailed' },
                { id: 'trends', label: 'Trends' }
              ].map((option) => (
                <button
                  key={option.id}
                  onClick={() => setViewType(option.id as any)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewType === option.id
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            
            <button className="flex items-center space-x-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
            
            <button className="flex items-center space-x-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <motion.div
        key={viewType}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {viewType === 'overview' && renderOverview()}
        {viewType === 'detailed' && renderDetailed()}
        {viewType === 'trends' && renderTrends()}
      </motion.div>
    </div>
  );
};