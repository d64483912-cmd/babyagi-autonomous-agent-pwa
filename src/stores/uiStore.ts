import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// Types for UI state store
interface UIState {
  // Navigation and routing
  currentView: 'dashboard' | 'objectives' | 'tasks' | 'memory' | 'results' | 'analytics' | 'settings';
  previousView: string | null;
  breadcrumbs: Array<{ label: string; view: string; id?: string }>;
  
  // Sidebar and layout
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  sidebarWidth: number;
  layoutMode: 'desktop' | 'tablet' | 'mobile';
  theme: 'light' | 'dark' | 'system';
  
  // Loading states
  globalLoading: boolean;
  loadingStates: Record<string, boolean>;
  loadingMessages: Record<string, string>;
  
  // Notifications
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    timestamp: Date;
    duration?: number;
    persistent?: boolean;
    actions?: Array<{
      label: string;
      action: () => void;
      variant?: 'primary' | 'secondary';
    }>;
    data?: any;
  }>;
  
  // Modals and dialogs
  activeModal: string | null;
  modalData: any;
  dialogStack: Array<{
    id: string;
    component: string;
    props?: any;
    persistent?: boolean;
  }>;
  
  // Panels and tabs
  activePanels: Record<string, string | string[]>;
  panelStates: Record<string, {
    open: boolean;
    size: number;
    position: 'left' | 'right' | 'top' | 'bottom';
    resizable: boolean;
  }>;
  
  // Form states
  activeForms: Record<string, {
    isDirty: boolean;
    isValid: boolean;
    errors: Record<string, string>;
    touched: Record<string, boolean>;
  }>;
  
  // Search and filters
  globalSearch: {
    query: string;
    active: boolean;
    results: any[];
    suggestions: string[];
  };
  viewFilters: Record<string, {
    searchQuery: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    filters: Record<string, any>;
  }>;
  
  // Data visualization
  chartConfigs: Record<string, {
    type: 'line' | 'bar' | 'pie' | 'area' | 'scatter';
    data: any;
    options: any;
    timestamp: Date;
  }>;
  
  // User interaction states
  userPreferences: {
    confirmActions: boolean;
    showTooltips: boolean;
    autoRefresh: boolean;
    refreshInterval: number;
    keyboardShortcuts: boolean;
  };
  
  // Contextual states
  selectedItems: Record<string, string[]>;
  clipboard: any;
  dragState: {
    isDragging: boolean;
    draggedItem: any;
    dropTarget: string | null;
    dragOffset: { x: number; y: number };
  };
  
  // Performance and optimization
  virtualization: {
    enabled: boolean;
    itemHeight: number;
    overscan: number;
  };
  
  // Accessibility
  accessibility: {
    highContrast: boolean;
    reducedMotion: boolean;
    screenReaderOptimized: boolean;
    keyboardNavigation: boolean;
  };
  
  // Error handling
  errorBoundary: {
    hasError: boolean;
    error: Error | null;
    errorInfo: any;
    retryAction?: () => void;
  };
}

// Types for UI actions
interface UIActions {
  // Navigation and routing
  setCurrentView: (view: UIState['currentView'], data?: any) => void;
  navigateToView: (view: string, data?: any) => void;
  goBack: () => void;
  addBreadcrumb: (label: string, view: string, id?: string) => void;
  clearBreadcrumbs: () => void;
  
  // Sidebar and layout
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSidebarWidth: (width: number) => void;
  setLayoutMode: (mode: 'desktop' | 'tablet' | 'mobile') => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  
  // Loading states
  setGlobalLoading: (loading: boolean, message?: string) => void;
  setLoading: (key: string, loading: boolean, message?: string) => void;
  clearLoading: (key: string) => void;
  clearAllLoading: () => void;
  
  // Notifications
  showNotification: (notification: Omit<UIState['notifications'][0], 'id' | 'timestamp'>) => string;
  hideNotification: (id: string) => void;
  clearNotifications: (type?: UIState['notifications'][0]['type']) => void;
  showSuccess: (title: string, message: string, duration?: number) => string;
  showError: (title: string, message: string, persistent?: boolean) => string;
  showWarning: (title: string, message: string, duration?: number) => string;
  showInfo: (title: string, message: string, duration?: number) => string;
  
