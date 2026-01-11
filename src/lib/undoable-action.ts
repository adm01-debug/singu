import { toast } from 'sonner';

interface UndoableActionOptions<T> {
  action: () => Promise<T>;
  undo: () => Promise<void>;
  successMessage: string;
  undoMessage: string;
  errorMessage?: string;
  timeout?: number;
}

/**
 * Execute an action with undo capability
 * Returns the result of the action, or null if undone
 */
export async function executeWithUndo<T>({
  action,
  undo,
  successMessage,
  undoMessage,
  errorMessage = 'Erro ao executar ação',
  timeout = 5000,
}: UndoableActionOptions<T>): Promise<T | null> {
  let undone = false;
  let result: T;

  try {
    result = await action();
  } catch (error) {
    toast.error(errorMessage);
    throw error;
  }

  return new Promise((resolve) => {
    const toastId = toast.success(successMessage, {
      duration: timeout,
      action: {
        label: 'Desfazer',
        onClick: async () => {
          undone = true;
          toast.dismiss(toastId);
          
          try {
            await undo();
            toast.success(undoMessage, { duration: 3000 });
            resolve(null);
          } catch (error) {
            toast.error('Erro ao desfazer ação');
            resolve(result);
          }
        },
      },
    });

    // Resolve with result after timeout if not undone
    setTimeout(() => {
      if (!undone) {
        resolve(result);
      }
    }, timeout);
  });
}

/**
 * Hook-friendly version for use with state updates
 */
export function createUndoableAction<T, S>(
  setState: React.Dispatch<React.SetStateAction<S>>,
  options: {
    getBackup: (state: S) => T;
    applyAction: (state: S, backup: T) => S;
    applyUndo: (state: S, backup: T) => S;
    persistAction: (backup: T) => Promise<void>;
    persistUndo: (backup: T) => Promise<void>;
    successMessage: string;
    undoMessage: string;
    timeout?: number;
  }
) {
  return async (currentState: S) => {
    const backup = options.getBackup(currentState);
    
    // Optimistic update
    setState(prev => options.applyAction(prev, backup));

    try {
      await executeWithUndo({
        action: async () => {
          await options.persistAction(backup);
          return backup;
        },
        undo: async () => {
          setState(prev => options.applyUndo(prev, backup));
          await options.persistUndo(backup);
        },
        successMessage: options.successMessage,
        undoMessage: options.undoMessage,
        timeout: options.timeout,
      });
    } catch {
      // Revert optimistic update on error
      setState(prev => options.applyUndo(prev, backup));
    }
  };
}

/**
 * Simple soft delete with undo
 */
export async function softDeleteWithUndo<T extends { id: string }>(
  item: T,
  deleteFromState: () => void,
  restoreToState: () => void,
  deleteFn: () => Promise<void>,
  restoreFn: () => Promise<void>,
  itemName: string = 'Item'
): Promise<boolean> {
  // Optimistic delete from UI
  deleteFromState();

  const result = await executeWithUndo({
    action: deleteFn,
    undo: async () => {
      restoreToState();
      await restoreFn();
    },
    successMessage: `${itemName} excluído`,
    undoMessage: `${itemName} restaurado`,
  });

  return result !== null;
}
