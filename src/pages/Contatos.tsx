import { useState, useMemo, useCallback, useEffect, useRef, startTransition, lazy, Suspense } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { SEOHead } from '@/components/seo/SEOHead';
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
  Database,
  MoreHorizontal,
  Download,
  Bookmark,
  Rows3,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AdvancedFilters, type FilterConfig, type SortOption } from '@/components/filters/AdvancedFilters';
import { ContactForm } from '@/components/forms/ContactForm';
import { ContactCardWithContext } from '@/components/contact-card/ContactCardWithContext';
import { ContactsStatsBar } from '@/components/contacts/ContactsStatsBar';
import { BulkActionsBar } from '@/components/bulk-actions/BulkActionsBar';
import { KeyboardShortcutsCheatsheet } from '@/components/keyboard/KeyboardShortcutsCheatsheet';
import { useAccessibleToast } from '@/hooks/useAccessibleToast';
import { useFuzzySearch } from '@/hooks/useFuzzySearch';
import { useContacts, type Contact } from '@/hooks/useContacts';
import { BulkImportDialog } from '@/components/import/BulkImportDialog';
import { useCompanies } from '@/hooks/useCompanies';
import { useInteractions } from '@/hooks/useInteractions';
import { useMiniCelebration } from '@/components/celebrations/MiniCelebration';
import { useListNavigation, useKeyboardShortcutsEnhanced } from '@/hooks/useKeyboardShortcutsEnhanced';
import { SearchPresetsMenu } from '@/components/search/SearchPresetsMenu';
import type { SearchPreset } from '@/hooks/useSearchPresets';
import { logger } from "@/lib/logger";
import { useTableDensity } from '@/hooks/useTableDensity';
import { hapticHeavy, hapticSuccess } from '@/lib/haptics';
import { useSuccessCelebration } from '@/hooks/useSuccessCelebration';
import { useActivityLogger } from '@/hooks/useActivityLogger';

import { ViewModeSwitcher, type ViewMode, type GridColumns } from '@/components/ui/view-mode-switcher';
import { ContactsTableView } from '@/components/contacts/ContactsTableView';

