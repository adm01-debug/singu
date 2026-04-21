import { useState, useMemo, useRef, useEffect, startTransition, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare, Phone, Mail, Users, Edit, Search, Calendar, MoreVertical,
  Trash2, Video, FileText, Clock, AlertCircle, Plus, X,
} from 'lucide-react';
import { InteractionsListSkeleton } from '@/components/skeletons/PageSkeletons';
import { EmptyState, SearchEmptyState } from '@/components/ui/empty-state';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { OptimizedAvatar } from '@/components/ui/optimized-avatar';
import { SentimentIndicator } from '@/components/ui/sentiment-indicator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AdvancedFilters, type FilterConfig, type SortOption } from '@/components/filters/AdvancedFilters';
import { MorphingNumber } from '@/components/micro-interactions/MorphingNumber';
import { SmartBreadcrumbs } from '@/components/navigation/SmartBreadcrumbs';
import { sortArray } from '@/lib/sorting-utils';
import { sortInteractions } from '@/lib/sortInteractions';
import type { Interaction } from '@/hooks/useInteractions';
import type { SentimentType } from '@/types';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AdvancedSearchBar } from '@/components/interactions/AdvancedSearchBar';
import { ActiveFiltersBar } from '@/components/interactions/ActiveFiltersBar';
import { useInteractionsAdvancedFilter } from '@/hooks/useInteractionsAdvancedFilter';
import { useCompanies } from '@/hooks/useCompanies';

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

const ActivityHeatmapChart = lazy(() => import('@/components/interactions/ActivityHeatmapChart'));

const interactionIcons: Record<string, typeof MessageSquare> = { whatsapp: MessageSquare, call: Phone, email: Mail, meeting: Users, video_call: Video, note: FileText, social: MessageSquare };
const interactionColors: Record<string, string> = { whatsapp: 'bg-success/10 text-success', call: 'bg-info/10 text-info', email: 'bg-primary/10 text-primary', meeting: 'bg-warning/10 text-warning', video_call: 'bg-secondary/10 text-secondary', note: 'bg-muted text-muted-foreground', social: 'bg-accent/10 text-accent' };
const interactionLabels: Record<string, string> = { whatsapp: 'WhatsApp', call: 'Ligação', email: 'Email', meeting: 'Reunião', video_call: 'Videochamada', note: 'Nota', social: 'Social' };

interface Props {
  interactions: Interaction[];
  loading: boolean;
  contactMap: Map<string, { id: string; first_name: string; last_name: string; avatar_url: string | null; role_title: string | null }>;
  stats: { total: number; followUp: number; thisWeek: number };
  onSetIsFormOpen: (open: boolean) => void;
  onSetEditingInteraction: (interaction: Interaction | null) => void;
  onSetDeletingInteraction: (interaction: Interaction | null) => void;
  filterConfigs: FilterConfig[];
  sortOptions: SortOption[];
}

