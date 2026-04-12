import { useContactProposals } from '@/hooks/useContactProposals';
import { ExternalDataCard } from '@/components/ui/external-data-card';
import { Badge } from '@/components/ui/badge';
import { FileText, Eye, Check, X } from 'lucide-react';
import { format } from 'date-fns';

interface Props { contactId: string; }

const statusConfig: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
  draft: { label: 'Rascunho', icon: <FileText className="h-3 w-3" />, className: 'bg-muted text-muted-foreground' },
  sent: { label: 'Enviada', icon: <FileText className="h-3 w-3" />, className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  viewed: { label: 'Visualizada', icon: <Eye className="h-3 w-3" />, className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' },
  accepted: { label: 'Aceita', icon: <Check className="h-3 w-3" />, className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
  rejected: { label: 'Rejeitada', icon: <X className="h-3 w-3" />, className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
};

export function ProposalsCard({ contactId }: Props) {
  const { data: proposals, isLoading, error, refetch } = useContactProposals(contactId);

  return (
    <ExternalDataCard
      title="Propostas"
      icon={<FileText className="h-4 w-4" />}
      isLoading={isLoading}
      error={error}
      onRetry={refetch}
      isEmpty={!proposals?.length}
      emptyMessage="Nenhuma proposta vinculada"
      badge={proposals?.length ? `${proposals.length}` : undefined}
    >
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {proposals?.map(p => {
          const cfg = statusConfig[p.status || ''] || statusConfig.draft;
          return (
            <div key={p.id} className="flex items-center justify-between p-2 rounded-md border border-border/50 hover:bg-muted/30 transition-colors">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium truncate">{p.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {p.value != null && (
                    <span className="text-[10px] text-muted-foreground">
                      R$ {p.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  )}
                  <span className="text-[10px] text-muted-foreground">
                    {format(new Date(p.created_at), 'dd/MM/yy')}
                  </span>
                </div>
              </div>
              <Badge className={`text-[9px] ml-2 flex items-center gap-1 ${cfg.className}`}>
                {cfg.icon} {cfg.label}
              </Badge>
            </div>
          );
        })}
      </div>
    </ExternalDataCard>
  );
}
