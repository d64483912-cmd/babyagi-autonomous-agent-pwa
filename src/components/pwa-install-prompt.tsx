import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Download, X, Smartphone, Wifi, Zap, Bell } from 'lucide-react'
import { usePWA } from '@/lib/pwa-utils'
import { motion, AnimatePresence } from 'framer-motion'

interface PWAInstallPromptProps {
  className?: string
  onDismiss?: () => void
  showCloseButton?: boolean
  position?: 'bottom' | 'center' | 'top'
}

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({
  className = '',
  onDismiss,
  showCloseButton = true,
  position = 'bottom'
}) => {
  const { canInstall, installApp, isInstalled, beforeInstallPrompt } = usePWA()

  if (!canInstall || isInstalled || !beforeInstallPrompt) {
    return null
  }

  const handleInstall = async () => {
    await installApp()
    onDismiss?.()
  }

  const handleDismiss = () => {
    onDismiss?.()
  }

  const positionClasses = {
    bottom: 'bottom-4 left-4 right-4',
    center: 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2',
    top: 'top-4 left-4 right-4'
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: position === 'bottom' ? 100 : -100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: position === 'bottom' ? 100 : -100 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={`fixed z-50 ${positionClasses[position]} ${className}`}
      >
        <Card className="bg-gradient-to-br from-blue-600 to-blue-800 text-white border-0 shadow-2xl">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Smartphone className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-lg">Install BabyAGI</CardTitle>
                  <CardDescription className="text-blue-100">
                    Get the full native app experience
                  </CardDescription>
                </div>
              </div>
              {showCloseButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismiss}
                  className="text-white hover:bg-white/20 h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-3 text-sm">
                <Wifi className="h-4 w-4 text-blue-200" />
                <span>Works offline with full functionality</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Zap className="h-4 w-4 text-blue-200" />
                <span>Faster loading and smoother performance</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Bell className="h-4 w-4 text-blue-200" />
                <span>Get notified when tasks complete</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleInstall}
                className="flex-1 bg-white text-blue-600 hover:bg-blue-50"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Install App
              </Button>
              {showCloseButton && (
                <Button
                  variant="outline"
                  onClick={handleDismiss}
                  className="border-white/30 text-white hover:bg-white/10"
                  size="sm"
                >
                  Not Now
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}

// Simplified banner component
export const PWAInstallBanner: React.FC<{
  className?: string
  onDismiss?: () => void
}> = ({ className = '', onDismiss }) => {
  const { canInstall, installApp } = usePWA()

  if (!canInstall) return null

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className={`bg-gradient-to-r from-blue-600 to-blue-700 text-white ${className}`}
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Smartphone className="h-5 w-5" />
            <span className="text-sm font-medium">
              Install BabyAGI for offline access and better performance
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={installApp}
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20"
            >
              Install
            </Button>
            {onDismiss && (
              <Button
                onClick={onDismiss}
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/20 h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default PWAInstallPrompt