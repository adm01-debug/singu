import React from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Building2, User, MessageSquare, Phone, Mail, Users as UsersIcon, Video, FileText, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import type { TimelineGroup } from '@/hooks/useTimelineByEntity';

const eventIcons: Record<string, typeof MessageSquare> = {
  whatsapp: MessageSquare, call: Phone, email: Mail, meeting: UsersIcon, video_call: Video, note: FileText,
};
const eventColors: Record<string, string> = {
  whatsapp: 'bg-success/10 text-success border-success/20',
  call: 'bg-info/10 text-info border-info/20',
  email: 'bg-primary/10 text-primary border-primary/20',
  meeting: 'bg-warning/10 text-warning border-warning/20',
  video_call: 'bg-secondary/10 text-secondary border-secondary/20',
  note: 'bg-muted text-muted-foreground border-border',
};
const eventLabels: Record<string, string> = {
  whatsapp: 'WhatsApp', call: 'Ligação', email: 'Email', meeting: 'Reunião', video_call: 'Vídeo', note: 'Nota',
};

interface Props {
  group: TimelineGroup;
  defaultOpen?: boolean;
}

export const TimelineGroupCard = React.memo(function TimelineGroupCard({ group, defaultOpen = false }: Props) {
  const EntityIcon = group.entity_type === 'company' ? Building2 : User;

  return (
    <Accordion type="single" collapsible defaultValue={defaultOpen ? group.entity_id : undefined} className="border border-border/60 rounded-lg bg-card">
      <AccordionItem value={group.entity_id} className="border-0">
        <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/30 rounded-lg">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <EntityIcon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="font-medium text-sm text-foreground truncate">{group.entity_name}</p>
              <p className="text-xs text-muted-foreground">
                Última atividade {formatDistanceToNow(new Date(group.last_event_at), { locale: ptBR, addSuffix: true })}
              </p>
            </div>
            <Badge variant="outline" className="text-[10px] shrink-0">{group.events.length}</Badge>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4">
          <div className="relative pl-4">
            <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />
            {group.events.map(event => {
              const Icon = eventIcons[event.type] || FileText;
              const colorClass = eventColors[event.type] || eventColors.note;
              return (
                <div key={event.id} className="relative flex gap-3 py-2.5">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 border ${colorClass} -ml-[3px]`}>
                    <Icon className="w-3 h-3" />
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 min-w-0">
                        <Badge variant="outline" className="text-[9px] shrink-0">{eventLabels[event.type] || event.type}</Badge>
                        <p className="text-sm font-medium truncate">{event.title}</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(event.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    {event.content && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{event.content}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
});
