import { useState, useEffect } from 'react'

export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export interface PWADeferredPrompt {
  beforeInstallPrompt?: BeforeInstallPromptEvent
  isInstalled: boolean
  isInstallable: boolean
  installApp: () => Promise<void>
  canInstall: boolean
}

export const usePWA = (): PWADeferredPrompt => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | undefined>()
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if app is already installed
    const checkIfInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      const isInWebApp = (window.navigator as any).standalone === true
      const isInWebAppiOS = window.matchMedia('(display-mode: standalone)').matches && 
                           window.navigator.platform === 'MacIntel'
      
      setIsInstalled(isStandalone || isInWebApp || isInWebAppiOS)
    }

    checkIfInstalled()

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setDeferredPrompt(undefined)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const installApp = async (): Promise<void> => {
    if (!deferredPrompt) return

    try {
      await deferredPrompt.prompt()
      const choiceResult = await deferredPrompt.userChoice
      
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt')
      } else {
        console.log('User dismissed the install prompt')
      }
      
      setDeferredPrompt(undefined)
    } catch (error) {
      console.error('Error installing PWA:', error)
    }
  }

  return {
    beforeInstallPrompt: deferredPrompt,
    isInstalled,
    isInstallable: !!deferredPrompt && !isInstalled,
    installApp,
    canInstall: !!deferredPrompt && !isInstalled
  }
}

export const isPWACompatible = (): boolean => {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window &&
    'BackgroundSync' in window
  )
}

export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) {
    throw new Error('This browser does not support notifications')
  }

  if (Notification.permission === 'granted') {
    return 'granted'
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    return permission
  }

  return 'denied'
}

export const registerBackgroundSync = async (tag: string): Promise<void> => {
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    const registration = await navigator.serviceWorker.ready
    await registration.sync.register(tag)
  }
}

export const sendTaskExecutionToBackgroundSync = async (
  url: string,
  method: string = 'POST',
  body?: any,
  headers?: Record<string, string>
): Promise<void> => {
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    const registration = await navigator.serviceWorker.ready
    
    if ('active' in registration) {
      registration.active?.postMessage({
        type: 'TASK_EXECUTION_OFFLINE',
        url,
        method,
        body,
        headers
      })
    }
  }
}