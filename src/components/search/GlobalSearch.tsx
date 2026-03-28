import { useState, useEffect, useCallback, useMemo } from 'react';
import { logger } from '@/lib/logger';
import { useNavigate, useLocation } from 'react-router-dom';
import Fuse from 'fuse.js';
import { Zap } from 'lucide-react';
import {
  CommandDialog,
  CommandInput,
  CommandList,
} from '@/components/ui/command';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

import type { GlobalSearchProps, SearchResult, RecentItem } from './searchTypes';
import {
  navigationItems,
  quickActions,
  getRecentItems,
  addRecentItem,
  normalizeText,
} from './searchTypes';
import { QuickActionsGroup } from './QuickActionsGroup';
import { SearchResultGroups } from './SearchResultGroups';
import { SearchEmptyState, SearchLoadingState } from './SearchEmptyState';
import { SearchFooter } from './SearchFooter';

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{
    contacts: SearchResult[];
    companies: SearchResult[];
    interactions: SearchResult[];
  }>({
    contacts: [],
    companies: [],
    interactions: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Fuse.js instances for local fuzzy search
  const navigationFuse = useMemo(() => new Fuse(navigationItems, {
    keys: ['label', 'description'],
    threshold: 0.4,
    ignoreLocation: true,
    getFn: (obj, path) => {
      const value = Fuse.config.getFn(obj, path);
      if (typeof value === 'string') return normalizeText(value);
      if (Array.isArray(value)) return value.map(v => typeof v === 'string' ? normalizeText(v) : v);
      return value;
    },
  }), []);

  const quickActionsFuse = useMemo(() => new Fuse(quickActions, {
    keys: ['label', 'description'],
    threshold: 0.4,
    ignoreLocation: true,
    getFn: (obj, path) => {
      const value = Fuse.config.getFn(obj, path);
      if (typeof value === 'string') return normalizeText(value);
      if (Array.isArray(value)) return value.map(v => typeof v === 'string' ? normalizeText(v) : v);
      return value;
    },
  }), []);

  // Filtered local items based on fuzzy search
  const filteredNavigation = useMemo(() => {
    if (!query.trim()) return navigationItems;
    const normalizedQuery = normalizeText(query);
    return navigationFuse.search(normalizedQuery).map(r => r.item);
  }, [query, navigationFuse]);

  const filteredQuickActions = useMemo(() => {
    if (!query.trim()) return quickActions;
    const normalizedQuery = normalizeText(query);
    return quickActionsFuse.search(normalizedQuery).map(r => r.item);
  }, [query, quickActionsFuse]);

  const filteredRecent = useMemo(() => {
    if (!query.trim()) return recentItems;
    const fuse = new Fuse(recentItems, {
      keys: ['title'],
      threshold: 0.4,
      ignoreLocation: true,
    });
    return fuse.search(query).map(r => r.item);
  }, [query, recentItems]);

  // Sync search query with URL params (#10)
  useEffect(() => {
    if (!open) return;

    const params = new URLSearchParams(location.search);
    const urlQuery = params.get('q') ?? '';
    if (urlQuery !== query) setQuery(urlQuery);
    setRecentItems(getRecentItems());
  }, [open, location.search, query]);

  // Persist query in URL for share/back-forward behavior
  useEffect(() => {
    if (!open) return;

    const params = new URLSearchParams(location.search);
    const normalizedQuery = query.trim();

    if (normalizedQuery) params.set('q', normalizedQuery);
    else params.delete('q');

    const nextSearch = params.toString();
    const currentSearch = location.search.startsWith('?') ? location.search.slice(1) : location.search;

    if (nextSearch !== currentSearch) {
      navigate(
        {
          pathname: location.pathname,
          search: nextSearch ? `?${nextSearch}` : '',
        },
        { replace: true }
      );
    }
  }, [query, open, location.pathname, location.search, navigate]);

  // Handle quick action shortcuts
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for quick action shortcuts (Alt + key)
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        const action = quickActions.find(a => a.shortcut.toLowerCase() === e.key.toLowerCase());
        if (action) {
          e.preventDefault();
          handleQuickAction(action);
          return;
        }
      }

      // Check for navigation shortcuts (Alt + number)
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        const navItem = navigationItems.find(n => n.key === e.key);
        if (navItem) {
          e.preventDefault();
          handleNavigate(navItem.path, navItem.label);
          return;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  // Search function
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || !user) {
      setResults({ contacts: [], companies: [], interactions: [] });
      return;
    }

    setIsLoading(true);
    const normalizedSearch = normalizeText(searchQuery);
    const searchTerm = `%${normalizedSearch}%`;

    try {
      const [contactsResponse, companiesResponse, interactionsResponse] = await Promise.all([
        supabase
          .from('contacts')
          .select('id, first_name, last_name, email, phone, role_title, company_id')
          .eq('user_id', user.id)
          .or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},email.ilike.${searchTerm},role_title.ilike.${searchTerm}`)
          .limit(5),
        supabase
          .from('companies')
          .select('id, name, industry, city, state')
          .eq('user_id', user.id)
          .or(`name.ilike.${searchTerm},industry.ilike.${searchTerm},city.ilike.${searchTerm}`)
          .limit(5),
        supabase
          .from('interactions')
          .select('id, title, type, created_at, contact_id')
          .eq('user_id', user.id)
          .or(`title.ilike.${searchTerm},content.ilike.${searchTerm}`)
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      if (contactsResponse.error || companiesResponse.error || interactionsResponse.error) {
        throw contactsResponse.error || companiesResponse.error || interactionsResponse.error;
      }

      const contacts = contactsResponse.data;
      const companies = companiesResponse.data;
      const interactions = interactionsResponse.data;

      setResults({
        contacts: contacts?.map(c => ({
          id: c.id,
          type: 'contact' as const,
          title: `${c.first_name} ${c.last_name}`,
          subtitle: c.role_title || c.email,
          meta: c.phone,
        })) || [],
        companies: companies?.map(c => ({
          id: c.id,
          type: 'company' as const,
          title: c.name,
          subtitle: c.industry,
          meta: c.city && c.state ? `${c.city}, ${c.state}` : undefined,
        })) || [],
        interactions: interactions?.map(i => ({
          id: i.id,
          type: 'interaction' as const,
          title: i.title,
          subtitle: i.type,
          meta: new Date(i.created_at).toLocaleDateString('pt-BR'),
        })) || [],
      });
    } catch (_err) {
      logger.error('Global search failed:', _err);
      toast.error('Nao foi possivel completar a busca agora.');
      setResults({ contacts: [], companies: [], interactions: [] });
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, performSearch]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults({ contacts: [], companies: [], interactions: [] });
    }
  }, [open]);

  const handleNavigate = (path: string, label: string) => {
    onOpenChange(false);
    addRecentItem({ id: path, type: 'page', title: label, path });
    navigate(path);
  };

  const handleSelect = (result: SearchResult) => {
    onOpenChange(false);
    let path = '';
    switch (result.type) {
      case 'contact':
        path = `/contatos/${result.id}`;
        break;
      case 'company':
        path = `/empresas/${result.id}`;
        break;
      case 'interaction':
        path = '/interacoes';
        break;
    }
    addRecentItem({ id: result.id, type: result.type, title: result.title, path });
    navigate(path);
  };

  const handleQuickAction = (action: typeof quickActions[number]) => {
    onOpenChange(false);
    navigate(action.path);
  };

  const handleRecentSelect = (item: RecentItem) => {
    onOpenChange(false);
    navigate(item.path);
  };

  const hasResults = results.contacts.length > 0 || results.companies.length > 0 || results.interactions.length > 0;
  const hasLocalResults = filteredNavigation.length > 0 || filteredQuickActions.length > 0 || filteredRecent.length > 0;

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <div className="flex items-center gap-2 px-3 border-b border-border">
        <Zap className="w-4 h-4 text-primary" />
        <span className="text-xs font-medium text-muted-foreground">Super Command Palette</span>
      </div>
      <CommandInput
        placeholder="Buscar contatos, empresas, navegar ou executar ações..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList className="max-h-[400px]">
        {(!query || filteredQuickActions.length > 0) && (
          <QuickActionsGroup
            filteredQuickActions={filteredQuickActions}
            filteredRecent={filteredRecent}
            filteredNavigation={filteredNavigation}
            currentPathname={location.pathname}
            onQuickAction={handleQuickAction}
            onRecentSelect={handleRecentSelect}
            onNavigate={handleNavigate}
          />
        )}

        {query && !hasResults && !hasLocalResults && !isLoading && (
          <SearchEmptyState query={query} onQuickAction={handleQuickAction} />
        )}

        {query && isLoading && (
          <SearchLoadingState />
        )}

        <SearchResultGroups results={results} onSelect={handleSelect} />
      </CommandList>

      <SearchFooter />
    </CommandDialog>
  );
}
