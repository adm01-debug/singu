import { useState, useCallback, useRef } from 'react';
import { toast } from '@/components/feedback/ToastSystem';

interface OptimisticOperation<T, TError = Error> {
  /** Unique identifier for the operation */
  id: string;
  /** Original data before update */
  previousData: T;
  /** New data after optimistic update */
  newData: T;
  /** Timestamp of the operation */
  timestamp: number;
  /** Status of the operation */
  status: 'pending' | 'success' | 'error';
  /** Error if operation failed */
  error?: TError;
}

interface UseOptimisticUpdateOptions<T> {
  /** Callback when rollback occurs */
  onRollback?: (previousData: T, newData: T, error: Error) => void;
  /** Custom error message */
  errorMessage?: string;
  /** Success message */
  successMessage?: string;
  /** Show toast on error */
  showErrorToast?: boolean;
  /** Show toast on success */
  showSuccessToast?: boolean;
  /** Delay before showing success (ms) */
  successDelay?: number;
}

interface UseOptimisticUpdateReturn<T> {
  /** Perform optimistic update */
  execute: <TResult>(
    optimisticData: T,
    asyncOperation: () => Promise<TResult>,
    options?: {
      onSuccess?: (result: TResult) => void;
      onError?: (error: Error) => void;
    }
  ) => Promise<TResult | null>;
  /** Check if there's a pending operation */
  isPending: boolean;
  /** Current pending operations */
  pendingOperations: OptimisticOperation<T>[];
  /** Clear all pending operations */
  clearPending: () => void;
}

/**
 * Hook for optimistic UI updates with automatic rollback on failure
 */
export function useOptimisticUpdate<T>(
  currentData: T,
  setData: (data: T) => void,
  options: UseOptimisticUpdateOptions<T> = {}
): UseOptimisticUpdateReturn<T> {
  const {
    onRollback,
    errorMessage = 'Operação falhou. Alterações revertidas.',
    successMessage,
    showErrorToast = true,
    showSuccessToast = false,
    successDelay = 0,
  } = options;

  const [pendingOperations, setPendingOperations] = useState<OptimisticOperation<T>[]>([]);
  const operationIdRef = useRef(0);

  const execute = useCallback(async <TResult>(
    optimisticData: T,
    asyncOperation: () => Promise<TResult>,
    callbackOptions?: {
      onSuccess?: (result: TResult) => void;
      onError?: (error: Error) => void;
    }
  ): Promise<TResult | null> => {
    const operationId = `op-${++operationIdRef.current}`;
    const previousData = currentData;

    // Create operation record
    const operation: OptimisticOperation<T> = {
      id: operationId,
      previousData,
      newData: optimisticData,
      timestamp: Date.now(),
      status: 'pending',
    };

    // Add to pending operations
    setPendingOperations(ops => [...ops, operation]);

    // Apply optimistic update immediately
    setData(optimisticData);

    try {
      // Execute the actual async operation
      const result = await asyncOperation();

      // Mark operation as success
      setPendingOperations(ops =>
        ops.map(op =>
          op.id === operationId ? { ...op, status: 'success' as const } : op
        )
      );

      // Show success toast if configured
      if (showSuccessToast && successMessage) {
        if (successDelay > 0) {
          setTimeout(() => toast.success(successMessage), successDelay);
        } else {
          toast.success(successMessage);
        }
      }

      // Call success callback
      callbackOptions?.onSuccess?.(result);

      // Clean up completed operation after a short delay
      setTimeout(() => {
        setPendingOperations(ops => ops.filter(op => op.id !== operationId));
      }, 1000);

      return result;
    } catch (error) {
      // Rollback to previous state
      setData(previousData);

      // Mark operation as error
      setPendingOperations(ops =>
        ops.map(op =>
          op.id === operationId
            ? { ...op, status: 'error' as const, error: error as Error }
            : op
        )
      );

      // Show error toast
      if (showErrorToast) {
        toast.error(errorMessage, {
          retry: () => execute(optimisticData, asyncOperation, callbackOptions),
        });
      }

      // Call rollback callback
      onRollback?.(previousData, optimisticData, error as Error);

      // Call error callback
      callbackOptions?.onError?.(error as Error);

      // Clean up failed operation after a short delay
      setTimeout(() => {
        setPendingOperations(ops => ops.filter(op => op.id !== operationId));
      }, 3000);

      return null;
    }
  }, [currentData, setData, onRollback, errorMessage, successMessage, showErrorToast, showSuccessToast, successDelay]);

  const isPending = pendingOperations.some(op => op.status === 'pending');

  const clearPending = useCallback(() => {
    setPendingOperations([]);
  }, []);

  return {
    execute,
    isPending,
    pendingOperations,
    clearPending,
  };
}

/**
 * Hook for optimistic list operations (add, update, remove)
 */
export function useOptimisticList<T extends { id: string }>(
  items: T[],
  setItems: (items: T[]) => void
) {
  const optimistic = useOptimisticUpdate(items, setItems);

  const addItem = useCallback(async (
    newItem: T,
    asyncOperation: () => Promise<T>
  ) => {
    const optimisticItems = [...items, newItem];
    return optimistic.execute(optimisticItems, asyncOperation);
  }, [items, optimistic]);

  const updateItem = useCallback(async (
    id: string,
    updates: Partial<T>,
    asyncOperation: () => Promise<T>
  ) => {
    const optimisticItems = items.map(item =>
      item.id === id ? { ...item, ...updates } : item
    );
    return optimistic.execute(optimisticItems, asyncOperation);
  }, [items, optimistic]);

  const removeItem = useCallback(async (
    id: string,
    asyncOperation: () => Promise<void>
  ) => {
    const optimisticItems = items.filter(item => item.id !== id);
    return optimistic.execute(optimisticItems, asyncOperation);
  }, [items, optimistic]);

  const moveItem = useCallback(async (
    fromIndex: number,
    toIndex: number,
    asyncOperation: () => Promise<void>
  ) => {
    const optimisticItems = [...items];
    const [removed] = optimisticItems.splice(fromIndex, 1);
    optimisticItems.splice(toIndex, 0, removed);
    return optimistic.execute(optimisticItems, asyncOperation);
  }, [items, optimistic]);

  return {
    addItem,
    updateItem,
    removeItem,
    moveItem,
    isPending: optimistic.isPending,
  };
}

export default useOptimisticUpdate;
