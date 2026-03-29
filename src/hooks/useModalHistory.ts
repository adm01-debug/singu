import { useEffect, useCallback, useRef } from 'react';

/**
 * Hook that integrates modals with browser history.
 * When a modal opens, it pushes a state to history.
 * When browser back is pressed, the modal closes instead of navigating.
 * 
 * @param isOpen - Whether the modal is currently open
 * @param onClose - Callback to close the modal
 * @param id - Unique identifier for this modal in history state
 */
export function useModalHistory(
  isOpen: boolean,
  onClose: () => void,
  id: string = 'modal'
) {
  const pushedRef = useRef(false);

  const handlePopState = useCallback((event: PopStateEvent) => {
    if (pushedRef.current) {
      pushedRef.current = false;
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen && !pushedRef.current) {
      // Push a state entry so browser back closes the modal
      window.history.pushState({ modal: id }, '');
      pushedRef.current = true;
    }

    if (!isOpen && pushedRef.current) {
      // Modal closed programmatically — clean up history entry
      pushedRef.current = false;
      window.history.back();
    }
  }, [isOpen, id]);

  useEffect(() => {
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      // Clean up on unmount if modal was open
      if (pushedRef.current) {
        pushedRef.current = false;
      }
    };
  }, [handlePopState]);
}
