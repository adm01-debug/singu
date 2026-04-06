import { useState, useEffect } from 'react';
import { AlertTriangle, Target, Heart, Gift, Lightbulb, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ModuleHelp, moduleHelpContent } from '@/components/ui/module-help';
import type { Tables } from '@/integrations/supabase/types';

interface Props {
  contactId: string;
}

export function ContactIntelligenceTab({ contactId }: Props) {
  const { user } = useAuth();
  const [objections, setObjections] = useState<Tables<'hidden_objections'>[]>([]);
  const [criteria, setCriteria] = useState<Tables<'decision_criteria'>[]>([]);
  const [values, setValues] = useState<Tables<'client_values'>[]>([]);
  const [offers, setOffers] = useState<Tables<'offer_suggestions'>[]>([]);

  useEffect(() => {
    if (!user || !contactId) return;

    const fetchData = async () => {
      const [objRes, critRes, valRes, offRes] = await Promise.all([
        supabase.from('hidden_objections').select('*').eq('contact_id', contactId).order('created_at', { ascending: false }),
        supabase.from('decision_criteria').select('*').eq('contact_id', contactId).order('priority', { ascending: false }),
        supabase.from('client_values').select('*').eq('contact_id', contactId).order('importance', { ascending: false }),
        supabase.from('offer_suggestions').select('*').eq('contact_id', contactId).order('created_at', { ascending: false }),
      ]);

      setObjections(objRes.data || []);
      setCriteria(critRes.data || []);
      setValues(valRes.data || []);
      setOffers(offRes.data || []);
    };

    fetchData();
  }, [user, contactId]);

  const unresolvedObjections = objections.filter(o => !o.resolved);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ModuleHelp {...moduleHelpContent.neuromarketing} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
      {/* Hidden Objections */}
      <Card className={cn(unresolvedObjections.length > 0 && 'border-orange-200 dark:border-orange-800')}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            Objeções Ocultas ({unresolvedObjections.length} ativas)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {unresolvedObjections.length > 0 ? (
            <div className="space-y-2">
              {unresolvedObjections.map((obj: any) => (
                <div key={obj.id} className="rounded-lg border p-2.5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">{obj.objection_type}</span>
                    <Badge
                      variant="outline"
                      className={cn('text-xs',
                        obj.severity === 'high' ? 'text-red-600 border-red-300' :
                        obj.severity === 'medium' ? 'text-orange-600 border-orange-300' :
                        'text-muted-foreground'
                      )}
                    >
                      {obj.severity}
                    </Badge>
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
            <p className="text-xs text-muted-foreground italic">Nenhuma objeção oculta detectada</p>
          )}
        </CardContent>
      </Card>

      {/* Decision Criteria */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Target className="h-4 w-4 text-indigo-500" />
            Critérios de Decisão ({criteria.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {criteria.length > 0 ? (
            <div className="space-y-2">
              {criteria.map((c: any) => (
                <div key={c.id} className="flex items-start justify-between rounded-lg border p-2.5 text-sm">
                  <div>
                    <p className="font-medium text-foreground">{c.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{c.criteria_type}</p>
                    {c.how_to_address && (
                      <p className="text-xs text-primary mt-1">→ {c.how_to_address}</p>
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs">P{c.priority || 1}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">Nenhum critério de decisão registrado</p>
          )}
        </CardContent>
      </Card>

      {/* Client Values */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Heart className="h-4 w-4 text-pink-500" />
            Valores do Cliente ({values.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {values.length > 0 ? (
            <div className="space-y-2">
              {values.map((v: any) => (
                <div key={v.id} className="flex items-center justify-between rounded-lg border p-2 text-sm">
                  <div>
                    <p className="font-medium text-foreground">{v.value_name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{v.category}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground">Importância: {v.importance}/10</span>
                    {v.frequency > 1 && (
                      <p className="text-xs text-muted-foreground">Mencionado {v.frequency}x</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">Nenhum valor detectado</p>
          )}
        </CardContent>
      </Card>

      {/* Offer Suggestions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Gift className="h-4 w-4 text-green-500" />
            Sugestões de Oferta ({offers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {offers.length > 0 ? (
            <div className="space-y-2">
              {offers.map((o: any) => {
                const statusConfig: Record<string, string> = {
                  pending: 'bg-yellow-100 text-yellow-700',
                  presented: 'bg-blue-100 text-blue-700',
                  accepted: 'bg-green-100 text-green-700',
                  rejected: 'bg-red-100 text-red-700',
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
            <p className="text-xs text-muted-foreground italic">Nenhuma sugestão de oferta</p>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
