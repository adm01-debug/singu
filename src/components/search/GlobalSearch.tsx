import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Users, 
  MessageSquare, 
  Search,
  ArrowRight,
  Phone,
  Mail,
  Calendar,
  ExternalLink
} from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface SearchResult {
  id: string;
  type: 'contact' | 'company' | 'interaction';
  title: string;
  subtitle?: string;
  meta?: string;
}

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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
  const navigate = useNavigate();
  const { user } = useAuth();

  // Search function
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || !user) {
      setResults({ contacts: [], companies: [], interactions: [] });
      return;
    }

    setIsLoading(true);
    const searchTerm = `%${searchQuery.toLowerCase()}%`;

    try {
      // Search contacts
      const { data: contacts } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, email, phone, role_title, company_id')
        .eq('user_id', user.id)
        .or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},email.ilike.${searchTerm},role_title.ilike.${searchTerm}`)
        .limit(5);

      // Search companies
      const { data: companies } = await supabase
        .from('companies')
        .select('id, name, industry, city, state')
        .eq('user_id', user.id)
        .or(`name.ilike.${searchTerm},industry.ilike.${searchTerm},city.ilike.${searchTerm}`)
        .limit(5);

      // Search interactions
      const { data: interactions } = await supabase
        .from('interactions')
        .select('id, title, type, created_at, contact_id')
        .eq('user_id', user.id)
        .or(`title.ilike.${searchTerm},content.ilike.${searchTerm}`)
        .order('created_at', { ascending: false })
        .limit(5);

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
    } catch (error) {
      console.error('Search error:', error);
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

  const handleSelect = (result: SearchResult) => {
    onOpenChange(false);
    switch (result.type) {
      case 'contact':
        navigate(`/contatos/${result.id}`);
        break;
      case 'company':
        navigate(`/empresas/${result.id}`);
        break;
      case 'interaction':
        navigate('/interacoes');
        break;
    }
  };

  const handleQuickAction = (action: string) => {
    onOpenChange(false);
    switch (action) {
      case 'new-contact':
        navigate('/contatos?new=true');
        break;
      case 'new-company':
        navigate('/empresas?new=true');
        break;
      case 'new-interaction':
        navigate('/interacoes?new=true');
        break;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'contact':
        return <Users className="w-4 h-4" />;
      case 'company':
        return <Building2 className="w-4 h-4" />;
      case 'interaction':
        return <MessageSquare className="w-4 h-4" />;
      default:
        return <Search className="w-4 h-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const config = {
      contact: { label: 'Contato', className: 'bg-primary/10 text-primary border-primary/20' },
      company: { label: 'Empresa', className: 'bg-accent/10 text-accent border-accent/20' },
      interaction: { label: 'Interação', className: 'bg-warning/10 text-warning border-warning/20' },
    }[type];

    return (
      <Badge variant="outline" className={`text-xs ${config?.className}`}>
        {config?.label}
      </Badge>
    );
  };

  const hasResults = results.contacts.length > 0 || results.companies.length > 0 || results.interactions.length > 0;

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput 
        placeholder="Buscar contatos, empresas, interações..." 
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {!query && (
          <>
            <CommandGroup heading="Ações Rápidas">
              <CommandItem onSelect={() => handleQuickAction('new-contact')} className="gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                  <Users className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Novo Contato</p>
                  <p className="text-xs text-muted-foreground">Adicionar um novo contato</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </CommandItem>
              <CommandItem onSelect={() => handleQuickAction('new-company')} className="gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent/10">
                  <Building2 className="w-4 h-4 text-accent" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Nova Empresa</p>
                  <p className="text-xs text-muted-foreground">Cadastrar uma nova empresa</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </CommandItem>
              <CommandItem onSelect={() => handleQuickAction('new-interaction')} className="gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-warning/10">
                  <MessageSquare className="w-4 h-4 text-warning" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Nova Interação</p>
                  <p className="text-xs text-muted-foreground">Registrar uma nova interação</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Navegação">
              <CommandItem onSelect={() => { onOpenChange(false); navigate('/'); }} className="gap-3">
                <span className="text-muted-foreground">Ir para</span>
                <span className="font-medium">Dashboard</span>
              </CommandItem>
              <CommandItem onSelect={() => { onOpenChange(false); navigate('/contatos'); }} className="gap-3">
                <span className="text-muted-foreground">Ir para</span>
                <span className="font-medium">Contatos</span>
              </CommandItem>
              <CommandItem onSelect={() => { onOpenChange(false); navigate('/empresas'); }} className="gap-3">
                <span className="text-muted-foreground">Ir para</span>
                <span className="font-medium">Empresas</span>
              </CommandItem>
              <CommandItem onSelect={() => { onOpenChange(false); navigate('/interacoes'); }} className="gap-3">
                <span className="text-muted-foreground">Ir para</span>
                <span className="font-medium">Interações</span>
              </CommandItem>
              <CommandItem onSelect={() => { onOpenChange(false); navigate('/insights'); }} className="gap-3">
                <span className="text-muted-foreground">Ir para</span>
                <span className="font-medium">Insights</span>
              </CommandItem>
            </CommandGroup>
          </>
        )}

        {query && !hasResults && !isLoading && (
          <CommandEmpty>
            <div className="flex flex-col items-center gap-2 py-6">
              <Search className="w-10 h-10 text-muted-foreground/50" />
              <p>Nenhum resultado encontrado para "{query}"</p>
              <p className="text-xs text-muted-foreground">
                Tente buscar por nome, email, empresa ou título
              </p>
            </div>
          </CommandEmpty>
        )}

        {query && isLoading && (
          <div className="flex items-center justify-center py-6">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        )}

        {results.contacts.length > 0 && (
          <CommandGroup heading="Contatos">
            {results.contacts.map((result) => (
              <CommandItem
                key={result.id}
                onSelect={() => handleSelect(result)}
                className="gap-3 py-3"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{result.title}</p>
                  {result.subtitle && (
                    <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                  )}
                </div>
                {result.meta && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Phone className="w-3 h-3" />
                    <span className="truncate max-w-[100px]">{result.meta}</span>
                  </div>
                )}
                <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100" />
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {results.companies.length > 0 && (
          <>
            {results.contacts.length > 0 && <CommandSeparator />}
            <CommandGroup heading="Empresas">
              {results.companies.map((result) => (
                <CommandItem
                  key={result.id}
                  onSelect={() => handleSelect(result)}
                  className="gap-3 py-3"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-accent/10">
                    <Building2 className="w-5 h-5 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{result.title}</p>
                    {result.subtitle && (
                      <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                    )}
                  </div>
                  {result.meta && (
                    <span className="text-xs text-muted-foreground">{result.meta}</span>
                  )}
                  <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100" />
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {results.interactions.length > 0 && (
          <>
            {(results.contacts.length > 0 || results.companies.length > 0) && <CommandSeparator />}
            <CommandGroup heading="Interações">
              {results.interactions.map((result) => (
                <CommandItem
                  key={result.id}
                  onSelect={() => handleSelect(result)}
                  className="gap-3 py-3"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-warning/10">
                    <MessageSquare className="w-5 h-5 text-warning" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{result.title}</p>
                    {result.subtitle && (
                      <Badge variant="secondary" className="text-xs capitalize">
                        {result.subtitle}
                      </Badge>
                    )}
                  </div>
                  {result.meta && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>{result.meta}</span>
                    </div>
                  )}
                  <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100" />
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
      
      {/* Footer with keyboard hints */}
      <div className="border-t border-border p-2 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">↑↓</kbd>
            <span>navegar</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">↵</kbd>
            <span>selecionar</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">esc</kbd>
            <span>fechar</span>
          </span>
        </div>
      </div>
    </CommandDialog>
  );
}
