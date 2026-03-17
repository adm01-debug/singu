import { useState, useEffect, useCallback, useRef } from 'react';

interface UseOnlineStatusOptions {
  /** Callback when connection is lost */
  onOffline?: () => void;
  /** Callback when connection is restored */
  onOnline?: () => void;
  /** Check interval in ms (default: 30000) */
  pingInterval?: number;
}

interface UseOnlineStatusReturn {
  /** Whether the browser is online */
  isOnline: boolean;
  /** Whether we're checking connection status */
  isChecking: boolean;
  /** Last time connection was checked */
  lastChecked: Date | null;
  /** Manually trigger a connection check */
  checkConnection: () => Promise<boolean>;
}

/**
 * Hook to track online/offline status with optional ping checks
 */
export function useOnlineStatus(options: UseOnlineStatusOptions = {}): UseOnlineStatusReturn {
  const { onOffline, onOnline, pingInterval } = options;

  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  // Use refs for callbacks to break dependency cycle
  const onOnlineRef = useRef(onOnline);
  const onOfflineRef = useRef(onOffline);
  onOnlineRef.current = onOnline;
  onOfflineRef.current = onOffline;

  // Check connection with a simple fetch — stable reference (no deps on isOnline)
  const checkConnection = useCallback(async (): Promise<boolean> => {
    if (typeof navigator === 'undefined') return true;

    setIsChecking(true);

    try {
      const response = await fetch('/favicon.ico', {
        method: 'HEAD',
        cache: 'no-store',
      });

      const online = response.ok;
      setLastChecked(new Date());

      setIsOnline(prev => {
        if (online !== prev) {
          if (online) onOnlineRef.current?.();
          else onOfflineRef.current?.();
        }
        return online;
      });

      return online;
    } catch {
      setLastChecked(new Date());

      setIsOnline(prev => {
        if (prev) onOfflineRef.current?.();
        return false;
      });

      return false;
    } finally {
      setIsChecking(false);
    }
  }, []);

  // Listen for browser online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      onOnline?.();
    };

    const handleOffline = () => {
      setIsOnline(false);
      onOffline?.();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [onOnline, onOffline]);

  // Optional periodic ping check
  useEffect(() => {
    if (!pingInterval) return;

    const interval = setInterval(() => {
      checkConnection();
    }, pingInterval);

    return () => clearInterval(interval);
  }, [pingInterval, checkConnection]);

  return {
    isOnline,
    isChecking,
    lastChecked,
    checkConnection,
  };
}

export default useOnlineStatus;