  // Modals and dialogs
  openModal: (component: string, data?: any, persistent?: boolean) => string;
  closeModal: () => void;
  closeModalById: (id: string) => void;
  pushDialog: (component: string, props?: any, persistent?: boolean) => string;
  popDialog: () => void;
  clearDialogStack: () => void;
  
  // Panels and tabs
  setActivePanel: (panelId: string, tabId: string | string[]) => void;
  togglePanel: (panelId: string) => void;
  setPanelSize: (panelId: string, size: number) => void;
  setPanelPosition: (panelId: string, position: 'left' | 'right' | 'top' | 'bottom') => void;
  resetPanelLayout: () => void;
  
  // Form states
  setFormState: (formId: string, state: Partial<UIState['activeForms'][string]>) => void;
  clearFormState: (formId: string) => void;
  updateFormField: (formId: string, field: string, value: any, valid?: boolean, error?: string) => void;
  
  // Search and filters
  setGlobalSearch: (query: string) => void;
  toggleGlobalSearch: () => void;
  clearGlobalSearch: () => void;
  setViewFilter: (view: string, filter: Partial<UIState['viewFilters'][string]>) => void;
  clearViewFilter: (view: string) => void;
  
  // Data visualization
  setChartConfig: (chartId: string, config: Omit<UIState['chartConfigs'][string], 'timestamp'>) => void;
  removeChartConfig: (chartId: string) => void;
  refreshChart: (chartId: string) => void;
  
  // User interaction
  setUserPreference: (key: keyof UIState['userPreferences'], value: any) => void;
  updateSelectedItems: (context: string, itemId: string, selected: boolean) => void;
  clearSelectedItems: (context?: string) => void;
  setClipboard: (data: any) => void;
  clearClipboard: () => void;
  
  // Drag and drop
  startDrag: (item: any, offset: { x: number; y: number }) => void;
  updateDragPosition: (offset: { x: number; y: number }) => void;
  setDropTarget: (target: string | null) => void;
  endDrag: () => void;
  
  // Virtualization
  enableVirtualization: (enabled: boolean, itemHeight?: number, overscan?: number) => void;
  
  // Accessibility
  setAccessibilityOption: (option: keyof UIState['accessibility'], value: boolean) => void;
  resetAccessibilitySettings: () => void;
  
  // Error handling
  setError: (error: Error, retryAction?: () => void) => void;
  clearError: () => void;
  resetErrorBoundary: () => void;
  
  // Utility actions
  resetUIState: () => void;
  exportUIState: () => string;
  importUIState: (stateData: string) => void;
  
  // Computed getters
  getCurrentViewData: () => any;
  isLoading: (key?: string) => boolean;
  getNotificationCount: (type?: UIState['notifications'][0]['type']) => number;
  getActiveModalData: () => any;
  getSelectedItems: (context: string) => string[];
  getPanelState: (panelId: string) => UIState['panelStates'][string] | undefined;
  
  // Event handlers
  handleKeyboardShortcut: (event: KeyboardEvent) => void;
  handleResize: (dimensions: { width: number; height: number }) => void;
  handleVisibilityChange: (visible: boolean) => void;
}

// Combined store type
type UIStore = UIState & UIActions;

// Default state
const createDefaultState = (): Omit<UIState, keyof UIActions> => ({
  currentView: 'dashboard',
  previousView: null,
  breadcrumbs: [{ label: 'Dashboard', view: 'dashboard' }],
  
  sidebarOpen: true,
  sidebarCollapsed: false,
  sidebarWidth: 280,
  layoutMode: 'desktop',
  theme: 'system',
  
  globalLoading: false,
  loadingStates: {},
  loadingMessages: {},
  
  notifications: [],
  
  activeModal: null,
  modalData: null,
  dialogStack: [],
  
  activePanels: {},
  panelStates: {},
  
  activeForms: {},
  
  globalSearch: {
    query: '',
    active: false,
    results: [],
    suggestions: []
  },
  viewFilters: {},
  
  chartConfigs: {},
  
  userPreferences: {
    confirmActions: true,
    showTooltips: true,
    autoRefresh: false,
    refreshInterval: 30000, // 30 seconds
    keyboardShortcuts: true
  },
  
  selectedItems: {},
  clipboard: null,
  dragState: {
    isDragging: false,
    draggedItem: null,
    dropTarget: null,
    dragOffset: { x: 0, y: 0 }
  },
  
  virtualization: {
    enabled: true,
    itemHeight: 40,
    overscan: 5
  },
  
  accessibility: {
    highContrast: false,
    reducedMotion: false,
    screenReaderOptimized: false,
    keyboardNavigation: true
  },
  
  errorBoundary: {
    hasError: false,
    error: null,
    errorInfo: null
  }
});