const DuplicateContactsPanel = lazy(() => import('@/components/contacts/DuplicateContactsPanel'));

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
  usePageTitle('Contatos');
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { contacts, loading, createContact, updateContact, deleteContact, fetchContacts } = useContacts();
  const { companies } = useCompanies();
  const { interactions } = useInteractions();
  
  // Initialize state from URL params
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('q') || '');
  const [viewMode, setViewMode] = useState<ViewMode>(() => (searchParams.get('view') as ViewMode) || 'grid');
  const [gridColumns, setGridColumns] = useState<GridColumns>(() => {
    const c = searchParams.get('cols');
    return c ? (Number(c) as GridColumns) : 3;
  });
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
  
  // Table density
  const { density, toggle: toggleDensity } = useTableDensity();
  const { celebrate } = useSuccessCelebration();
  const { logActivity } = useActivityLogger();
  
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
    if (gridColumns !== 3) params.set('cols', String(gridColumns));
    
    setSearchParams(params, { replace: true });
  }, [searchTerm, viewMode, activeFilters, sortBy, sortOrder, gridColumns, setSearchParams]);

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

  // Progressive rendering for grid view
  const RENDER_BATCH = 60;
  const [visibleCount, setVisibleCount] = useState(RENDER_BATCH);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setVisibleCount(RENDER_BATCH);
  }, [activeFilters, sortBy, sortOrder, searchTerm]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          startTransition(() => {
            setVisibleCount(prev => prev + RENDER_BATCH);
          });
        }
      },
      { rootMargin: '400px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [filteredAndSortedContacts.length]);

  const visibleContacts = useMemo(
    () => filteredAndSortedContacts.slice(0, visibleCount),
    [filteredAndSortedContacts, visibleCount]
  );
  const hasMoreContacts = visibleCount < filteredAndSortedContacts.length;

  // Keyboard navigation
  const { selectedIndex, setSelectedIndex } = useListNavigation(filteredAndSortedContacts, {
    onOpen: (contact) => navigate(`/contatos/${contact.id}`),
    onSelect: () => {},
  });

  useKeyboardShortcutsEnhanced();

  const companyNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of companies) {
      map.set(c.id, c.name);
    }
    return map;
  }, [companies]);

  const lastInteractionMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const i of interactions) {
      const existing = map.get(i.contact_id);
      if (!existing || i.created_at > existing) {
        map.set(i.contact_id, i.created_at);
      }
    }
    return map;
  }, [interactions]);

  const getCompanyName = useCallback((companyId: string | null) => {
    if (!companyId) return null;
    return companyNameMap.get(companyId) || null;
  }, [companyNameMap]);

  const getLastInteractionDate = useCallback((contactId: string): string | null => {
    return lastInteractionMap.get(contactId) || null;
  }, [lastInteractionMap]);

  const handleCreate = async (data: Parameters<typeof createContact>[0], event?: React.MouseEvent) => {
    setIsSubmitting(true);
    const result = await createContact(data);
    setIsSubmitting(false);
    if (result) {
      setIsFormOpen(false);
      hapticSuccess();
      logActivity({ type: 'created', entityType: 'contact', entityId: result.id || '', entityName: `${data.first_name} ${data.last_name}`.trim() });
      // First contact celebration
      if (contacts.length === 0) {
        celebrate('confetti');
      }
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
    hapticHeavy();
    
    // Contact is removed from UI instantly by optimistic deleteContact
    const success = await deleteContact(contactToDelete.id);
    if (success) {
      accessibleToast.success(`${contactToDelete.first_name} excluído com sucesso`);
      logActivity({ type: 'deleted', entityType: 'contact', entityId: contactToDelete.id, entityName: contactToDelete.first_name });
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
    accessibleToast.success(`Tag "${tag}" adicionada a ${ids.length} contato${ids.length > 1 ? 's' : ''}`);
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
    } catch (err: unknown) {
      logger.error('Enrichment error:', err);
      toast.error('Erro ao enriquecer contatos: ' + (err instanceof Error ? err.message : 'Erro desconhecido'));
    } finally {
      setIsEnriching(false);
    }
  };

  return (
    <>
    <AppLayout>
      <SEOHead title="Contatos" description="Gestão inteligente de contatos e relacionamentos" />
      <Header 
        title="Contatos" 
        subtitle={`${filteredAndSortedContacts.length} de ${contacts.length} pessoas`}
        showAddButton
        addButtonLabel="Novo Contato"
        onAddClick={() => setIsFormOpen(true)}
        hideBack
      />

      <div className="p-4 md:p-6 space-y-5">
        {/* Duplicate Contacts Alert */}
        <Suspense fallback={null}>
          <DuplicateContactsPanel />
        </Suspense>
        {/* Stats Summary Bar */}
        <ContactsStatsBar contacts={contacts} />
        {/* Search and View Toggle */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" aria-hidden="true" />
            <Input
              placeholder="Buscar por nome, cargo ou email..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 transition-shadow focus-visible:shadow-[0_0_0_3px_hsl(var(--primary)/0.15)]"
              aria-label="Buscar contatos"
            />
          </div>
          <div className="flex items-center gap-2">
            {/* Primary actions always visible */}
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
            <BulkImportDialog entityType="contacts" />
            <Button
              variant={selectionMode ? 'default' : 'outline'}
              size="sm"
              onClick={toggleSelectionMode}
              className="gap-2"
            >
              <CheckSquare className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">{selectionMode ? 'Cancelar' : 'Selecionar'}</span>
            </Button>
            <ViewModeSwitcher value={viewMode} onChange={setViewMode} gridColumns={gridColumns} onGridColumnsChange={setGridColumns} />

            {/* Enriquecer e Exportar removidos — acesso restrito a admin master */}
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
            {/* Contacts Grid */}
            {viewMode === 'grid' && (
              <>
                <div className={`grid grid-cols-1 gap-5 ${
                  gridColumns === 2 ? 'md:grid-cols-2' :
                  gridColumns === 3 ? 'md:grid-cols-2 xl:grid-cols-3' :
                  gridColumns === 4 ? 'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' :
                  gridColumns === 5 ? 'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5' :
                  'md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6'
                }`}>
                  {visibleContacts.map((contact, index) => (
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
                {hasMoreContacts && (
                  <div ref={sentinelRef} className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                    Carregando mais contatos...
                  </div>
                )}
              </>
            )}

            {/* Contacts List */}
            {viewMode === 'list' && (
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
                  rowComponent={({ index, style, ...props }) => {
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

            {/* Contacts Table */}
            {viewMode === 'table' && (
              <ContactsTableView
                contacts={filteredAndSortedContacts}
                selectionMode={selectionMode}
                selectedIds={selectedIds}
                onSelect={handleSelect}
                getCompanyName={getCompanyName}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSortChange={(field) => {
                  if (sortBy === field) {
                    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortBy(field);
                    setSortOrder('asc');
                  }
                }}
              />
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
