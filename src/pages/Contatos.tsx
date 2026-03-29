import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { SwipeableListItem } from '@/components/ui/swipeable-list-item';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { sortArray } from '@/lib/sorting-utils';
import { List as VirtualList } from 'react-window';
import { 
  Search,
  Grid3X3,
  List,
  Crown,
  Briefcase,
  ShoppingCart,
  User,
  UserPlus,
  Upload,
  CheckSquare,
  Keyboard,
  RefreshCw,
  Database
} from 'lucide-react';
import { ContactsGridSkeleton, ContactsListSkeleton } from '@/components/skeletons/PageSkeletons';
import { EmptyState, SearchEmptyState } from '@/components/ui/empty-state';
import { AppLayout } from '@/components/layout/AppLayout';
import { FloatingQuickActions } from '@/components/quick-actions/FloatingQuickActions';
import { AdvancedDataExporter } from '@/components/data-export/AdvancedDataExporter';
import { RecentlyViewedSection } from '@/components/recently-viewed/RecentlyViewedSection';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AdvancedFilters, type FilterConfig, type SortOption } from '@/components/filters/AdvancedFilters';
import { ContactForm } from '@/components/forms/ContactForm';
import { ContactCardWithContext } from '@/components/contact-card/ContactCardWithContext';
import { BulkActionsBar } from '@/components/bulk-actions/BulkActionsBar';
import { KeyboardShortcutsCheatsheet } from '@/components/keyboard/KeyboardShortcutsCheatsheet';
import { ContextualHelpTooltip } from '@/components/help/ContextualHelpTooltip';
import { useAccessibleToast } from '@/hooks/useAccessibleToast';
import { useFuzzySearch } from '@/hooks/useFuzzySearch';
import { useContacts, type Contact } from '@/hooks/useContacts';
import { useCompanies } from '@/hooks/useCompanies';
import { useInteractions } from '@/hooks/useInteractions';
import { useMiniCelebration } from '@/components/celebrations/MiniCelebration';
import { useListNavigation, useKeyboardShortcutsEnhanced } from '@/hooks/useKeyboardShortcutsEnhanced';
import type { ContactRole } from '@/types';
import { SearchPresetsMenu } from '@/components/search/SearchPresetsMenu';
import { FeatureSpotlight } from '@/components/feedback/FeatureSpotlight';
import type { SearchPreset } from '@/hooks/useSearchPresets';
import { logger } from "@/lib/logger";

type ViewMode = 'grid' | 'list';

const filterConfigs: FilterConfig[] = [
  {
    key: 'role',
    label: 'Papel',
    multiple: true,
    options: [
      { value: 'owner', label: 'Proprietário', icon: Crown },
      { value: 'manager', label: 'Gerente', icon: Briefcase },
      { value: 'buyer', label: 'Comprador', icon: ShoppingCart },
      { value: 'contact', label: 'Contato', icon: User },
    ],
  },
  {
    key: 'sentiment',
    label: 'Sentimento',
    multiple: false,
    options: [
      { value: 'positive', label: 'Positivo' },
      { value: 'neutral', label: 'Neutro' },
      { value: 'negative', label: 'Negativo' },
    ],
  },
  {
    key: 'relationship_stage',
    label: 'Estágio',
    multiple: true,
    options: [
      { value: 'lead', label: 'Lead' },
      { value: 'prospect', label: 'Prospect' },
      { value: 'negotiation', label: 'Negociação' },
      { value: 'client', label: 'Cliente' },
      { value: 'partner', label: 'Parceiro' },
      { value: 'churned', label: 'Inativo' },
      { value: 'unknown', label: 'Desconhecido' },
    ],
  },
];

const sortOptions: SortOption[] = [
  { value: 'first_name', label: 'Nome' },
  { value: 'relationship_score', label: 'Score de Relacionamento' },
  { value: 'created_at', label: 'Data de Criação' },
  { value: 'updated_at', label: 'Última Atualização' },
];

