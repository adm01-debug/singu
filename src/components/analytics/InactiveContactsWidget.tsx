import { UserX, AlertTriangle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ExternalDataCard } from '@/components/ui/external-data-card';
import { useInactiveContacts } from '@/hooks/useInactiveContacts';
import { cn } from '@/lib/utils';

export function InactiveContactsWidget() {
  const { data: contacts, isLoading, error, refetch } = useInactiveContacts(15);

  return (
    <ExternalDataCard
      title="Contatos Inativos"
      icon={<UserX className="h-4 w-4 text-destructive" />}
      isLoading={isLoading}
      error={error}
      onRetry={refetch}
      hasData={!!contacts?.length}
      emptyMessage="Nenhum contato inativo detectado"
    >
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm font-medium">
            <span className="flex items-center gap-2">
              <UserX className="h-4 w-4 text-destructive" />
              Contatos Inativos
            </span>
            <Badge variant="destructive" className="text-[10px]">{contacts?.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-[200px]">
            <div className="space-y-1.5">
              {contacts?.map(c => (
                <div key={c.contact_id} className="flex items-center justify-between text-xs p-1.5 rounded hover:bg-muted/30 transition-colors">
                  <span className="font-medium truncate flex-1">{c.contact_name}</span>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="tabular-nums text-muted-foreground">{c.days_inactive}d</span>
                    <Badge variant="outline" className={cn('text-[9px]',
                      c.risk_level === 'alto' || c.risk_level === 'high' ? 'border-red-500/30 text-red-600' :
                      c.risk_level === 'medio' || c.risk_level === 'medium' ? 'border-yellow-500/30 text-yellow-600' :
                      'border-muted'
                    )}>
                      {c.risk_level}
                    </Badge>
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
