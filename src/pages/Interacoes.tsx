import { useState, useMemo, useRef, useEffect, startTransition } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { sortArray } from '@/lib/sorting-utils';
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
  AlertCircle,
  Plus,
  X
} from 'lucide-react';
import { InteractionsListSkeleton } from '@/components/skeletons/PageSkeletons';
import { EmptyState, SearchEmptyState } from '@/components/ui/empty-state';
import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { OptimizedAvatar } from '@/components/ui/optimized-avatar';
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
import { SmartBreadcrumbs } from '@/components/navigation/SmartBreadcrumbs';
import { MorphingNumber } from '@/components/micro-interactions/MorphingNumber';
import { useInteractions, type Interaction } from '@/hooks/useInteractions';
import { useContacts } from '@/hooks/useContacts';
import { useMiniCelebration } from '@/components/celebrations/MiniCelebration';
import { useFuzzySearch } from '@/hooks/useFuzzySearch';
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
  video_call: 'bg-secondary/10 text-secondary',
  note: 'bg-muted text-muted-foreground',
  social: 'bg-accent/10 text-accent',
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
  usePageTitle('Interações');
  const { interactions, loading, createInteraction, updateInteraction, deleteInteraction } = useInteractions();
  const { contacts } = useContacts();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInteraction, setEditingInteraction] = useState<Interaction | null>(null);
  const [deletingInteraction, setDeletingInteraction] = useState<Interaction | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Mini celebration hook
  const celebration = useMiniCelebration();
  
  // Advanced filters state
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Fuzzy search with Fuse.js
  const {
    query: searchTerm,
    setQuery: setSearchTerm,
    results: fuzzyResults,
    isSearching,
    clearSearch,
  } = useFuzzySearch(interactions, {
    keys: ['title', 'content', 'tags'],
    threshold: 0.3,
    minChars: 1,
  });

  const filteredAndSortedInteractions = useMemo(() => {
    let result = fuzzyResults.filter(interaction => {
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

    // Sort using type-safe utility
    return sortArray(result, sortBy as keyof Interaction, sortOrder, {
      dateFields: ['created_at', 'follow_up_date'],
      numericFields: ['duration', 'response_time']
    });
  }, [fuzzyResults, activeFilters, sortBy, sortOrder]);

  // Progressive rendering
  const RENDER_BATCH = 40;
  const [visibleCount, setVisibleCount] = useState(RENDER_BATCH);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setVisibleCount(RENDER_BATCH); }, [activeFilters, sortBy, sortOrder]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          startTransition(() => setVisibleCount(prev => prev + RENDER_BATCH));
        }
      },
      { rootMargin: '400px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [filteredAndSortedInteractions.length]);

  const visibleInteractions = useMemo(
    () => filteredAndSortedInteractions.slice(0, visibleCount),
    [filteredAndSortedInteractions, visibleCount]
  );
  const hasMore = visibleCount < filteredAndSortedInteractions.length;

  // O(1) contact lookup
  const contactMap = useMemo(() => {
    const map = new Map<string, typeof contacts[0]>();
    for (const c of contacts) map.set(c.id, c);
    return map;
  }, [contacts]);

  const getContactInfo = (contactId: string) => {
    return contactMap.get(contactId);
  };

  const handleCreate = async (data: Parameters<typeof createInteraction>[0], event?: React.MouseEvent) => {
    setIsSubmitting(true);
    const result = await createInteraction(data);
    setIsSubmitting(false);
    if (result) {
      setIsFormOpen(false);
      // Trigger celebration
      if (event) {
        celebration.trigger(event, { variant: 'success', message: 'Interação criada!' });
      } else {
        celebration.trigger({ clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 }, { variant: 'success', message: 'Interação criada!' });
      }
    }
  };

  const handleUpdate = async (data: Parameters<typeof updateInteraction>[1], event?: React.MouseEvent) => {
    if (!editingInteraction) return;
    setIsSubmitting(true);
    const result = await updateInteraction(editingInteraction.id, data);
    setIsSubmitting(false);
    if (result) {
      setEditingInteraction(null);
      // Trigger celebration
      if (event) {
        celebration.trigger(event, { variant: 'star', message: 'Atualizado!' });
      } else {
        celebration.trigger({ clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 }, { variant: 'star', message: 'Atualizado!' });
      }
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
        hideBack
        showAddButton
        addButtonLabel="Nova Interação"
        onAddClick={() => setIsFormOpen(true)}
      />

      <div className="p-6 space-y-6">
        <SmartBreadcrumbs />
        
        {/* Stats with MorphingNumber */}
        <div className="grid grid-cols-3 gap-4 max-w-lg">
          <Card className="border-border/50">
            <CardContent className="p-4 text-center">
              <MorphingNumber value={stats.total} className="text-2xl font-bold text-foreground" />
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 text-center">
              <MorphingNumber value={stats.followUp} className="text-2xl font-bold text-warning" />
              <p className="text-xs text-muted-foreground">Follow-ups</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 text-center">
              <MorphingNumber value={stats.thisWeek} className="text-2xl font-bold text-primary" />
              <p className="text-xs text-muted-foreground">Esta semana</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar interações... (tolerante a erros)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
                {visibleInteractions.map((interaction, index) => {
                  const contact = getContactInfo(interaction.contact_id);
                  const Icon = interactionIcons[interaction.type] || MessageSquare;
                  
                  return (
                    <motion.div
                      key={interaction.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.3) }}
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
                              <OptimizedAvatar
                                src={contact.avatar_url}
                                alt={`${contact.first_name} ${contact.last_name}`}
                                fallback={`${(contact.first_name || '?')[0]}${(contact.last_name || '?')[0]}`}
                                size="sm"
                              />
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
              isSearching || Object.keys(activeFilters).length > 0 ? (
                <SearchEmptyState
                  searchTerm={searchTerm || 'filtros ativos'}
                  onClearSearch={() => {
                    clearSearch();
                    setActiveFilters({});
                  }}
                  entityName="interações"
                />
              ) : (
                <EmptyState
                  illustration="interactions"
                  title="Documente suas conversas"
                  description="Registre ligações, emails, reuniões e mensagens para ter um histórico completo de cada relacionamento."
                  actions={[
                    {
                      label: 'Registrar Interação',
                      onClick: () => setIsFormOpen(true),
                      icon: Plus,
                    },
                  ]}
                  tips={[
                    'Selecione o tipo correto para melhor categorização',
                    'Marque follow-ups para nunca perder um compromisso',
                    'Use tags para vincular a projetos ou campanhas',
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

      {/* Mini Celebration */}
      {celebration.MiniCelebrationComponent}
    </AppLayout>
  );
};

export default Interacoes;
