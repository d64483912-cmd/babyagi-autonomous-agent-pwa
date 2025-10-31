# BabyAGI PWA Zustand Stores Documentation

This document provides a comprehensive overview of the Zustand stores created for the BabyAGI PWA application.

## Overview

The application uses 5 main Zustand stores to manage different aspects of state:

1. **Objectives Store** - Manages objectives and their lifecycle
2. **Tasks Store** - Handles task management and execution
3. **Results Store** - Stores execution results and learning data
4. **Settings Store** - Manages application settings and API configuration
5. **UI Store** - Controls user interface state and interactions

## Architecture

### Store Structure

```
src/stores/
├── objectivesStore.ts     # Objective management
├── tasksStore.ts         # Task management and execution
├── resultsStore.ts       # Results, analytics, and learning
├── settingsStore.ts      # Settings and configuration
├── uiStore.ts           # UI state and interactions
├── hooks.ts             # Custom hooks for store usage
└── index.ts             # Exports and utilities
```

### Key Features

- **TypeScript First** - Full type safety throughout
- **Persistence** - Selected data persisted to localStorage
- **Middleware** - Immer for immutable updates, subscription support
- **Cross-store Communication** - Stores can communicate with each other
- **Error Handling** - Comprehensive error management
- **Performance** - Optimized subscriptions and computed values
- **Accessibility** - Built-in accessibility features
- **Development Tools** - Debug utilities in development mode

## Store Details

### 1. Objectives Store (`useObjectivesStore`)

**Purpose**: Manages the lifecycle of objectives from creation to completion.

**State**:
- `objectives` - All objectives
- `currentObjective` - Currently selected objective
- `objectiveHistory` - Historical objectives
- `objectivesByStatus` - Objectives grouped by status
- `isLoading`, `error` - UI state

**Key Actions**:
- `addObjective()` - Create new objective
- `updateObjective()` - Update existing objective
- `markObjectiveCompleted()` - Mark objective as completed
- `markObjectiveFailed()` - Mark objective as failed
- `addTaskToObjective()` - Add task to objective

**Persistence**: Objectives and history are persisted.

**Usage Example**:
```typescript
import { useObjectives } from '@/stores/hooks';

function ObjectiveManager() {
  const { objectives, activeObjectives, addObjective, updateObjective } = useObjectives();
  
  const handleCreateObjective = (data) => {
    addObjective({
      title: 'Learn TypeScript',
      description: 'Master TypeScript fundamentals',
      complexity: 7,
      status: 'pending'
    });
  };
  
  return (
    <div>
      <h2>Active Objectives ({activeObjectives.length})</h2>
      {objectives.map(obj => (
        <div key={obj.id}>{obj.title}</div>
      ))}
    </div>
  );
}
```

### 2. Tasks Store (`useTasksStore`)

**Purpose**: Manages tasks, their execution, and related operations.

**State**:
- `tasks` - All tasks
- `activeTasks` - Currently executing tasks
- `taskQueue` - Queued tasks
- `completedTasks`, `failedTasks` - Historical tasks
- `taskExecutionState` - Real-time execution data
- `tasksByPriority`, `tasksByObjective`, `tasksByStatus` - Grouped tasks

**Key Actions**:
- `addTask()` - Create new task
- `startTaskExecution()` - Begin task execution
- `completeTask()` - Mark task as completed
- `failTask()` - Mark task as failed
- `bulkUpdateTasks()` - Batch update multiple tasks
- `addExecutionLog()` - Add execution log entry

**Persistence**: Recent completed and failed tasks are persisted.

**Usage Example**:
```typescript
import { useTasks } from '@/stores/hooks';

function TaskQueue() {
  const { 
    taskQueue, 
    executableTasks, 
    startTaskExecution, 
    addExecutionLog 
  } = useTasks();
  
  const handleExecuteTask = (taskId) => {
    startTaskExecution(taskId);
    addExecutionLog(taskId, 'info', 'Task execution started');
  };
  
  return (
    <div>
      <h2>Task Queue ({taskQueue.length})</h2>
      {taskQueue.map(task => (
        <TaskItem 
          key={task.id} 
          task={task}
          onExecute={() => handleExecuteTask(task.id)}
        />
      ))}
    </div>
  );
}
```

### 3. Results Store (`useResultsStore`)

**Purpose**: Stores execution results, learning data, and analytics.

**State**:
- `executionResults` - Task execution results
- `learningInsights` - Learning insights gained
- `agentMemory` - Agent memory entries
- `strategyImprovements` - Strategy improvements
- `simulationStatistics` - Overall statistics
- `performanceMetrics` - Detailed performance data
- `detailedLogs` - Execution logs

