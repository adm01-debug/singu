import { useCallback, useRef } from 'react';
import { toast } from 'sonner';

interface UseUndoDeleteOptions<T> {
  /** Entity display name e.g. "contato" */
  entityName: string;
  /** Actual delete function — called after undo window expires */
  onDelete: (item: T) => Promise<void>;
  /** Called immediately to hide the item from UI (optimistic) */
  onHide?: (item: T) => void;
  /** Called if user undoes — restores the item in UI */
  onRestore?: (item: T) => void;
  /** Undo window in milliseconds (default 5000) */
  undoWindowMs?: number;
}

/**
 * Hook that replaces destructive confirmation dialogs with a toast + undo pattern.
 * 
 * Flow:
 * 1. User clicks delete → item is hidden immediately (optimistic)
 * 2. Toast appears with "Desfazer" button for 5 seconds
 * 3. If user clicks "Desfazer" → item is restored
 * 4. If timeout expires → actual delete is performed
 */
export function useUndoDelete<T extends { id?: string }>({
  entityName,
  onDelete,
  onHide,
  onRestore,
  undoWindowMs = 5000,
}: UseUndoDeleteOptions<T>) {
  const pendingRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const requestDelete = useCallback((item: T, displayName?: string) => {
    const itemId = item.id || Math.random().toString(36);
    
    // Optimistically hide from UI
    onHide?.(item);

    // Clear any existing timer for this item
    const existing = pendingRef.current.get(itemId);
    if (existing) clearTimeout(existing);

    const label = displayName || entityName;

    toast(`${label} removido(a)`, {
      description: 'Clique em "Desfazer" para restaurar.',
      duration: undoWindowMs,
      action: {
        label: 'Desfazer',
        onClick: () => {
          // Cancel the pending delete
          const timer = pendingRef.current.get(itemId);
          if (timer) {
            clearTimeout(timer);
            pendingRef.current.delete(itemId);
          }
          // Restore the item
          onRestore?.(item);
          toast.success(`${label} restaurado(a)`);
        },
      },
      onDismiss: () => {
        // If dismissed without undo, delete proceeds via the timer
      },
    });

    // Schedule actual deletion after undo window
    const timer = setTimeout(async () => {
      pendingRef.current.delete(itemId);
      try {
        await onDelete(item);
      } catch (err) {
        // If delete fails, restore
        onRestore?.(item);
        toast.error(`Erro ao remover ${entityName}`);
      }
    }, undoWindowMs);

    pendingRef.current.set(itemId, timer);
  }, [entityName, onDelete, onHide, onRestore, undoWindowMs]);

  return { requestDelete };
}
