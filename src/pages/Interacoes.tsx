import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageSquare, 
  Phone, 
  Mail, 
  Users,
  Edit,
  Search,
  Calendar,
  Loader2,
  MoreVertical,
  Trash2
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SentimentIndicator } from '@/components/ui/sentiment-indicator';
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
import { InteractionForm } from '@/components/forms/InteractionForm';
import { useInteractions, type Interaction } from '@/hooks/useInteractions';
import { useContacts } from '@/hooks/useContacts';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { SentimentType } from '@/types';

const interactionIcons: Record<string, typeof MessageSquare> = {
  whatsapp: MessageSquare,
  call: Phone,
  email: Mail,
  meeting: Users,
  note: Edit,
  social: MessageSquare,
};

const interactionColors: Record<string, string> = {
  whatsapp: 'bg-success/10 text-success',
  call: 'bg-info/10 text-info',
  email: 'bg-primary/10 text-primary',
  meeting: 'bg-warning/10 text-warning',
  note: 'bg-muted text-muted-foreground',
  social: 'bg-pink-100 text-pink-600',
};

const interactionLabels: Record<string, string> = {
  whatsapp: 'WhatsApp',
  call: 'Ligação',
  email: 'Email',
  meeting: 'Reunião',
  note: 'Nota',
  social: 'Social',
};

const Interacoes = () => {
  const { interactions, loading, createInteraction, updateInteraction, deleteInteraction } = useInteractions();
  const { contacts } = useContacts();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInteraction, setEditingInteraction] = useState<Interaction | null>(null);
  const [deletingInteraction, setDeletingInteraction] = useState<Interaction | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredInteractions = interactions
    .filter(interaction => {
      const matchesSearch = interaction.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (interaction.content && interaction.content.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesType = !selectedType || interaction.type === selectedType;
      return matchesSearch && matchesType;
    });

  const types = ['whatsapp', 'call', 'email', 'meeting', 'note'];

  const getContactInfo = (contactId: string) => {
    return contacts.find(c => c.id === contactId);
  };

  const handleCreate = async (data: any) => {
    setIsSubmitting(true);
    const result = await createInteraction(data);
    setIsSubmitting(false);
    if (result) {
      setIsFormOpen(false);
    }
  };

  const handleUpdate = async (data: any) => {
    if (!editingInteraction) return;
    setIsSubmitting(true);
    const result = await updateInteraction(editingInteraction.id, data);
    setIsSubmitting(false);
    if (result) {
      setEditingInteraction(null);
    }
  };

  const handleDelete = async () => {
    if (!deletingInteraction) return;
    await deleteInteraction(deletingInteraction.id);
    setDeletingInteraction(null);
  };

  return (
    <AppLayout>
      <Header 
        title="Interações" 
        subtitle="Histórico de comunicações com seus contatos"
        showAddButton
        addButtonLabel="Nova Interação"
        onAddClick={() => setIsFormOpen(true)}
      />

      <div className="p-6 space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="relative flex-1 max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar interações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant={selectedType === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType(null)}
            >
              Todos
            </Button>
            {types.map(type => {
              const Icon = interactionIcons[type];
              return (
                <Button
                  key={type}
                  variant={selectedType === type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedType(type)}
                  className="gap-1.5"
                >
                  <Icon className="w-3.5 h-3.5" />
                  {interactionLabels[type]}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Timeline */}
            <div className="relative">
              <div className="absolute left-[27px] top-0 bottom-0 w-0.5 bg-border" />
              
              <div className="space-y-4">
                {filteredInteractions.map((interaction, index) => {
                  const contact = getContactInfo(interaction.contact_id);
                  const Icon = interactionIcons[interaction.type] || MessageSquare;
                  
                  return (
                    <motion.div
                      key={interaction.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="relative pl-16 group"
                    >
                      <div className={`absolute left-2 top-4 w-10 h-10 rounded-full flex items-center justify-center ${interactionColors[interaction.type]} border-4 border-background z-10`}>
                        <Icon className="w-4 h-4" />
                      </div>

                      <Card className="card-hover">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className={`text-xs ${interactionColors[interaction.type].replace('bg-', 'border-').replace('/10', '/50')}`}>
                                  {interactionLabels[interaction.type]}
                                </Badge>
                                <SentimentIndicator sentiment={(interaction.sentiment as SentimentType) || 'neutral'} size="sm" />
                                {interaction.follow_up_required && (
                                  <Badge variant="outline" className="text-xs text-warning border-warning">
                                    Follow-up
                                  </Badge>
                                )}
                              </div>
                              <h3 className="font-semibold text-foreground">{interaction.title}</h3>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-right text-xs text-muted-foreground">
                                <div className="flex items-center gap-1 justify-end">
                                  <Calendar className="w-3 h-3" />
                                  {format(new Date(interaction.created_at), "d MMM 'às' HH:mm", { locale: ptBR })}
                                </div>
                                <div>{formatDistanceToNow(new Date(interaction.created_at), { locale: ptBR, addSuffix: true })}</div>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setEditingInteraction(interaction)}>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => setDeletingInteraction(interaction)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Excluir
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>

                          {interaction.content && (
                            <p className="text-sm text-muted-foreground mb-4">{interaction.content}</p>
                          )}

                          {interaction.duration && (
                            <p className="text-xs text-muted-foreground mb-3">
                              Duração: {Math.floor(interaction.duration / 60)} min
                            </p>
                          )}

                          {interaction.tags && interaction.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-4">
                              {interaction.tags.map(tag => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}

                          {contact && (
                            <div className="flex items-center gap-3 pt-3 border-t border-border">
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={contact.avatar_url || undefined} />
                                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                                  {contact.first_name[0]}{contact.last_name[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium text-foreground">
                                  {contact.first_name} {contact.last_name}
                                </p>
                                <p className="text-xs text-muted-foreground">{contact.role_title}</p>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {filteredInteractions.length === 0 && !loading && (
              <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {searchTerm || selectedType ? 'Nenhuma interação encontrada' : 'Nenhuma interação registrada'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || selectedType ? 'Tente ajustar seus filtros.' : 'Registre suas comunicações para manter o histórico atualizado.'}
                </p>
                {!searchTerm && !selectedType && (
                  <Button onClick={() => setIsFormOpen(true)}>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Nova Interação
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
          <InteractionForm
            contacts={contacts}
            onSubmit={handleCreate}
            onCancel={() => setIsFormOpen(false)}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingInteraction} onOpenChange={(open) => !open && setEditingInteraction(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <InteractionForm
            interaction={editingInteraction}
            contacts={contacts}
            onSubmit={handleUpdate}
            onCancel={() => setEditingInteraction(null)}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingInteraction} onOpenChange={(open) => !open && setDeletingInteraction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir interação?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta interação? Esta ação não pode ser desfeita.
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

export default Interacoes;
