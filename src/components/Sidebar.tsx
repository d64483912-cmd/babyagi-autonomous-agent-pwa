import React from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  Target, 
  CheckSquare, 
  MemoryStick, 
  BarChart3, 
  Settings, 
  Home,
  ChevronLeft,
  ChevronRight,
  Activity
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  simulationRunning: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  isCollapsed,
  onToggleCollapse,
  simulationRunning
}) => {
  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      description: 'Main overview'
    },
    {
      id: 'objectives',
      label: 'Objectives',
      icon: Target,
      description: 'Goal management',
      badge: 'new'
    },
    {
      id: 'tasks',
      label: 'Tasks',
      icon: CheckSquare,
      description: 'Task execution',
      badge: simulationRunning ? 'running' : undefined
    },
    {
      id: 'memory',
      label: 'Memory',
      icon: MemoryStick,
      description: 'Agent learning'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      description: 'Performance metrics'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      description: 'Configuration'
    }
  ];

  const getBadgeContent = (badge?: string) => {
    switch (badge) {
      case 'new':
        return (
          <span className="px-1.5 py-0.5 text-xs bg-blue-600 text-white rounded-full">
            NEW
          </span>
        );
      case 'running':
        return (
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-400">LIVE</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={false}
      animate={{ width: isCollapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="bg-slate-800/50 backdrop-blur-sm border-r border-slate-700/50 h-full flex flex-col"
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Brain className="w-5 h-5 text-white" />
            </div>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h1 className="text-lg font-bold text-white">BabyAGI</h1>
                <p className="text-xs text-slate-400">AI Simulator</p>
              </motion.div>
            )}
          </div>
          <button
            onClick={onToggleCollapse}
            className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors text-slate-400 hover:text-white"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <motion.button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-all group ${
                isActive
                  ? 'bg-blue-600/20 border border-blue-500/30 text-blue-400'
                  : 'hover:bg-slate-700/50 text-slate-400 hover:text-white'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-blue-400' : ''}`} />
              
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex-1 text-left"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{item.label}</span>
                    {getBadgeContent(item.badge)}
                  </div>
                  <p className="text-xs text-slate-500 group-hover:text-slate-400">
                    {item.description}
                  </p>
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Status Footer */}
      {!isCollapsed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 border-t border-slate-700/50"
        >
          <div className="flex items-center space-x-2 text-sm">
            <Activity className={`w-4 h-4 ${simulationRunning ? 'text-green-400' : 'text-slate-500'}`} />
            <span className={`${simulationRunning ? 'text-green-400' : 'text-slate-400'}`}>
              {simulationRunning ? 'Running' : 'Idle'}
            </span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

// Mobile overlay sidebar
interface MobileSidebarProps extends SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileSidebar: React.FC<MobileSidebarProps> = ({
  isOpen,
  onClose,
  ...props
}) => {
  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <motion.div
        initial={{ x: -280 }}
        animate={{ x: isOpen ? 0 : -280 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed left-0 top-0 h-full w-80 z-50 lg:hidden"
      >
        <Sidebar {...props} isCollapsed={false} onToggleCollapse={() => {}} />
      </motion.div>
    </>
  );
};