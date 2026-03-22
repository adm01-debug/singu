import { useEffect, useCallback } from 'react';
import { useBlocker } from 'react-router-dom';

/**
 * Hook that warns users before navigating away when there are unsaved changes.
 * Uses react-router's useBlocker for SPA navigation and beforeunload for hard navigation.
 */
export function useUnsavedChangesGuard(hasUnsavedChanges: boolean, message?: string) {
  const defaultMessage = 'Você tem alterações não salvas. Deseja realmente sair?';
  const warningMessage = message || defaultMessage;

  // Handle browser/tab close
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = warningMessage;
      return warningMessage;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, warningMessage]);

  // Handle SPA navigation via react-router
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasUnsavedChanges && currentLocation.pathname !== nextLocation.pathname
  );

  useEffect(() => {
    if (blocker.state === 'blocked') {
      const confirmed = window.confirm(warningMessage);
      if (confirmed) {
        blocker.proceed();
      } else {
        blocker.reset();
      }
    }
  }, [blocker, warningMessage]);

  return {
    isBlocked: blocker.state === 'blocked',
  };
}