const Contatos = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { contacts, loading, createContact, updateContact, deleteContact, fetchContacts } = useContacts();
  const { companies } = useCompanies();
  const { interactions } = useInteractions();
  
  // Initialize state from URL params
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('q') || '');
  const [viewMode, setViewMode] = useState<ViewMode>(() => (searchParams.get('view') as ViewMode) || 'grid');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [deletingContact, setDeletingContact] = useState<Contact | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  
  // Accessible toast (toast + ARIA announce)
  const accessibleToast = useAccessibleToast();
  
  // Selection state for bulk actions
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Mini celebration hook
  const celebration = useMiniCelebration();
  
  // Pull-to-refresh handler
  const handleRefresh = useCallback(async () => {
    await fetchContacts();
  }, [fetchContacts]);
  
  // Advanced filters state - restore from URL
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>(() => {
    try {
      const f = searchParams.get('filters');
      return f ? JSON.parse(decodeURIComponent(f)) : {};
    } catch { return {}; }
  });
  const [sortBy, setSortBy] = useState(() => searchParams.get('sort') || 'updated_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(() => (searchParams.get('order') as 'asc' | 'desc') || 'desc');

  // Sync state to URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('q', searchTerm);
    if (viewMode !== 'grid') params.set('view', viewMode);
    if (Object.keys(activeFilters).length > 0) {
      params.set('filters', encodeURIComponent(JSON.stringify(activeFilters)));
    }
    if (sortBy !== 'updated_at') params.set('sort', sortBy);
    if (sortOrder !== 'desc') params.set('order', sortOrder);
    
    setSearchParams(params, { replace: true });
  }, [searchTerm, viewMode, activeFilters, sortBy, sortOrder, setSearchParams]);

  // Fuzzy search for better matching
  const { results: fuzzyResults, setQuery: setFuzzyQuery } = useFuzzySearch(contacts, {
    keys: ['first_name', 'last_name', 'email', 'role_title'],
    threshold: 0.4,
  });
  
  // Sync search term to fuzzy search
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    setFuzzyQuery(value);
  }, [setFuzzyQuery]);

  const filteredAndSortedContacts = useMemo(() => {
    // Use fuzzy search results when searching, otherwise use all contacts
    let result = searchTerm ? fuzzyResults : contacts;
    
    // Apply advanced filters
    result = result.filter(contact => {
      for (const [key, values] of Object.entries(activeFilters)) {
        if (values.length === 0) continue;
        
        const contactValue = contact[key as keyof Contact];
        if (!contactValue || !values.includes(String(contactValue))) {
          return false;
        }
      }
      return true;
    });

    // Sort using type-safe utility
    return sortArray(result, sortBy as keyof Contact, sortOrder, {
      dateFields: ['created_at', 'updated_at', 'birthday'],
      numericFields: ['relationship_score']
    });
  }, [contacts, fuzzyResults, searchTerm, activeFilters, sortBy, sortOrder]);

  // Keyboard navigation
  const { selectedIndex, setSelectedIndex } = useListNavigation(filteredAndSortedContacts, {
    onOpen: (contact) => navigate(`/contatos/${contact.id}`),
    onSelect: () => {},
  });

  useKeyboardShortcutsEnhanced();

  const getCompanyName = useCallback((companyId: string | null) => {
    if (!companyId) return null;
    const company = companies.find(c => c.id === companyId);
    return company?.name || null;
  }, [companies]);

  const getLastInteractionDate = useCallback((contactId: string): string | null => {
    const contactInteractions = interactions
      .filter(i => i.contact_id === contactId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return contactInteractions[0]?.created_at || null;
  }, [interactions]);

  const handleCreate = async (data: Parameters<typeof createContact>[0], event?: React.MouseEvent) => {
    setIsSubmitting(true);
    const result = await createContact(data);
    setIsSubmitting(false);
    if (result) {
      setIsFormOpen(false);
      if (event) {
        celebration.trigger(event, { variant: 'success', message: 'Contato criado!' });
      } else {
        celebration.trigger({ clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 }, { variant: 'success', message: 'Contato criado!' });
      }
    }
  };

  const handleUpdate = async (data: Parameters<typeof updateContact>[1], event?: React.MouseEvent) => {
    if (!editingContact) return;
    setIsSubmitting(true);
    const result = await updateContact(editingContact.id, data);
    setIsSubmitting(false);
    if (result) {
      setEditingContact(null);
      if (event) {
        celebration.trigger(event, { variant: 'star', message: 'Atualizado!' });
      } else {
        celebration.trigger({ clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 }, { variant: 'star', message: 'Atualizado!' });
      }
    }
  };

  const handleDelete = async () => {
    if (!deletingContact) return;
    const contactToDelete = deletingContact;
    setDeletingContact(null);
    
    // Contact is removed from UI instantly by optimistic deleteContact
    const success = await deleteContact(contactToDelete.id);
    if (success) {
      accessibleToast.success(`${contactToDelete.first_name} excluído com sucesso`);
    }
  };

  // Selection handlers
  const handleSelect = (id: string, selected: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (selected) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredAndSortedContacts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAndSortedContacts.map(c => c.id)));
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    for (const id of ids) {
      await deleteContact(id);
    }
    setSelectedIds(new Set());
    setSelectionMode(false);
    accessibleToast.success(`${ids.length} contato${ids.length > 1 ? 's' : ''} excluído${ids.length > 1 ? 's' : ''}`);
  };

  const handleBulkAddTag = async (ids: string[], tag: string) => {
    for (const id of ids) {
      const contact = contacts.find(c => c.id === id);
      if (contact) {
        const currentTags = contact.tags || [];
        if (!currentTags.includes(tag)) {
          await updateContact(id, { tags: [...currentTags, tag] });
        }
      }
    }
    setSelectedIds(new Set());
  };

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    if (selectionMode) {
      setSelectedIds(new Set());
    }
  };

  const [isEnriching, setIsEnriching] = useState(false);

  const handleEnrichContacts = async () => {
    setIsEnriching(true);
    toast.info('Enriquecendo contatos com banco externo...');
    try {
      const { data, error } = await supabase.functions.invoke('enrich-contacts');
      if (error) throw error;
      const result = data;
      toast.success(`Enriquecimento concluído: ${result.enriched} contatos atualizados de ${result.total} analisados`);
      if (result.enriched > 0) {
        window.location.reload();
      }
    } catch (err: any) {
      logger.error('Enrichment error:', err);
      toast.error('Erro ao enriquecer contatos: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setIsEnriching(false);
    }
  };

  return (
    <>
    <AppLayout>
      <Header 
        title="Contatos" 
        subtitle={`${filteredAndSortedContacts.length} de ${contacts.length} pessoas`}
        showAddButton
        addButtonLabel="Novo Contato"
        onAddClick={() => setIsFormOpen(true)}
      />

      <div className="p-6 space-y-6">
        {/* Search and View Toggle */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              placeholder="Buscar por nome, cargo ou email (aceita erros de digitação)..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
              aria-label="Buscar contatos"
              aria-describedby="search-hint"
            />
            <span id="search-hint" className="sr-only">
              A busca é inteligente e aceita erros de digitação
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ContextualHelpTooltip
              title="Busca Inteligente"
              description="A busca usa Fuzzy Search para encontrar resultados mesmo com erros de digitação."
              tips={[
                '"joao" encontra "João Silva"',
                'Busca por nome, email e cargo',
                'Resultados ordenados por relevância',
              ]}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleEnrichContacts}
              disabled={isEnriching}
              className="gap-2"
              title="Enriquecer contatos com dados do banco externo"
            >
              {isEnriching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
              {isEnriching ? 'Enriquecendo...' : 'Enriquecer'}
            </Button>
            <FeatureSpotlight
              featureId="search-presets"
              title="Novo: Presets de Busca"
              description="Salve combinações de filtros para reutilizar rapidamente. Ideal para buscas que você faz com frequência!"
              position="bottom"
            >
              <SearchPresetsMenu
                context="contacts"
                currentFilters={activeFilters}
                currentSortBy={sortBy}
                currentSortOrder={sortOrder}
                currentSearchTerm={searchTerm}
                onApplyPreset={(preset: SearchPreset) => {
                  setActiveFilters(preset.filters);
                  setSortBy(preset.sortBy);
                  setSortOrder(preset.sortOrder);
                  if (preset.searchTerm) handleSearchChange(preset.searchTerm);
                }}
              />
            </FeatureSpotlight>
            <AdvancedDataExporter entityType="contacts" />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowShortcuts(true)}
              className="text-muted-foreground"
              aria-label="Ver atalhos de teclado"
            >
              <Keyboard className="w-4 h-4" />
            </Button>
            <Button
              variant={selectionMode ? 'default' : 'outline'}
              size="sm"
              onClick={toggleSelectionMode}
              className="gap-2"
            >
              <CheckSquare className="w-4 h-4" aria-hidden="true" />
              {selectionMode ? 'Cancelar' : 'Selecionar'}
            </Button>
            <div className="flex items-center gap-1 bg-secondary rounded-lg p-1" role="group" aria-label="Modo de visualização">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('grid')}
                className="h-8 w-8"
                aria-label="Visualização em grade"
                aria-pressed={viewMode === 'grid'}
              >
                <Grid3X3 className="w-4 h-4" aria-hidden="true" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('list')}
                className="h-8 w-8"
                aria-label="Visualização em lista"
                aria-pressed={viewMode === 'list'}
              >
                <List className="w-4 h-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        <AdvancedFilters
          filters={filterConfigs}
          sortOptions={sortOptions}
          activeFilters={activeFilters}
          onFiltersChange={setActiveFilters}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={(newSortBy, newSortOrder) => {
            setSortBy(newSortBy);
            setSortOrder(newSortOrder);
          }}
        />

        {/* Recently Viewed */}
        <RecentlyViewedSection type="contact" />

        <PullToRefresh onRefresh={handleRefresh}>
        {/* Loading State */}
        {loading ? (
          viewMode === 'grid' ? <ContactsGridSkeleton /> : <ContactsListSkeleton />
        ) : (
          <>
            {/* Contacts Grid/List */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAndSortedContacts.map((contact, index) => (
                  <ContactCardWithContext
                    key={contact.id}
                    contact={contact}
                    companyName={getCompanyName(contact.company_id)}
                    lastInteraction={getLastInteractionDate(contact.id)}
                    index={index}
                    isSelected={selectedIds.has(contact.id)}
                    isHighlighted={selectedIndex === index}
                    selectionMode={selectionMode}
                    onSelect={handleSelect}
                    onEdit={setEditingContact}
                    onDelete={setDeletingContact}
                    onUpdate={updateContact}
                    viewMode="grid"
                  />
                ))}
              </div>
            ) : (
              filteredAndSortedContacts.length > 50 ? (
                <VirtualList
                  rowCount={filteredAndSortedContacts.length}
                  rowHeight={88}
                  rowProps={{
                    contacts: filteredAndSortedContacts,
                    getCompanyName,
                    getLastInteractionDate,
                    selectedIds,
                    selectedIndex,
                    selectionMode,
                    handleSelect,
                    setEditingContact,
                    setDeletingContact,
                    updateContact,
                  }}
                  style={{ height: Math.min(filteredAndSortedContacts.length * 88, 600) }}
                  rowComponent={({ index, style, ...props }: any) => {
                    const contact = props.contacts[index];
                    if (!contact) return null;
                    return (
                      <div style={style} className="pb-2">
                        <ContactCardWithContext
                          contact={contact}
                          companyName={props.getCompanyName(contact.company_id)}
                          lastInteraction={props.getLastInteractionDate(contact.id)}
                          index={index}
                          isSelected={props.selectedIds.has(contact.id)}
                          isHighlighted={props.selectedIndex === index}
                          selectionMode={props.selectionMode}
                          onSelect={props.handleSelect}
                          onEdit={props.setEditingContact}
                          onDelete={props.setDeletingContact}
                          onUpdate={props.updateContact}
                          viewMode="list"
                        />
                      </div>
                    );
                  }}
                />
              ) : (
                <div className="space-y-2">
                  {filteredAndSortedContacts.map((contact, index) => (
                    <SwipeableListItem
                      key={contact.id}
                      onDelete={() => setDeletingContact(contact)}
                      onArchive={() => updateContact(contact.id, { relationship_stage: 'churned' })}
                    >
                      <ContactCardWithContext
                        contact={contact}
                        companyName={getCompanyName(contact.company_id)}
                        lastInteraction={getLastInteractionDate(contact.id)}
                        index={index}
                        isSelected={selectedIds.has(contact.id)}
                        isHighlighted={selectedIndex === index}
                        selectionMode={selectionMode}
                        onSelect={handleSelect}
                        onEdit={setEditingContact}
                        onDelete={setDeletingContact}
                        onUpdate={updateContact}
                        viewMode="list"
                      />
                    </SwipeableListItem>
                  ))}
                </div>
              )
            )}

            {filteredAndSortedContacts.length === 0 && !loading && (
              searchTerm || Object.keys(activeFilters).length > 0 ? (
                <SearchEmptyState
                  searchTerm={searchTerm || 'filtros ativos'}
                  onClearSearch={() => {
                    setSearchTerm('');
                    setActiveFilters({});
                  }}
                  entityName="contatos"
                />
              ) : (
                <EmptyState
                  illustration="contacts"
                  title="Sua rede de contatos começa aqui"
                  description="Adicione seu primeiro contato para começar a gerenciar seus relacionamentos profissionais de forma inteligente."
                  actions={[
                    {
                      label: 'Adicionar Contato',
                      onClick: () => setIsFormOpen(true),
                      icon: UserPlus,
                    },
                    {
                      label: 'Importar CSV',
                      onClick: () => {},
                      variant: 'outline',
                      icon: Upload,
                    },
                  ]}
                  tips={[
                    'Adicione informações como cargo e empresa para contextualizar',
                    'Use tags para organizar seus contatos por projeto ou área',
                    'O perfil DISC ajuda a personalizar sua comunicação',
                  ]}
                />
              )
            )}
          </>
        )}
        </PullToRefresh>
      </div>

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedIds={Array.from(selectedIds)}
        totalCount={filteredAndSortedContacts.length}
        entityType="contacts"
        onSelectAll={handleSelectAll}
        onClearSelection={() => setSelectedIds(new Set())}
        onDelete={handleBulkDelete}
        onAddTag={handleBulkAddTag}
      />

      {/* Create Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <ContactForm
            companies={companies}
            onSubmit={handleCreate}
            onCancel={() => setIsFormOpen(false)}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingContact} onOpenChange={(open) => !open && setEditingContact(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <ContactForm
            contact={editingContact}
            companies={companies}
            onSubmit={handleUpdate}
            onCancel={() => setEditingContact(null)}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingContact} onOpenChange={(open) => !open && setDeletingContact(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir contato?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{deletingContact?.first_name} {deletingContact?.last_name}</strong>? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Floating Quick Actions */}
      <FloatingQuickActions />
      
      {/* Keyboard Shortcuts Dialog */}
      <KeyboardShortcutsCheatsheet 
        open={showShortcuts} 
        onOpenChange={setShowShortcuts} 
      />
    </AppLayout>
    
    {/* Mini Celebration */}
    {celebration.MiniCelebrationComponent}
    </>
  );
};

export default Contatos;
