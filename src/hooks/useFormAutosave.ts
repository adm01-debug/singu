import { useEffect, useCallback } from 'react';
import { UseFormReturn, FieldValues } from 'react-hook-form';

interface UseFormAutosaveOptions {
  /** Unique key for localStorage */
  storageKey: string;
  /** Debounce delay in ms (default: 1000) */
  debounceMs?: number;
  /** Whether autosave is enabled (default: true) */
  enabled?: boolean;
  /** Fields to exclude from autosave */
  excludeFields?: string[];
}

interface UseFormAutosaveReturn<T> {
  /** Whether there's a saved draft */
  hasDraft: boolean;
  /** Clear the saved draft */
  clearDraft: () => void;
  /** Get the saved draft */
  getDraft: () => Partial<T> | null;
  /** Manually save current form state */
  saveDraft: () => void;
}

/**
 * Hook to auto-save form data to localStorage
 * Prevents data loss when users accidentally close the form
 */
export function useFormAutosave<T extends FieldValues>(
  form: UseFormReturn<T>,
  options: UseFormAutosaveOptions
): UseFormAutosaveReturn<T> {
  const {
    storageKey,
    debounceMs = 1000,
    enabled = true,
    excludeFields = [],
  } = options;

  const fullStorageKey = `form-draft-${storageKey}`;

  // Get draft from localStorage
  const getDraft = useCallback((): Partial<T> | null => {
    try {
      const stored = localStorage.getItem(fullStorageKey);
      if (!stored) return null;
      
      const parsed = JSON.parse(stored);
      // Check if draft is not too old (24 hours)
      if (parsed.timestamp && Date.now() - parsed.timestamp > 24 * 60 * 60 * 1000) {
        localStorage.removeItem(fullStorageKey);
        return null;
      }
      
      return parsed.data;
    } catch {
      return null;
    }
  }, [fullStorageKey]);

  // Clear draft
  const clearDraft = useCallback(() => {
    localStorage.removeItem(fullStorageKey);
  }, [fullStorageKey]);

  // Save draft manually
  const saveDraft = useCallback(() => {
    if (!enabled) return;
    
    const formData = form.getValues();
    
    // Filter out excluded fields
    const filteredData = Object.entries(formData).reduce((acc, [key, value]) => {
      if (!excludeFields.includes(key)) {
        acc[key as keyof T] = value;
      }
      return acc;
    }, {} as Partial<T>);

    localStorage.setItem(fullStorageKey, JSON.stringify({
      data: filteredData,
      timestamp: Date.now(),
    }));
  }, [form, fullStorageKey, enabled, excludeFields]);

  // Check for existing draft
  const hasDraft = getDraft() !== null;

  // Restore draft on mount
  useEffect(() => {
    if (!enabled) return;
    
    const draft = getDraft();
    if (draft) {
      // Only restore if form is empty (no user edits yet)
      const currentValues = form.getValues();
      const hasEdits = Object.values(currentValues).some(v => v !== '' && v !== null && v !== undefined);
      
      if (!hasEdits) {
        form.reset(draft as T);
      }
    }
  }, [enabled, getDraft]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-save on form changes
  useEffect(() => {
    if (!enabled) return;

    const subscription = form.watch(() => {
      const timer = setTimeout(() => {
        saveDraft();
      }, debounceMs);

      return () => clearTimeout(timer);
    });

    return () => subscription.unsubscribe();
  }, [form, enabled, debounceMs, saveDraft]);

  // Clear draft on successful form submission
  useEffect(() => {
    const handleSubmit = () => {
      clearDraft();
    };

    // Listen for form submit events
    const formElement = document.querySelector('form');
    if (formElement) {
      formElement.addEventListener('submit', handleSubmit);
      return () => formElement.removeEventListener('submit', handleSubmit);
    }
  }, [clearDraft]);

  return {
    hasDraft,
    clearDraft,
    getDraft,
    saveDraft,
  };
}
