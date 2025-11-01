import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Bell, 
  BellRing, 
  Wifi, 
  WifiOff, 
  Smartphone, 
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react'
import { motion } from 'framer-motion'
import { 
  requestNotificationPermission, 
  isPWACompatible,
  usePWA 
} from '@/lib/pwa-utils'

interface NotificationSettings {
  taskComplete: boolean
  errorAlerts: boolean
  backgroundSync: boolean
  performanceAlerts: boolean
}


export const PWAStatus: React.FC = () => {
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default')
  const [settings, setSettings] = useState<NotificationSettings>({
    taskComplete: true,
    errorAlerts: true,
    backgroundSync: true,
    performanceAlerts: false
  })
  const [serviceWorkerStatus, setServiceWorkerStatus] = useState<ServiceWorkerState>('installing')
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isInstalled, setIsInstalled] = useState(false)
  const [hasUpdate, setHasUpdate] = useState(false)

  const { canInstall } = usePWA()

  useEffect(() => {
    // Check initial state
    setNotificationPermission(Notification.permission)
    checkPWAStatus()

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Listen for service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        if (registration.active) {
          setServiceWorkerStatus(registration.active.state)
        }
      })

      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // Service worker has updated
        setHasUpdate(false)
        checkPWAStatus()
      })

      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'SW_UPDATE_AVAILABLE') {
          setHasUpdate(true)
        }
      })
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const checkPWAStatus = () => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    const isInWebApp = (window.navigator as any).standalone === true
    setIsInstalled(isStandalone || isInWebApp)
  }

  const handleNotificationRequest = async () => {
    try {
      const permission = await requestNotificationPermission()
      setNotificationPermission(permission)
    } catch (error) {
      console.error('Failed to request notification permission:', error)
    }
  }

  const handleUpdateApp = async () => {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready
      await registration.update()
    }
    window.location.reload()
  }

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    )
  }

  const getConnectionStatus = () => {
    if (isOnline) {
      return {
        icon: <Wifi className="h-4 w-4 text-green-500" />,
        text: 'Online',
        color: 'text-green-600'
      }
    } else {
      return {
        icon: <WifiOff className="h-4 w-4 text-red-500" />,
        text: 'Offline',
        color: 'text-red-600'
      }
    }
  }

  const connectionStatus = getConnectionStatus()

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          PWA Status & Features
        </CardTitle>
        <CardDescription>
          Progressive Web App configuration and monitoring
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Installation Status */}
        {canInstall && !isInstalled && (
          <Alert>
            <BellRing className="h-4 w-4" />
            <AlertDescription>
              <strong>Install Available:</strong> Install BabyAGI as a native app for offline access and better performance.
            </AlertDescription>
          </Alert>
        )}

        {/* Connection Status */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-3">
            {connectionStatus.icon}
            <span className={`font-medium ${connectionStatus.color}`}>
              {connectionStatus.text}
            </span>
          </div>
          <Badge variant={isOnline ? 'default' : 'destructive'}>
            {isOnline ? 'Connected' : 'Disconnected'}
          </Badge>
        </div>

        {/* PWA Installation Status */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-3">
            <Smartphone className="h-4 w-4 text-blue-500" />
            <span className="font-medium">PWA Installed</span>
          </div>
          <Badge variant={isInstalled ? 'default' : 'secondary'}>
            {isInstalled ? 'Yes' : 'No'}
          </Badge>
        </div>

        {/* Service Worker Status */}
        {isPWACompatible() && (
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              Service Worker Status
              <Badge variant="outline">
                {serviceWorkerStatus}
              </Badge>
            </h4>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="font-medium">Active & Ready</span>
              </div>
              {hasUpdate && (
                <Button
                  onClick={handleUpdateApp}
                  size="sm"
                  variant="outline"
                >
                  Update App
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Notification Permissions */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notification Settings
          </h4>
          
          {notificationPermission !== 'granted' ? (
            <Button
              onClick={handleNotificationRequest}
              className="w-full"
              variant="outline"
            >
              <Bell className="h-4 w-4 mr-2" />
              Enable Notifications
            </Button>
          ) : (
            <div className="space-y-3">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Notifications are enabled and ready to keep you informed about task completion.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Task Completion</div>
                    <div className="text-sm text-muted-foreground">
                      Get notified when tasks complete
                    </div>
                  </div>
                  <Switch
                    checked={settings.taskComplete}
                    onCheckedChange={(checked) =>
                      setSettings(prev => ({ ...prev, taskComplete: checked }))
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Error Alerts</div>
                    <div className="text-sm text-muted-foreground">
                      Notifications for errors and issues
                    </div>
                  </div>
                  <Switch
                    checked={settings.errorAlerts}
                    onCheckedChange={(checked) =>
                      setSettings(prev => ({ ...prev, errorAlerts: checked }))
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Background Sync</div>
                    <div className="text-sm text-muted-foreground">
                      Sync task results when online
                    </div>
                  </div>
                  <Switch
                    checked={settings.backgroundSync}
                    onCheckedChange={(checked) =>
                      setSettings(prev => ({ ...prev, backgroundSync: checked }))
                    }
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* PWA Features Status */}
        <div className="space-y-3">
          <h4 className="font-medium">PWA Features</h4>
          <div className="grid grid-cols-2 gap-3">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="flex items-center gap-2 p-2 bg-muted rounded-lg"
            >
              {getStatusIcon(isPWACompatible())}
              <span className="text-sm">Service Worker</span>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="flex items-center gap-2 p-2 bg-muted rounded-lg"
            >
              {getStatusIcon('Notification' in window)}
              <span className="text-sm">Push Notifications</span>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="flex items-center gap-2 p-2 bg-muted rounded-lg"
            >
              {getStatusIcon(isInstalled)}
              <span className="text-sm">App Manifest</span>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="flex items-center gap-2 p-2 bg-muted rounded-lg"
            >
              {getStatusIcon(isOnline)}
              <span className="text-sm">Background Sync</span>
            </motion.div>
          </div>
        </div>

        {/* Cache Status */}
        {isPWACompatible() && (
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Cache Information
            </h4>
            <Alert>
              <AlertDescription>
                <strong>Offline Ready:</strong> The app caches essential resources for offline usage.
                <br />
                <strong>Storage:</strong> Temporary storage is used for task results and app data.
                <br />
                <strong>Updates:</strong> Automatic updates ensure you always have the latest version.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </CardContent>
    </Card>
  )
}