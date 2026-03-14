import { useCallback, useEffect, useRef, useState } from 'react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { toast } from 'sonner';

interface QueuedMutation {
  id: string;
  action: () => Promise<void>;
  description: string;
  createdAt: number;
}

/**
 * Hook for queueing mutations while offline and executing them when back online
 */
export function useOfflineQueue() {
  const { isOnline } = useOnlineStatus();
  const queueRef = useRef<QueuedMutation[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const processingRef = useRef(false);

  const enqueue = useCallback((action: () => Promise<void>, description: string) => {
    if (isOnline) {
      // Execute immediately if online
      return action();
    }

    // Queue for later
    const mutation: QueuedMutation = {
      id: crypto.randomUUID(),
      action,
      description,
      createdAt: Date.now(),
    };
    queueRef.current.push(mutation);
    setPendingCount(queueRef.current.length);
    toast.info('Ação salva offline', {
      description: `"${description}" será executada quando a conexão for restaurada.`,
    });
    return Promise.resolve();
  }, [isOnline]);

  // Process queue when back online
  useEffect(() => {
    if (!isOnline || processingRef.current || queueRef.current.length === 0) return;

    const processQueue = async () => {
      processingRef.current = true;
      setIsSyncing(true);
      const queue = [...queueRef.current];
      let successCount = 0;
      let failCount = 0;

      for (const mutation of queue) {
        try {
          await mutation.action();
          successCount++;
          queueRef.current = queueRef.current.filter(m => m.id !== mutation.id);
          setPendingCount(queueRef.current.length);
        } catch {
          failCount++;
        }
      }

      setIsSyncing(false);
      processingRef.current = false;

      if (successCount > 0) {
        toast.success(`${successCount} ${successCount === 1 ? 'ação sincronizada' : 'ações sincronizadas'}`);
      }
      if (failCount > 0) {
        toast.error(`${failCount} ${failCount === 1 ? 'ação falhou' : 'ações falharam'} ao sincronizar`);
      }
    };

    processQueue();
  }, [isOnline]);

  return {
    enqueue,
    pendingCount,
    isSyncing,
    hasPending: pendingCount > 0,
  };
}
