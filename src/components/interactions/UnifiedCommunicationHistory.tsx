import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useUnifiedCommunicationHistory, type InteractionHistoryItem } from '@/hooks/useInteractionsRpc';
import { MessageSquare, Phone, Mail, Globe, Users, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const channelIcons: Record<string, typeof MessageSquare> = {
  whatsapp: MessageSquare,
  call: Phone,
  email: Mail,
  meeting: Users,
  note: Edit,
  social: Globe,
};

const channelColors: Record<string, string> = {
  whatsapp: 'bg-success/10 text-success',
  call: 'bg-info/10 text-info',
  email: 'bg-primary/10 text-primary',
  meeting: 'bg-warning/10 text-warning',
  note: 'bg-muted text-muted-foreground',
  social: 'bg-accent text-accent-foreground',
};

export const UnifiedCommunicationHistory = React.memo(function UnifiedCommunicationHistory({ contactId }: { contactId: string }) {
  const { data: history, isLoading } = useUnifiedCommunicationHistory(contactId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Comunicação Unificada</CardTitle>
        </CardHeader>
        <CardContent><Skeleton className="h-40" /></CardContent>
      </Card>
    );
  }

  if (!history || history.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          Comunicação Unificada
          <Badge variant="outline" className="text-[10px] ml-auto">{history.length}</Badge>
        </CardTitle>
        <CardDescription className="text-xs">Todas as interações consolidadas de todos os canais</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-[350px] overflow-y-auto">
          {history.map((item: InteractionHistoryItem) => {
            const channel = item.channel || item.type || 'note';
            const Icon = channelIcons[channel] || MessageSquare;
            const colorClass = channelColors[channel] || channelColors.note;

            return (
              <div key={item.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/30 transition-colors border border-border/30">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {item.resumo || item.type}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="outline" className="text-[9px]">{channel}</Badge>
                    {item.direction && (
                      <span className="text-[9px] text-muted-foreground">
                        {item.direction === 'inbound' ? '← Recebido' : '→ Enviado'}
                      </span>
                    )}
                    {item.data_interacao && (
                      <span className="text-[9px] text-muted-foreground ml-auto">
                        {format(new Date(item.data_interacao), "dd/MM/yy HH:mm", { locale: ptBR })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
});

export default UnifiedCommunicationHistory;
