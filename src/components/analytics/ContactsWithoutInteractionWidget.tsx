import { Ghost, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ExternalDataCard } from '@/components/ui/external-data-card';
import { useContactsWithoutInteraction } from '@/hooks/useContactsWithoutInteraction';
import { format } from 'date-fns';

export function ContactsWithoutInteractionWidget() {
  const { data: contacts, isLoading, error, refetch } = useContactsWithoutInteraction(15);

  return (
    <ExternalDataCard
      title="Sem Interação"
      icon={<Ghost className="h-4 w-4 text-muted-foreground" />}
      isLoading={isLoading}
      error={error}
      onRetry={refetch}
      hasData={!!contacts?.length}
      emptyMessage="Todos os contatos possuem interações"
    >
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm font-medium">
            <span className="flex items-center gap-2">
              <Ghost className="h-4 w-4 text-muted-foreground" />
              Sem Nenhuma Interação
            </span>
            <Badge variant="outline" className="text-[10px]">{contacts?.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-[200px]">
            <div className="space-y-1.5">
              {contacts?.map(c => (
                <div key={c.contact_id} className="flex items-center justify-between text-xs p-1.5 rounded hover:bg-muted/30 transition-colors">
                  <span className="font-medium truncate flex-1">{c.contact_name}</span>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span className="tabular-nums text-muted-foreground text-[10px]">
                      {format(new Date(c.created_at), 'dd/MM/yy')}
                    </span>
                    <Badge variant="outline" className="text-[9px] tabular-nums">{c.days_since_creation}d</Badge>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </ExternalDataCard>
  );
}
