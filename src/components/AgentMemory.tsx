import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useBabyAGIStore } from '../stores/babyagiStore';
import { MemoryStick, Brain, TrendingUp, AlertTriangle, CheckCircle, Lightbulb } from 'lucide-react';

export const AgentMemory: React.FC = () => {
  const { agentMemory } = useBabyAGIStore();
  const [filter, setFilter] = useState<'all' | 'learning' | 'success' | 'failure' | 'strategy'>('all');

  const getMemoryIcon = (type: string) => {
    switch (type) {
      case 'learning':
        return <Brain className="w-4 h-4 text-purple-400" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'failure':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'strategy':
        return <TrendingUp className="w-4 h-4 text-blue-400" />;
      default:
        return <Lightbulb className="w-4 h-4 text-yellow-400" />;
    }
  };

  const getMemoryColor = (type: string) => {
    switch (type) {
      case 'learning':
        return 'bg-purple-600/20 border-purple-500/50';
      case 'success':
        return 'bg-green-600/20 border-green-500/50';
      case 'failure':
        return 'bg-red-600/20 border-red-500/50';
      case 'strategy':
        return 'bg-blue-600/20 border-blue-500/50';
      default:
        return 'bg-yellow-600/20 border-yellow-500/50';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-400';
    if (confidence >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const filteredMemory = agentMemory.filter(memory => 
    filter === 'all' || memory.type === filter
  );

  const sortedMemory = [...filteredMemory].sort((a, b) => 
    b.timestamp.getTime() - a.timestamp.getTime()
  );

  const memoryStats = {
    total: agentMemory.length,
    learning: agentMemory.filter(m => m.type === 'learning').length,
    success: agentMemory.filter(m => m.type === 'success').length,
    failure: agentMemory.filter(m => m.type === 'failure').length,
    strategy: agentMemory.filter(m => m.type === 'strategy').length,
    avgConfidence: agentMemory.length > 0 
      ? Math.round((agentMemory.reduce((sum, m) => sum + m.confidence, 0) / agentMemory.length) * 100) / 100
      : 0
  };

  const filters = [
    { id: 'all', label: 'All', count: memoryStats.total },
    { id: 'learning', label: 'Learning', count: memoryStats.learning },
    { id: 'success', label: 'Success', count: memoryStats.success },
    { id: 'failure', label: 'Failure', count: memoryStats.failure },
    { id: 'strategy', label: 'Strategy', count: memoryStats.strategy }
  ];

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <MemoryStick className="w-6 h-6 text-blue-400" />
          <h2 className="text-xl font-bold text-white">Agent Memory & Learning</h2>
        </div>
        <div className="text-sm text-slate-400">
          {agentMemory.length} memory item{agentMemory.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6 p-4 bg-slate-700/30 rounded-lg">
        <div className="text-center">
          <div className="text-2xl font-bold text-white">{memoryStats.total}</div>
          <div className="text-sm text-slate-400">Total</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-400">{memoryStats.learning}</div>
          <div className="text-sm text-slate-400">Learning</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400">{memoryStats.success}</div>
          <div className="text-sm text-slate-400">Success</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-400">{memoryStats.failure}</div>
          <div className="text-sm text-slate-400">Failure</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-400">{memoryStats.strategy}</div>
          <div className="text-sm text-slate-400">Strategy</div>
        </div>
        <div className="text-center">
          <div className={`text-2xl font-bold ${getConfidenceColor(memoryStats.avgConfidence)}`}>
            {memoryStats.avgConfidence}
          </div>
          <div className="text-sm text-slate-400">Avg Confidence</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {filters.map(filterOption => (
          <button
            key={filterOption.id}
            onClick={() => setFilter(filterOption.id as any)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === filterOption.id
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {filterOption.label} ({filterOption.count})
          </button>
        ))}
      </div>

      {/* Memory Items */}
      {sortedMemory.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <MemoryStick className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No memory entries yet</p>
          <p className="text-sm">Agent memory will populate as the simulation runs</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {sortedMemory.map((memory, index) => (
            <motion.div
              key={memory.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`p-4 border rounded-lg ${getMemoryColor(memory.type)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  {getMemoryIcon(memory.type)}
                  <div className="flex-1">
                    <p className="text-white mb-2">{memory.content}</p>
                    
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center space-x-1">
                        <span className="text-slate-500">Confidence:</span>
                        <span className={getConfidenceColor(memory.confidence)}>
                          {Math.round(memory.confidence * 100)}%
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <span className="text-slate-500">Type:</span>
                        <span className="text-slate-300 capitalize">{memory.type}</span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <span className="text-slate-500">Time:</span>
                        <span className="text-slate-300">
                          {memory.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                    
                    {memory.applicability.length > 0 && (
                      <div className="mt-2">
                        <span className="text-xs text-slate-500">Applies to: </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {memory.applicability.map(category => (
                            <span
                              key={category}
                              className="px-2 py-1 text-xs bg-slate-600/30 text-slate-300 rounded"
                            >
                              {category}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <div className={`w-2 h-2 rounded-full ${
                    memory.confidence >= 0.8 ? 'bg-green-400' :
                    memory.confidence >= 0.6 ? 'bg-yellow-400' :
                    'bg-red-400'
                  }`} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Learning Insights */}
      {memoryStats.learning > 0 && (
        <div className="mt-6 pt-6 border-t border-slate-700/50">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
            <Brain className="w-5 h-5 text-purple-400" />
            <span>Key Learning Insights</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {agentMemory
              .filter(m => m.type === 'learning' && m.confidence > 0.7)
              .slice(0, 4)
              .map((insight, index) => (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-3 bg-purple-600/10 border border-purple-600/20 rounded-lg"
                >
                  <p className="text-purple-300 text-sm mb-2">{insight.content}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-purple-400">
                      Confidence: {Math.round(insight.confidence * 100)}%
                    </span>
                    <span className="text-xs text-slate-500">
                      {insight.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </motion.div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
