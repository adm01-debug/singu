import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageSquare, 
  Phone, 
  Mail, 
  Users,
  Edit,
  Search,
  Calendar,
  MoreVertical,
  Trash2,
  Video,
  FileText,
  Clock,
  AlertCircle
} from 'lucide-react';
import { InteractionsListSkeleton } from '@/components/skeletons/PageSkeletons';
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
import { AdvancedFilters, type FilterConfig, type SortOption } from '@/components/filters/AdvancedFilters';
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
  video_call: Video,
  note: FileText,
  social: MessageSquare,
};

const interactionColors: Record<string, string> = {
  whatsapp: 'bg-success/10 text-success',
  call: 'bg-info/10 text-info',
  email: 'bg-primary/10 text-primary',
  meeting: 'bg-warning/10 text-warning',
  video_call: 'bg-purple-100 text-purple-600',
  note: 'bg-muted text-muted-foreground',
  social: 'bg-pink-100 text-pink-600',
};

const interactionLabels: Record<string, string> = {
  whatsapp: 'WhatsApp',
  call: 'Ligação',
  email: 'Email',
  meeting: 'Reunião',
  video_call: 'Videochamada',
  note: 'Nota',
  social: 'Social',
};

const filterConfigs: FilterConfig[] = [
  {
    key: 'type',
    label: 'Tipo',
    multiple: true,
    options: [
      { value: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
      { value: 'call', label: 'Ligação', icon: Phone },
      { value: 'email', label: 'Email', icon: Mail },
      { value: 'meeting', label: 'Reunião', icon: Users },
      { value: 'video_call', label: 'Videochamada', icon: Video },
      { value: 'note', label: 'Nota', icon: FileText },
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
    key: 'follow_up_required',
    label: 'Follow-up',
    multiple: false,
    options: [
      { value: 'true', label: 'Pendente', icon: AlertCircle },
      { value: 'false', label: 'Concluído' },
    ],
  },
  {
    key: 'initiated_by',
    label: 'Iniciado por',
    multiple: false,
    options: [
      { value: 'us', label: 'Nós' },
      { value: 'them', label: 'Contato' },
    ],
  },
];

const sortOptions: SortOption[] = [
  { value: 'created_at', label: 'Data' },
  { value: 'title', label: 'Título' },
  { value: 'type', label: 'Tipo' },
  { value: 'duration', label: 'Duração' },
];

const Interacoes = () => {
  const { interactions, loading, createInteraction, updateInteraction, deleteInteraction } = useInteractions();
  const { contacts } = useContacts();
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInteraction, setEditingInteraction] = useState<Interaction | null>(null);
  const [deletingInteraction, setDeletingInteraction] = useState<Interaction | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Advanced filters state
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredAndSortedInteractions = useMemo(() => {
    let result = interactions.filter(interaction => {
      // Text search
      const matchesSearch = 
        interaction.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (interaction.content && interaction.content.toLowerCase().includes(searchTerm.toLowerCase()));
      
      if (!matchesSearch) return false;

      // Advanced filters
      for (const [key, values] of Object.entries(activeFilters)) {
        if (values.length === 0) continue;
        
        const interactionValue = interaction[key as keyof Interaction];
        
        // Handle boolean conversion for follow_up_required
        if (key === 'follow_up_required') {
          const boolValue = String(interactionValue);
          if (!values.includes(boolValue)) return false;
          continue;
        }
        
        if (interactionValue === null || interactionValue === undefined) return false;
        if (!values.includes(String(interactionValue))) return false;
      }

      return true;
    });

    // Sort
    result.sort((a, b) => {
      let aVal = a[sortBy as keyof Interaction];
      let bVal = b[sortBy as keyof Interaction];

      if (aVal === null || aVal === undefined) aVal = '' as any;
      if (bVal === null || bVal === undefined) bVal = '' as any;

      if (sortBy === 'duration') {
        const numA = Number(aVal) || 0;
        const numB = Number(bVal) || 0;
        return sortOrder === 'asc' ? numA - numB : numB - numA;
      }

      if (sortBy === 'created_at') {
        const dateA = new Date(aVal as string).getTime();
        const dateB = new Date(bVal as string).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        const comparison = aVal.localeCompare(bVal, 'pt-BR');
        return sortOrder === 'asc' ? comparison : -comparison;
      }

      return 0;
    });

    return result;
  }, [interactions, searchTerm, activeFilters, sortBy, sortOrder]);

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

  // Stats
  const stats = useMemo(() => {
    const followUpCount = interactions.filter(i => i.follow_up_required).length;
    const thisWeek = interactions.filter(i => {
      const date = new Date(i.created_at);
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return date >= weekAgo;
    }).length;

    return { total: interactions.length, followUp: followUpCount, thisWeek };
  }, [interactions]);

  return (
    <AppLayout>
      <Header 
        title="Interações" 
        subtitle={`${filteredAndSortedInteractions.length} de ${interactions.length} interações`}
        showAddButton
        addButtonLabel="Nova Interação"
        onAddClick={() => setIsFormOpen(true)}
      />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 max-w-lg">
          <Card className="border-border/50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-warning">{stats.followUp}</p>
              <p className="text-xs text-muted-foreground">Follow-ups</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{stats.thisWeek}</p>
              <p className="text-xs text-muted-foreground">Esta semana</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar interações..."
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
          <InteractionsListSkeleton />
        ) : (
          <>
            {/* Timeline */}
            <div className="relative">
              <div className="absolute left-[27px] top-0 bottom-0 w-0.5 bg-border" />
              
              <div className="space-y-4">
                {filteredAndSortedInteractions.map((interaction, index) => {
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
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <Badge variant="outline" className={`text-xs ${interactionColors[interaction.type].replace('bg-', 'border-').replace('/10', '/50')}`}>
                                  {interactionLabels[interaction.type]}
                                </Badge>
                                <SentimentIndicator sentiment={(interaction.sentiment as SentimentType) || 'neutral'} size="sm" />
                                {interaction.follow_up_required && (
                                  <Badge variant="outline" className="text-xs text-warning border-warning bg-warning/10">
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    Follow-up
                                  </Badge>
                                )}
                                {interaction.initiated_by === 'them' && (
                                  <Badge variant="secondary" className="text-xs">
                                    Recebido
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
                            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{interaction.content}</p>
                          )}

                          {interaction.duration && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                              <Clock className="w-3 h-3" />
                              Duração: {Math.floor(interaction.duration / 60)} min
                            </div>
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

            {filteredAndSortedInteractions.length === 0 && !loading && (
              <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {searchTerm || Object.keys(activeFilters).length > 0 
                    ? 'Nenhuma interação encontrada' 
                    : 'Nenhuma interação registrada'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || Object.keys(activeFilters).length > 0 
                    ? 'Tente ajustar seus filtros.' 
                    : 'Registre suas comunicações para manter o histórico atualizado.'}
                </p>
                {!searchTerm && Object.keys(activeFilters).length === 0 && (
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
