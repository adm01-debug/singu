import { Clock, MessageSquare, DollarSign, Calendar, FileText, Mail, Phone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ExternalDataCard } from '@/components/ui/external-data-card';
import { useContactTimeline } from '@/hooks/useContactTimeline';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Props { contactId: string; }

const EVENT_ICONS: Record<string, typeof Clock> = {
  interaction: MessageSquare,
  deal: DollarSign,
  meeting: Calendar,
  proposal: FileText,
  email: Mail,
  call: Phone,
};

const EVENT_COLORS: Record<string, string> = {
  interaction: 'bg-blue-500',
  deal: 'bg-green-500',
  meeting: 'bg-purple-500',
  proposal: 'bg-orange-500',
  email: 'bg-cyan-500',
  call: 'bg-yellow-500',
};

export function ContactTimelineWidget({ contactId }: Props) {
  const { data: events, isLoading, error, refetch } = useContactTimeline(contactId);

  return (
    <ExternalDataCard
      title="Linha do Tempo"
      icon={<Clock className="h-4 w-4 text-primary" />}
      isLoading={isLoading}
      error={error}
      onRetry={refetch}
      hasData={!!events?.length}
      emptyMessage="Nenhum evento registrado"
      skeletonHeight="h-40"
    >
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm font-medium">
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Linha do Tempo
            </span>
            <Badge variant="outline" className="text-[10px]">{events?.length} eventos</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[280px] pr-3">
            <div className="relative pl-6">
              <div className="absolute left-[9px] top-2 bottom-2 w-px bg-border" />
              {events?.map((event, i) => {
                const Icon = EVENT_ICONS[event.event_type] || Clock;
                const dotColor = EVENT_COLORS[event.event_type] || 'bg-muted-foreground';
                return (
                  <div key={event.id || i} className="relative pb-4 last:pb-0">
                    <div className={cn('absolute left-[-18px] top-1 h-2.5 w-2.5 rounded-full ring-2 ring-background', dotColor)} />
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Icon className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs font-medium truncate">{event.title}</span>
                      </div>
                      {event.description && (
                        <p className="text-[10px] text-muted-foreground line-clamp-2 pl-5">{event.description}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground/70 pl-5 tabular-nums">
                        {format(new Date(event.event_date), 'dd/MM/yy HH:mm')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </ExternalDataCard>
  );
}
