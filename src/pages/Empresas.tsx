import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Users,
  MoreVertical,
  Search,
  Filter,
  Loader2
} from 'lucide-react';
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
import { CompanyForm } from '@/components/forms/CompanyForm';
import { useCompanies, type Company } from '@/hooks/useCompanies';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Empresas = () => {
  const { companies, loading, createCompany, updateCompany, deleteCompany } = useCompanies();
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [deletingCompany, setDeletingCompany] = useState<Company | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (company.industry && company.industry.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
        subtitle={`${companies.length} empresas cadastradas`}
        showAddButton
        addButtonLabel="Nova Empresa"
        onAddClick={() => setIsFormOpen(true)}
      />

      <div className="p-6 space-y-6">
        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar empresa ou segmento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" />
            Filtros
          </Button>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Companies Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCompanies.map((company, index) => (
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
                              <p className="text-sm text-muted-foreground">{company.industry || 'Sem segmento'}</p>
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
              ))}
            </div>

            {filteredCompanies.length === 0 && !loading && (
              <div className="text-center py-12">
                <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {searchTerm ? 'Nenhuma empresa encontrada' : 'Nenhuma empresa cadastrada'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? 'Tente ajustar sua busca.' : 'Comece adicionando sua primeira empresa.'}
                </p>
                {!searchTerm && (
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
