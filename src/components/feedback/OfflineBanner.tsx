import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useState, useEffect } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface OfflineBannerProps {
  /** Position of the banner */
  position?: 'top' | 'bottom';
  /** Custom message when offline */
  message?: string;
  /** Show sync message when back online */
  showSyncMessage?: boolean;
}

export function OfflineBanner({
  position = 'bottom',
  message = 'Você está offline. Suas ações serão sincronizadas quando a conexão for restaurada.',
  showSyncMessage = true,
}: OfflineBannerProps) {
  const { isOnline, isChecking, checkConnection } = useOnlineStatus();
  const [showReconnected, setShowReconnected] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  // Track if we were offline
  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
    } else if (wasOffline && showSyncMessage) {
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
        setWasOffline(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline, showSyncMessage]);

  // Auto-retry connection every 10 seconds when offline
  useEffect(() => {
    if (isOnline || isChecking) return;
    const interval = setInterval(() => {
      checkConnection();
    }, 10000);
    return () => clearInterval(interval);
  }, [isOnline, isChecking, checkConnection]);

  const positionClasses = position === 'top'
    ? 'top-0 left-0 right-0'
    : 'bottom-0 left-0 right-0 pb-safe';

  const animation = prefersReducedMotion
    ? { opacity: 1, y: 0 }
    : { opacity: 1, y: 0 };

  const initial = prefersReducedMotion
    ? { opacity: 0 }
    : { opacity: 0, y: position === 'top' ? -20 : 20 };

  const exit = prefersReducedMotion
    ? { opacity: 0 }
    : { opacity: 0, y: position === 'top' ? -20 : 20 };

  return (
    <AnimatePresence>
      {/* Offline Banner */}
      {!isOnline && (
        <motion.div
          initial={initial}
          animate={animation}
          exit={exit}
          transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
          className={`fixed ${positionClasses} z-[var(--z-toast)] px-4 py-3`}
        >
          <div className="max-w-xl mx-auto">
            <div className="bg-warning/95 backdrop-blur-sm text-warning-foreground rounded-lg shadow-lg border border-warning/20 p-4">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <WifiOff className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Sem conexão</p>
                  <p className="text-xs opacity-90 mt-0.5">{message}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => checkConnection()}
                  disabled={isChecking}
                  className="flex-shrink-0 bg-warning-foreground/10 hover:bg-warning-foreground/20"
                >
                  {isChecking ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Verificar
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Reconnected Banner */}
      {showReconnected && (
        <motion.div
          initial={initial}
          animate={animation}
          exit={exit}
          transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
          className={`fixed ${positionClasses} z-[var(--z-toast)] px-4 py-3`}
        >
          <div className="max-w-xl mx-auto">
            <div className="bg-success/95 backdrop-blur-sm text-success-foreground rounded-lg shadow-lg border border-success/20 p-4">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  >
                    ✓
                  </motion.div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Conexão restaurada</p>
                  <p className="text-xs opacity-90 mt-0.5">
                    Suas alterações estão sendo sincronizadas...
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default OfflineBanner;
