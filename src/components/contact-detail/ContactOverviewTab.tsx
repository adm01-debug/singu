import { useState, useEffect } from 'react';
import { 
  Heart, Users, Clock, Star, Gift, MapPin, Target,
  MessageSquare, Calendar, Bookmark, Lightbulb, AlertTriangle, PenLine
} from 'lucide-react';
import { CollapsibleSection } from '@/components/ui/collapsible-section';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { InlineEmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { queryExternalData } from '@/lib/externalData';
import type { Tables } from '@/integrations/supabase/types';
import type { Contact, Company, Insight, Alert } from '@/hooks/useContactDetail';

interface Props {
  contact: Contact;
  company: Company | null;
  insights: Insight[];
  alerts: Alert[];
  onDismissAlert?: (id: string) => void;
  onDismissInsight?: (id: string) => void;
}

export function ContactOverviewTab({ contact, company, insights, alerts, onDismissAlert, onDismissInsight }: Props) {
  const { user } = useAuth();
  const [relatives, setRelatives] = useState<Tables<'contact_relatives'>[]>([]);
  const [lifeEvents, setLifeEvents] = useState<Tables<'life_events'>[]>([]);
  const [cadence, setCadence] = useState<Tables<'contact_cadence'> | null>(null);
  const [preferences, setPreferences] = useState<Tables<'contact_preferences'> | null>(null);

  useEffect(() => {
    if (!user || !contact.id) return;

    const fetchWithFallback = async <T,>(
      localFn: () => Promise<{ data: T | null; error: unknown }>,
      extTable: string,
      filters: Array<{ type: 'eq'; column: string; value: string }>,
    ): Promise<T | null> => {
      const { data: local } = await localFn();
      if (local && (Array.isArray(local) ? local.length > 0 : true)) return local;
      const { data: ext } = await queryExternalData<T>({ table: extTable, filters });
      if (Array.isArray(ext) && ext.length > 0) return ext as unknown as T;
      if (ext && !Array.isArray(ext)) return ext as unknown as T;
      return Array.isArray(local) ? ([] as unknown as T) : null;
    };

    const fetchData = async () => {
      const contactFilter = [{ type: 'eq' as const, column: 'contact_id', value: contact.id }];

      const [relData, eventsData, cadenceData, prefData] = await Promise.all([
        fetchWithFallback<Tables<'contact_relatives'>[]>(
          async () => supabase.from('contact_relatives').select('*').eq('contact_id', contact.id).order('name'),
          'contact_relatives', contactFilter,
        ),
        fetchWithFallback<Tables<'life_events'>[]>(
          async () => supabase.from('life_events').select('*').eq('contact_id', contact.id).order('event_date', { ascending: false }),
          'life_events', contactFilter,
        ),
        fetchWithFallback<Tables<'contact_cadence'> | null>(
          async () => supabase.from('contact_cadence').select('*').eq('contact_id', contact.id).maybeSingle(),
          'contact_cadence', contactFilter,
        ),
        fetchWithFallback<Tables<'contact_preferences'> | null>(
          async () => supabase.from('contact_preferences').select('*').eq('contact_id', contact.id).maybeSingle(),
          'contact_preferences', contactFilter,
        ),
      ]);

      setRelatives(relData || []);
      setLifeEvents(eventsData || []);
      setCadence(cadenceData);
      setPreferences(prefData);
    };

    fetchData();
  }, [user, contact.id]);

  const behavior = contact.behavior as Record<string, unknown> | null;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Alerts */}
      {alerts.length > 0 && (
        <Card className="md:col-span-2 lg:col-span-3 border-accent/30 dark:border-accent/30">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-accent dark:text-accent">
              <AlertTriangle className="h-4 w-4" />
              Alertas Ativos ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {alerts.map(alert => (
                <Badge
                  key={alert.id}
                  variant="outline"
                  className={cn(
                    'cursor-pointer text-xs',
                    alert.priority === 'high' ? 'border-destructive text-destructive' :
                    alert.priority === 'medium' ? 'border-accent/30 text-accent' :
                    'border-muted text-muted-foreground'
                  )}
                  onClick={() => onDismissAlert?.(alert.id)}
                >
                  {alert.title}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights */}
      {insights.length > 0 && (
        <Card className="md:col-span-2 lg:col-span-3">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Lightbulb className="h-4 w-4 text-warning" />
              Insights ({insights.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {insights.slice(0, 5).map(insight => (
                <div key={insight.id} className="flex items-start gap-2 rounded-lg border p-2.5 text-sm">
                  <Badge variant="outline" className="flex-shrink-0 text-xs capitalize">
                    {insight.category}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">{insight.title}</p>
                    {insight.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{insight.description}</p>
                    )}
                  </div>
                  {insight.confidence && (
                    <span className="flex-shrink-0 text-xs text-muted-foreground">{insight.confidence}%</span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Personal Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Heart className="h-4 w-4 text-primary" />
            Informações Pessoais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {contact.notes && (
            <div>
              <span className="text-xs font-medium text-muted-foreground">Notas</span>
              <p className="text-foreground">{contact.notes}</p>
            </div>
          )}
          {contact.personal_notes && (
            <div>
              <span className="text-xs font-medium text-muted-foreground">Notas Pessoais</span>
              <p className="text-foreground">{contact.personal_notes}</p>
            </div>
          )}
          {contact.family_info && (
            <div>
              <span className="text-xs font-medium text-muted-foreground">Família</span>
              <p className="text-foreground">{contact.family_info}</p>
            </div>
          )}
          {contact.hobbies && contact.hobbies.length > 0 && (
            <div>
              <span className="text-xs font-medium text-muted-foreground">Hobbies</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {contact.hobbies.map(h => (
                  <Badge key={h} variant="secondary" className="text-xs">{h}</Badge>
                ))}
              </div>
            </div>
          )}
          {contact.interests && contact.interests.length > 0 && (
            <div>
              <span className="text-xs font-medium text-muted-foreground">Interesses</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {contact.interests.map(i => (
                  <Badge key={i} variant="secondary" className="text-xs">{i}</Badge>
                ))}
              </div>
            </div>
          )}
          {!contact.notes && !contact.personal_notes && !contact.family_info && 
           (!contact.hobbies || contact.hobbies.length === 0) && 
           (!contact.interests || contact.interests.length === 0) && (
            <InlineEmptyState
              icon={PenLine}
              title="Sem informações pessoais"
              description="Adicione notas, hobbies ou interesses para personalizar o relacionamento"
            />
          )}
        </CardContent>
      </Card>

      {/* Cadence & Preferences */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Clock className="h-4 w-4 text-info" />
            Cadência & Preferências
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {cadence ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Frequência</span>
                <span className="font-medium">A cada {cadence.cadence_days} dias</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Prioridade</span>
                <Badge variant="outline" className="text-xs capitalize">{cadence.priority || 'medium'}</Badge>
              </div>
              {cadence.next_contact_due && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Próximo contato</span>
                  <span className="text-xs">{format(new Date(cadence.next_contact_due), "dd/MM/yyyy")}</span>
                </div>
              )}
              {cadence.last_contact_at && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Último contato</span>
                  <span className="text-xs">
                    {formatDistanceToNow(new Date(cadence.last_contact_at), { addSuffix: true, locale: ptBR })}
                  </span>
                </div>
              )}
            </>
          ) : (
            <InlineEmptyState
              icon={Clock}
              title="Sem cadência configurada"
              description="Defina uma frequência ideal de contato"
            />
          )}

          {preferences && (
            <>
              <Separator />
              {preferences.preferred_channel && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Canal preferido</span>
                  <Badge variant="outline" className="text-xs capitalize">{preferences.preferred_channel}</Badge>
                </div>
              )}
              {preferences.preferred_days?.length > 0 && (
                <div>
                  <span className="text-xs text-muted-foreground">Dias preferidos</span>
                  <div className="mt-1 flex gap-1">
                    {preferences.preferred_days.map((d: string) => (
                      <Badge key={d} variant="secondary" className="text-xs">{d}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {preferences.communication_tips && (
                <div>
                  <span className="text-xs text-muted-foreground">Dicas de comunicação</span>
                  <p className="text-xs text-foreground">{preferences.communication_tips}</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Relatives — Progressive Disclosure */}
      <CollapsibleSection
        title="Relacionados"
        icon={Users}
        iconColor="text-secondary"
        badge={relatives.length}
        defaultOpen={relatives.length > 0}
      >
        {relatives.length > 0 ? (
          <div className="space-y-2">
            {relatives.map((rel) => (
              <div key={rel.id} className="flex items-center justify-between rounded-lg border p-2 text-sm">
                <div>
                  <p className="font-medium text-foreground">{rel.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{rel.relationship_type}</p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  {rel.occupation && <p>{rel.occupation}</p>}
                  {rel.is_decision_influencer && (
                    <Badge variant="outline" className="text-xs text-warning">Influenciador</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <InlineEmptyState icon={Users} title="Nenhum relacionado" description="Adicione familiares ou contatos próximos" />
        )}
      </CollapsibleSection>

      {/* Life Events — Progressive Disclosure */}
      <CollapsibleSection
        title="Eventos de Vida"
        icon={Gift}
        iconColor="text-success"
        badge={lifeEvents.length}
        defaultOpen={lifeEvents.length > 0}
        className="md:col-span-2 lg:col-span-3"
      >
        {lifeEvents.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {lifeEvents.map((event) => (
              <div key={event.id} className="flex items-center gap-2 rounded-lg border p-2.5 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">{event.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(event.event_date), "dd/MM/yyyy")} · {event.event_type}
                    {event.recurring && ' · Recorrente'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <InlineEmptyState icon={Calendar} title="Nenhum evento de vida" description="Registre aniversários, promoções ou marcos importantes" />
        )}
      </CollapsibleSection>
    </div>
  );
}