**Key Actions**:
- `addExecutionResult()` - Record execution result
- `addLearningInsight()` - Add learning insight
- `generatePerformanceReport()` - Generate analytics report
- `exportResults()` - Export results data
- `recalculatePerformanceMetrics()` - Update performance data

**Persistence**: Execution results, learning insights, and statistics are persisted.

**Usage Example**:
```typescript
import { useResults } from '@/stores/hooks';

function Analytics() {
  const { 
    performanceMetrics, 
    generatePerformanceReport, 
    recentResults 
  } = useResults();
  
  const handleGenerateReport = async () => {
    const report = await generatePerformanceReport('month');
    console.log('Performance Report:', report);
  };
  
  return (
    <div>
      <h2>Performance Metrics</h2>
      <div>Success Rate: {performanceMetrics.successRate}%</div>
      <div>Average Duration: {performanceMetrics.averageTaskDuration}s</div>
      <div>Efficiency Score: {performanceMetrics.efficiencyScore}</div>
    </div>
  );
}
```

### 4. Settings Store (`useSettingsStore`)

**Purpose**: Manages application settings, API configuration, and user preferences.

**State**:
- `settings` - Core application settings
- `availableModels` - Available AI models
- `selectedModel` - Currently selected model
- `apiKeyValidation` - API key validation state
- `connectionStatus` - API connection status
- `theme`, `language`, `timezone` - UI preferences
- `notifications` - Notification preferences
- `privacy` - Privacy settings

**Key Actions**:
- `setApiKey()` - Set and validate API key
- `loadAvailableModels()` - Load available AI models
- `updateSettings()` - Update application settings
- `validateSettings()` - Validate current settings
- `exportSettings()`, `importSettings()` - Settings backup/restore

**Persistence**: All settings are persisted with encryption for sensitive data.

**Usage Example**:
```typescript
import { useSettings } from '@/stores/hooks';

function SettingsPanel() {
  const { 
    settings, 
    updateSettings, 
    setApiKey, 
    connectionStatus,
    hasUnsavedChanges 
  } = useSettings();
  
  const handleApiKeyChange = async (apiKey) => {
    await setApiKey(apiKey);
  };
  
  return (
    <div>
      <h2>Settings</h2>
      
      <div>
        <label>API Key:</label>
        <input 
          type="password"
          value={settings.openRouterApiKey || ''}
          onChange={(e) => handleApiKeyChange(e.target.value)}
        />
        <div>Status: {connectionStatus}</div>
      </div>
      
      <div>
        <label>Simulation Speed:</label>
        <select 
          value={settings.simulationSpeed}
          onChange={(e) => updateSettings({ simulationSpeed: e.target.value })}
        >
          <option value="slow">Slow</option>
          <option value="normal">Normal</option>
          <option value="fast">Fast</option>
        </select>
      </div>
      
      {hasUnsavedChanges && (
        <button onClick={() => markAsSaved()}>
          Save Changes
        </button>
      )}
    </div>
  );
}
```

### 5. UI Store (`useUIStore`)

**Purpose**: Manages user interface state, interactions, and layout.

**State**:
- `currentView` - Current view/route
- `sidebarOpen`, `sidebarCollapsed` - Sidebar state
- `notifications` - Active notifications
- `activeModal` - Current modal
- `loadingStates` - Loading indicators
- `globalSearch` - Search functionality
- `selectedItems` - Selected items by context
- `breadcrumbs` - Navigation breadcrumbs

**Key Actions**:
- `setCurrentView()` - Navigate to new view
- `showNotification()` - Display notification
- `openModal()`, `closeModal()` - Modal management
- `setGlobalSearch()` - Global search
- `updateSelectedItems()` - Item selection

**Persistence**: UI preferences and layout state are persisted.

**Usage Example**:
```typescript
import { useUI } from '@/stores/hooks';

function Layout() {
  const { 
    currentView, 
    setCurrentView, 
    sidebarOpen, 
    toggleSidebar,
    showSuccess,
    notifications 
  } = useUI();
  
  const handleNavigation = (view) => {
    setCurrentView(view);
    showSuccess('Navigation', `Switched to ${view}`);
  };
  
  return (
    <div>
      <Sidebar open={sidebarOpen} onToggle={toggleSidebar} />
      
      <main>
        {currentView === 'dashboard' && <Dashboard />}
        {currentView === 'objectives' && <Objectives />}
        {currentView === 'tasks' && <Tasks />}
      </main>
      
      <NotificationContainer notifications={notifications} />
    </div>
  );
}
```

## Custom Hooks

The `hooks.ts` file provides several custom hooks for convenient store usage:

