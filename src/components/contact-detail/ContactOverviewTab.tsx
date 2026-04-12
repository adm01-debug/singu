import {
  Heart, Users, Clock, Star, Gift, MapPin, Target,
  MessageSquare, Calendar, Bookmark, Lightbulb, AlertTriangle, PenLine,
  Phone, Mail, Building2, Cake, AlertCircle, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CollapsibleSection } from '@/components/ui/collapsible-section';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { InlineEmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow, differenceInYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useContactRelationalData } from '@/hooks/useContactRelationalData';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
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
  // Use shared React Query hook instead of raw useEffect
  const { data: relData, error: relError, refetch: relRefetch } = useContactRelationalData(contact.id);

  const { data: lifeEvents = [], error: eventsError, refetch: eventsRefetch } = useQuery({
    queryKey: ['life-events', contact.id, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('life_events')
        .select('*')
        .eq('contact_id', contact.id)
        .order('event_date', { ascending: false });
      return data || [];
    },
    enabled: !!contact.id && !!user,
    staleTime: 5 * 60 * 1000,
  });

  const relatives = relData?.relatives || [];
  const cadence = relData?.cadence || null;
  const preferences = relData?.preferences || null;

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
          {(() => {
            const c = contact as Record<string, unknown>;
            const extFields = [
              { label: 'Apelido', value: c.apelido },
              { label: 'Nome de Tratamento', value: c.nome_tratamento },
              { label: 'CPF', value: c.cpf },
              { label: 'Sexo', value: c.sexo === 'M' ? 'Masculino' : c.sexo === 'F' ? 'Feminino' : c.sexo === 'NB' ? 'Não-binário' : c.sexo },
              { label: 'Cargo', value: c.cargo || contact.role_title },
              { label: 'Departamento', value: c.departamento },
              { label: 'Fonte', value: c.source },
              { label: 'Assinatura', value: c.assinatura_contato },
            ].filter(f => f.value);
            return extFields.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {extFields.map(f => (
                  <div key={f.label}>
                    <span className="text-xs font-medium text-muted-foreground">{f.label}</span>
                    <p className="text-foreground">{f.value as string}</p>
                  </div>
                ))}
              </div>
            ) : null;
          })()}

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
          {(() => {
            const interests = contact.interests || (contact as Record<string, unknown>).interests_array as string[] | undefined;
            return interests && interests.length > 0 ? (
              <div>
                <span className="text-xs font-medium text-muted-foreground">Interesses</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {interests.map(i => (
                    <Badge key={i} variant="secondary" className="text-xs">{i}</Badge>
                  ))}
                </div>
              </div>
            ) : null;
          })()}

          {/* Extra data from external DB */}
          {(() => {
            const extraData = (contact as Record<string, unknown>).extra_data as Record<string, unknown> | null;
            if (!extraData || Object.keys(extraData).length === 0) return null;
            return (
              <div>
                <span className="text-xs font-medium text-muted-foreground">Dados Extras</span>
                <div className="mt-1 grid grid-cols-2 gap-1.5">
                  {Object.entries(extraData).map(([key, val]) => val ? (
                    <div key={key} className="rounded border px-2 py-1 text-xs">
                      <span className="text-muted-foreground">{key.replace(/_/g, ' ')}: </span>
                      <span className="text-foreground">{String(val)}</span>
                    </div>
                  ) : null)}
                </div>
              </div>
            );
          })()}

          {!contact.notes && !contact.personal_notes && !contact.family_info && 
           (!contact.hobbies || contact.hobbies.length === 0) && 
           (!contact.interests || (contact.interests as string[]).length === 0) &&
           !(contact as Record<string, unknown>).apelido && !(contact as Record<string, unknown>).cpf && (
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
              {cadence.auto_remind && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Auto-lembrete</span>
                  <Badge variant="secondary" className="text-xs">Ativo</Badge>
                </div>
              )}
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
              {cadence.notes && (
                <div>
                  <span className="text-xs text-muted-foreground">Notas da cadência</span>
                  <p className="text-xs text-foreground">{cadence.notes}</p>
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
              {(preferences.preferred_days?.length ?? 0) > 0 && (
                <div>
                  <span className="text-xs text-muted-foreground">Dias preferidos</span>
                  <div className="mt-1 flex gap-1">
                    {preferences.preferred_days!.map((d: string) => (
                      <Badge key={d} variant="secondary" className="text-xs">{d}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {(preferences.preferred_times?.length ?? 0) > 0 && (
                <div>
                  <span className="text-xs text-muted-foreground">Horários preferidos</span>
                  <div className="mt-1 flex gap-1">
                    {preferences.preferred_times!.map((t: string) => (
                      <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {(preferences.avoid_days?.length ?? 0) > 0 && (
                <div>
                  <span className="text-xs text-muted-foreground">Dias a evitar</span>
                  <div className="mt-1 flex gap-1">
                    {preferences.avoid_days!.map((d: string) => (
                      <Badge key={d} variant="destructive" className="text-xs">{d}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {(preferences.avoid_times?.length ?? 0) > 0 && (
                <div>
                  <span className="text-xs text-muted-foreground">Horários a evitar</span>
                  <div className="mt-1 flex gap-1">
                    {preferences.avoid_times!.map((t: string) => (
                      <Badge key={t} variant="destructive" className="text-xs">{t}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {preferences.restrictions && (
                <div>
                  <span className="text-xs text-muted-foreground">Restrições</span>
                  <p className="text-xs text-foreground">{preferences.restrictions}</p>
                </div>
              )}
              {preferences.communication_tips && (
                <div>
                  <span className="text-xs text-muted-foreground">Dicas de comunicação</span>
                  <p className="text-xs text-foreground">{preferences.communication_tips}</p>
                </div>
              )}
              {preferences.personal_notes && (
                <div>
                  <span className="text-xs text-muted-foreground">Notas pessoais</span>
                  <p className="text-xs text-foreground">{preferences.personal_notes}</p>
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
              <div key={rel.id} className="rounded-lg border p-2.5 text-sm space-y-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">{rel.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{rel.relationship_type}</p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground space-y-0.5">
                    {rel.occupation && <p>{rel.occupation}</p>}
                    {rel.company && (
                      <span className="flex items-center gap-1 justify-end">
                        <Building2 className="h-3 w-3" />
                        {rel.company}
                      </span>
                    )}
                    {rel.is_decision_influencer && (
                      <Badge variant="outline" className="text-xs text-warning">Influenciador</Badge>
                    )}
                  </div>
                </div>
                {/* Extended relative info */}
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {rel.age && (
                    <span>{rel.age} anos</span>
                  )}
                  {rel.birthday && (
                    <span className="flex items-center gap-0.5">
                      <Cake className="h-3 w-3" />
                      {format(new Date(rel.birthday), "dd/MM")}
                    </span>
                  )}
                  {rel.phone && (
                    <a href={`tel:${rel.phone}`} className="flex items-center gap-0.5 hover:text-foreground">
                      <Phone className="h-3 w-3" />
                      {rel.phone}
                    </a>
                  )}
                  {rel.email && (
                    <a href={`mailto:${rel.email}`} className="flex items-center gap-0.5 hover:text-foreground">
                      <Mail className="h-3 w-3" />
                      <span className="truncate max-w-[120px]">{rel.email}</span>
                    </a>
                  )}
                </div>
                {rel.notes && (
                  <p className="text-xs text-muted-foreground italic">{rel.notes}</p>
                )}
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
              <div key={event.id} className="flex items-start gap-2 rounded-lg border p-2.5 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">{event.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(event.event_date), "dd/MM/yyyy")} · {event.event_type}
                    {event.recurring && ' · Recorrente'}
                  </p>
                  {event.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{event.description}</p>
                  )}
                  {event.reminder_days_before != null && (
                    <Badge variant="outline" className="text-[10px] mt-1">
                      Lembrete: {event.reminder_days_before}d antes
                    </Badge>
                  )}
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
