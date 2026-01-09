import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Users,
  MoreVertical,
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
  GraduationCap
} from 'lucide-react';
import { CompaniesGridSkeleton } from '@/components/skeletons/PageSkeletons';
import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { useCompanies, type Company } from '@/hooks/useCompanies';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const industryIcons: Record<string, React.ElementType> = {
  'Tecnologia': Cpu,
  'Saúde': HeartPulse,
  'Educação': GraduationCap,
  'Varejo': ShoppingCart,
  'Financeiro': Landmark,
  'Indústria': Factory,
  'Serviços': Briefcase,
};

const filterConfigs: FilterConfig[] = [
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
  const { companies, loading, createCompany, updateCompany, deleteCompany } = useCompanies();
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [deletingCompany, setDeletingCompany] = useState<Company | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Advanced filters state
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  const [sortBy, setSortBy] = useState('updated_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredAndSortedCompanies = useMemo(() => {
    let result = companies.filter(company => {
      // Text search
      const matchesSearch = 
        company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (company.industry && company.industry.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (company.city && company.city.toLowerCase().includes(searchTerm.toLowerCase()));
      
      if (!matchesSearch) return false;

      // Advanced filters
      for (const [key, values] of Object.entries(activeFilters)) {
        if (values.length === 0) continue;
        
        const companyValue = company[key as keyof Company];
        if (!companyValue || !values.includes(String(companyValue))) {
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
  }, [companies, searchTerm, activeFilters, sortBy, sortOrder]);

  const handleCreate = async (data: any) => {
    setIsSubmitting(true);
    const result = await createCompany(data);
    setIsSubmitting(false);
    if (result) {
      setIsFormOpen(false);
    }
  };

  const handleUpdate = async (data: any) => {
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
    await deleteCompany(deletingCompany.id);
    setDeletingCompany(null);
  };

  const openEdit = (company: Company) => {
    setEditingCompany(company);
  };

  return (
    <AppLayout>
      <Header 
        title="Empresas" 
        subtitle={`${filteredAndSortedCompanies.length} de ${companies.length} empresas`}
        showAddButton
        addButtonLabel="Nova Empresa"
        onAddClick={() => setIsFormOpen(true)}
      />

      <div className="p-6 space-y-6">
        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar empresa, segmento ou cidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
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

        {/* Loading State */}
        {loading ? (
          <CompaniesGridSkeleton />
        ) : (
          <>
            {/* Companies Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAndSortedCompanies.map((company, index) => {
                const IndustryIcon = industryIcons[company.industry || ''] || Building2;
                
                return (
                  <motion.div
                    key={company.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Link to={`/empresas/${company.id}`}>
                      <Card className="h-full card-hover group cursor-pointer">
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center text-white font-bold text-lg shadow-glow">
                                {company.name[0]}
                              </div>
                              <div>
                                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                  {company.name}
                                </h3>
                                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                  <IndustryIcon className="w-3.5 h-3.5" />
                                  <span>{company.industry || 'Sem segmento'}</span>
                                </div>
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                                <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => { e.preventDefault(); openEdit(company); }}>
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={(e) => { e.preventDefault(); setDeletingCompany(company); }}
                                  className="text-destructive"
                                >
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          <div className="space-y-2 mb-4">
                            {(company.city || company.state) && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <MapPin className="w-4 h-4 flex-shrink-0" />
                                <span>{[company.city, company.state].filter(Boolean).join(', ')}</span>
                              </div>
                            )}
                            {company.phone && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Phone className="w-4 h-4 flex-shrink-0" />
                                <span>{company.phone}</span>
                              </div>
                            )}
                            {company.email && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Mail className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate">{company.email}</span>
                              </div>
                            )}
                          </div>

                          {company.financial_health && company.financial_health !== 'unknown' && (
                            <div className="mb-4">
                              <Badge 
                                variant="outline" 
                                className={
                                  company.financial_health === 'excellent' || company.financial_health === 'good'
                                    ? 'border-green-500/50 text-green-600 bg-green-500/10'
                                    : company.financial_health === 'average'
                                    ? 'border-yellow-500/50 text-yellow-600 bg-yellow-500/10'
                                    : 'border-red-500/50 text-red-600 bg-red-500/10'
                                }
                              >
                                {company.financial_health === 'excellent' ? 'Excelente' :
                                 company.financial_health === 'good' ? 'Boa' :
                                 company.financial_health === 'average' ? 'Regular' :
                                 company.financial_health === 'poor' ? 'Ruim' : ''}
                              </Badge>
                            </div>
                          )}

                          {company.tags && company.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-4">
                              {company.tags.slice(0, 3).map(tag => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {company.tags.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{company.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-4 border-t border-border">
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <Users className="w-4 h-4" />
                              <span>--</span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(company.updated_at), { locale: ptBR, addSuffix: true })}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                );
              })}
            </div>

            {filteredAndSortedCompanies.length === 0 && !loading && (
              <div className="text-center py-12">
                <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {searchTerm || Object.keys(activeFilters).length > 0 
                    ? 'Nenhuma empresa encontrada' 
                    : 'Nenhuma empresa cadastrada'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || Object.keys(activeFilters).length > 0 
                    ? 'Tente ajustar seus filtros.' 
                    : 'Comece adicionando sua primeira empresa.'}
                </p>
                {!searchTerm && Object.keys(activeFilters).length === 0 && (
                  <Button onClick={() => setIsFormOpen(true)}>
                    <Building2 className="w-4 h-4 mr-2" />
                    Nova Empresa
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </div>

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
    </AppLayout>
  );
};

export default Empresas;
