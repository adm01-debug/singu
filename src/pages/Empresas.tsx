import { useState, useMemo, useCallback, useEffect, useRef, startTransition } from 'react';
import { cn } from '@/lib/utils';
import { hapticSuccess, hapticHeavy } from '@/lib/haptics';
import { useSuccessCelebration } from '@/hooks/useSuccessCelebration';
import { usePageTitle } from '@/hooks/usePageTitle';
import { toast } from 'sonner';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Search,
  Plus,
  CheckSquare,
  X,
} from 'lucide-react';
import { CompaniesGridSkeleton } from '@/components/skeletons/PageSkeletons';
import { CompaniesStatsBar } from '@/components/companies/CompaniesStatsBar';
import { EmptyState, SearchEmptyState } from '@/components/ui/empty-state';
import { AppLayout } from '@/components/layout/AppLayout';
import { FloatingQuickActions } from '@/components/quick-actions/FloatingQuickActions';
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
import { CompanyForm } from '@/components/forms/CompanyForm';
import { CompanyCardWithContext } from '@/components/company-card/CompanyCardWithContext';
import { CompanyListItem } from '@/components/companies/CompanyListItem';
import { CompaniesTableView } from '@/components/companies/CompaniesTableView';
import { ViewModeSwitcher, type ViewMode, type GridColumns } from '@/components/ui/view-mode-switcher';
import { BulkActionsBar } from '@/components/bulk-actions/BulkActionsBar';
import { SearchPresetsMenu } from '@/components/search/SearchPresetsMenu';
import { useCompanies, type Company } from '@/hooks/useCompanies';
import { useContacts } from '@/hooks/useContacts';
import { useInteractions } from '@/hooks/useInteractions';
import { useCompanyFilterOptions, companySortOptions } from '@/hooks/useCompanyFilterOptions';
import type { SearchPreset } from '@/hooks/useSearchPresets';
import { useListNavigation, useKeyboardShortcutsEnhanced } from '@/hooks/useKeyboardShortcutsEnhanced';
import { useCompanyGroups, GroupHeader, useGroupExpansion } from '@/components/companies/CompanyGrouping';
import { CompaniesInlineMap } from '@/components/companies/CompaniesInlineMap';

