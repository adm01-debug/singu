import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PendingOperation {
  id: string;
  table: string;
  operation: 'insert' | 'update' | 'delete';
  data: Record<string, unknown>;
  timestamp: number;
}

const CACHE_PREFIX = 'relateiq_cache_';
const PENDING_OPS_KEY = 'relateiq_pending_operations';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

// Supported tables for offline operations
type SupportedTable = 'contacts' | 'companies' | 'interactions' | 'activities' | 'alerts' | 'insights';

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Conexão restaurada', {
        description: 'Sincronizando dados...',
      });
      syncPendingOperations();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('Sem conexão', {
        description: 'Trabalhando offline. Alterações serão sincronizadas quando a conexão for restaurada.',
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load pending count on mount
    const pending = getPendingOperations();
    setPendingCount(pending.length);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Cache data locally
  const cacheData = useCallback((key: string, data: unknown) => {
    try {
      const cacheItem = {
        data,
        timestamp: Date.now(),
        expiry: Date.now() + CACHE_EXPIRY,
      };
      localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(cacheItem));
    } catch (error) {
      console.warn('Failed to cache data:', error);
    }
  }, []);

  // Get cached data
  const getCachedData = useCallback(<T>(key: string): T | null => {
    try {
      const cached = localStorage.getItem(`${CACHE_PREFIX}${key}`);
      if (!cached) return null;

      const { data, expiry } = JSON.parse(cached);
      if (Date.now() > expiry) {
        localStorage.removeItem(`${CACHE_PREFIX}${key}`);
        return null;
      }

      return data as T;
    } catch {
      return null;
    }
  }, []);

  // Get pending operations
  const getPendingOperations = useCallback((): PendingOperation[] => {
    try {
      const pending = localStorage.getItem(PENDING_OPS_KEY);
      return pending ? JSON.parse(pending) : [];
    } catch {
      return [];
    }
  }, []);

  // Add pending operation
  const addPendingOperation = useCallback((
    table: string,
    operation: 'insert' | 'update' | 'delete',
    data: Record<string, unknown>
  ) => {
    const pending = getPendingOperations();
    const newOp: PendingOperation = {
      id: crypto.randomUUID(),
      table,
      operation,
      data,
      timestamp: Date.now(),
    };
    pending.push(newOp);
    localStorage.setItem(PENDING_OPS_KEY, JSON.stringify(pending));
    setPendingCount(pending.length);
    return newOp.id;
  }, [getPendingOperations]);

  // Remove pending operation
  const removePendingOperation = useCallback((id: string) => {
    const pending = getPendingOperations();
    const filtered = pending.filter(op => op.id !== id);
    localStorage.setItem(PENDING_OPS_KEY, JSON.stringify(filtered));
    setPendingCount(filtered.length);
  }, [getPendingOperations]);

  // Type-safe table operation executor
  const executeTableOperation = async (op: PendingOperation) => {
    const validTables: SupportedTable[] = ['contacts', 'companies', 'interactions', 'activities', 'alerts', 'insights'];
    
    if (!validTables.includes(op.table as SupportedTable)) {
      console.warn(`Unsupported table for offline sync: ${op.table}`);
      return;
    }

    const tableName = op.table as SupportedTable;

    switch (op.operation) {
      case 'insert': {
        // Remove any fields that shouldn't be inserted
        const { id: _id, ...insertData } = op.data;
        await supabase.from(tableName).insert(insertData as never);
        break;
      }
      case 'update': {
        if (op.data.id && typeof op.data.id === 'string') {
          const { id, ...updateData } = op.data;
          await supabase.from(tableName).update(updateData as never).eq('id', id);
        }
        break;
      }
      case 'delete': {
        if (op.data.id && typeof op.data.id === 'string') {
          await supabase.from(tableName).delete().eq('id', op.data.id);
        }
        break;
      }
    }
  };

  // Sync pending operations when online
  const syncPendingOperations = useCallback(async () => {
    if (!navigator.onLine) return;

    const pending = getPendingOperations();
    if (pending.length === 0) return;

    setIsSyncing(true);
    let syncedCount = 0;
    let errorCount = 0;

    for (const op of pending) {
      try {
        await executeTableOperation(op);
        removePendingOperation(op.id);
        syncedCount++;
      } catch (error) {
        console.error('Failed to sync operation:', op, error);
        errorCount++;
      }
    }

    setIsSyncing(false);

    if (syncedCount > 0) {
      toast.success(`${syncedCount} alterações sincronizadas`);
    }
    if (errorCount > 0) {
      toast.error(`${errorCount} alterações falharam na sincronização`);
    }
  }, [getPendingOperations, removePendingOperation]);

  // Fetch with offline fallback
  const fetchWithCache = useCallback(async <T>(
    cacheKey: string,
    fetcher: () => Promise<T>
  ): Promise<T | null> => {
    if (navigator.onLine) {
      try {
        const data = await fetcher();
        cacheData(cacheKey, data);
        return data;
      } catch (error) {
        console.error('Fetch failed, trying cache:', error);
        return getCachedData<T>(cacheKey);
      }
    } else {
      return getCachedData<T>(cacheKey);
    }
  }, [cacheData, getCachedData]);

  // Clear all cached data
  const clearCache = useCallback(() => {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(CACHE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    toast.success('Cache limpo');
  }, []);

  // Get cache size
  const getCacheSize = useCallback((): number => {
    let totalSize = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(CACHE_PREFIX)) {
        const value = localStorage.getItem(key);
        if (value) {
          totalSize += value.length * 2; // Approximate bytes (UTF-16)
        }
      }
    }
    return totalSize;
  }, []);

  return {
    isOnline,
    isSyncing,
    pendingCount,
    cacheData,
    getCachedData,
    addPendingOperation,
    syncPendingOperations,
    fetchWithCache,
    clearCache,
    getCacheSize,
  };
}

export default useOfflineSync;
