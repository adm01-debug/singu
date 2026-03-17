import { useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { isMacOS } from '@/lib/utils';

interface NavigationRoute {
  key: string;
  path: string;
  label: string;
}

const navigationRoutes: NavigationRoute[] = [
  { key: '1', path: '/', label: 'Dashboard' },
  { key: '2', path: '/empresas', label: 'Empresas' },
  { key: '3', path: '/contatos', label: 'Contatos' },
  { key: '4', path: '/interacoes', label: 'Interações' },
  { key: '5', path: '/calendario', label: 'Calendário' },
  { key: '6', path: '/insights', label: 'Insights' },
  { key: '7', path: '/notificacoes', label: 'Notificações' },
  { key: '8', path: '/configuracoes', label: 'Configurações' },
];

interface UseKeyboardNavigationOptions {
  onToggleSidebar?: () => void;
  onOpenSearch?: () => void;
  enabled?: boolean;
}

export function useKeyboardNavigation({
  onToggleSidebar,
  onOpenSearch,
  enabled = true,
}: UseKeyboardNavigationOptions = {}) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // Ignore if user is typing in an input
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      return;
    }

    const isMac = isMacOS();
    const modifierKey = isMac ? event.metaKey : event.ctrlKey;

    // ⌘/Ctrl + K - Open search (handled by GlobalSearch)
    if (modifierKey && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      onOpenSearch?.();
      return;
    }

    // ⌘/Ctrl + B - Toggle sidebar
    if (modifierKey && event.key.toLowerCase() === 'b') {
      event.preventDefault();
      onToggleSidebar?.();
      return;
    }

    // ⌘/Ctrl + \ - Toggle sidebar (alternative)
    if (modifierKey && event.key === '\\') {
      event.preventDefault();
      onToggleSidebar?.();
      return;
    }

    // G + number for navigation (g1, g2, etc.)
    if (event.key.toLowerCase() === 'g') {
      // Set up listener for next key
      const handleNextKey = (e: KeyboardEvent) => {
        const route = navigationRoutes.find(r => r.key === e.key);
        if (route && location.pathname !== route.path) {
          e.preventDefault();
          navigate(route.path);
        }
        document.removeEventListener('keydown', handleNextKey);
      };

      // Listen for the next key within 1 second
      document.addEventListener('keydown', handleNextKey);
      setTimeout(() => {
        document.removeEventListener('keydown', handleNextKey);
      }, 1000);
      return;
    }

    // Alt + number for quick navigation
    if (event.altKey && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
      const route = navigationRoutes.find(r => r.key === event.key);
      if (route && location.pathname !== route.path) {
        event.preventDefault();
        navigate(route.path);
      }
    }
  }, [enabled, navigate, location.pathname, onToggleSidebar, onOpenSearch]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return {
    navigationRoutes,
  };
}
