import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, Brain, Target, CheckSquare, Zap } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  color = 'text-blue-400',
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      className={`${sizeClasses[size]} ${color} ${className}`}
    >
      <Loader2 className="w-full h-full" />
    </motion.div>
  );
};

interface PageLoaderProps {
  title?: string;
  message?: string;
  showProgress?: boolean;
  progress?: number;
}

export const PageLoader: React.FC<PageLoaderProps> = ({ 
  title = 'Loading...', 
  message = 'Please wait while we process your request',
  showProgress = false,
  progress = 0
}) => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="text-center">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-6"
        >
          <Brain className="w-8 h-8 text-white" />
        </motion.div>
        
        <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
        <p className="text-slate-400 mb-6">{message}</p>
        
        {showProgress && (
          <div className="w-64 mx-auto">
            <div className="flex justify-between text-sm text-slate-400 mb-2">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <motion.div
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        )}
        
        <LoadingSpinner size="lg" className="mt-6 mx-auto" />
      </div>
    </div>
  );
};

interface SkeletonLoaderProps {
  className?: string;
  lines?: number;
  height?: string;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ 
  className = '',
  lines = 3,
  height = 'h-4'
}) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.1 }}
          className={`bg-slate-700/50 rounded ${height} animate-pulse`}
        />
      ))}
    </div>
  );
};

interface CardSkeletonProps {
  count?: number;
}

export const CardSkeleton: React.FC<CardSkeletonProps> = ({ count = 3 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-slate-700 rounded-lg animate-pulse" />
            <div className="flex-1">
              <div className="h-4 bg-slate-700 rounded animate-pulse mb-2" />
              <div className="h-3 bg-slate-700/50 rounded animate-pulse w-2/3" />
            </div>
          </div>
          <SkeletonLoader lines={2} height="h-3" />
        </motion.div>
      ))}
    </div>
  );
};

interface TaskExecutionLoaderProps {
  taskTitle?: string;
  step?: string;
  progress?: number;
}

export const TaskExecutionLoader: React.FC<TaskExecutionLoaderProps> = ({ 
  taskTitle = 'Processing task...',
  step = 'Analyzing requirements',
  progress = 0
}) => {
  const steps = [
    'Analyzing requirements',
    'Breaking down tasks',
    'Evaluating dependencies',
    'Executing plan',
    'Updating progress',
    'Generating insights'
  ];

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
      <div className="flex items-center space-x-3 mb-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Zap className="w-6 h-6 text-blue-400" />
        </motion.div>
        <div>
          <h3 className="text-white font-medium">{taskTitle}</h3>
          <p className="text-slate-400 text-sm">{step}</p>
        </div>
      </div>
      
      <div className="mb-4">
        <div className="flex justify-between text-sm text-slate-400 mb-2">
          <span>Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2">
          <motion.div
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>
      
      <div className="space-y-2">
        {steps.map((stepName, index) => {
          const isActive = steps.indexOf(step) === index;
          const isCompleted = steps.indexOf(step) > index;
          
          return (
            <motion.div
              key={stepName}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-center space-x-2 text-sm ${
                isActive ? 'text-blue-400' : 
                isCompleted ? 'text-green-400' : 'text-slate-500'
              }`}
            >
              <motion.div
                animate={isActive ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 1, repeat: Infinity }}
                className={`w-2 h-2 rounded-full ${
                  isActive ? 'bg-blue-400' : 
                  isCompleted ? 'bg-green-400' : 'bg-slate-600'
                }`}
              />
              <span>{stepName}</span>
              {isActive && <LoadingSpinner size="sm" />}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

// Dashboard loading state
export const DashboardLoader: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-slate-700 rounded-lg animate-pulse" />
            <div>
              <div className="h-6 bg-slate-700 rounded w-48 animate-pulse mb-2" />
              <div className="h-4 bg-slate-700/50 rounded w-32 animate-pulse" />
            </div>
          </div>
          <div className="flex space-x-2">
            <div className="w-20 h-8 bg-slate-700 rounded animate-pulse" />
            <div className="w-20 h-8 bg-slate-700 rounded animate-pulse" />
            <div className="w-8 h-8 bg-slate-700 rounded animate-pulse" />
          </div>
        </div>
      </div>
      
      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
            <div className="h-6 bg-slate-700 rounded w-32 animate-pulse mb-4" />
            <SkeletonLoader />
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
            <div className="h-6 bg-slate-700 rounded w-40 animate-pulse mb-4" />
            <SkeletonLoader />
          </div>
        </div>
        <div className="space-y-6">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
            <div className="h-6 bg-slate-700 rounded w-36 animate-pulse mb-4" />
            <SkeletonLoader />
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
            <div className="h-6 bg-slate-700 rounded w-28 animate-pulse mb-4" />
            <SkeletonLoader />
          </div>
        </div>
      </div>
    </div>
  );
};