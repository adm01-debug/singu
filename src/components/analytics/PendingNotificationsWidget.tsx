import { Bell, Clock, AlertCircle, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { usePendingNotifications } from '@/hooks/usePendingNotifications';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const PRIORITY_STYLES: Record<string, string> = {
  high: 'bg-destructive/10 text-destructive border-destructive/30',
  medium: 'bg-warning/10 text-warning border-warning/30',
  low: 'bg-muted text-muted-foreground',
};

export function PendingNotificationsWidget() {
  const { data, isLoading, error } = usePendingNotifications(20);

  if (isLoading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-5 w-48" /></CardHeader>
        <CardContent className="space-y-2">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-14" />)}
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Bell className="h-4 w-4" /> Notificações Pendentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground text-center py-4">Erro ao carregar notificações</p>
        </CardContent>
      </Card>
    );
  }

  const notifications = data || [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bell className="h-5 w-5 text-primary" />
          Notificações Pendentes
          {notifications.length > 0 && (
            <Badge variant="destructive" className="text-[10px] ml-auto">{notifications.length}</Badge>
          )}
        </CardTitle>
        <CardDescription>Alertas e lembretes que aguardam ação</CardDescription>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">
            Nenhuma notificação pendente — tudo em dia! ✨
          </p>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {notifications.map((n, i) => (
              <div key={n.id || i} className="flex items-start gap-3 p-2.5 rounded-lg border text-sm">
                <AlertCircle className={cn('h-4 w-4 mt-0.5 shrink-0',
                  n.priority === 'high' ? 'text-destructive' :
                  n.priority === 'medium' ? 'text-warning' : 'text-muted-foreground'
                )} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{n.title || 'Notificação'}</p>
                  {n.contact_name && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <User className="h-3 w-3" /> {n.contact_name}
                    </p>
                  )}
                  {n.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.description}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {n.priority && (
                    <Badge variant="outline" className={cn('text-[10px]', PRIORITY_STYLES[n.priority] || '')}>
                      {n.priority}
                    </Badge>
                  )}
                  {n.due_at && (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <Clock className="h-2.5 w-2.5" />
                      {formatDistanceToNow(new Date(n.due_at), { addSuffix: true, locale: ptBR })}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
