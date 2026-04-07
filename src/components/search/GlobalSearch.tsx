import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Fuse from 'fuse.js';
import { useModalHistory } from '@/hooks/useModalHistory';
import { 
  Building2, 
  Users, 
  MessageSquare, 
  Search,
  ArrowRight,
  Phone,
  Calendar,
  ExternalLink,
  Home,
  Lightbulb,
  Settings,
  Bell,
  CalendarDays,
  Plus,
  Clock,
  Zap,
  Command,
  LayoutDashboard,
  TrendingUp,
  UserPlus,
  Building,
  MessagesSquare,
  Mic,
} from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toTitleCase } from '@/lib/formatters';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { logger } from "@/lib/logger";

const LazyVoiceOverlay = lazy(() => import("./VoiceSearchOverlayConnected"));

interface SearchResult {
  id: string;
  type: 'contact' | 'company' | 'interaction';
  title: string;
  subtitle?: string;
  meta?: string;
}

interface RecentItem {
  id: string;
  type: 'contact' | 'company' | 'interaction' | 'page';
  title: string;
  path: string;
  timestamp: number;
}

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  voiceMode?: boolean;
  onVoiceModeChange?: (open: boolean) => void;
}

const navigationItems = [
  { 
    key: '1', 
    path: '/', 
    label: 'Dashboard', 
    icon: LayoutDashboard,
    description: 'Visão geral e métricas'
  },
  { 
    key: '2', 
    path: '/empresas', 
    label: 'Empresas', 
    icon: Building2,
    description: 'Gerenciar empresas'
  },
  { 
    key: '3', 
    path: '/contatos', 
    label: 'Contatos', 
    icon: Users,
    description: 'Gerenciar contatos'
  },
  { 
    key: '4', 
    path: '/interacoes', 
    label: 'Interações', 
    icon: MessageSquare,
    description: 'Histórico de interações'
  },
  { 
    key: '5', 
    path: '/calendario', 
    label: 'Calendário', 
    icon: CalendarDays,
    description: 'Eventos e lembretes'
  },
  { 
    key: '6', 
    path: '/insights', 
    label: 'Insights', 
    icon: Lightbulb,
    description: 'Análises e tendências'
  },
  { 
    key: '7', 
    path: '/notificacoes', 
    label: 'Notificações', 
    icon: Bell,
    description: 'Alertas e avisos'
  },
  { 
    key: '8', 
    path: '/configuracoes', 
    label: 'Configurações', 
    icon: Settings,
    description: 'Preferências do sistema'
  },
];

const quickActions = [
  {
    id: 'new-contact',
    label: 'Novo Contato',
    description: 'Adicionar um novo contato à sua rede',
    icon: UserPlus,
    shortcut: 'C',
    color: 'primary',
    path: '/contatos?new=true',
  },
  {
    id: 'new-company',
    label: 'Nova Empresa',
    description: 'Cadastrar uma nova empresa',
    icon: Building,
    shortcut: 'E',
    color: 'accent',
    path: '/empresas?new=true',
  },
  {
    id: 'new-interaction',
    label: 'Nova Interação',
    description: 'Registrar uma nova interação',
    icon: MessagesSquare,
    shortcut: 'I',
    color: 'warning',
    path: '/interacoes?new=true',
  },
];

// Local storage key for recent items
const RECENT_ITEMS_KEY = 'command-palette-recent';
const MAX_RECENT_ITEMS = 5;

