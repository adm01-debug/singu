import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Phone, 
  Mail, 
  MessageSquare,
  Building2,
  Search,
  Filter,
  Grid3X3,
  List,
  Heart,
  Linkedin,
  Instagram,
  Loader2,
  MoreVertical
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RoleBadge } from '@/components/ui/role-badge';
import { RelationshipScore } from '@/components/ui/relationship-score';
import { SentimentIndicator } from '@/components/ui/sentiment-indicator';
import { DISCBadge } from '@/components/ui/disc-badge';
import { RelationshipStageBadge } from '@/components/ui/relationship-stage';
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
import { ContactForm } from '@/components/forms/ContactForm';
import { useContacts, type Contact } from '@/hooks/useContacts';
import { useCompanies } from '@/hooks/useCompanies';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { ContactRole, SentimentType, DISCProfile, RelationshipStage } from '@/types';

type ViewMode = 'grid' | 'list';

const Contatos = () => {
  const { contacts, loading, createContact, updateContact, deleteContact } = useContacts();
  const { companies } = useCompanies();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [deletingContact, setDeletingContact] = useState<Contact | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredContacts = contacts.filter(contact =>
    `${contact.first_name} ${contact.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (contact.role_title && contact.role_title.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getCompanyName = (companyId: string | null) => {
    if (!companyId) return null;
    const company = companies.find(c => c.id === companyId);
    return company?.name || null;
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
        subtitle={`${contacts.length} pessoas cadastradas`}
        showAddButton
        addButtonLabel="Novo Contato"
        onAddClick={() => setIsFormOpen(true)}
      />

      <div className="p-6 space-y-6">
        {/* Filters */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, empresa ou cargo..."
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

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Contacts Grid/List */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredContacts.map((contact, index) => {
                  const behavior = contact.behavior as { discProfile?: DISCProfile } | null;
                  const companyName = getCompanyName(contact.company_id);
                  
                  return (
                    <motion.div
                      key={contact.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <Card className="h-full card-hover group cursor-pointer overflow-hidden relative">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 hover:bg-white"
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
                            <div className="h-16 bg-gradient-primary relative">
                              <div className="absolute -bottom-8 left-5">
                                <Avatar className="w-16 h-16 border-4 border-card shadow-medium">
                                  <AvatarImage src={contact.avatar_url || undefined} />
                                  <AvatarFallback className="bg-primary text-primary-foreground text-lg font-bold">
                                    {contact.first_name[0]}{contact.last_name[0]}
                                  </AvatarFallback>
                                </Avatar>
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
                {filteredContacts.map((contact, index) => {
                  const behavior = contact.behavior as { discProfile?: DISCProfile } | null;
                  const companyName = getCompanyName(contact.company_id);
                  
                  return (
                    <motion.div
                      key={contact.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.03 }}
                    >
                      <Card className="card-hover cursor-pointer group">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <Link to={`/contatos/${contact.id}`} className="flex items-center gap-4 flex-1 min-w-0">
                              <Avatar className="w-12 h-12 border-2 border-primary/20">
                                <AvatarImage src={contact.avatar_url || undefined} />
                                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                  {contact.first_name[0]}{contact.last_name[0]}
                                </AvatarFallback>
                              </Avatar>

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

            {filteredContacts.length === 0 && !loading && (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {searchTerm ? 'Nenhum contato encontrado' : 'Nenhum contato cadastrado'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? 'Tente ajustar sua busca.' : 'Comece adicionando seu primeiro contato.'}
                </p>
                {!searchTerm && (
                  <Button onClick={() => setIsFormOpen(true)}>
                    <Users className="w-4 h-4 mr-2" />
                    Novo Contato
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