// Store implementation
export const useUIStore = create<UIStore>()(
  subscribeWithSelector(
    immer((set, get) => ({
      ...createDefaultState(),

      // Navigation and routing
      setCurrentView: (view, data) => {
        set((state) => {
          state.previousView = state.currentView;
          state.currentView = view;
          
          // Update breadcrumbs
          const existingBreadcrumbIndex = state.breadcrumbs.findIndex(b => b.view === view);
          if (existingBreadcrumbIndex >= 0) {
            state.breadcrumbs = state.breadcrumbs.slice(0, existingBreadcrumbIndex + 1);
          } else {
            state.breadcrumbs.push({
              label: view.charAt(0).toUpperCase() + view.slice(1),
              view
            });
          }
          
          // Store data for the view
          if (data) {
            state.modalData = data;
          }
        });
      },

      navigateToView: (view, data) => {
        get().setCurrentView(view as UIState['currentView'], data);
      },

      goBack: () => {
        const { previousView } = get();
        if (previousView) {
          get().setCurrentView(previousView as UIState['currentView']);
        }
      },

      addBreadcrumb: (label, view, id) => {
        set((state) => {
          state.breadcrumbs.push({ label, view, id });
        });
      },

      clearBreadcrumbs: () => {
        set((state) => {
          state.breadcrumbs = [{ label: 'Dashboard', view: 'dashboard' }];
        });
      },

      // Sidebar and layout
      toggleSidebar: () => {
        set((state) => {
          state.sidebarOpen = !state.sidebarOpen;
        });
      },

      setSidebarOpen: (open) => {
        set((state) => {
          state.sidebarOpen = open;
        });
      },

      setSidebarCollapsed: (collapsed) => {
        set((state) => {
          state.sidebarCollapsed = collapsed;
        });
      },

      setSidebarWidth: (width) => {
        set((state) => {
          state.sidebarWidth = Math.max(200, Math.min(600, width));
        });
      },

      setLayoutMode: (mode) => {
        set((state) => {
          state.layoutMode = mode;
          
          // Auto-adjust sidebar for mobile/tablet
          if (mode === 'mobile') {
            state.sidebarOpen = false;
          }
        });
      },

      setTheme: (theme) => {
        set((state) => {
          state.theme = theme;
        });

        // Apply theme to document
        const root = document.documentElement;
        if (theme === 'dark') {
          root.classList.add('dark');
        } else if (theme === 'light') {
          root.classList.remove('dark');
        } else {
          // System theme
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          if (prefersDark) {
            root.classList.add('dark');
          } else {
            root.classList.remove('dark');
          }
        }
      },

      // Loading states
      setGlobalLoading: (loading, message) => {
        set((state) => {
          state.globalLoading = loading;
          if (message) {
            state.loadingMessages.global = message;
          }
        });
      },

      setLoading: (key, loading, message) => {
        set((state) => {
          state.loadingStates[key] = loading;
          if (message) {
            state.loadingMessages[key] = message;
          }
        });
      },

      clearLoading: (key) => {
        set((state) => {
          delete state.loadingStates[key];
          delete state.loadingMessages[key];
        });
      },

      clearAllLoading: () => {
        set((state) => {
          state.loadingStates = {};
          state.loadingMessages = {};
          state.globalLoading = false;
        });
      },

      // Notifications
      showNotification: (notificationData) => {
        const id = crypto.randomUUID();
        
        set((state) => {
          state.notifications.push({
            ...notificationData,
            id,
            timestamp: new Date()
          });
          
          // Auto-hide notification if duration is set
          if (notificationData.duration && !notificationData.persistent) {
            setTimeout(() => {
              get().hideNotification(id);
            }, notificationData.duration);
          }
        });
        
        return id;
      },

      hideNotification: (id) => {
        set((state) => {
          state.notifications = state.notifications.filter(n => n.id !== id);
        });
      },

      clearNotifications: (type) => {
        set((state) => {
          if (type) {
            state.notifications = state.notifications.filter(n => n.type !== type);
          } else {
            state.notifications = [];
          }
        });
      },

      showSuccess: (title, message, duration = 5000) => {
        return get().showNotification({
          type: 'success',
          title,
          message,
          duration
        });
      },

      showError: (title, message, persistent = false) => {
        return get().showNotification({
          type: 'error',
          title,
          message,
          persistent
        });
      },

      showWarning: (title, message, duration = 7000) => {
        return get().showNotification({
          type: 'warning',
          title,
          message,
          duration
        });
      },

      showInfo: (title, message, duration = 5000) => {
        return get().showNotification({
          type: 'info',
          title,
          message,
          duration
        });
      },

      // Modals and dialogs
      openModal: (component, data, persistent = false) => {
        const id = crypto.randomUUID();
        set((state) => {
          state.activeModal = component;
          state.modalData = data;
          if (persistent) {
            state.dialogStack.push({ id, component, props: data, persistent: true });
          }
        });
        return id;
      },

      closeModal: () => {
        set((state) => {
          state.activeModal = null;
          state.modalData = null;
          
          // Remove non-persistent dialogs from stack
          state.dialogStack = state.dialogStack.filter(dialog => dialog.persistent);
        });
      },

      closeModalById: (id) => {
        set((state) => {
          state.dialogStack = state.dialogStack.filter(dialog => dialog.id !== id);
          
          // If this was the active modal, close it
          if (state.activeModal === id) {
            state.activeModal = null;
            state.modalData = null;
          }
        });
      },

      pushDialog: (component, props, persistent = false) => {
        const id = crypto.randomUUID();
        set((state) => {
          state.dialogStack.push({ id, component, props, persistent });
        });
        return id;
      },

      popDialog: () => {
        set((state) => {
          const lastDialog = state.dialogStack[state.dialogStack.length - 1];
          if (lastDialog && !lastDialog.persistent) {
            state.dialogStack.pop();
            
            // If we popped the active modal, update it
            if (state.dialogStack.length === 0) {
              state.activeModal = null;
              state.modalData = null;
            }
          }
        });
      },

      clearDialogStack: () => {
        set((state) => {
          state.dialogStack = state.dialogStack.filter(dialog => dialog.persistent);
          state.activeModal = null;
          state.modalData = null;
        });
      },

      // Panels and tabs
      setActivePanel: (panelId, tabId) => {
        set((state) => {
          state.activePanels[panelId] = tabId;
        });
      },

      togglePanel: (panelId) => {
        set((state) => {
          if (!state.panelStates[panelId]) {
            state.panelStates[panelId] = {
              open: true,
              size: 300,
              position: 'right',
              resizable: true
            };
          }
          
          state.panelStates[panelId].open = !state.panelStates[panelId].open;
        });
      },

      setPanelSize: (panelId, size) => {
        set((state) => {
          if (!state.panelStates[panelId]) {
            state.panelStates[panelId] = {
              open: true,
              size: 300,
              position: 'right',
              resizable: true
            };
          }
          
          state.panelStates[panelId].size = size;
        });
      },

      setPanelPosition: (panelId, position) => {
        set((state) => {
          if (!state.panelStates[panelId]) {
            state.panelStates[panelId] = {
              open: true,
              size: 300,
              position: 'right',
              resizable: true
            };
          }
          
          state.panelStates[panelId].position = position;
        });
      },

      resetPanelLayout: () => {
        set((state) => {
          state.panelStates = {};
          state.activePanels = {};
        });
      },

      // Form states
      setFormState: (formId, formState) => {
        set((state) => {
          if (!state.activeForms[formId]) {
            state.activeForms[formId] = {
              isDirty: false,
              isValid: true,
              errors: {},
              touched: {}
            };
          }
          
          state.activeForms[formId] = {
            ...state.activeForms[formId],
            ...formState
          };
        });
      },

      clearFormState: (formId) => {
        set((state) => {
          delete state.activeForms[formId];
        });
      },

      updateFormField: (formId, field, value, valid = true, error) => {
        set((state) => {
          if (!state.activeForms[formId]) {
            state.activeForms[formId] = {
              isDirty: true,
              isValid: true,
              errors: {},
              touched: {}
            };
          }
          
          const form = state.activeForms[formId];
          form.isDirty = true;
          form.touched[field] = true;
          
          if (error) {
            form.errors[field] = error;
            form.isValid = false;
          } else {
            delete form.errors[field];
            form.isValid = Object.keys(form.errors).length === 0;
          }
        });
      },

      // Search and filters
      setGlobalSearch: (query) => {
        set((state) => {
          state.globalSearch.query = query;
          state.globalSearch.active = query.length > 0;
        });
      },

      toggleGlobalSearch: () => {
        set((state) => {
          state.globalSearch.active = !state.globalSearch.active;
        });
      },

      clearGlobalSearch: () => {
        set((state) => {
          state.globalSearch = {
            query: '',
            active: false,
            results: [],
            suggestions: []
          };
        });
      },

      setViewFilter: (view, filter) => {
        set((state) => {
          state.viewFilters[view] = {
            searchQuery: '',
            sortBy: 'createdAt',
            sortOrder: 'desc',
            filters: {},
            ...state.viewFilters[view],
            ...filter
          };
        });
      },

      clearViewFilter: (view) => {
        set((state) => {
          delete state.viewFilters[view];
        });
      },

      // Data visualization
      setChartConfig: (chartId, config) => {
        set((state) => {
          state.chartConfigs[chartId] = {
            ...config,
            timestamp: new Date()
          };
        });
      },

      removeChartConfig: (chartId) => {
        set((state) => {
          delete state.chartConfigs[chartId];
        });
      },

      refreshChart: (chartId) => {
        set((state) => {
          if (state.chartConfigs[chartId]) {
            state.chartConfigs[chartId].timestamp = new Date();
          }
        });
      },

      // User interaction
      setUserPreference: (key, value) => {
        set((state) => {
          state.userPreferences[key] = value;
        });
      },

      updateSelectedItems: (context, itemId, selected) => {
        set((state) => {
          if (!state.selectedItems[context]) {
            state.selectedItems[context] = [];
          }
          
          if (selected) {
            if (!state.selectedItems[context].includes(itemId)) {
              state.selectedItems[context].push(itemId);
            }
          } else {
            state.selectedItems[context] = state.selectedItems[context].filter(id => id !== itemId);
          }
        });
      },

      clearSelectedItems: (context) => {
        set((state) => {
          if (context) {
            delete state.selectedItems[context];
          } else {
            state.selectedItems = {};
          }
        });
      },

      setClipboard: (data) => {
        set((state) => {
          state.clipboard = data;
        });
      },

      clearClipboard: () => {
        set((state) => {
          state.clipboard = null;
        });
      },

      // Drag and drop
      startDrag: (item, offset) => {
        set((state) => {
          state.dragState = {
            isDragging: true,
            draggedItem: item,
            dropTarget: null,
            dragOffset: offset
          };
        });
      },

      updateDragPosition: (offset) => {
        set((state) => {
          if (state.dragState.isDragging) {
            state.dragState.dragOffset = offset;
          }
        });
      },

      setDropTarget: (target) => {
        set((state) => {
          state.dragState.dropTarget = target;
        });
      },

      endDrag: () => {
        set((state) => {
          state.dragState = {
            isDragging: false,
            draggedItem: null,
            dropTarget: null,
            dragOffset: { x: 0, y: 0 }
          };
        });
      },

      // Virtualization
      enableVirtualization: (enabled, itemHeight = 40, overscan = 5) => {
        set((state) => {
          state.virtualization = {
            enabled,
            itemHeight,
            overscan
          };
        });
      },

      // Accessibility
      setAccessibilityOption: (option, value) => {
        set((state) => {
          state.accessibility[option] = value;
        });

        // Apply accessibility changes
        const root = document.documentElement;
        if (option === 'highContrast') {
          if (value) {
            root.classList.add('high-contrast');
          } else {
            root.classList.remove('high-contrast');
          }
        } else if (option === 'reducedMotion') {
          if (value) {
            root.classList.add('reduce-motion');
          } else {
            root.classList.remove('reduce-motion');
          }
        }
      },

      resetAccessibilitySettings: () => {
        set((state) => {
          state.accessibility = {
            highContrast: false,
            reducedMotion: false,
            screenReaderOptimized: false,
            keyboardNavigation: true
          };
        });
      },

      // Error handling
      setError: (error, retryAction) => {
        set((state) => {
          state.errorBoundary = {
            hasError: true,
            error,
            errorInfo: error.stack,
            retryAction
          };
        });
      },

      clearError: () => {
        set((state) => {
          state.errorBoundary = {
            hasError: false,
            error: null,
            errorInfo: null
          };
        });
      },

      resetErrorBoundary: () => {
        set((state) => {
          state.errorBoundary = {
            hasError: false,
            error: null,
            errorInfo: null
          };
        });
      },

      // Utility actions
      resetUIState: () => {
        set(() => ({
          ...createDefaultState()
        }));
      },

      exportUIState: () => {
        const state = get();
        const exportableState = {
          userPreferences: state.userPreferences,
          accessibility: state.accessibility,
          panelStates: state.panelStates,
          viewFilters: state.viewFilters,
          chartConfigs: state.chartConfigs,
          theme: state.theme
        };
        return JSON.stringify(exportableState, null, 2);
      },

      importUIState: (stateData) => {
        try {
          const importedState = JSON.parse(stateData);
          set((state) => {
            Object.assign(state.userPreferences, importedState.userPreferences || {});
            Object.assign(state.accessibility, importedState.accessibility || {});
            Object.assign(state.panelStates, importedState.panelStates || {});
            Object.assign(state.viewFilters, importedState.viewFilters || {});
            Object.assign(state.chartConfigs, importedState.chartConfigs || {});
            if (importedState.theme) {
              state.theme = importedState.theme;
            }
          });
        } catch (error) {
          get().showError('Import Error', 'Failed to import UI state');
        }
      },

      // Computed getters
      getCurrentViewData: () => {
        return get().modalData;
      },

      isLoading: (key) => {
        const { globalLoading, loadingStates } = get();
        return key ? loadingStates[key] || false : globalLoading;
      },

      getNotificationCount: (type) => {
        const { notifications } = get();
        if (type) {
          return notifications.filter(n => n.type === type).length;
        }
        return notifications.length;
      },

      getActiveModalData: () => {
        return get().modalData;
      },

      getSelectedItems: (context) => {
        return get().selectedItems[context] || [];
      },

      getPanelState: (panelId) => {
        return get().panelStates[panelId];
      },

      // Event handlers
      handleKeyboardShortcut: (event) => {
        const { userPreferences } = get();
        if (!userPreferences.keyboardShortcuts) return;

        // Global shortcuts
        if (event.ctrlKey || event.metaKey) {
          switch (event.key) {
            case 'k':
              event.preventDefault();
              get().toggleGlobalSearch();
              break;
            case '/':
              event.preventDefault();
              get().toggleGlobalSearch();
              break;
          }
        }

        // View navigation
        switch (event.key) {
          case 'Escape':
            if (get().activeModal) {
              get().closeModal();
            }
            break;
        }
      },

      handleResize: (dimensions) => {
        const { width } = dimensions;
        let layoutMode: 'desktop' | 'tablet' | 'mobile' = 'desktop';
        
        if (width < 768) {
          layoutMode = 'mobile';
        } else if (width < 1024) {
          layoutMode = 'tablet';
        }

        const currentMode = get().layoutMode;
        if (currentMode !== layoutMode) {
          get().setLayoutMode(layoutMode);
        }
      },

      handleVisibilityChange: (visible) => {
        if (!visible) {
          // Pause any ongoing operations when tab is not visible
          get().clearAllLoading();
        }
      }
    }))
  )
);

// Subscribe to window events
if (typeof window !== 'undefined') {
  window.addEventListener('resize', (event) => {
    useUIStore.getState().handleResize({
      width: event.target.innerWidth,
      height: event.target.innerHeight
    });
  });

  document.addEventListener('visibilitychange', () => {
    useUIStore.getState().handleVisibilityChange(!document.hidden);
  });

  document.addEventListener('keydown', (event) => {
    useUIStore.getState().handleKeyboardShortcut(event);
  });
}
