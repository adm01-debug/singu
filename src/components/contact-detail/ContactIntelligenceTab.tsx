import { useState } from 'react';
import { AlertTriangle, Target, Heart, Gift, CheckCircle2, Plus, Trash2, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InlineEmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { ModuleHelp, moduleHelpContent } from '@/components/ui/module-help';
import { EmotionalAnchorsPanel } from '@/components/contact-detail/EmotionalAnchorsPanel';
import { BestTimeToContactCard } from '@/components/contact-detail/BestTimeToContactCard';
import { AIActionsPanel } from '@/components/contact-detail/AIActionsPanel';
import { SocialIntelligencePanel } from '@/components/contact-detail/SocialIntelligencePanel';
import { ScoreHistoryPanel } from '@/components/contact-detail/ScoreHistoryPanel';
import { CommunicationPreferencesCard } from '@/components/contact-detail/CommunicationPreferencesCard';
import { WorkspaceAccountsCard } from '@/components/contact-detail/WorkspaceAccountsCard';
import type { Tables } from '@/integrations/supabase/types';

interface Props {
  contactId: string;
  contactName?: string;
  linkedinUrl?: string | null;
  websiteUrl?: string | null;
}

export function ContactIntelligenceTab({ contactId, contactName, linkedinUrl, websiteUrl }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ['contact-intelligence', contactId, user?.id];

  const [addingCriteria, setAddingCriteria] = useState(false);
  const [criteriaForm, setCriteriaForm] = useState({ name: '', criteria_type: 'rational', how_to_address: '', priority: 5 });
  const [addingValue, setAddingValue] = useState(false);
  const [valueForm, setValueForm] = useState({ value_name: '', category: 'personal', importance: 5 });

  const { data } = useQuery({
    queryKey,
    queryFn: async () => {
      const [objRes, critRes, valRes, offRes] = await Promise.all([
        supabase.from('hidden_objections').select('*').eq('contact_id', contactId).order('created_at', { ascending: false }),
        supabase.from('decision_criteria').select('*').eq('contact_id', contactId).order('priority', { ascending: false }),
        supabase.from('client_values').select('*').eq('contact_id', contactId).order('importance', { ascending: false }),
        supabase.from('offer_suggestions').select('*').eq('contact_id', contactId).order('created_at', { ascending: false }),
      ]);
      return {
        objections: objRes.data || [],
        criteria: critRes.data || [],
        values: valRes.data || [],
        offers: offRes.data || [],
      };
    },
    enabled: !!contactId && !!user,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // ─── Mutations ────────────────────────────────────────────
  const resolveObjection = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('hidden_objections').update({ resolved: true, resolved_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Objeção resolvida'); queryClient.invalidateQueries({ queryKey }); },
    onError: (e) => toast.error(`Erro: ${e.message}`),
  });

  const addCriteria = useMutation({
    mutationFn: async (data: typeof criteriaForm) => {
      if (!user) throw new Error('Not auth');
      const { error } = await supabase.from('decision_criteria').insert({
        contact_id: contactId, user_id: user.id,
        name: data.name, criteria_type: data.criteria_type,
        how_to_address: data.how_to_address || null, priority: data.priority,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Critério adicionado');
      queryClient.invalidateQueries({ queryKey });
      setAddingCriteria(false);
      setCriteriaForm({ name: '', criteria_type: 'rational', how_to_address: '', priority: 5 });
    },
    onError: (e) => toast.error(`Erro: ${e.message}`),
  });

  const deleteCriteria = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('decision_criteria').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Critério removido'); queryClient.invalidateQueries({ queryKey }); },
    onError: (e) => toast.error(`Erro: ${e.message}`),
  });

  const addValue = useMutation({
    mutationFn: async (data: typeof valueForm) => {
      if (!user) throw new Error('Not auth');
      const { error } = await supabase.from('client_values').insert({
        contact_id: contactId, user_id: user.id,
        value_name: data.value_name, category: data.category, importance: data.importance,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Valor adicionado');
      queryClient.invalidateQueries({ queryKey });
      setAddingValue(false);
      setValueForm({ value_name: '', category: 'personal', importance: 5 });
    },
    onError: (e) => toast.error(`Erro: ${e.message}`),
  });

  const deleteValue = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('client_values').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Valor removido'); queryClient.invalidateQueries({ queryKey }); },
    onError: (e) => toast.error(`Erro: ${e.message}`),
  });

  const objections = data?.objections || [];
  const criteria = data?.criteria || [];
  const values = data?.values || [];
  const offers = data?.offers || [];
  const unresolvedObjections = objections.filter(o => !o.resolved);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ModuleHelp {...moduleHelpContent.neuromarketing} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
      {/* Hidden Objections */}
      <Card className={cn(unresolvedObjections.length > 0 && 'border-accent/30 dark:border-accent/30')}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-accent" />
            Objeções Ocultas ({unresolvedObjections.length} ativas)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {unresolvedObjections.length > 0 ? (
            <div className="space-y-2">
              {unresolvedObjections.map((obj) => (
                <div key={obj.id} className="rounded-lg border p-2.5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">{obj.objection_type}</span>
                    <div className="flex items-center gap-1">
                      <Badge
                        variant="outline"
                        className={cn('text-xs',
                          obj.severity === 'high' ? 'text-destructive border-destructive' :
                          obj.severity === 'medium' ? 'text-accent border-accent/30' :
                          'text-muted-foreground'
                        )}
                      >
                        {obj.severity}
                      </Badge>
                      <Button
                        variant="ghost" size="sm" className="h-6 w-6 p-0 text-success hover:text-success"
                        onClick={() => resolveObjection.mutate(obj.id)}
                        title="Marcar como resolvida"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{obj.indicator}</p>
                  {obj.possible_real_objection && (
                    <p className="text-xs text-foreground mt-1">
                      <strong>Provável:</strong> {obj.possible_real_objection}
                    </p>
                  )}
                  {obj.suggested_probe && (
                    <p className="text-xs text-primary mt-1">
                      💡 {obj.suggested_probe}
                    </p>
                  )}
                  {obj.probability && (
                    <Progress value={obj.probability} className="h-1.5 mt-2" />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <InlineEmptyState icon={AlertTriangle} title="Nenhuma objeção detectada" description="A IA identificará objeções ocultas conforme interações são analisadas" />
          )}
        </CardContent>
      </Card>

      {/* Decision Criteria */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Critérios de Decisão ({criteria.length})
            </div>
            <Button variant="ghost" size="sm" className="h-6 px-1.5 text-[10px]" onClick={() => setAddingCriteria(true)}>
              <Plus className="h-3 w-3 mr-0.5" />Adicionar
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {addingCriteria && (
            <div className="space-y-2 mb-3 rounded-lg border border-primary/20 p-2.5">
              <Input value={criteriaForm.name} onChange={e => setCriteriaForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome do critério" className="h-7 text-xs" />
              <div className="grid grid-cols-2 gap-2">
                <Select value={criteriaForm.criteria_type} onValueChange={v => setCriteriaForm(f => ({ ...f, criteria_type: v }))}>
                  <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['rational', 'emotional', 'social', 'financial', 'technical'].map(t => (
                      <SelectItem key={t} value={t} className="text-xs capitalize">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={String(criteriaForm.priority)} onValueChange={v => setCriteriaForm(f => ({ ...f, priority: Number(v) }))}>
                  <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5,6,7,8,9,10].map(p => (
                      <SelectItem key={p} value={String(p)} className="text-xs">P{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Input value={criteriaForm.how_to_address} onChange={e => setCriteriaForm(f => ({ ...f, how_to_address: e.target.value }))} placeholder="Como abordar (opcional)" className="h-7 text-xs" />
              <div className="flex gap-1 justify-end">
                <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setAddingCriteria(false)}><X className="h-3 w-3" /></Button>
                <Button size="sm" className="h-6 text-xs" disabled={!criteriaForm.name.trim()} onClick={() => addCriteria.mutate(criteriaForm)}>Salvar</Button>
              </div>
            </div>
          )}
          {criteria.length > 0 ? (
            <div className="space-y-2">
              {criteria.map((c) => (
                <div key={c.id} className="flex items-start justify-between rounded-lg border p-2.5 text-sm group">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">{c.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{c.criteria_type}</p>
                    {c.how_to_address && <p className="text-xs text-primary mt-1">→ {c.how_to_address}</p>}
                    {c.detected_from && <p className="text-[10px] text-muted-foreground/60 mt-0.5">Fonte: {c.detected_from}</p>}
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="text-xs">P{c.priority || 1}</Badge>
                    <Button variant="ghost" size="sm" className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 text-destructive" onClick={() => deleteCriteria.mutate(c.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : !addingCriteria ? (
            <InlineEmptyState icon={Target} title="Sem critérios registrados" description="Critérios de decisão serão detectados automaticamente" />
          ) : null}
        </CardContent>
      </Card>

      {/* Client Values */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-primary" />
              Valores do Cliente ({values.length})
            </div>
            <Button variant="ghost" size="sm" className="h-6 px-1.5 text-[10px]" onClick={() => setAddingValue(true)}>
              <Plus className="h-3 w-3 mr-0.5" />Adicionar
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {addingValue && (
            <div className="space-y-2 mb-3 rounded-lg border border-primary/20 p-2.5">
              <Input value={valueForm.value_name} onChange={e => setValueForm(f => ({ ...f, value_name: e.target.value }))} placeholder="Nome do valor" className="h-7 text-xs" />
              <div className="grid grid-cols-2 gap-2">
                <Select value={valueForm.category} onValueChange={v => setValueForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['personal', 'professional', 'financial', 'social', 'ethical', 'family'].map(c => (
                      <SelectItem key={c} value={c} className="text-xs capitalize">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={String(valueForm.importance)} onValueChange={v => setValueForm(f => ({ ...f, importance: Number(v) }))}>
                  <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5,6,7,8,9,10].map(i => (
                      <SelectItem key={i} value={String(i)} className="text-xs">{i}/10</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-1 justify-end">
                <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setAddingValue(false)}><X className="h-3 w-3" /></Button>
                <Button size="sm" className="h-6 text-xs" disabled={!valueForm.value_name.trim()} onClick={() => addValue.mutate(valueForm)}>Salvar</Button>
              </div>
            </div>
          )}
          {values.length > 0 ? (
            <div className="space-y-2">
              {values.map((v) => (
                <div key={v.id} className="flex items-center justify-between rounded-lg border p-2 text-sm group">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">{v.value_name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{v.category}</p>
                    {v.detected_phrases && v.detected_phrases.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {v.detected_phrases.slice(0, 3).map((p, i) => (
                          <span key={i} className="text-[10px] text-muted-foreground/60 italic">"{p}"</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="text-right">
                      <span className="text-xs text-muted-foreground">{v.importance}/10</span>
                      {(v.frequency ?? 0) > 1 && <p className="text-xs text-muted-foreground">{v.frequency}x</p>}
                    </div>
                    <Button variant="ghost" size="sm" className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 text-destructive" onClick={() => deleteValue.mutate(v.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : !addingValue ? (
            <InlineEmptyState icon={Heart} title="Nenhum valor detectado" description="Valores serão identificados nas conversas" />
          ) : null}
        </CardContent>
      </Card>

      {/* Offer Suggestions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Gift className="h-4 w-4 text-success" />
            Sugestões de Oferta ({offers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {offers.length > 0 ? (
            <div className="space-y-2">
              {offers.map((o) => {
                const statusConfig: Record<string, string> = {
                  pending: 'bg-warning text-warning',
                  presented: 'bg-info text-info',
                  accepted: 'bg-success text-success',
                  rejected: 'bg-destructive text-destructive',
                };
                return (
                  <div key={o.id} className="rounded-lg border p-2.5 text-sm">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-foreground">{o.offer_name}</p>
                      <Badge className={cn('text-xs', statusConfig[o.status || 'pending'])}>
                        {o.status || 'pending'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{o.reason}</p>
                    {o.confidence_score && (
                      <div className="flex items-center gap-2 mt-1">
                        <Progress value={o.confidence_score} className="h-1.5 flex-1" />
                        <span className="text-xs text-muted-foreground">{o.confidence_score}%</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <InlineEmptyState icon={Gift} title="Sem sugestões de oferta" description="Use o painel de IA para gerar sugestões personalizadas" />
          )}
        </CardContent>
      </Card>
      </div>

      <SocialIntelligencePanel contactId={contactId} />

      <div className="grid gap-4 md:grid-cols-2">
        <CommunicationPreferencesCard contactId={contactId} />
        <ScoreHistoryPanel contactId={contactId} />
        <WorkspaceAccountsCard contactId={contactId} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <EmotionalAnchorsPanel contactId={contactId} />
        <BestTimeToContactCard contactId={contactId} />
      </div>

      <AIActionsPanel
        contactId={contactId}
        contactName={contactName || 'Contato'}
        linkedinUrl={linkedinUrl}
        websiteUrl={websiteUrl}
      />
    </div>
  );
}
