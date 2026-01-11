import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface ShortcutHandler {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts() {
  const navigate = useNavigate();

  const shortcuts: ShortcutHandler[] = [
    // Navigation shortcuts
    { key: 'k', ctrlKey: true, action: () => {
      // Trigger global search - dispatch custom event
      window.dispatchEvent(new CustomEvent('toggle-global-search'));
    }, description: 'Abrir busca global' },
    
    { key: 'h', altKey: true, action: () => navigate('/'), description: 'Ir para Dashboard' },
    { key: 'c', altKey: true, action: () => navigate('/contatos'), description: 'Ir para Contatos' },
    { key: 'e', altKey: true, action: () => navigate('/empresas'), description: 'Ir para Empresas' },
    { key: 'i', altKey: true, action: () => navigate('/interacoes'), description: 'Ir para Interações' },
    { key: 's', altKey: true, action: () => navigate('/insights'), description: 'Ir para Insights' },
    { key: 'l', altKey: true, action: () => navigate('/calendario'), description: 'Ir para Calendário' },
    { key: 'n', altKey: true, action: () => navigate('/network'), description: 'Ir para Network' },
    
    // Quick actions
    { key: 'n', ctrlKey: true, action: () => {
      window.dispatchEvent(new CustomEvent('quick-add-contact'));
    }, description: 'Novo contato' },
    
    { key: 'j', ctrlKey: true, action: () => {
      window.dispatchEvent(new CustomEvent('quick-add-interaction'));
    }, description: 'Nova interação' },
    
    { key: 'b', ctrlKey: true, action: () => {
      window.dispatchEvent(new CustomEvent('quick-add-company'));
    }, description: 'Nova empresa' },
    
    // UI shortcuts
    { key: '?', shiftKey: true, action: () => {
      window.dispatchEvent(new CustomEvent('show-keyboard-shortcuts'));
    }, description: 'Mostrar atalhos' },
    
    { key: 'Escape', action: () => {
      window.dispatchEvent(new CustomEvent('close-all-modals'));
    }, description: 'Fechar modais' },
  ];

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      // Allow Escape even in inputs
      if (event.key !== 'Escape') return;
    }

    for (const shortcut of shortcuts) {
      const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
      const ctrlMatch = shortcut.ctrlKey ? (event.ctrlKey || event.metaKey) : !event.ctrlKey && !event.metaKey;
      const shiftMatch = shortcut.shiftKey ? event.shiftKey : !event.shiftKey;
      const altMatch = shortcut.altKey ? event.altKey : !event.altKey;

      // Special handling for Ctrl+K (override browser default)
      if (shortcut.ctrlKey && shortcut.key === 'k') {
        if (keyMatch && (event.ctrlKey || event.metaKey)) {
          event.preventDefault();
          shortcut.action();
          return;
        }
      } else if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
        event.preventDefault();
        shortcut.action();
        return;
      }
    }
  }, [shortcuts]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return { shortcuts };
}
