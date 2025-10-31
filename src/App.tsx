import React, { useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { ErrorBoundary } from './components/ErrorBoundary';
import { registerSW } from 'virtual:pwa-register';
import './App.css';

function App() {
  useEffect(() => {
    // Register service worker for PWA functionality
    const updateSW = registerSW({
      onNeedRefresh() {
        if (confirm('New version available. Refresh to update?')) {
          updateSW(true);
        }
      },
      onOfflineReady() {
        console.log('App ready to work offline');
      },
    });

    return () => {
      updateSW(false);
    };
  }, []);

  return (
    <ErrorBoundary>
      <div className="App">
        <Dashboard />
      </div>
    </ErrorBoundary>
  );
}

export default App;
