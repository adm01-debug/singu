import { useContactEmailLogs } from '@/hooks/useContactEmailLogs';
import { ExternalDataCard } from '@/components/ui/external-data-card';
import { Badge } from '@/components/ui/badge';
import { Mail, Eye, MousePointerClick, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

interface Props { contactId: string; }

export function EmailLogsCard({ contactId }: Props) {
  const { data: emails, isLoading, error, refetch } = useContactEmailLogs(contactId);

  const openRate = emails?.length
    ? Math.round((emails.filter(e => e.opened_at).length / emails.length) * 100)
    : 0;

  return (
    <ExternalDataCard
      title="E-mails Enviados"
      icon={<Mail className="h-4 w-4" />}
      isLoading={isLoading}
      error={error}
      onRetry={refetch}
      hasData={!!data?.length || !!deals?.length || !!proposals?.length || !!meetings?.length || !!tasks?.length || !!emails?.length || !!surveys?.length || !!enrollments?.length || !!alerts?.length}
      hasData={false}
      emptyMessage="Nenhum e-mail registrado"
    >
      {emails && emails.length > 0 && (
        <div className="flex items-center gap-3 mb-3 p-2 rounded-lg bg-muted/50 text-[10px]">
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3 text-primary" /> Abertura: {openRate}%
          </span>
          <span className="flex items-center gap-1">
            <MousePointerClick className="h-3 w-3 text-primary" /> Cliques: {emails.filter(e => e.clicked_at).length}
          </span>
          {emails.some(e => e.bounced_at) && (
            <span className="flex items-center gap-1 text-destructive">
              <AlertTriangle className="h-3 w-3" /> {emails.filter(e => e.bounced_at).length} bounce(s)
            </span>
          )}
        </div>
      )}
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {emails?.map(email => (
          <div key={email.id} className="flex items-center justify-between p-2 rounded-md border border-border/50 hover:bg-muted/30 transition-colors">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium truncate">{email.subject || '(sem assunto)'}</p>
              <div className="flex items-center gap-2 mt-0.5">
                {email.sent_at && (
                  <span className="text-[10px] text-muted-foreground">
                    {format(new Date(email.sent_at), 'dd/MM/yy HH:mm')}
                  </span>
                )}
                {email.to_email && (
                  <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                    → {email.to_email}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 ml-2">
              {email.opened_at && <Eye className="h-3 w-3 text-green-500" />}
              {email.clicked_at && <MousePointerClick className="h-3 w-3 text-blue-500" />}
              {email.bounced_at && <AlertTriangle className="h-3 w-3 text-red-500" />}
              {!email.opened_at && !email.bounced_at && (
                <Badge variant="outline" className="text-[9px]">{email.status || 'enviado'}</Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    </ExternalDataCard>
  );
}
