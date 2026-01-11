import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/ux-messages';

interface UseRetryOptions<T> {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  onSuccess?: (data: T) => void;
  onError?: (error: Error, attempt: number) => void;
  onMaxRetriesReached?: (error: Error) => void;
  showToasts?: boolean;
  retryCondition?: (error: Error) => boolean;
}

interface UseRetryResult<T> {
  execute: (fn: () => Promise<T>) => Promise<T | null>;
  isRetrying: boolean;
  retryCount: number;
  lastError: Error | null;
  reset: () => void;
  cancel: () => void;
}

export function useRetry<T = unknown>(options: UseRetryOptions<T> = {}): UseRetryResult<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    onSuccess,
    onError,
    onMaxRetriesReached,
    showToasts = true,
    retryCondition = () => true,
  } = options;

  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastError, setLastError] = useState<Error | null>(null);
  
  const cancelRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const cancel = useCallback(() => {
    cancelRef.current = true;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsRetrying(false);
  }, []);

  const reset = useCallback(() => {
    cancel();
    cancelRef.current = false;
    setRetryCount(0);
    setLastError(null);
  }, [cancel]);

  const calculateDelay = useCallback((attempt: number) => {
    const delay = initialDelay * Math.pow(backoffMultiplier, attempt);
    return Math.min(delay, maxDelay);
  }, [initialDelay, backoffMultiplier, maxDelay]);

  const execute = useCallback(async (fn: () => Promise<T>): Promise<T | null> => {
    cancelRef.current = false;
    setIsRetrying(false);
    setRetryCount(0);
    setLastError(null);

    const attemptExecution = async (attempt: number): Promise<T | null> => {
      if (cancelRef.current) return null;

      try {
        const result = await fn();
        setIsRetrying(false);
        setRetryCount(0);
        onSuccess?.(result);
        return result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        setLastError(err);
        onError?.(err, attempt);

        if (!retryCondition(err)) {
          setIsRetrying(false);
          throw err;
        }

        if (attempt < maxRetries) {
          setIsRetrying(true);
          setRetryCount(attempt + 1);
          
          const delay = calculateDelay(attempt);
          
          if (showToasts) {
            toast.loading(getErrorMessage('network'), {
              description: `Tentando novamente em ${Math.round(delay / 1000)}s... (${attempt + 1}/${maxRetries})`,
              duration: delay,
            });
          }

          return new Promise((resolve) => {
            timeoutRef.current = setTimeout(async () => {
              if (cancelRef.current) {
                resolve(null);
                return;
              }
              const result = await attemptExecution(attempt + 1);
              resolve(result);
            }, delay);
          });
        } else {
          setIsRetrying(false);
          onMaxRetriesReached?.(err);
          
          if (showToasts) {
            toast.error('Não foi possível completar a operação', {
              description: 'Por favor, verifique sua conexão e tente novamente.',
            });
          }
          
          throw err;
        }
      }
    };

    return attemptExecution(0);
  }, [maxRetries, calculateDelay, onSuccess, onError, onMaxRetriesReached, showToasts, retryCondition]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    execute,
    isRetrying,
    retryCount,
    lastError,
    reset,
    cancel,
  };
}

// Hook for optimistic updates
interface UseOptimisticUpdateOptions<T, U> {
  onMutate: (data: U) => T; // Returns the optimistic data
  onSuccess?: (result: T, data: U) => void;
  onError?: (error: Error, previousData: T) => void;
  onSettled?: () => void;
}

export function useOptimisticUpdate<T, U>(
  currentData: T,
  options: UseOptimisticUpdateOptions<T, U>
) {
  const [optimisticData, setOptimisticData] = useState<T>(currentData);
  const previousDataRef = useRef<T>(currentData);
  const [isPending, setIsPending] = useState(false);

  // Sync with current data when it changes
  useEffect(() => {
    if (!isPending) {
      setOptimisticData(currentData);
      previousDataRef.current = currentData;
    }
  }, [currentData, isPending]);

  const mutate = useCallback(async (
    mutationFn: (data: U) => Promise<T>,
    data: U
  ) => {
    setIsPending(true);
    previousDataRef.current = optimisticData;

    // Apply optimistic update immediately
    const optimistic = options.onMutate(data);
    setOptimisticData(optimistic);

    try {
      const result = await mutationFn(data);
      setOptimisticData(result);
      options.onSuccess?.(result, data);
      return result;
    } catch (error) {
      // Rollback on error
      setOptimisticData(previousDataRef.current);
      options.onError?.(error instanceof Error ? error : new Error(String(error)), previousDataRef.current);
      throw error;
    } finally {
      setIsPending(false);
      options.onSettled?.();
    }
  }, [optimisticData, options]);

  const rollback = useCallback(() => {
    setOptimisticData(previousDataRef.current);
    setIsPending(false);
  }, []);

  return {
    data: optimisticData,
    isPending,
    mutate,
    rollback,
  };
}
