import { useState, useMemo } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { SEOHead } from '@/components/seo/SEOHead';
import { MessageSquare, Phone, Mail, Users, Video, FileText, AlertCircle, Plus } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { InteractionForm } from '@/components/forms/InteractionForm';
import { useInteractions, type Interaction } from '@/hooks/useInteractions';
import { useContacts } from '@/hooks/useContacts';
import { useMiniCelebration } from '@/components/celebrations/MiniCelebration';
import { useNLPAutoAnalysis } from '@/hooks/useNLPAutoAnalysis';
import { useActivityLogger } from '@/hooks/useActivityLogger';
import type { FilterConfig, SortOption } from '@/components/filters/AdvancedFilters';
import { InteracoesContent } from './interacoes/InteracoesContent';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UnifiedTimelineView } from '@/components/interactions/UnifiedTimelineView';
import { useSearchParams } from 'react-router-dom';
import { List, Activity } from 'lucide-react';

const filterConfigs: FilterConfig[] = [
  { key: 'type', label: 'Tipo', multiple: true, options: [{ value: 'whatsapp', label: 'WhatsApp', icon: MessageSquare }, { value: 'call', label: 'Ligação', icon: Phone }, { value: 'email', label: 'Email', icon: Mail }, { value: 'meeting', label: 'Reunião', icon: Users }, { value: 'video_call', label: 'Videochamada', icon: Video }, { value: 'note', label: 'Nota', icon: FileText }] },
  { key: 'sentiment', label: 'Sentimento', multiple: false, options: [{ value: 'positive', label: 'Positivo' }, { value: 'neutral', label: 'Neutro' }, { value: 'negative', label: 'Negativo' }] },
  { key: 'follow_up_required', label: 'Follow-up', multiple: false, options: [{ value: 'true', label: 'Pendente', icon: AlertCircle }, { value: 'false', label: 'Concluído' }] },
  { key: 'initiated_by', label: 'Iniciado por', multiple: false, options: [{ value: 'us', label: 'Nós' }, { value: 'them', label: 'Contato' }] },
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
  const celebration = useMiniCelebration();
  const { triggerAnalysis } = useNLPAutoAnalysis();
  const { logActivity } = useActivityLogger();

  const contactMap = useMemo(() => { const map = new Map<string, typeof contacts[0]>(); for (const c of contacts) map.set(c.id, c); return map; }, [contacts]);

  const stats = useMemo(() => {
    const followUpCount = interactions.filter(i => i.follow_up_required).length;
    const thisWeek = interactions.filter(i => { const d = new Date(i.created_at); return d >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); }).length;
    return { total: interactions.length, followUp: followUpCount, thisWeek };
  }, [interactions]);

  const handleCreate = async (data: Parameters<typeof createInteraction>[0], event?: React.MouseEvent) => {
    setIsSubmitting(true);
    const result = await createInteraction(data);
    setIsSubmitting(false);
    if (result) {
      setIsFormOpen(false);
      logActivity({ type: 'created', entityType: 'interaction', entityId: result.id || '', entityName: data.title, description: `Tipo: ${data.type}` });
      if (result.id && data.contact_id) triggerAnalysis(data.contact_id, result.id, data.content || null, null, data.type);
      const pos = event || { clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 };
      celebration.trigger(pos, { variant: 'success', message: 'Interação criada!' });
    }
  };

  const handleUpdate = async (data: Parameters<typeof updateInteraction>[1], event?: React.MouseEvent) => {
    if (!editingInteraction) return;
    setIsSubmitting(true);
    const result = await updateInteraction(editingInteraction.id, data);
    setIsSubmitting(false);
    if (result) { setEditingInteraction(null); const pos = event || { clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 }; celebration.trigger(pos, { variant: 'star', message: 'Atualizado!' }); }
  };

  const handleDelete = async () => { if (!deletingInteraction) return; await deleteInteraction(deletingInteraction.id); setDeletingInteraction(null); };

  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') === 'timeline' ? 'timeline' : 'lista';
  const handleTabChange = (val: string) => {
    const next = new URLSearchParams(searchParams);
    if (val === 'timeline') next.set('tab', 'timeline'); else next.delete('tab');
    setSearchParams(next, { replace: true });
  };

  return (
    <AppLayout>
      <SEOHead title="Interações" description="Histórico completo de comunicações e engajamentos" />
      <Header title="Interações" subtitle={`${interactions.length} interações`} hideBack showAddButton addButtonLabel="Nova Interação" onAddClick={() => setIsFormOpen(true)} />

      <Tabs value={activeTab} onValueChange={handleTabChange} className="px-6 pt-4">
        <TabsList>
          <TabsTrigger value="lista" className="gap-2"><List className="w-4 h-4" />Lista</TabsTrigger>
          <TabsTrigger value="timeline" className="gap-2"><Activity className="w-4 h-4" />Timeline</TabsTrigger>
        </TabsList>
        <TabsContent value="lista" className="mt-0">
          <InteracoesContent interactions={interactions} loading={loading} contactMap={contactMap} stats={stats} onSetIsFormOpen={setIsFormOpen} onSetEditingInteraction={setEditingInteraction} onSetDeletingInteraction={setDeletingInteraction} filterConfigs={filterConfigs} sortOptions={sortOptions} />
        </TabsContent>
        <TabsContent value="timeline" className="mt-0 p-6">
          <UnifiedTimelineView />
        </TabsContent>
      </Tabs>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}><DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto"><InteractionForm contacts={contacts} onSubmit={handleCreate} onCancel={() => setIsFormOpen(false)} isSubmitting={isSubmitting} /></DialogContent></Dialog>
      <Dialog open={!!editingInteraction} onOpenChange={(open) => !open && setEditingInteraction(null)}><DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto"><InteractionForm interaction={editingInteraction} contacts={contacts} onSubmit={handleUpdate} onCancel={() => setEditingInteraction(null)} isSubmitting={isSubmitting} /></DialogContent></Dialog>
      <AlertDialog open={!!deletingInteraction} onOpenChange={(open) => !open && setDeletingInteraction(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir interação?</AlertDialogTitle><AlertDialogDescription>Tem certeza que deseja excluir esta interação? Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
      {celebration.MiniCelebrationComponent}
    </AppLayout>
  );
};

export default Interacoes;
