import { MessageSquare, Clock, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCommunicationPreferences } from '@/hooks/useCommunicationPreferences';

interface Props {
  contactId: string;
}

const CHANNEL_LABELS: Record<string, string> = {
  whatsapp: 'WhatsApp',
  email: 'E-mail',
  phone: 'Telefone',
  linkedin: 'LinkedIn',
  instagram: 'Instagram',
  meeting: 'Reunião',
};

const DAY_LABELS: Record<string, string> = {
  monday: 'Seg',
  tuesday: 'Ter',
  wednesday: 'Qua',
  thursday: 'Qui',
  friday: 'Sex',
  saturday: 'Sáb',
  sunday: 'Dom',
};

const FREQUENCY_LABELS: Record<string, string> = {
  daily: 'Diária',
  weekly: 'Semanal',
  biweekly: 'Quinzenal',
  monthly: 'Mensal',
  quarterly: 'Trimestral',
};

export function CommunicationPreferencesCard({ contactId }: Props) {
  const { prefs, loading } = useCommunicationPreferences(contactId);

  if (loading || !prefs) return null;

  const responseRates = prefs.response_rate_by_channel as Record<string, number> | null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <MessageSquare className="h-4 w-4 text-primary" />
          Preferências de Comunicação
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border p-2 text-center">
            <p className="text-xs text-muted-foreground">Canal Preferido</p>
            <p className="font-medium text-sm text-foreground">
              {CHANNEL_LABELS[prefs.preferred_channel] || prefs.preferred_channel}
            </p>
          </div>
          {prefs.contact_frequency && (
            <div className="rounded-lg border p-2 text-center">
              <p className="text-xs text-muted-foreground">Frequência</p>
              <p className="font-medium text-sm text-foreground">
                {FREQUENCY_LABELS[prefs.contact_frequency] || prefs.contact_frequency}
              </p>
            </div>
          )}
        </div>

        {prefs.preferred_time_start && prefs.preferred_time_end && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Horário:</span>
            <span className="text-foreground">{prefs.preferred_time_start} - {prefs.preferred_time_end}</span>
          </div>
        )}

        {prefs.preferred_days && prefs.preferred_days.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            {prefs.preferred_days.map(d => (
              <Badge key={d} variant="secondary" className="text-xs">
                {DAY_LABELS[d] || d}
              </Badge>
            ))}
          </div>
        )}

        {prefs.avoid_days && prefs.avoid_days.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">Evitar:</span>
            {prefs.avoid_days.map(d => (
              <Badge key={d} variant="outline" className="text-xs text-destructive">
                {DAY_LABELS[d] || d}
              </Badge>
            ))}
          </div>
        )}

        {responseRates && Object.keys(responseRates).length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Taxa de Resposta por Canal</p>
            <div className="grid grid-cols-2 gap-1.5">
              {Object.entries(responseRates).map(([ch, rate]) => (
                <div key={ch} className="flex items-center justify-between rounded border px-2 py-1 text-xs">
                  <span className="text-muted-foreground">{CHANNEL_LABELS[ch] || ch}</span>
                  <span className="font-medium text-foreground">{Math.round(rate * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {prefs.notes && (
          <p className="text-xs text-muted-foreground italic border-t pt-2">{prefs.notes}</p>
        )}
      </CardContent>
    </Card>
  );
}
