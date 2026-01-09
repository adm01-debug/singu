import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Phone, 
  Mail, 
  MessageSquare,
  Building2,
  Search,
  Grid3X3,
  List,
  Linkedin,
  MoreVertical,
  UserCheck,
  UserX,
  Crown,
  Briefcase,
  ShoppingCart,
  User,
  UserPlus,
  Upload
} from 'lucide-react';
import { ContactsGridSkeleton, ContactsListSkeleton } from '@/components/skeletons/PageSkeletons';
import { EmptyState, SearchEmptyState } from '@/components/ui/empty-state';
import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RoleBadge } from '@/components/ui/role-badge';
import { RelationshipScore } from '@/components/ui/relationship-score';
import { SentimentIndicator } from '@/components/ui/sentiment-indicator';
import { DISCBadge } from '@/components/ui/disc-badge';
import { RelationshipStageBadge } from '@/components/ui/relationship-stage';
import { PriorityIndicator, PriorityBar } from '@/components/ui/priority-indicator';
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
import { ContactForm } from '@/components/forms/ContactForm';
import { useContacts, type Contact } from '@/hooks/useContacts';
import { useCompanies } from '@/hooks/useCompanies';
import { useInteractions } from '@/hooks/useInteractions';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { ContactRole, SentimentType, DISCProfile, RelationshipStage } from '@/types';

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
  const { contacts, loading, createContact, updateContact, deleteContact } = useContacts();
  const { companies } = useCompanies();
  const { interactions } = useInteractions();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [deletingContact, setDeletingContact] = useState<Contact | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Advanced filters state
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  const [sortBy, setSortBy] = useState('updated_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredAndSortedContacts = useMemo(() => {
    let result = contacts.filter(contact => {
      // Text search
      const fullName = `${contact.first_name} ${contact.last_name}`.toLowerCase();
      const matchesSearch = 
        fullName.includes(searchTerm.toLowerCase()) ||
        (contact.role_title && contact.role_title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (contact.email && contact.email.toLowerCase().includes(searchTerm.toLowerCase()));
      
      if (!matchesSearch) return false;

      // Advanced filters
      for (const [key, values] of Object.entries(activeFilters)) {
        if (values.length === 0) continue;
        
        const contactValue = contact[key as keyof Contact];
        if (!contactValue || !values.includes(String(contactValue))) {
          return false;
        }
      }

      return true;
    });

    // Sort
    result.sort((a, b) => {
      let aVal = a[sortBy as keyof Contact];
      let bVal = b[sortBy as keyof Contact];

      if (aVal === null || aVal === undefined) aVal = '' as any;
      if (bVal === null || bVal === undefined) bVal = '' as any;

      if (sortBy === 'relationship_score') {
        const numA = Number(aVal) || 0;
        const numB = Number(bVal) || 0;
        return sortOrder === 'asc' ? numA - numB : numB - numA;
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        const comparison = aVal.localeCompare(bVal, 'pt-BR');
        return sortOrder === 'asc' ? comparison : -comparison;
      }

      return 0;
    });

    return result;
  }, [contacts, searchTerm, activeFilters, sortBy, sortOrder]);

  const getCompanyName = (companyId: string | null) => {
    if (!companyId) return null;
    const company = companies.find(c => c.id === companyId);
    return company?.name || null;
  };

  const getLastInteractionDate = (contactId: string): string | null => {
    const contactInteractions = interactions
      .filter(i => i.contact_id === contactId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return contactInteractions[0]?.created_at || null;
  };

  const handleCreate = async (data: any) => {
    setIsSubmitting(true);
    const result = await createContact(data);
    setIsSubmitting(false);
    if (result) {
      setIsFormOpen(false);
    }
  };

  const handleUpdate = async (data: any) => {
    if (!editingContact) return;
    setIsSubmitting(true);
    const result = await updateContact(editingContact.id, data);
    setIsSubmitting(false);
    if (result) {
      setEditingContact(null);
    }
  };

  const handleDelete = async () => {
    if (!deletingContact) return;
    await deleteContact(deletingContact.id);
    setDeletingContact(null);
  };

  return (
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, cargo ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('grid')}
              className="h-8 w-8"
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('list')}
              className="h-8 w-8"
            >
              <List className="w-4 h-4" />
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

        {/* Loading State */}
        {loading ? (
          viewMode === 'grid' ? <ContactsGridSkeleton /> : <ContactsListSkeleton />
        ) : (
          <>
            {/* Contacts Grid/List */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAndSortedContacts.map((contact, index) => {
                  const behavior = contact.behavior as { discProfile?: DISCProfile } | null;
                  const companyName = getCompanyName(contact.company_id);
                  const lastInteraction = getLastInteractionDate(contact.id);
                  
                  return (
                    <motion.div
                      key={contact.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <Card className="h-full card-hover group cursor-pointer overflow-hidden relative">
                        {/* Priority Bar at the top */}
                        <PriorityBar 
                          relationshipScore={contact.relationship_score || 0} 
                          lastInteractionDate={lastInteraction}
                          className="absolute top-0 left-0 right-0 z-20"
                        />
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="absolute top-3 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 hover:bg-white dark:bg-background/80 dark:hover:bg-background"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditingContact(contact)}>
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => setDeletingContact(contact)}
                              className="text-destructive"
                            >
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        
                        <Link to={`/contatos/${contact.id}`}>
                          <CardContent className="p-0">
                            {/* Header with gradient */}
                            <div className="h-16 bg-gradient-primary relative mt-1">
                              <div className="absolute -bottom-8 left-5">
                                <div className="relative">
                                  <Avatar className="w-16 h-16 border-4 border-card shadow-medium">
                                    <AvatarImage src={contact.avatar_url || undefined} />
                                    <AvatarFallback className="bg-primary text-primary-foreground text-lg font-bold">
                                      {contact.first_name[0]}{contact.last_name[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  {/* Priority indicator on avatar */}
                                  <div className="absolute -top-1 -right-1">
                                    <PriorityIndicator 
                                      relationshipScore={contact.relationship_score || 0}
                                      lastInteractionDate={lastInteraction}
                                    />
                                  </div>
                                </div>
                              </div>
                              <div className="absolute top-3 right-10">
                                <RelationshipScore score={contact.relationship_score || 0} size="sm" />
                              </div>
                            </div>

                            <div className="pt-10 px-5 pb-5">
                              <div className="mb-3">
                                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                  {contact.first_name} {contact.last_name}
                                </h3>
                                <p className="text-sm text-muted-foreground">{contact.role_title || 'Sem cargo'}</p>
                              </div>

                              {companyName && (
                                <div className="flex items-center gap-2 mb-3">
                                  <Building2 className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-sm text-muted-foreground">{companyName}</span>
                                </div>
                              )}

                              <div className="flex items-center gap-2 mb-3 flex-wrap">
                                <RoleBadge role={(contact.role as ContactRole) || 'contact'} />
                                {behavior?.discProfile && (
                                  <DISCBadge profile={behavior.discProfile} size="sm" showLabel={false} />
                                )}
                                <SentimentIndicator sentiment={(contact.sentiment as SentimentType) || 'neutral'} size="sm" />
                              </div>

                              <div className="mb-4">
                                <RelationshipStageBadge stage={(contact.relationship_stage as RelationshipStage) || 'unknown'} />
                              </div>

                              {/* Contact Methods */}
                              <div className="flex items-center gap-2 pt-4 border-t border-border">
                                {contact.whatsapp && (
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-success">
                                    <MessageSquare className="w-4 h-4" />
                                  </Button>
                                )}
                                {contact.phone && (
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <Phone className="w-4 h-4" />
                                  </Button>
                                )}
                                {contact.email && (
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <Mail className="w-4 h-4" />
                                  </Button>
                                )}
                                {contact.linkedin && (
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-info">
                                    <Linkedin className="w-4 h-4" />
                                  </Button>
                                )}
                                <div className="ml-auto text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(contact.updated_at), { locale: ptBR, addSuffix: true })}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Link>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredAndSortedContacts.map((contact, index) => {
                  const behavior = contact.behavior as { discProfile?: DISCProfile } | null;
                  const companyName = getCompanyName(contact.company_id);
                  const lastInteraction = getLastInteractionDate(contact.id);
                  
                  return (
                    <motion.div
                      key={contact.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.03 }}
                    >
                      <Card className="card-hover cursor-pointer group overflow-hidden relative">
                        {/* Priority Bar on left side */}
                        <div className="absolute left-0 top-0 bottom-0 w-1">
                          <PriorityBar 
                            relationshipScore={contact.relationship_score || 0} 
                            lastInteractionDate={lastInteraction}
                            className="h-full w-full rounded-none"
                          />
                        </div>
                        <CardContent className="p-4 pl-5">
                          <div className="flex items-center gap-4">
                            <Link to={`/contatos/${contact.id}`} className="flex items-center gap-4 flex-1 min-w-0">
                              <div className="relative">
                                <Avatar className="w-12 h-12 border-2 border-primary/20">
                                  <AvatarImage src={contact.avatar_url || undefined} />
                                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                    {contact.first_name[0]}{contact.last_name[0]}
                                  </AvatarFallback>
                                </Avatar>
                                {/* Priority indicator on avatar */}
                                <div className="absolute -top-1 -right-1">
                                  <PriorityIndicator 
                                    relationshipScore={contact.relationship_score || 0}
                                    lastInteractionDate={lastInteraction}
                                  />
                                </div>
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="font-semibold text-foreground truncate">
                                    {contact.first_name} {contact.last_name}
                                  </h3>
                                  <RoleBadge role={(contact.role as ContactRole) || 'contact'} />
                                  {behavior?.discProfile && (
                                    <DISCBadge profile={behavior.discProfile} size="sm" showLabel={false} />
                                  )}
                                  <SentimentIndicator sentiment={(contact.sentiment as SentimentType) || 'neutral'} size="sm" />
                                </div>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                  <span>{contact.role_title || 'Sem cargo'}</span>
                                  {companyName && (
                                    <>
                                      <span>•</span>
                                      <span>{companyName}</span>
                                    </>
                                  )}
                                  <span>•</span>
                                  <RelationshipStageBadge stage={(contact.relationship_stage as RelationshipStage) || 'unknown'} />
                                </div>
                              </div>

                              <RelationshipScore score={contact.relationship_score || 0} size="sm" />
                            </Link>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setEditingContact(contact)}>
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => setDeletingContact(contact)}
                                  className="text-destructive"
                                >
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
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
      </div>

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
    </AppLayout>
  );
};

export default Contatos;
