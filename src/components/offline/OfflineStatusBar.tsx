import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Cloud,
  CloudOff,
  RefreshCw,
  Wifi,
  WifiOff,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

export function OfflineStatusBar() {
  const { isOnline, isSyncing, pendingCount, syncPendingOperations, getCacheSize } = useOfflineSync();
  const [showBar, setShowBar] = useState(false);
  const [cacheSize, setCacheSize] = useState(0);

  useEffect(() => {
    // Show bar when offline or when there are pending operations
    setShowBar(!isOnline || pendingCount > 0);

    // Update cache size
    setCacheSize(getCacheSize());
  }, [isOnline, pendingCount, getCacheSize]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  return (
    <AnimatePresence>
      {showBar && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div
            className={`px-4 py-2 flex items-center justify-between text-sm ${
              isOnline
                ? 'bg-warning/10 border-b border-warning/20'
                : 'bg-destructive/10 border-b border-destructive/20'
            }`}
          >
            <div className="flex items-center gap-3">
              {isOnline ? (
                <div className="flex items-center gap-2 text-warning">
                  <Wifi className="h-4 w-4" />
                  <span>Online</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-destructive">
                  <WifiOff className="h-4 w-4" />
                  <span>Offline</span>
                </div>
              )}

              {pendingCount > 0 && (
                <Badge variant="outline" className="gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {pendingCount} alterações pendentes
                </Badge>
              )}

              {isSyncing && (
                <div className="flex items-center gap-2 text-primary">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Sincronizando...</span>
                </div>
              )}

              {cacheSize > 0 && (
                <span className="text-muted-foreground text-xs">
                  Cache: {formatBytes(cacheSize)}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {isOnline && pendingCount > 0 && !isSyncing && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() => syncPendingOperations()}
                >
                  <Cloud className="h-3 w-3" />
                  Sincronizar agora
                </Button>
              )}

              {!isOnline && (
                <span className="text-xs text-muted-foreground">
                  Alterações serão sincronizadas quando voltar online
                </span>
              )}
            </div>
          </div>

          {isSyncing && (
            <Progress value={undefined} className="h-1" />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Compact status indicator for sidebar/header
export function OfflineStatusIndicator() {
  const { isOnline, pendingCount, isSyncing } = useOfflineSync();

  if (isOnline && pendingCount === 0) {
    return null;
  }

  return (
    <div className="relative">
      {isOnline ? (
        isSyncing ? (
          <RefreshCw className="h-4 w-4 text-primary animate-spin" />
        ) : (
          <Cloud className="h-4 w-4 text-warning" />
        )
      ) : (
        <CloudOff className="h-4 w-4 text-destructive" />
      )}
      {pendingCount > 0 && (
        <span className="absolute -top-1 -right-1 h-3 w-3 bg-warning text-[10px] text-warning-foreground rounded-full flex items-center justify-center font-medium">
          {pendingCount > 9 ? '9+' : pendingCount}
        </span>
      )}
    </div>
  );
}

// Sync status toast content
export function SyncStatusContent({ 
  synced, 
  failed 
}: { 
  synced: number; 
  failed: number 
}) {
  return (
    <div className="flex items-center gap-2">
      {failed === 0 ? (
        <CheckCircle2 className="h-4 w-4 text-success" />
      ) : (
        <AlertTriangle className="h-4 w-4 text-warning" />
      )}
      <div>
        <p className="font-medium">
          {synced} {synced === 1 ? 'alteração sincronizada' : 'alterações sincronizadas'}
        </p>
        {failed > 0 && (
          <p className="text-sm text-muted-foreground">
            {failed} {failed === 1 ? 'falha' : 'falhas'}
          </p>
        )}
      </div>
    </div>
  );
}

export default OfflineStatusBar;
