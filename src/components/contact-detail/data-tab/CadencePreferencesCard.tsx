import { Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Tables, Json } from '@/integrations/supabase/types';

function ResponseRateChart({ rates }: { rates: Json }) {
  if (!rates || typeof rates !== 'object' || Array.isArray(rates)) return null;
  const entries = Object.entries(rates as Record<string, number>).filter(([, v]) => typeof v === 'number' && v > 0);
  if (entries.length === 0) return null;
  const maxRate = Math.max(...entries.map(([, v]) => v));

  return (
    <div className="space-y-1.5">
      <span className="text-xs text-muted-foreground font-medium">Taxa de resposta por canal</span>
      {entries.map(([channel, rate]) => (
        <div key={channel} className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground w-16 capitalize truncate">{channel}</span>
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(rate / maxRate) * 100}%` }} />
          </div>
          <span className="text-[10px] text-foreground font-medium w-8 text-right">{rate}%</span>
        </div>
      ))}
    </div>
  );
}

interface Props {
  cadence: Tables<'contact_cadence'> | null;
  preferences: Tables<'contact_preferences'> | null;
  commPreferences: Tables<'communication_preferences'> | null;
}

export function CadencePreferencesCard({ cadence, preferences, commPreferences }: Props) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Clock className="h-4 w-4 text-info" />
          Cadência & Preferências
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {cadence ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Frequência</span>
              <span className="font-medium">A cada {cadence.cadence_days} dias</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Prioridade</span>
              <Badge variant="outline" className="text-xs capitalize">{cadence.priority || 'medium'}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Auto-lembrete</span>
              <Badge variant={cadence.auto_remind ? 'default' : 'secondary'} className="text-xs">
                {cadence.auto_remind ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
            {cadence.next_contact_due && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Próximo contato</span>
                <span className="text-xs">{format(new Date(cadence.next_contact_due), 'dd/MM/yyyy')}</span>
              </div>
            )}
            {cadence.last_contact_at && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Último contato</span>
                <span className="text-xs">{formatDistanceToNow(new Date(cadence.last_contact_at), { addSuffix: true, locale: ptBR })}</span>
              </div>
            )}
            {cadence.notes && <p className="text-xs text-muted-foreground italic border-t pt-2">{cadence.notes}</p>}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-2">Sem cadência configurada</p>
        )}

        {preferences && (
          <>
            <Separator />
            <div className="space-y-2">
              {preferences.preferred_channel && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Canal preferido</span>
                  <Badge variant="outline" className="text-xs capitalize">{preferences.preferred_channel}</Badge>
                </div>
              )}
              {(preferences.preferred_days?.length ?? 0) > 0 && (
                <div>
                  <span className="text-xs text-muted-foreground">Dias preferidos</span>
                  <div className="mt-0.5 flex gap-1 flex-wrap">
                    {preferences.preferred_days?.map((d: string) => (
                      <Badge key={d} variant="secondary" className="text-[10px]">{d}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {(preferences.preferred_times?.length ?? 0) > 0 && (
                <div>
                  <span className="text-xs text-muted-foreground">Horários preferidos</span>
                  <div className="mt-0.5 flex gap-1 flex-wrap">
                    {preferences.preferred_times?.map((t: string) => (
                      <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {(preferences.avoid_days?.length ?? 0) > 0 && (
                <div>
                  <span className="text-xs text-muted-foreground">Dias a evitar</span>
                  <div className="mt-0.5 flex gap-1 flex-wrap">
                    {preferences.avoid_days?.map((d: string) => (
                      <Badge key={d} variant="outline" className="text-[10px] border-destructive/30 text-destructive">{d}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {(preferences.avoid_times?.length ?? 0) > 0 && (
                <div>
                  <span className="text-xs text-muted-foreground">Horários a evitar</span>
                  <div className="mt-0.5 flex gap-1 flex-wrap">
                    {preferences.avoid_times?.map((t: string) => (
                      <Badge key={t} variant="outline" className="text-[10px] border-destructive/30 text-destructive">{t}</Badge>
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
                  <p className="text-xs text-foreground italic">{preferences.personal_notes}</p>
                </div>
              )}
            </div>
          </>
        )}

        {commPreferences && (
          <>
            <Separator />
            <div className="space-y-2">
              {commPreferences.contact_frequency && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Frequência de contato</span>
                  <Badge variant="outline" className="text-xs capitalize">{commPreferences.contact_frequency}</Badge>
                </div>
              )}
              {commPreferences.preferred_time_start && commPreferences.preferred_time_end && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Janela horária</span>
                  <span className="text-xs">{commPreferences.preferred_time_start} – {commPreferences.preferred_time_end}</span>
                </div>
              )}
              {commPreferences.notes && (
                <div>
                  <span className="text-xs text-muted-foreground">Observações</span>
                  <p className="text-xs text-foreground italic">{commPreferences.notes}</p>
                </div>
              )}
              <ResponseRateChart rates={commPreferences.response_rate_by_channel} />
            </div>
          </>
        )}

        {!cadence && !preferences && !commPreferences && (
          <p className="text-xs text-muted-foreground text-center py-2">Sem preferências configuradas</p>
        )}
      </CardContent>
    </Card>
  );
}