export function InteracoesContent({ interactions, loading, contactMap, stats, onSetIsFormOpen, onSetEditingInteraction, onSetDeletingInteraction, filterConfigs, sortOptions }: Props) {
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { filters: adv, debouncedQ, setFilter, clear, activeCount } = useInteractionsAdvancedFilter();
  const { companies } = useCompanies();

  const contactOptions = useMemo(
    () => Array.from(contactMap.values()).map(c => ({ id: c.id, label: `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() || 'Sem nome' })),
    [contactMap]
  );
  const companyOptions = useMemo(
    () => (Array.isArray(companies) ? companies : []).map(c => ({ id: c.id, label: c.name ?? 'Sem nome' })),
    [companies]
  );

  // Apply advanced filters first (URL-driven)
  const advancedFiltered = useMemo(() => {
    if (!Array.isArray(interactions)) return [];
    const q = debouncedQ ? normalize(debouncedQ) : '';
    const deTs = adv.de ? new Date(adv.de).setHours(0, 0, 0, 0) : null;
    const ateTs = adv.ate ? new Date(adv.ate).setHours(23, 59, 59, 999) : null;
    return interactions.filter(i => {
      if (adv.contact && i.contact_id !== adv.contact) return false;
      if (adv.company && i.company_id !== adv.company) return false;
      if (adv.canais.length > 0 && !adv.canais.includes(i.type)) return false;
      const ts = new Date(i.created_at).getTime();
      if (deTs !== null && ts < deTs) return false;
      if (ateTs !== null && ts > ateTs) return false;
      if (q) {
        const hay = normalize(`${i.title ?? ''} ${i.content ?? ''} ${(i.tags ?? []).join(' ')}`);
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [interactions, adv, debouncedQ]);

  const filteredAndSorted = useMemo(() => {
    const result = advancedFiltered.filter(interaction => {
      for (const [key, values] of Object.entries(activeFilters)) {
        if (values.length === 0) continue;
        const val = interaction[key as keyof Interaction];
        if (key === 'follow_up_required') { if (!values.includes(String(val))) return false; continue; }
        if (val === null || val === undefined) return false;
        if (!values.includes(String(val))) return false;
      }
      return true;
    });
    return sortArray(result, sortBy as keyof Interaction, sortOrder, { dateFields: ['created_at', 'follow_up_date'], numericFields: ['duration', 'response_time'] });
  }, [advancedFiltered, activeFilters, sortBy, sortOrder]);

  const RENDER_BATCH = 40;
  const [visibleCount, setVisibleCount] = useState(RENDER_BATCH);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setVisibleCount(RENDER_BATCH); }, [activeFilters, sortBy, sortOrder]);
  useEffect(() => { const el = sentinelRef.current; if (!el) return; const obs = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) startTransition(() => setVisibleCount(prev => prev + RENDER_BATCH)); }, { rootMargin: '400px' }); obs.observe(el); return () => obs.disconnect(); }, [filteredAndSorted.length]);

  const sortedForView = useMemo(() => {
    const mapped = filteredAndSorted.map(i => {
      const c = contactMap.get(i.contact_id);
      return {
        ...i,
        date: i.created_at,
        contact_name: c ? `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() : null,
        company_name: null as string | null,
      };
    });
    return sortInteractions(mapped, adv.sort, debouncedQ);
  }, [filteredAndSorted, contactMap, adv.sort, debouncedQ]);

  const visibleInteractions = useMemo(() => sortedForView.slice(0, visibleCount), [sortedForView, visibleCount]);
  const hasMore = visibleCount < sortedForView.length;

  return (
    <div className="p-6 space-y-6">
      <SmartBreadcrumbs />
      <div className="grid grid-cols-3 gap-4 max-w-lg">
        <Card className="border-border/50"><CardContent className="p-4 text-center"><MorphingNumber value={stats.total} className="text-2xl font-bold text-foreground" /><p className="text-xs text-muted-foreground">Total</p></CardContent></Card>
        <Card className="border-border/50"><CardContent className="p-4 text-center"><MorphingNumber value={stats.followUp} className="text-2xl font-bold text-warning" /><p className="text-xs text-muted-foreground">Follow-ups</p></CardContent></Card>
        <Card className="border-border/50"><CardContent className="p-4 text-center"><MorphingNumber value={stats.thisWeek} className="text-2xl font-bold text-primary" /><p className="text-xs text-muted-foreground">Esta semana</p></CardContent></Card>
      </div>

      <Suspense fallback={<Card className="border-border/50"><CardContent className="p-4"><div className="h-48 animate-pulse bg-muted/30 rounded-lg" /></CardContent></Card>}><ActivityHeatmapChart /></Suspense>

      <AdvancedSearchBar
        filters={adv}
        setFilter={setFilter}
        clear={clear}
        activeCount={activeCount}
        contacts={contactOptions}
        companies={companyOptions}
        resultsCount={filteredAndSorted.length}
        totalCount={interactions.length}
      />

      <AdvancedFilters filters={filterConfigs} sortOptions={sortOptions} activeFilters={activeFilters} onFiltersChange={setActiveFilters} sortBy={sortBy} sortOrder={sortOrder} onSortChange={(sb, so) => { setSortBy(sb); setSortOrder(so); }} />

      {loading ? <InteractionsListSkeleton /> : (
        <>
          <div className="relative">
            <div className="absolute left-[27px] top-0 bottom-0 w-0.5 bg-border" />
            <div className="space-y-4">
              {visibleInteractions.map((interaction, index) => {
                const contact = contactMap.get(interaction.contact_id);
                const Icon = interactionIcons[interaction.type] || MessageSquare;
                return (
                  <motion.div key={interaction.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.3) }} className="relative pl-16 group">
                    <div className={`absolute left-2 top-4 w-10 h-10 rounded-full flex items-center justify-center ${interactionColors[interaction.type]} border-4 border-background z-10`}><Icon className="w-4 h-4" /></div>
                    <Card className="card-hover"><CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Badge variant="outline" className={`text-xs ${interactionColors[interaction.type].replace('bg-', 'border-').replace('/10', '/50')}`}>{interactionLabels[interaction.type]}</Badge>
                            <SentimentIndicator sentiment={(interaction.sentiment as SentimentType) || 'neutral'} size="sm" />
                            {interaction.follow_up_required && <Badge variant="outline" className="text-xs text-warning border-warning bg-warning/10"><AlertCircle className="w-3 h-3 mr-1" />Follow-up</Badge>}
                            {interaction.initiated_by === 'them' && <Badge variant="secondary" className="text-xs">Recebido</Badge>}
                          </div>
                          <h3 className="font-semibold text-foreground">{interaction.title}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right text-xs text-muted-foreground"><div className="flex items-center gap-1 justify-end"><Calendar className="w-3 h-3" />{format(new Date(interaction.created_at), "d MMM 'às' HH:mm", { locale: ptBR })}</div><div>{formatDistanceToNow(new Date(interaction.created_at), { locale: ptBR, addSuffix: true })}</div></div>
                          <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => onSetEditingInteraction(interaction)}><Edit className="w-4 h-4 mr-2" />Editar</DropdownMenuItem><DropdownMenuItem onClick={() => onSetDeletingInteraction(interaction)} className="text-destructive"><Trash2 className="w-4 h-4 mr-2" />Excluir</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
                        </div>
                      </div>
                      {interaction.content && <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{interaction.content}</p>}
                      {interaction.duration && <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3"><Clock className="w-3 h-3" />Duração: {Math.floor(interaction.duration / 60)} min</div>}
                      {interaction.tags && interaction.tags.length > 0 && <div className="flex flex-wrap gap-1.5 mb-4">{interaction.tags.map(tag => <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>)}</div>}
                      {contact && <div className="flex items-center gap-3 pt-3 border-t border-border"><OptimizedAvatar src={contact.avatar_url} alt={`${contact.first_name} ${contact.last_name}`} fallback={`${(contact.first_name || '?')[0]}${(contact.last_name || '?')[0]}`} size="sm" /><div><p className="text-sm font-medium text-foreground">{contact.first_name} {contact.last_name}</p><p className="text-xs text-muted-foreground">{contact.role_title}</p></div></div>}
                    </CardContent></Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
          {hasMore && <div ref={sentinelRef} className="flex items-center justify-center py-6 text-sm text-muted-foreground">Carregando mais interações...</div>}
          {filteredAndSorted.length === 0 && !loading && (
            activeCount > 0 || Object.keys(activeFilters).length > 0
              ? <SearchEmptyState searchTerm={adv.q || 'filtros ativos'} onClearSearch={() => { clear(); setActiveFilters({}); }} entityName="interações" />
              : <EmptyState illustration="interactions" title="Documente suas conversas" description="Registre ligações, emails, reuniões e mensagens."
                  actions={[{ label: 'Registrar Interação', onClick: () => onSetIsFormOpen(true), icon: Plus }]}
                  tips={['Selecione o tipo correto para melhor categorização', 'Marque follow-ups para nunca perder um compromisso', 'Use tags para vincular a projetos']} />
          )}
        </>
      )}
    </div>
  );
}

