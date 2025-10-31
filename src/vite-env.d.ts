/// <reference types="vite/client" />

// PWA Module Declarations
declare module 'virtual:pwa-register' {
  export function registerSW(options?: {
    onNeedRefresh?: () => void | Promise<void>;
    onOfflineReady?: () => void | Promise<void>;
    onRegistered?: (registration: ServiceWorkerRegistration | undefined) => void | Promise<void>;
    onRegisterError?: (error: any) => void;
  }): (reloadPage?: boolean) => Promise<void>;
}
