import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from './use-toast';

interface AutoSaveOptions<T> {
  key: string;
  data: T;
  onSave: (data: T) => Promise<boolean>;
  debounceMs?: number;
  enabled?: boolean;
  showToast?: boolean;
}

interface AutoSaveState {
  status: 'idle' | 'saving' | 'saved' | 'error';
  lastSaved: Date | null;
  hasPendingChanges: boolean;
}

export function useAutoSave<T>({
  key,
  data,
  onSave,
  debounceMs = 2000,
  enabled = true,
  showToast = false,
}: AutoSaveOptions<T>) {
  const { toast } = useToast();
  const [state, setState] = useState<AutoSaveState>({
    status: 'idle',
    lastSaved: null,
    hasPendingChanges: false,
  });
  
  const dataRef = useRef(data);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedDataRef = useRef<string>('');

  // Serialize data for comparison
  const serializedData = JSON.stringify(data);

  // Check for pending changes
  useEffect(() => {
    if (serializedData !== lastSavedDataRef.current) {
      setState(prev => ({ ...prev, hasPendingChanges: true }));
    }
  }, [serializedData]);

  // Save to localStorage as backup
  useEffect(() => {
    if (enabled && state.hasPendingChanges) {
      localStorage.setItem(`autosave_${key}`, serializedData);
    }
  }, [key, serializedData, enabled, state.hasPendingChanges]);

  // Debounced save
  const save = useCallback(async () => {
    if (!enabled) return;
    
    setState(prev => ({ ...prev, status: 'saving' }));
    
    try {
      const success = await onSave(dataRef.current);
      
      if (success) {
        lastSavedDataRef.current = JSON.stringify(dataRef.current);
        localStorage.removeItem(`autosave_${key}`);
        
        setState({
          status: 'saved',
          lastSaved: new Date(),
          hasPendingChanges: false,
        });
        
        if (showToast) {
          toast({
            title: '✓ Salvo automaticamente',
            duration: 2000,
          });
        }
        
        // Reset to idle after showing saved status
        setTimeout(() => {
          setState(prev => ({ ...prev, status: 'idle' }));
        }, 2000);
      } else {
        throw new Error('Save failed');
      }
    } catch (error) {
      setState(prev => ({ ...prev, status: 'error' }));
      
      if (showToast) {
        toast({
          title: 'Erro ao salvar',
          description: 'Suas alterações foram salvas localmente',
          variant: 'destructive',
        });
      }
    }
  }, [enabled, onSave, key, showToast, toast]);

  // Trigger debounced save when data changes
  useEffect(() => {
    dataRef.current = data;
    
    if (!enabled || !state.hasPendingChanges) return;
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(save, debounceMs);
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, save, debounceMs, enabled, state.hasPendingChanges]);

  // Recover from localStorage
  const recoverData = useCallback((): T | null => {
    try {
      const saved = localStorage.getItem(`autosave_${key}`);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Ignore parse errors
    }
    return null;
  }, [key]);

  // Clear backup
  const clearBackup = useCallback(() => {
    localStorage.removeItem(`autosave_${key}`);
  }, [key]);

  // Force save now
  const saveNow = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    await save();
  }, [save]);

  return {
    ...state,
    save: saveNow,
    recoverData,
    clearBackup,
  };
}

// Hook for form auto-save with draft recovery
export function useFormAutoSave<T extends Record<string, any>>(
  formId: string,
  initialData: T,
  onSave: (data: T) => Promise<boolean>
) {
  const [data, setData] = useState<T>(initialData);
  const [hasRecoveredDraft, setHasRecoveredDraft] = useState(false);

  const autoSave = useAutoSave({
    key: `form_${formId}`,
    data,
    onSave,
    debounceMs: 3000,
  });

  // Check for draft on mount
  useEffect(() => {
    const draft = autoSave.recoverData();
    if (draft && !hasRecoveredDraft) {
      setData(draft);
      setHasRecoveredDraft(true);
    }
  }, [autoSave, hasRecoveredDraft]);

  const updateField = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setData(prev => ({ ...prev, [field]: value }));
  }, []);

  const resetForm = useCallback(() => {
    setData(initialData);
    autoSave.clearBackup();
  }, [initialData, autoSave]);

  return {
    data,
    setData,
    updateField,
    resetForm,
    hasRecoveredDraft,
    ...autoSave,
  };
}
