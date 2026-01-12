import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// Types for announcer
type AriaLiveMode = 'polite' | 'assertive' | 'off';

interface Announcement {
  message: string;
  mode: AriaLiveMode;
  id: string;
}

interface LiveAnnouncerContextType {
  announce: (message: string, mode?: AriaLiveMode) => void;
  announcePolite: (message: string) => void;
  announceAssertive: (message: string) => void;
}

const LiveAnnouncerContext = createContext<LiveAnnouncerContextType | null>(null);

/**
 * Hook to access the live announcer for screen reader announcements
 * @example
 * const { announce, announcePolite } = useLiveAnnouncer();
 * announcePolite('Contact saved successfully');
 */
export function useLiveAnnouncer() {
  const context = useContext(LiveAnnouncerContext);
  if (!context) {
    throw new Error('useLiveAnnouncer must be used within a LiveAnnouncerProvider');
  }
  return context;
}

interface LiveAnnouncerProviderProps {
  children: ReactNode;
}

/**
 * Provider that enables screen reader announcements throughout the app
 * Implements ARIA live regions for dynamic content updates
 */
export function LiveAnnouncerProvider({ children }: LiveAnnouncerProviderProps) {
  const [politeAnnouncement, setPoliteAnnouncement] = useState<Announcement | null>(null);
  const [assertiveAnnouncement, setAssertiveAnnouncement] = useState<Announcement | null>(null);

  const announce = useCallback((message: string, mode: AriaLiveMode = 'polite') => {
    const announcement: Announcement = {
      message,
      mode,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    if (mode === 'assertive') {
      setAssertiveAnnouncement(announcement);
      // Clear after announcement is read
      setTimeout(() => setAssertiveAnnouncement(null), 1000);
    } else {
      setPoliteAnnouncement(announcement);
      // Clear after announcement is read
      setTimeout(() => setPoliteAnnouncement(null), 1000);
    }
  }, []);

  const announcePolite = useCallback((message: string) => {
    announce(message, 'polite');
  }, [announce]);

  const announceAssertive = useCallback((message: string) => {
    announce(message, 'assertive');
  }, [announce]);

  return (
    <LiveAnnouncerContext.Provider value={{ announce, announcePolite, announceAssertive }}>
      {children}
      
      {/* Polite live region - for non-urgent updates */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {politeAnnouncement?.message}
      </div>
      
      {/* Assertive live region - for urgent/important updates */}
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {assertiveAnnouncement?.message}
      </div>
    </LiveAnnouncerContext.Provider>
  );
}

/**
 * Utility function for common announcements
 */
export const announcements = {
  saved: (item: string) => `${item} salvo com sucesso`,
  deleted: (item: string) => `${item} excluído`,
  created: (item: string) => `${item} criado com sucesso`,
  updated: (item: string) => `${item} atualizado`,
  error: (action: string) => `Erro ao ${action}. Por favor, tente novamente.`,
  loading: (item: string) => `Carregando ${item}...`,
  loaded: (item: string, count?: number) => 
    count !== undefined 
      ? `${count} ${item} carregado${count !== 1 ? 's' : ''}`
      : `${item} carregado`,
  navigation: (page: string) => `Navegando para ${page}`,
  formError: (field: string) => `Erro no campo ${field}`,
  formValid: () => 'Formulário válido',
  searchResults: (count: number, query: string) => 
    count === 0 
      ? `Nenhum resultado encontrado para "${query}"`
      : `${count} resultado${count !== 1 ? 's' : ''} encontrado${count !== 1 ? 's' : ''} para "${query}"`,
};

export default LiveAnnouncerProvider;
