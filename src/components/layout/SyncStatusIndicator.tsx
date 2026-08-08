'use client'

import { useEffect, useState } from 'react'
import { useSyncQueueStore } from '@/store/syncQueueStore'
import { syncEngine } from '@/lib/sync/queue'
import { Cloud, CloudOff, RefreshCw, AlertCircle } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function SyncStatusIndicator() {
  const [isOnline, setIsOnline] = useState(true)
  const { queue, isSyncing, lastSyncTime } = useSyncQueueStore()
  
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsOnline(navigator.onLine)
    
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    // Initialize auto-resume
    syncEngine.initAutoResume()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const failedItems = queue.filter(a => a.status === 'failed')
  const pendingItems = queue.filter(a => a.status !== 'failed' && a.status !== 'syncing')

  let statusIcon = <Cloud className="h-5 w-5 text-muted-foreground" />
  let statusText = 'Online & synced'
  let textColor = 'text-muted-foreground'

  if (!isOnline) {
    statusIcon = <CloudOff className="h-5 w-5 text-muted-foreground" />
    statusText = 'Offline'
  } else if (isSyncing) {
    statusIcon = <RefreshCw className="h-5 w-5 text-primary animate-spin" />
    statusText = 'Syncing...'
    textColor = 'text-primary'
  } else if (failedItems.length > 0) {
    statusIcon = <AlertCircle className="h-5 w-5 text-destructive" />
    statusText = 'Sync failed. Retrying...'
    textColor = 'text-destructive'
  } else if (pendingItems.length > 0) {
    statusIcon = <Cloud className="h-5 w-5 text-yellow-500" />
    statusText = `${pendingItems.length} items queued`
    textColor = 'text-yellow-500'
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div className="flex items-center gap-2 px-2 py-1.5 cursor-default hover:bg-secondary/50 rounded-md transition-colors">
            {statusIcon}
            {queue.length > 0 && !isSyncing && (
              <span className={`text-xs font-medium ${textColor}`}>
                {queue.length}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="end" className="w-64 p-3 bg-card border border-border shadow-xl">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm leading-none flex items-center justify-between">
              <span>Sync Status</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isOnline ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </h4>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Queue length: {queue.length}</p>
              <p>State: {statusText}</p>
              <p>Last synced: {lastSyncTime ? new Date(lastSyncTime).toLocaleTimeString() : 'Never'}</p>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