const Empresas = () => {
  usePageTitle('Empresas');
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { companies, loading, totalCount, searchTerm: activeSearch, setSearchTerm: triggerSearch, createCompany, updateCompany, deleteCompany } = useCompanies();

  // Defer secondary data — only load after companies are ready (non-blocking)
  const [secondaryReady, setSecondaryReady] = useState(false);
  useEffect(() => {
    if (!loading && companies.length > 0) {
      const t = setTimeout(() => setSecondaryReady(true), 300);
      return () => clearTimeout(t);
    }
  }, [loading, companies.length]);

  const { contacts } = useContacts(undefined, { enabled: secondaryReady });
  const { interactions } = useInteractions(undefined, undefined, { enabled: secondaryReady });
  const dynamicFilters = useCompanyFilterOptions({ enabled: secondaryReady });

  // Pre-compute contact counts and last interaction per company (non-blocking)
  const companyMetrics = useMemo(() => {
    const contactCountMap = new Map<string, number>();
    const lastInteractionMap = new Map<string, number>();
    
    if (contacts.length > 0) {
      for (const c of contacts) {
        if (c.company_id) {
          contactCountMap.set(c.company_id, (contactCountMap.get(c.company_id) || 0) + 1);
        }
      }
    }
    
    if (interactions.length > 0) {
      const now = Date.now();
      for (const i of interactions) {
        if (i.company_id) {
          const days = Math.floor((now - new Date(i.created_at).getTime()) / (1000 * 60 * 60 * 24));
          const current = lastInteractionMap.get(i.company_id);
          if (current === undefined || days < current) {
            lastInteractionMap.set(i.company_id, days);
          }
        }
      }
    }
    
    return { contactCountMap, lastInteractionMap };
  }, [contacts, interactions]);

  const [localSearch, setLocalSearch] = useState(() => searchParams.get('q') || '');
  const [viewMode, setViewMode] = useState<ViewMode>(() => (searchParams.get('view') as ViewMode) || 'grid');
  const [gridColumns, setGridColumns] = useState<GridColumns>(() => {
    const c = searchParams.get('cols');
    return c ? (Number(c) as GridColumns) : 3;
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [deletingCompany, setDeletingCompany] = useState<Company | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Progressive rendering — show 60 initially, load 60 more as user scrolls
  const RENDER_BATCH = 60;
  const [visibleCount, setVisibleCount] = useState(RENDER_BATCH);
  const sentinelRef = useRef<HTMLDivElement>(null);
  
  // Selection state for bulk actions
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Advanced filters state — restore from URL
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
    if (localSearch) params.set('q', localSearch);
    if (viewMode !== 'grid') params.set('view', viewMode);
    if (Object.keys(activeFilters).length > 0) {
      params.set('filters', encodeURIComponent(JSON.stringify(activeFilters)));
    }
    if (sortBy !== 'updated_at') params.set('sort', sortBy);
    if (sortOrder !== 'desc') params.set('order', sortOrder);
    if (gridColumns !== 3) params.set('cols', String(gridColumns));
    setSearchParams(params, { replace: true });
  }, [localSearch, viewMode, activeFilters, sortBy, sortOrder, gridColumns, setSearchParams]);

  // Debounced server-side search
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const isSearching = localSearch.length > 0;

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      triggerSearch(localSearch);
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [localSearch]);

  const clearSearch = useCallback(() => {
    setLocalSearch('');
    triggerSearch('');
  }, [triggerSearch]);

  const filteredAndSortedCompanies = useMemo(() => {
    let result = companies.filter(company => {
      for (const [key, values] of Object.entries(activeFilters)) {
        if (values.length === 0) continue;

        const companyValue = company[key as keyof Company];

        // Boolean fields: null/undefined treated as 'false'
        if (key === 'is_customer' || key === 'is_supplier' || key === 'is_carrier' || key === 'is_matriz') {
          const boolStr = String(companyValue ?? false);
          if (!values.includes(boolStr)) return false;
          continue;
        }

        if (typeof companyValue === 'boolean') {
          if (!values.includes(String(companyValue))) return false;
          continue;
        }

        // Null/empty → exclude from filtered results
        if (companyValue === null || companyValue === undefined || companyValue === '') {
          return false;
        }

        if (!values.includes(String(companyValue))) return false;
      }
      return true;
    });

    result.sort((a, b) => {
      let aVal = a[sortBy as keyof Company];
      let bVal = b[sortBy as keyof Company];
      if (aVal === null || aVal === undefined) aVal = '';
      if (bVal === null || bVal === undefined) bVal = '';
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        const comparison = aVal.localeCompare(bVal, 'pt-BR');
        return sortOrder === 'asc' ? comparison : -comparison;
      }
      return 0;
    });

    return result;
  }, [companies, activeFilters, sortBy, sortOrder]);

  // Reset visible count when filter/sort changes
  useEffect(() => {
    setVisibleCount(RENDER_BATCH);
  }, [activeFilters, sortBy, sortOrder, activeSearch]);

  // Intersection observer for progressive loading
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
  }, [filteredAndSortedCompanies.length]);

  // Slice for rendering
  const visibleCompanies = useMemo(
    () => filteredAndSortedCompanies.slice(0, visibleCount),
    [filteredAndSortedCompanies, visibleCount]
  );
  const hasMore = visibleCount < filteredAndSortedCompanies.length;

  // Keyboard navigation
  const { selectedIndex, setSelectedIndex } = useListNavigation(filteredAndSortedCompanies as Array<{ id: string }>, {
    onOpen: (company) => navigate(`/empresas/${company.id}`),
    onSelect: () => {},
  });

  useKeyboardShortcutsEnhanced();

  // Company grouping
  const { groups, hasGroups } = useCompanyGroups(filteredAndSortedCompanies);
  const { toggle: toggleGroup, isExpanded: isGroupExpanded } = useGroupExpansion(groups);

  const { celebrate } = useSuccessCelebration();

  const handleCreate = async (data: Parameters<typeof createCompany>[0]) => {
    setIsSubmitting(true);
    const result = await createCompany(data);
    setIsSubmitting(false);
    if (result) {
      setIsFormOpen(false);
      hapticSuccess();
      if (companies.length === 0) {
        celebrate('confetti');
      }
    }
  };

  const handleUpdate = async (data: Parameters<typeof updateCompany>[1]) => {
    if (!editingCompany) return;
    setIsSubmitting(true);
    const result = await updateCompany(editingCompany.id, data);
    setIsSubmitting(false);
    if (result) {
      setEditingCompany(null);
    }
  };

  const handleDelete = async () => {
    if (!deletingCompany) return;
    hapticHeavy();
    await deleteCompany(deletingCompany.id);
    setDeletingCompany(null);
  };

  // Selection handlers
  const handleSelect = (id: string, selected: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (selected) next.add(id); else next.delete(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredAndSortedCompanies.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAndSortedCompanies.map(c => c.id)));
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    for (const id of ids) {
      await deleteCompany(id);
    }
    setSelectedIds(new Set());
    setSelectionMode(false);
    toast.success(`${ids.length} empresa${ids.length > 1 ? 's' : ''} excluída${ids.length > 1 ? 's' : ''}`);
  };

  const handleBulkAddTag = async (ids: string[], tag: string) => {
    for (const id of ids) {
      const company = companies.find(c => c.id === id);
      if (company) {
        const currentTags = company.tags || [];
        if (!currentTags.includes(tag)) {
          await updateCompany(id, { tags: [...currentTags, tag] });
        }
      }
    }
    setSelectedIds(new Set());
    toast.success(`Tag "${tag}" adicionada a ${ids.length} empresa${ids.length > 1 ? 's' : ''}`);
  };

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    if (selectionMode) {
      setSelectedIds(new Set());
    }
  };

  const handleTableSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  return (
    <AppLayout>
      <Header 
        title="Empresas" 
        subtitle={filteredAndSortedCompanies.length === (activeSearch ? totalCount : companies.length) ? `${activeSearch ? totalCount : companies.length} empresas` : `${filteredAndSortedCompanies.length} de ${activeSearch ? totalCount : companies.length} empresas`}
        showAddButton
        addButtonLabel="Nova Empresa"
        onAddClick={() => setIsFormOpen(true)}
        hideBack
      />

      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Stats Summary Bar */}
        <CompaniesStatsBar companies={companies} contactCountMap={companyMetrics.contactCountMap} />
        
        {/* Inline Map */}
        <CompaniesInlineMap companies={filteredAndSortedCompanies} />

        {/* Search, View Mode and Selection Toggle */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar empresa, segmento ou cidade..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className={`pl-10 ${isSearching ? 'pr-10' : ''}`}
            />
            {isSearching && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={clearSearch}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <SearchPresetsMenu
              context="companies"
              buttonLabel="Listas"
              title="Listas salvas"
              description="Salve combinações de filtros para segmentar empresas em um clique."
              currentFilters={activeFilters}
              currentSortBy={sortBy}
              currentSortOrder={sortOrder}
              currentSearchTerm={localSearch}
              onApplyPreset={(preset: SearchPreset) => {
                setActiveFilters(preset.filters);
                setSortBy(preset.sortBy);
                setSortOrder(preset.sortOrder);
                const nextSearch = preset.searchTerm || '';
                setLocalSearch(nextSearch);
                triggerSearch(nextSearch);
              }}
            />
            <ViewModeSwitcher value={viewMode} onChange={setViewMode} gridColumns={gridColumns} onGridColumnsChange={setGridColumns} />
            
            <Button
              variant={selectionMode ? 'default' : 'outline'}
              size="sm"
              onClick={toggleSelectionMode}
              className="gap-2"
            >
              <CheckSquare className="w-4 h-4" />
              {selectionMode ? 'Cancelar' : 'Selecionar'}
            </Button>
          </div>
        </div>

        {/* Advanced Filters */}
        <AdvancedFilters
          filters={dynamicFilters}
          sortOptions={companySortOptions}
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
        <RecentlyViewedSection type="company" />

        {/* Loading State */}
        {loading ? (
          <CompaniesGridSkeleton />
        ) : (
          <>
            {/* Companies Grid */}
            {viewMode === 'grid' && (
              <div className="space-y-4">
                {(hasGroups ? groups : [{ name: '', companies: visibleCompanies }]).map((group) => {
                  const expanded = isGroupExpanded(group.name);
                  let indexOffset = 0;
                  // Calculate offset for highlighting
                  for (const g of groups) {
                    if (g.name === group.name) break;
                    indexOffset += g.companies.length;
                  }

                  return (
                    <div key={group.name || '__ungrouped'}>
                      {group.name && (
                        <GroupHeader
                          name={group.name}
                          count={group.companies.length}
                          isExpanded={expanded}
                          onToggle={() => toggleGroup(group.name)}
                        />
                      )}
                      {expanded && (
                        <div className={cn(
                          `grid grid-cols-1 gap-4`,
                          gridColumns === 2 ? 'md:grid-cols-2' :
                          gridColumns === 3 ? 'md:grid-cols-2 lg:grid-cols-3' :
                          gridColumns === 4 ? 'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' :
                          gridColumns === 5 ? 'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5' :
                          'md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6',
                          group.name && 'mt-2 ml-2 border-l-2 border-primary/20 pl-3'
                        )}>
                          {group.companies.map((company, i) => (
                            <CompanyCardWithContext
                              key={company.id}
                              company={company}
                              index={indexOffset + i}
                              isSelected={selectedIds.has(company.id)}
                              isHighlighted={selectedIndex === indexOffset + i}
                              selectionMode={selectionMode}
                              contactCount={companyMetrics.contactCountMap.get(company.id) || 0}
                              lastInteractionDays={companyMetrics.lastInteractionMap.get(company.id) ?? null}
                              compact={gridColumns >= 5}
                              onSelect={handleSelect}
                              onEdit={setEditingCompany}
                              onDelete={setDeletingCompany}
                              onUpdate={updateCompany}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Companies List */}
            {viewMode === 'list' && (
              <div className="space-y-2">
                {visibleCompanies.map((company) => (
                  <CompanyListItem
                    key={company.id}
                    company={company}
                    contactCount={companyMetrics.contactCountMap.get(company.id) || 0}
                    lastInteractionDays={companyMetrics.lastInteractionMap.get(company.id) ?? null}
                    isSelected={selectedIds.has(company.id)}
                    selectionMode={selectionMode}
                    onSelect={handleSelect}
                  />
                ))}
              </div>
            )}

            {/* Companies Table */}
            {viewMode === 'table' && (
              <CompaniesTableView
                companies={visibleCompanies}
                selectionMode={selectionMode}
                selectedIds={selectedIds}
                onSelect={handleSelect}
                contactCountMap={companyMetrics.contactCountMap}
                lastInteractionMap={companyMetrics.lastInteractionMap}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSortChange={handleTableSort}
              />
            )}

            {filteredAndSortedCompanies.length === 0 && !loading && (
              isSearching || Object.keys(activeFilters).length > 0 ? (
                <SearchEmptyState
                  searchTerm={localSearch || 'filtros ativos'}
                  onClearSearch={() => {
                    clearSearch();
                    setActiveFilters({});
                  }}
                  entityName="empresas"
                />
              ) : (
                <EmptyState
                  illustration="companies"
                  title="Organize suas contas corporativas"
                  description="Cadastre empresas para vincular contatos e ter uma visão completa dos seus relacionamentos B2B."
                  actions={[
                    {
                      label: 'Cadastrar Empresa',
                      onClick: () => setIsFormOpen(true),
                      icon: Plus,
                    },
                  ]}
                  tips={[
                    'Adicione dados como segmento e porte para análises mais precisas',
                    'Vincule contatos às empresas para contexto nas interações',
                    'Use tags para agrupar empresas por oportunidade ou projeto',
                  ]}
                />
              )
            )}

            {/* Progressive loading sentinel */}
            {hasMore && (
              <div ref={sentinelRef} className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                Carregando mais {Math.min(RENDER_BATCH, filteredAndSortedCompanies.length - visibleCount)} empresas...
              </div>
            )}
          </>
        )}
      </div>

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedIds={Array.from(selectedIds)}
        totalCount={filteredAndSortedCompanies.length}
        entityType="companies"
        onSelectAll={handleSelectAll}
        onClearSelection={() => setSelectedIds(new Set())}
        onDelete={handleBulkDelete}
        onAddTag={handleBulkAddTag}
      />

      {/* Create Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
          <CompanyForm
            onSubmit={handleCreate}
            onCancel={() => setIsFormOpen(false)}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingCompany} onOpenChange={(open) => !open && setEditingCompany(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
          <CompanyForm
            company={editingCompany}
            onSubmit={handleUpdate}
            onCancel={() => setEditingCompany(null)}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingCompany} onOpenChange={(open) => !open && setDeletingCompany(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir empresa?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{deletingCompany?.name}</strong>? 
              Esta ação não pode ser desfeita e todos os dados relacionados serão perdidos.
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
    </AppLayout>
  );
};

export default Empresas;
