import { useState, useCallback, useEffect, useRef } from 'react';

type AnnounceMode = 'polite' | 'assertive';

interface AriaAnnouncement {
  message: string;
  mode: AnnounceMode;
  id: string;
}

/**
 * Hook for announcing messages to screen readers via ARIA live regions
 */
export function useAriaLive() {
  const [politeMessage, setPoliteMessage] = useState('');
  const [assertiveMessage, setAssertiveMessage] = useState('');
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const announce = useCallback((message: string, mode: AnnounceMode = 'polite') => {
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (mode === 'assertive') {
      setAssertiveMessage(message);
      // Clear after announcement is made
      timeoutRef.current = setTimeout(() => setAssertiveMessage(''), 1000);
    } else {
      setPoliteMessage(message);
      timeoutRef.current = setTimeout(() => setPoliteMessage(''), 1000);
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

  // Pre-made announcement functions for common actions
  const announcements = {
    // CRUD Operations
    saved: (entityName?: string) => 
      announce(`${entityName || 'Item'} salvo com sucesso`),
    deleted: (entityName?: string) => 
      announce(`${entityName || 'Item'} excluído com sucesso`),
    created: (entityName?: string) => 
      announce(`${entityName || 'Item'} criado com sucesso`),
    updated: (entityName?: string) => 
      announce(`${entityName || 'Item'} atualizado com sucesso`),
    
    // Form states
    formSubmitting: () => 
      announce('Enviando formulário...'),
    formError: (errorMessage?: string) => 
      announce(errorMessage || 'Erro no formulário. Por favor, verifique os campos.', 'assertive'),
    formSuccess: () => 
      announce('Formulário enviado com sucesso'),
    
    // Loading states
    loading: (context?: string) => 
      announce(`Carregando ${context || 'dados'}...`),
    loadingComplete: (context?: string) => 
      announce(`${context || 'Dados'} carregados`),
    
    // Search & Filters
    searchResults: (count: number, term?: string) => 
      announce(`${count} ${count === 1 ? 'resultado encontrado' : 'resultados encontrados'}${term ? ` para "${term}"` : ''}`),
    noResults: (term?: string) => 
      announce(`Nenhum resultado encontrado${term ? ` para "${term}"` : ''}`),
    filterApplied: (filterName: string) => 
      announce(`Filtro "${filterName}" aplicado`),
    filterRemoved: (filterName: string) => 
      announce(`Filtro "${filterName}" removido`),
    filtersCleared: () => 
      announce('Todos os filtros foram limpos'),
    
    // Navigation
    pageLoaded: (pageName: string) => 
      announce(`Página ${pageName} carregada`),
    modalOpened: (modalName?: string) => 
      announce(`${modalName || 'Modal'} aberto`),
    modalClosed: (modalName?: string) => 
      announce(`${modalName || 'Modal'} fechado`),
    menuExpanded: (menuName?: string) => 
      announce(`Menu ${menuName || ''} expandido`),
    menuCollapsed: (menuName?: string) => 
      announce(`Menu ${menuName || ''} recolhido`),
    
    // Selection
    itemSelected: (itemName?: string) => 
      announce(`${itemName || 'Item'} selecionado`),
    itemDeselected: (itemName?: string) => 
      announce(`${itemName || 'Item'} desmarcado`),
    allSelected: (count: number) => 
      announce(`${count} itens selecionados`),
    allDeselected: () => 
      announce('Seleção limpa'),
    
    // Status
    online: () => 
      announce('Conexão restaurada'),
    offline: () => 
      announce('Você está offline. Algumas funcionalidades podem não estar disponíveis.', 'assertive'),
    syncing: () => 
      announce('Sincronizando dados...'),
    syncComplete: () => 
      announce('Dados sincronizados'),
    
    // Errors
    error: (errorMessage: string) => 
      announce(errorMessage, 'assertive'),
    networkError: () => 
      announce('Erro de conexão. Por favor, tente novamente.', 'assertive'),
    
    // Notifications
    newNotification: (count: number) => 
      announce(`${count} ${count === 1 ? 'nova notificação' : 'novas notificações'}`),
    
    // Custom
    custom: announce,
  };

  return {
    announce,
    announcements,
    politeMessage,
    assertiveMessage,
    // ARIA live region component props
    liveRegionProps: {
      polite: {
        'aria-live': 'polite' as const,
        'aria-atomic': true,
        className: 'sr-only',
        children: politeMessage,
      },
      assertive: {
        'aria-live': 'assertive' as const,
        'aria-atomic': true,
        role: 'alert' as const,
        className: 'sr-only',
        children: assertiveMessage,
      },
    },
  };
}

/**
 * Pre-defined announcement messages in Portuguese
 */
export const ariaMessages = {
  // General
  loading: 'Carregando...',
  loaded: 'Conteúdo carregado',
  saving: 'Salvando...',
  saved: 'Salvo com sucesso',
  deleting: 'Excluindo...',
  deleted: 'Excluído com sucesso',
  error: 'Ocorreu um erro',
  
  // Forms
  formValid: 'Formulário válido',
  formInvalid: 'Formulário contém erros',
  fieldRequired: 'Este campo é obrigatório',
  
  // Navigation
  navigatedTo: (page: string) => `Navegou para ${page}`,
  
  // Lists
  listFiltered: (count: number) => `Lista filtrada. ${count} itens.`,
  listSorted: (field: string, direction: string) => 
    `Lista ordenada por ${field} em ordem ${direction === 'asc' ? 'crescente' : 'decrescente'}`,
    
  // Toggles
  expanded: 'Expandido',
  collapsed: 'Recolhido',
  enabled: 'Ativado',
  disabled: 'Desativado',
  
  // Selection
  selected: 'Selecionado',
  deselected: 'Desmarcado',
};

export default useAriaLive;
