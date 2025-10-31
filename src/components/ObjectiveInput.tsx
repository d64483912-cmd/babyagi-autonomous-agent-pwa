import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useBabyAGIStore } from '../stores/babyagiStore';
import { Target, Plus, Clock, Brain } from 'lucide-react';

export const ObjectiveInput: React.FC = () => {
  const { addObjective, objectives, currentObjective, selectObjective } = useBabyAGIStore();
  
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    complexity: 5
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim()) return;

    addObjective({
      ...formData,
      status: 'pending',
      subtasks: []
    });

    setFormData({ title: '', description: '', complexity: 5 });
    setIsCreating(false);
  };

  const complexityLabels = {
    1: 'Very Simple',
    3: 'Simple',
    5: 'Moderate',
    7: 'Complex',
    10: 'Very Complex'
  };

  const sampleObjectives = [
    {
      title: 'Research AI Market Trends',
      description: 'Analyze current AI market trends and predict future developments',
      complexity: 6
    },
    {
      title: 'Build a Personal Budget App',
      description: 'Create a mobile app for personal finance management',
      complexity: 7
    },
    {
      title: 'Optimize Website Performance',
      description: 'Improve website loading speed and user experience',
      complexity: 5
    },
    {
      title: 'Learn Machine Learning Fundamentals',
      description: 'Master the core concepts of machine learning algorithms',
      complexity: 8
    },
    {
      title: 'Implement AI Content Generation System',
      description: 'Create an automated content generation pipeline using language models',
      complexity: 7
    },
    {
      title: 'Develop Smart Home Automation',
      description: 'Design and build an AI-powered home automation system',
      complexity: 8
    },
    {
      title: 'Create AI-Powered Customer Support',
      description: 'Build an intelligent chatbot for customer service automation',
      complexity: 6
    },
    {
      title: 'Launch a Tech Startup',
      description: 'Plan and execute the launch of a technology startup from idea to MVP',
      complexity: 9
    }
  ];

  const handleSampleObjective = (sample: any) => {
    setFormData(sample);
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Target className="w-6 h-6 text-blue-400" />
          <h2 className="text-xl font-bold text-white">Objective Management</h2>
        </div>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Objective</span>
        </button>
      </div>

      {/* Create New Objective Form */}
      {isCreating && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-6 p-4 bg-slate-700/30 rounded-lg border border-slate-600/50"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Objective Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Research AI Market Trends"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Describe what you want to achieve..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Complexity Level: {complexityLabels[formData.complexity as keyof typeof complexityLabels]}
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={formData.complexity}
                onChange={(e) => setFormData({ ...formData, complexity: parseInt(e.target.value) })}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>Very Simple</span>
                <span>Very Complex</span>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                Create Objective
              </button>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Sample Objectives */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center space-x-2">
          <Brain className="w-5 h-5 text-purple-400" />
          <span>Sample Objectives</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sampleObjectives.map((sample, index) => (
            <motion.button
              key={index}
              onClick={() => handleSampleObjective(sample)}
              className="text-left p-3 bg-slate-700/30 hover:bg-slate-700/50 border border-slate-600/50 rounded-lg transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <h4 className="font-medium text-white mb-1">{sample.title}</h4>
              <p className="text-sm text-slate-400 mb-2">{sample.description}</p>
              <div className="flex items-center space-x-2">
                <Clock className="w-3 h-3 text-slate-500" />
                <span className="text-xs text-slate-500">
                  Complexity: {sample.complexity}/10
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Existing Objectives */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">Your Objectives</h3>
        {objectives.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No objectives created yet</p>
            <p className="text-sm">Create your first objective to start the simulation</p>
          </div>
        ) : (
          <div className="space-y-3">
            {objectives.map((objective) => (
              <motion.div
                key={objective.id}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  currentObjective?.id === objective.id
                    ? 'bg-blue-600/20 border-blue-500/50'
                    : 'bg-slate-700/30 border-slate-600/50 hover:bg-slate-700/50'
                }`}
                onClick={() => selectObjective(objective.id)}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-white mb-1">{objective.title}</h4>
                    <p className="text-sm text-slate-400 mb-2">{objective.description}</p>
                    <div className="flex items-center space-x-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        objective.status === 'completed' ? 'bg-green-600/20 text-green-400' :
                        objective.status === 'failed' ? 'bg-red-600/20 text-red-400' :
                        objective.status === 'in-progress' ? 'bg-blue-600/20 text-blue-400' :
                        'bg-slate-600/20 text-slate-400'
                      }`}>
                        {objective.status}
                      </span>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span className="text-xs text-slate-500">
                          Complexity: {objective.complexity}/10
                        </span>
                      </div>
                    </div>
                  </div>
                  {currentObjective?.id === objective.id && (
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};