import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  persistent?: boolean;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  }>;
}

interface ToastProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

export const ToastNotification: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!toast.persistent && toast.duration) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onDismiss(toast.id), 300);
      }, toast.duration);

      return () => clearTimeout(timer);
    }
  }, [toast, onDismiss]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      default:
        return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  const getColors = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-600/20 border-green-500/50';
      case 'error':
        return 'bg-red-600/20 border-red-500/50';
      case 'warning':
        return 'bg-yellow-600/20 border-yellow-500/50';
      default:
        return 'bg-blue-600/20 border-blue-500/50';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.8 }}
      animate={{ 
        opacity: isVisible ? 1 : 0, 
        x: isVisible ? 0 : 300, 
        scale: isVisible ? 1 : 0.8 
      }}
      exit={{ opacity: 0, x: 300, scale: 0.8 }}
      className={`max-w-sm w-full border rounded-lg p-4 shadow-xl backdrop-blur-sm ${getColors()}`}
    >
      <div className="flex items-start space-x-3">
        {getIcon()}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white">{toast.title}</p>
          <p className="mt-1 text-sm text-slate-300">{toast.message}</p>
          
          {toast.actions && (
            <div className="mt-3 flex space-x-2">
              {toast.actions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.onClick}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${
                    action.variant === 'primary'
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-slate-600 hover:bg-slate-700 text-slate-200'
                  }`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(() => onDismiss(toast.id), 300);
          }}
          className="flex-shrink-0 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

export const ToastContainer: React.FC<{
  toasts: Toast[];
  onDismiss: (id: string) => void;
}> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-3">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastNotification
            key={toast.id}
            toast={toast}
            onDismiss={onDismiss}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};