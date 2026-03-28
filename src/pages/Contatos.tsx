import { useState, useMemo, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { sortArray } from '@/lib/sorting-utils';
import { AppLayout } from '@/components/layout/AppLayout';
import { FloatingQuickActions } from '@/components/quick-actions/FloatingQuickActions';
import { RecentlyViewedSection } from '@/components/recently-viewed/RecentlyViewedSection';
import { Header } from '@/components/layout/Header';
import { AdvancedFilters } from '@/components/filters/AdvancedFilters';
import { BulkActionsBar } from '@/components/bulk-actions/BulkActionsBar';
import { useAriaLiveRegion } from '@/components/feedback/AriaLiveRegion';
import { useFuzzySearch } from '@/hooks/useFuzzySearch';
import { useContacts, type Contact } from '@/hooks/useContacts';
import { useCompanies } from '@/hooks/useCompanies';
import { useInteractions } from '@/hooks/useInteractions';
import { useMiniCelebration } from '@/components/celebrations/MiniCelebration';
import { useListNavigation, useKeyboardShortcutsEnhanced } from '@/hooks/useKeyboardShortcutsEnhanced';
import { logger } from '@/lib/logger';

import {
  ContatosSearchBar,
  ContatosContactList,
  ContatosDialogs,
  filterConfigs,
  sortOptions,
} from '@/components/contatos';
import type { SearchPreset } from '@/hooks/useSearchPresets';

type ViewMode = 'grid' | 'list';

const Contatos = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { contacts, loading, createContact, updateContact, deleteContact } = useContacts();
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

  // Accessibility announcements
  const { announce } = useAriaLiveRegion();

  // Selection state for bulk actions
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Mini celebration hook
  const celebration = useMiniCelebration();

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
    let result = searchTerm ? fuzzyResults : contacts;

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

  const lastInteractionMap = useMemo(() => {
    const map = new Map<string, string>();
    const sorted = [...interactions].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    for (const i of sorted) {
      if (i.contact_id && !map.has(i.contact_id)) {
        map.set(i.contact_id, i.created_at);
      }
    }
    return map;
  }, [interactions]);

  const getLastInteractionDate = useCallback((contactId: string): string | null => {
    return lastInteractionMap.get(contactId) || null;
  }, [lastInteractionMap]);

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

    toast.promise(
      deleteContact(contactToDelete.id),
      {
        loading: 'Excluindo contato...',
        success: `${contactToDelete.first_name} excluído com sucesso`,
        error: 'Falha ao excluir contato. Recarregue para restaurar.',
      }
    );
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
    } catch (err) {
      logger.error('Enrichment error:', err);
      toast.error('Erro ao enriquecer contatos: ' + (err instanceof Error ? err.message : 'Erro desconhecido'));
    } finally {
      setIsEnriching(false);
    }
  };

  const handleApplyPreset = useCallback((preset: SearchPreset) => {
    setActiveFilters(preset.filters);
    setSortBy(preset.sortBy);
    setSortOrder(preset.sortOrder);
    if (preset.searchTerm) handleSearchChange(preset.searchTerm);
  }, [handleSearchChange]);

  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
    setActiveFilters({});
  }, []);

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
        <ContatosSearchBar
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          selectionMode={selectionMode}
          onToggleSelectionMode={toggleSelectionMode}
          isEnriching={isEnriching}
          onEnrichContacts={handleEnrichContacts}
          onShowShortcuts={() => setShowShortcuts(true)}
          activeFilters={activeFilters}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onApplyPreset={handleApplyPreset}
        />

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

        <RecentlyViewedSection type="contact" />

        <ContatosContactList
          loading={loading}
          viewMode={viewMode}
          contacts={filteredAndSortedContacts}
          searchTerm={searchTerm}
          activeFilters={activeFilters}
          selectedIds={selectedIds}
          selectedIndex={selectedIndex}
          selectionMode={selectionMode}
          getCompanyName={getCompanyName}
          getLastInteractionDate={getLastInteractionDate}
          onSelect={handleSelect}
          onEdit={setEditingContact}
          onDelete={setDeletingContact}
          onUpdate={updateContact}
          onOpenCreateForm={() => setIsFormOpen(true)}
          onClearSearch={handleClearSearch}
        />
      </div>

      <BulkActionsBar
        selectedIds={Array.from(selectedIds)}
        totalCount={filteredAndSortedContacts.length}
        entityType="contacts"
        onSelectAll={handleSelectAll}
        onClearSelection={() => setSelectedIds(new Set())}
        onDelete={handleBulkDelete}
        onAddTag={handleBulkAddTag}
      />

      <ContatosDialogs
        isFormOpen={isFormOpen}
        onFormOpenChange={setIsFormOpen}
        editingContact={editingContact}
        onEditingContactChange={setEditingContact}
        deletingContact={deletingContact}
        onDeletingContactChange={setDeletingContact}
        companies={companies}
        isSubmitting={isSubmitting}
        onCreateSubmit={handleCreate}
        onEditSubmit={handleUpdate}
        onDeleteConfirm={handleDelete}
        showShortcuts={showShortcuts}
        onShowShortcutsChange={setShowShortcuts}
      />

      <FloatingQuickActions />
    </AppLayout>

    {celebration.MiniCelebrationComponent}
    </>
  );
};

export default Contatos;
