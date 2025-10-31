import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { WifiOff, RefreshCw, Home, Database } from 'lucide-react'
import { motion } from 'framer-motion'

interface OfflinePageProps {
  onRetry?: () => void
  onHome?: () => void
}

export const OfflinePage: React.FC<OfflinePageProps> = ({
  onRetry,
  onHome
}) => {
  const handleRetry = () => {
    if (onRetry) {
      onRetry()
    } else {
      window.location.reload()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
          <CardHeader className="text-center pb-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="mx-auto mb-4 p-4 bg-red-100 rounded-full w-fit"
            >
              <WifiOff className="h-8 w-8 text-red-600" />
            </motion.div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              You're Offline
            </CardTitle>
            <CardDescription className="text-gray-600">
              No internet connection detected
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Offline Features */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Database className="h-4 w-4" />
                Available Offline
              </h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  View cached objectives
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  Access saved tasks
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  Review completed results
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></div>
                  Create new objectives (will sync when online)
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={handleRetry}
                className="w-full"
                size="lg"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              
              <Button
                onClick={onHome}
                variant="outline"
                className="w-full"
                size="lg"
              >
                <Home className="h-4 w-4 mr-2" />
                Go to Home
              </Button>
            </div>

            {/* Help Text */}
            <div className="text-center text-xs text-gray-500">
              <p>
                Make sure you have a stable internet connection.
                <br />
                Once back online, your changes will be automatically synced.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

// Component for displaying offline status in the app
export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine)

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (isOnline) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -100 }}
      className="fixed top-0 left-0 right-0 bg-orange-500 text-white z-50"
    >
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-center gap-2 text-sm">
          <WifiOff className="h-4 w-4" />
          <span>You're offline - some features may be limited</span>
        </div>
      </div>
    </motion.div>
  )
}

export default OfflinePage