function getRecentItems(): RecentItem[] {
  try {
    const stored = localStorage.getItem(RECENT_ITEMS_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

function addRecentItem(item: Omit<RecentItem, 'timestamp'>) {
  const recent = getRecentItems();
  const filtered = recent.filter(r => !(r.id === item.id && r.type === item.type));
  const newRecent = [{ ...item, timestamp: Date.now() }, ...filtered].slice(0, MAX_RECENT_ITEMS);
  localStorage.setItem(RECENT_ITEMS_KEY, JSON.stringify(newRecent));
}

// Normalize text removing accents for better matching
function normalizeText(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export const GlobalSearch = React.forwardRef<HTMLDivElement, GlobalSearchProps>(({ open, onOpenChange }, ref) => {
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
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // Integrate with browser history so back button closes search
  useModalHistory(open, () => onOpenChange(false), 'global-search');

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
    const searchTermTrimmed = searchQuery.trim();

    try {
      const [contactsResponse, companiesResponse, interactionsResponse] = await Promise.all([
        supabase.rpc('search_contacts_unaccent', {
          p_user_id: user.id,
          p_query: searchQuery.trim(),
          p_limit: 5,
        }),
        supabase.rpc('search_companies_unaccent', {
          p_user_id: user.id,
          p_query: searchQuery.trim(),
          p_limit: 5,
        }),
        supabase.rpc('search_interactions_unaccent', {
          p_user_id: user.id,
          p_query: searchQuery.trim(),
          p_limit: 5,
        }),
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
          title: toTitleCase(c.name),
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
    } catch (error) {
      logger.error('Search error:', error);
      toast.error('Não foi possível completar a busca agora.');
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

  const handleQuickAction = (action: typeof quickActions[0]) => {
    onOpenChange(false);
    navigate(action.path);
  };

  const handleRecentSelect = (item: RecentItem) => {
    onOpenChange(false);
    navigate(item.path);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'contact':
        return <Users className="w-4 h-4" />;
      case 'company':
        return <Building2 className="w-4 h-4" />;
      case 'interaction':
        return <MessageSquare className="w-4 h-4" />;
      case 'page':
        return <ExternalLink className="w-4 h-4" />;
      default:
        return <Search className="w-4 h-4" />;
    }
  };

  const getColorClass = (color: string) => {
    switch (color) {
      case 'primary':
        return 'bg-primary/10 text-primary';
      case 'accent':
        return 'bg-accent/10 text-accent';
      case 'warning':
        return 'bg-warning/10 text-warning';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const hasResults = results.contacts.length > 0 || results.companies.length > 0 || results.interactions.length > 0;
  const hasLocalResults = filteredNavigation.length > 0 || filteredQuickActions.length > 0 || filteredRecent.length > 0;
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modKey = isMac ? '⌘' : 'Ctrl';

  return (
    <>
    <CommandDialog ref={ref} open={open} onOpenChange={onOpenChange} shouldFilter={false}>
      <div className="flex items-center justify-between gap-2 px-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          <span className="text-xs font-medium text-muted-foreground">Super Command Palette</span>
        </div>
        <button
          onClick={() => { onOpenChange(false); setVoiceOpen(true); }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium transition-colors"
          aria-label="Assistente de Voz"
        >
          <Mic className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Voz</span>
        </button>
      </div>
      <CommandInput 
        placeholder="Buscar contatos, empresas, navegar ou executar ações..." 
        value={query}
        onValueChange={setQuery}
      />
      <CommandList className="max-h-[400px]">
        {/* Screen reader announcement for search results */}
        {query && !isLoading && (
          <div className="sr-only" aria-live="polite" aria-atomic="true">
            {hasResults
              ? `${results.contacts.length + results.companies.length + results.interactions.length} resultados encontrados`
              : 'Nenhum resultado encontrado'}
          </div>
        )}
        {/* Loading */}
        {query && isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
              <p className="text-sm text-muted-foreground">Buscando...</p>
            </div>
          </div>
        )}

        {/* DB Results — show first when searching */}
        {results.contacts.length > 0 && (
          <CommandGroup heading={<div className="flex items-center gap-2"><Users className="w-3 h-3" /><span>Contatos</span><Badge variant="secondary" className="text-[10px] ml-auto">{results.contacts.length}</Badge></div>}>
            {results.contacts.map((result) => (
              <CommandItem key={result.id} onSelect={() => handleSelect(result)} className="gap-3 py-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10"><Users className="w-5 h-5 text-primary" /></div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{result.title}</p>
                  {result.subtitle && <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>}
                </div>
                {result.meta && <div className="flex items-center gap-1 text-xs text-muted-foreground"><Phone className="w-3 h-3" /><span className="truncate max-w-[100px]">{result.meta}</span></div>}
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {results.companies.length > 0 && (
          <><CommandSeparator /><CommandGroup heading={<div className="flex items-center gap-2"><Building2 className="w-3 h-3" /><span>Empresas</span><Badge variant="secondary" className="text-[10px] ml-auto">{results.companies.length}</Badge></div>}>
            {results.companies.map((result) => (
              <CommandItem key={result.id} onSelect={() => handleSelect(result)} className="gap-3 py-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-accent/10"><Building2 className="w-5 h-5 text-accent" /></div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{result.title}</p>
                  {result.subtitle && <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>}
                </div>
                {result.meta && <span className="text-xs text-muted-foreground">{result.meta}</span>}
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </CommandItem>
            ))}
          </CommandGroup></>
        )}
        {results.interactions.length > 0 && (
          <><CommandSeparator /><CommandGroup heading={<div className="flex items-center gap-2"><MessageSquare className="w-3 h-3" /><span>Interações</span><Badge variant="secondary" className="text-[10px] ml-auto">{results.interactions.length}</Badge></div>}>
            {results.interactions.map((result) => (
              <CommandItem key={result.id} onSelect={() => handleSelect(result)} className="gap-3 py-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-warning/10"><MessageSquare className="w-5 h-5 text-warning" /></div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{result.title}</p>
                  {result.subtitle && <Badge variant="secondary" className="text-xs capitalize">{result.subtitle}</Badge>}
                </div>
                {result.meta && <div className="flex items-center gap-1 text-xs text-muted-foreground"><Calendar className="w-3 h-3" /><span>{result.meta}</span></div>}
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </CommandItem>
            ))}
          </CommandGroup></>
        )}

        {/* Empty state */}
        {query && !hasResults && !hasLocalResults && !isLoading && (
          <CommandEmpty>
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center"><Search className="w-6 h-6 text-muted-foreground" /></div>
              <div className="text-center">
                <p className="font-medium">Nenhum resultado para "{query}"</p>
                <p className="text-sm text-muted-foreground mt-1">Tente buscar por nome, email, empresa ou título</p>
              </div>
            </div>
          </CommandEmpty>
        )}

        {/* Quick Actions */}
        {(!query || filteredQuickActions.length > 0) && (
          <CommandGroup heading={
            <div className="flex items-center gap-2">
              <Zap className="w-3 h-3" />
              <span>Ações Rápidas</span>
            </div>
          }>
            {filteredQuickActions.map((action) => {
              const Icon = action.icon;
              return (
                <CommandItem 
                  key={action.id} 
                  onSelect={() => handleQuickAction(action)} 
                  className="gap-3 py-3"
                >
                  <div className={`flex items-center justify-center w-9 h-9 rounded-lg ${getColorClass(action.color)}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{action.label}</p>
                    <p className="text-xs text-muted-foreground">{action.description}</p>
                  </div>
                  <CommandShortcut>Alt+{action.shortcut}</CommandShortcut>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        {/* Recent Items */}
        {filteredRecent.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading={
              <div className="flex items-center gap-2">
                <Clock className="w-3 h-3" />
                <span>Recentes</span>
              </div>
            }>
              {filteredRecent.map((item, index) => (
                <CommandItem
                  key={`${item.type}-${item.id}-${index}`}
                  onSelect={() => handleRecentSelect(item)}
                  className="gap-3"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted">
                    {getTypeIcon(item.type)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">{item.type === 'page' ? 'Página' : item.type}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Navigation */}
        {(!query || filteredNavigation.length > 0) && (
          <>
            <CommandSeparator />
            <CommandGroup heading={
              <div className="flex items-center gap-2">
                <Command className="w-3 h-3" />
                <span>Navegação</span>
              </div>
            }>
              {filteredNavigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <CommandItem 
                    key={item.path} 
                    onSelect={() => handleNavigate(item.path, item.label)} 
                    className={`gap-3 ${isActive ? 'bg-primary/5' : ''}`}
                  >
                    <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium ${isActive ? 'text-primary' : ''}`}>{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                    {isActive && (
                      <Badge variant="secondary" className="text-[10px]">Atual</Badge>
                    )}
                    <CommandShortcut>Alt+{item.key}</CommandShortcut>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </>
        )}

      </CommandList>
      
      {/* Enhanced Footer with keyboard hints */}
      <div className="border-t border-border p-2.5 bg-muted/30">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 bg-background border border-border rounded text-[10px] font-mono shadow-sm">↑↓</kbd>
              <span>navegar</span>
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 bg-background border border-border rounded text-[10px] font-mono shadow-sm">↵</kbd>
              <span>selecionar</span>
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 bg-background border border-border rounded text-[10px] font-mono shadow-sm">esc</kbd>
              <span>fechar</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground/70">Abrir com</span>
            <kbd className="px-1.5 py-0.5 bg-background border border-border rounded text-[10px] font-mono shadow-sm">{modKey}</kbd>
            <kbd className="px-1.5 py-0.5 bg-background border border-border rounded text-[10px] font-mono shadow-sm">K</kbd>
          </div>
        </div>
      </div>
    </CommandDialog>

    {voiceOpen && (
      <Suspense fallback={null}>
        <LazyVoiceOverlay
          isOpen={voiceOpen}
          onClose={() => setVoiceOpen(false)}
          onAction={(action) => {
            if (action.action === 'navigate' && action.data?.route) {
              navigate(action.data.route);
            } else if (action.action === 'search' && action.data?.query) {
              setVoiceOpen(false);
              onOpenChange(true);
              setQuery(action.data.query);
            }
          }}
        />
      </Suspense>
    )}
    </>
  );
});

GlobalSearch.displayName = 'GlobalSearch';
