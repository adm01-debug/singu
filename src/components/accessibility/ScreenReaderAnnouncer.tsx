import { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from 'react';
import { createPortal } from 'react-dom';

type AnnouncementPriority = 'polite' | 'assertive';

interface Announcement {
  id: string;
  message: string;
  priority: AnnouncementPriority;
  timestamp: number;
}

interface ScreenReaderAnnouncerContextValue {
  /** Announce a message to screen readers */
  announce: (message: string, priority?: AnnouncementPriority) => void;
  /** Announce form error */
  announceError: (error: string) => void;
  /** Announce form success */
  announceSuccess: (message: string) => void;
  /** Announce loading state */
  announceLoading: (message?: string) => void;
  /** Announce page change */
  announcePage: (pageTitle: string) => void;
  /** Announce item count */
  announceCount: (count: number, itemType: string) => void;
  /** Clear all announcements */
  clear: () => void;
}

const ScreenReaderAnnouncerContext = createContext<ScreenReaderAnnouncerContextValue | null>(null);

export function useScreenReaderAnnouncer() {
  const context = useContext(ScreenReaderAnnouncerContext);
  if (!context) {
    throw new Error('useScreenReaderAnnouncer must be used within ScreenReaderAnnouncerProvider');
  }
  return context;
}

interface ScreenReaderAnnouncerProviderProps {
  children: ReactNode;
  /** Delay between announcements to avoid overlap */
  debounceMs?: number;
}

export function ScreenReaderAnnouncerProvider({
  children,
  debounceMs = 100,
}: ScreenReaderAnnouncerProviderProps) {
  const [politeMessage, setPoliteMessage] = useState('');
  const [assertiveMessage, setAssertiveMessage] = useState('');
  const announceQueue = useRef<Announcement[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const idCounter = useRef(0);

  // Process announcement queue
  const processQueue = useCallback(() => {
    if (announceQueue.current.length === 0) return;

    const announcement = announceQueue.current.shift();
    if (!announcement) return;

    if (announcement.priority === 'assertive') {
      setAssertiveMessage(announcement.message);
    } else {
      setPoliteMessage(announcement.message);
    }

    // Clear message after a short delay to allow re-announcing same message
    timeoutRef.current = setTimeout(() => {
      if (announcement.priority === 'assertive') {
        setAssertiveMessage('');
      } else {
        setPoliteMessage('');
      }
      // Process next in queue
      processQueue();
    }, debounceMs);
  }, [debounceMs]);

  // Main announce function
  const announce = useCallback((message: string, priority: AnnouncementPriority = 'polite') => {
    const announcement: Announcement = {
      id: `announcement-${++idCounter.current}`,
      message,
      priority,
      timestamp: Date.now(),
    };

    announceQueue.current.push(announcement);
    processQueue();
  }, [processQueue]);

  // Convenience functions
  const announceError = useCallback((error: string) => {
    announce(`Erro: ${error}`, 'assertive');
  }, [announce]);

  const announceSuccess = useCallback((message: string) => {
    announce(`Sucesso: ${message}`, 'polite');
  }, [announce]);

  const announceLoading = useCallback((message = 'Carregando...') => {
    announce(message, 'polite');
  }, [announce]);

  const announcePage = useCallback((pageTitle: string) => {
    announce(`Página ${pageTitle} carregada`, 'polite');
  }, [announce]);

  const announceCount = useCallback((count: number, itemType: string) => {
    const plural = count === 1 ? '' : 's';
    announce(`${count} ${itemType}${plural} encontrado${plural}`, 'polite');
  }, [announce]);

  const clear = useCallback(() => {
    announceQueue.current = [];
    setPoliteMessage('');
    setAssertiveMessage('');
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const value: ScreenReaderAnnouncerContextValue = {
    announce,
    announceError,
    announceSuccess,
    announceLoading,
    announcePage,
    announceCount,
    clear,
  };

  return (
    <ScreenReaderAnnouncerContext.Provider value={value}>
      {children}
      {/* ARIA Live Regions - rendered via portal to ensure they're at root level */}
      {typeof document !== 'undefined' && createPortal(
        <>
          {/* Polite live region for non-urgent announcements */}
          <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="sr-only"
          >
            {politeMessage}
          </div>
          
          {/* Assertive live region for urgent announcements */}
          <div
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
            className="sr-only"
          >
            {assertiveMessage}
          </div>
        </>,
        document.body
      )}
    </ScreenReaderAnnouncerContext.Provider>
  );
}

// Predefined announcement messages for common scenarios
export const announcements = {
  // CRUD operations
  itemCreated: (type: string) => `${type} criado com sucesso`,
  itemUpdated: (type: string) => `${type} atualizado com sucesso`,
  itemDeleted: (type: string) => `${type} excluído com sucesso`,
  
  // Form states
  formSubmitting: 'Enviando formulário...',
  formSuccess: 'Formulário enviado com sucesso',
  formError: (count: number) => `Formulário contém ${count} erro${count > 1 ? 's' : ''}`,
  
  // Loading states
  loading: 'Carregando...',
  loadingComplete: 'Carregamento concluído',
  loadingError: 'Erro ao carregar dados',
  
  // Search
  searchResults: (count: number) => `${count} resultado${count !== 1 ? 's' : ''} encontrado${count !== 1 ? 's' : ''}`,
  noResults: 'Nenhum resultado encontrado',
  searching: 'Buscando...',
  
  // Navigation
  pageLoaded: (title: string) => `Página ${title} carregada`,
  modalOpened: (title: string) => `Modal ${title} aberto`,
  modalClosed: 'Modal fechado',
  
  // Filters
  filterApplied: 'Filtro aplicado',
  filtersCleared: 'Filtros limpos',
  sortChanged: (field: string, direction: string) => 
    `Ordenado por ${field} em ordem ${direction === 'asc' ? 'crescente' : 'decrescente'}`,
  
  // Selection
  itemSelected: (name: string) => `${name} selecionado`,
  itemDeselected: (name: string) => `${name} desmarcado`,
  allSelected: (count: number) => `Todos os ${count} itens selecionados`,
  selectionCleared: 'Seleção limpa',
  
  // Offline/Online
  offline: 'Você está offline. Alterações serão sincronizadas quando a conexão for restaurada.',
  online: 'Conexão restaurada. Sincronizando alterações...',
  syncComplete: 'Sincronização concluída',
};

export default ScreenReaderAnnouncerProvider;