### `useAppStore`
Combined hook that provides access to all stores and their interactions.

```typescript
import { useAppStore } from '@/stores/hooks';

function Component() {
  const { objectives, tasks, results, ui, executeTask } = useAppStore();
  
  const handleExecuteTask = async (taskId) => {
    await executeTask(taskId);
  };
}
```

### Specialized Hooks
- `useObjectives` - Objective management with computed values
- `useTasks` - Task management with execution helpers
- `useResults` - Results and analytics with computed metrics
- `useSettings` - Settings with validation and helpers
- `useUI` - UI state with interaction helpers
- `useDashboard` - Dashboard-specific data and actions
- `useAnalytics` - Analytics and reporting functions

## Performance Features

### 1. Selective Subscriptions
```typescript
// Subscribe to specific state changes
useObjectivesStore.subscribe(
  (state) => state.objectives,
  (objectives) => {
    console.log('Objectives changed:', objectives);
  }
);
```

### 2. Computed Values
```typescript
// Memoized computed values
const activeObjectives = useMemo(
  () => store.objectives.filter(obj => obj.status === 'pending'),
  [store.objectives]
);
```

### 3. Batched Updates
```typescript
// Use Immer for efficient immutable updates
set((state) => {
  state.objectives.push(newObjective);
  state.currentObjective = newObjective;
});
```

## Error Handling

Each store includes comprehensive error handling:

```typescript
// Automatic error notifications
store.showError('Operation Failed', 'Unable to complete the requested action');

// Error boundary integration
useEffect(() => {
  if (store.error) {
    // Log error and show user notification
    console.error('Store error:', store.error);
  }
}, [store.error]);
```

## Development Tools

In development mode, debugging tools are available:

```typescript
// Access debugging tools
window.babyagiDebug.state();    // Log current state
window.babyagiDebug.reset();    // Reset all stores
window.babyagiDebug.export();   // Export all data
window.babyagiDebug.performance(); // Monitor performance
```

## Best Practices

### 1. Use Custom Hooks
```typescript
// ✅ Good - Use custom hooks
const { addObjective } = useObjectives();

// ❌ Avoid - Direct store access
const store = useObjectivesStore();
```

### 2. Handle Loading States
```typescript
const { isLoading, setLoading } = useUI();

const handleAsyncOperation = async () => {
  setLoading('operation', true);
  try {
    // Perform operation
  } finally {
    setLoading('operation', false);
  }
};
```

### 3. Use TypeScript
```typescript
// ✅ Good - Typed actions
addObjective({ title: 'Test', description: 'Description' });

// ❌ Avoid - Untyped
addObjective({ title: 'Test' });
```

### 4. Handle Errors
```typescript
try {
  await store.updateTask(taskId, updates);
} catch (error) {
  store.showError('Update Failed', error.message);
}
```

## Migration from Single Store

If you're migrating from the old `babyagiStore.ts`, here's what changed:

### Old Store:
```typescript
// Old single store approach
const store = useBabyAGIStore();

// All actions mixed together
store.addObjective(data);
store.updateTask(id, updates);
store.startSimulation(objectiveId);
```

### New Stores:
```typescript
// New modular store approach
const { objectives, tasks, ui } = useAppStore();

// Dedicated stores with better separation
objectives.addObjective(data);
tasks.updateTask(id, updates);
// Simulation moved to results store
```

## Tips and Tricks

### 1. Cross-Store Communication
```typescript
// Objectives and tasks automatically sync
objectives.addObjective(data);
// Tasks store automatically updates related data
```

### 2. Real-time Updates
```typescript
// Subscribe to task execution updates
useTasksStore.subscribe(
  (state) => state.activeTasks,
  (activeTasks) => {
    // Update UI when tasks start/stop executing
    updateExecutionUI(activeTasks);
  }
);
```

### 3. Persistent Data Management
```typescript
// Only persist what's needed
const persisted = {
  objectives: state.objectives,
  settings: state.settings,
  ui: state.sidebarOpen
};
```

### 4. Performance Optimization
```typescript
// Use shallow comparison for better performance
const objectives = useObjectives(
  (state) => state.objectives,
  shallow
);
```

## Conclusion

The new Zustand store architecture provides:

- **Better Organization** - Separate concerns and modular design
- **Improved Performance** - Optimized subscriptions and computed values
- **Enhanced Type Safety** - Full TypeScript coverage
- **Development Experience** - Debug tools and error handling
- **Scalability** - Easy to extend and maintain
- **Persistence** - Smart data persistence strategies

This architecture supports the BabyAGI PWA's complex state management needs while maintaining simplicity and performance.