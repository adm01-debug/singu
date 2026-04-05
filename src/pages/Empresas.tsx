import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { hapticSuccess, hapticHeavy } from '@/lib/haptics';
import { useSuccessCelebration } from '@/hooks/useSuccessCelebration';
import { usePageTitle } from '@/hooks/usePageTitle';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { 
  Search,
  TrendingUp,
  TrendingDown,
  Minus,
  Factory,
  Briefcase,
  ShoppingCart,
  Landmark,
  Cpu,
  HeartPulse,
  GraduationCap,
  Plus,
  CheckSquare,
  X
} from 'lucide-react';
import { CompaniesGridSkeleton } from '@/components/skeletons/PageSkeletons';
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
import { CompanyForm } from '@/components/forms/CompanyForm';
import { CompanyCardWithContext } from '@/components/company-card/CompanyCardWithContext';
import { BulkActionsBar } from '@/components/bulk-actions/BulkActionsBar';
import { useCompanies, type Company } from '@/hooks/useCompanies';
import { useContacts } from '@/hooks/useContacts';
import { useInteractions } from '@/hooks/useInteractions';
import { useListNavigation, useKeyboardShortcutsEnhanced } from '@/hooks/useKeyboardShortcutsEnhanced';

const filterConfigs: FilterConfig[] = [
  {
    key: 'is_customer',
    label: 'Tipo',
    multiple: false,
    options: [
      { value: 'true', label: 'Clientes' },
      { value: 'false', label: 'Prospects' },
    ],
  },
  {
    key: 'industry',
    label: 'Segmento',
    multiple: true,
    options: [
      { value: 'Tecnologia', label: 'Tecnologia', icon: Cpu },
      { value: 'Saúde', label: 'Saúde', icon: HeartPulse },
      { value: 'Educação', label: 'Educação', icon: GraduationCap },
      { value: 'Varejo', label: 'Varejo', icon: ShoppingCart },
      { value: 'Financeiro', label: 'Financeiro', icon: Landmark },
      { value: 'Indústria', label: 'Indústria', icon: Factory },
      { value: 'Serviços', label: 'Serviços', icon: Briefcase },
    ],
  },
  {
    key: 'financial_health',
    label: 'Saúde Financeira',
    multiple: false,
    options: [
      { value: 'excellent', label: 'Excelente', icon: TrendingUp },
      { value: 'good', label: 'Boa', icon: TrendingUp },
      { value: 'average', label: 'Regular', icon: Minus },
      { value: 'poor', label: 'Ruim', icon: TrendingDown },
      { value: 'unknown', label: 'Desconhecida' },
    ],
  },
  {
    key: 'state',
    label: 'Estado',
    multiple: true,
    options: [
      { value: 'SP', label: 'São Paulo' },
      { value: 'RJ', label: 'Rio de Janeiro' },
      { value: 'MG', label: 'Minas Gerais' },
      { value: 'RS', label: 'Rio Grande do Sul' },
      { value: 'PR', label: 'Paraná' },
      { value: 'SC', label: 'Santa Catarina' },
      { value: 'BA', label: 'Bahia' },
      { value: 'DF', label: 'Distrito Federal' },
    ],
  },
];

const sortOptions: SortOption[] = [
  { value: 'name', label: 'Nome' },
  { value: 'created_at', label: 'Data de Criação' },
  { value: 'updated_at', label: 'Última Atualização' },
  { value: 'industry', label: 'Segmento' },
];

const Empresas = () => {
  usePageTitle('Empresas');
  const navigate = useNavigate();
  const { companies, loading, totalCount, searchTerm: activeSearch, setSearchTerm: triggerSearch, createCompany, updateCompany, deleteCompany } = useCompanies();
  const { contacts } = useContacts();
  const { interactions } = useInteractions();

  // Pre-compute contact counts and last interaction per company
  const companyMetrics = useMemo(() => {
    const contactCountMap = new Map<string, number>();
    const lastInteractionMap = new Map<string, number>();
    
    for (const c of contacts) {
      if (c.company_id) {
        contactCountMap.set(c.company_id, (contactCountMap.get(c.company_id) || 0) + 1);
      }
    }
    
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
    
    return { contactCountMap, lastInteractionMap };
  }, [contacts, interactions]);
  const [localSearch, setLocalSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [deletingCompany, setDeletingCompany] = useState<Company | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Selection state for bulk actions
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Advanced filters state
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  const [sortBy, setSortBy] = useState('updated_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

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
    // Start with server-side search results
    let result = companies.filter(company => {
      // Advanced filters
      for (const [key, values] of Object.entries(activeFilters)) {
        if (values.length === 0) continue;
        
        const companyValue = company[key as keyof Company];
        // Handle boolean fields like is_customer (null/false → "false")
        const strValue = typeof companyValue === 'boolean' ? String(companyValue) : (companyValue ? String(companyValue) : 'false');
        if (!values.includes(strValue)) {
          return false;
        }
      }

      return true;
    });

    // Sort
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

  // Keyboard navigation
  const { selectedIndex, setSelectedIndex } = useListNavigation(filteredAndSortedCompanies, {
    onOpen: (company) => navigate(`/empresas/${company.id}`),
    onSelect: () => {},
  });

  useKeyboardShortcutsEnhanced();

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
      if (selected) {
        next.add(id);
      } else {
        next.delete(id);
      }
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

  return (
    <AppLayout>
      <Header 
        title="Empresas" 
        subtitle={filteredAndSortedCompanies.length === companies.length ? `${companies.length} empresas` : `${filteredAndSortedCompanies.length} de ${companies.length} empresas`}
        showAddButton
        addButtonLabel="Nova Empresa"
        onAddClick={() => setIsFormOpen(true)}
      />

      <div className="p-6 space-y-6">
        {/* Search and Selection Toggle */}
        <div className="flex items-center justify-between gap-4">
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
            <AdvancedDataExporter entityType="companies" />
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
        <RecentlyViewedSection type="company" />

        {/* Loading State */}
        {loading ? (
          <CompaniesGridSkeleton />
        ) : (
          <>
            {/* Companies Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAndSortedCompanies.map((company, index) => (
                <CompanyCardWithContext
                  key={company.id}
                  company={company}
                  index={index}
                  isSelected={selectedIds.has(company.id)}
                  isHighlighted={selectedIndex === index}
                  selectionMode={selectionMode}
                  contactCount={companyMetrics.contactCountMap.get(company.id) || 0}
                  lastInteractionDays={companyMetrics.lastInteractionMap.get(company.id) ?? null}
                  onSelect={handleSelect}
                  onEdit={setEditingCompany}
                  onDelete={setDeletingCompany}
                  onUpdate={updateCompany}
                />
              ))}
            </div>

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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <CompanyForm
            onSubmit={handleCreate}
            onCancel={() => setIsFormOpen(false)}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingCompany} onOpenChange={(open) => !open && setEditingCompany(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
