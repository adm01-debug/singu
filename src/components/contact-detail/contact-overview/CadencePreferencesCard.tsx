import { Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { InlineEmptyState } from '@/components/ui/empty-state';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Tables } from '@/integrations/supabase/types';

interface CadencePreferencesCardProps {
  cadence: Tables<'contact_cadence'> | null;
  preferences: Tables<'contact_preferences'> | null;
}

export function CadencePreferencesCard({ cadence, preferences }: CadencePreferencesCardProps) {
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
                <span className="text-xs">{formatDistanceToNow(new Date(cadence.last_contact_at), { addSuffix: true, locale: ptBR })}</span>
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
          <InlineEmptyState icon={Clock} title="Sem cadência configurada" description="Defina uma frequência ideal de contato" />
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
                  {preferences.preferred_days!.map((d: string) => <Badge key={d} variant="secondary" className="text-xs">{d}</Badge>)}
                </div>
              </div>
            )}
            {(preferences.preferred_times?.length ?? 0) > 0 && (
              <div>
                <span className="text-xs text-muted-foreground">Horários preferidos</span>
                <div className="mt-1 flex gap-1">
                  {preferences.preferred_times!.map((t: string) => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}
                </div>
              </div>
            )}
            {(preferences.avoid_days?.length ?? 0) > 0 && (
              <div>
                <span className="text-xs text-muted-foreground">Dias a evitar</span>
                <div className="mt-1 flex gap-1">
                  {preferences.avoid_days!.map((d: string) => <Badge key={d} variant="destructive" className="text-xs">{d}</Badge>)}
                </div>
              </div>
            )}
            {(preferences.avoid_times?.length ?? 0) > 0 && (
              <div>
                <span className="text-xs text-muted-foreground">Horários a evitar</span>
                <div className="mt-1 flex gap-1">
                  {preferences.avoid_times!.map((t: string) => <Badge key={t} variant="destructive" className="text-xs">{t}</Badge>)}
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
  );
}
