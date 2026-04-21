import { memo } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Phone, Mail, Calendar, FileText, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InlineEmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';
import { useInfiniteList } from '@/hooks/useInfiniteList';
import { InfiniteScrollSentinel } from '@/components/interactions/InfiniteScrollSentinel';
import type { ExternalInteraction } from '@/hooks/useExternalInteractions';

interface Props {
  interactions: ExternalInteraction[];
  contactId: string;
  headerExtra?: React.ReactNode;
  filtersActive?: boolean;
}

const channelIcon = (channel: string | null) => {
  switch ((channel || '').toLowerCase()) {
    case 'whatsapp':
    case 'sms':
      return MessageSquare;
    case 'call':
    case 'phone':
      return Phone;
    case 'email':
      return Mail;
    case 'meeting':
      return Calendar;
    default:
      return FileText;
  }
};

const sentimentColor = (s: string | null | undefined): string => {
  const v = (s || '').toLowerCase();
  if (v.includes('pos')) return 'bg-success';
  if (v.includes('neg')) return 'bg-destructive';
  if (v.includes('neu')) return 'bg-muted-foreground';
  return 'bg-border';
};

function formatDate(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export const UltimasInteracoesCard = memo(({ interactions, contactId, headerExtra, filtersActive }: Props) => {
  const items = Array.isArray(interactions) ? interactions : [];

  return (
    <Card>
      <CardHeader className="pb-3 space-y-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Últimas Interações</CardTitle>
          <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs">
            <Link to={`/interacoes?contact=${contactId}`}>
              Ver todas <ArrowRight className="h-3 w-3 ml-1" />
            </Link>
          </Button>
        </div>
        {headerExtra}
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <InlineEmptyState
            icon={MessageSquare}
            title={filtersActive ? 'Nenhuma interação nos filtros' : 'Sem interações recentes'}
            description={
              filtersActive
                ? 'Ajuste o período ou os canais selecionados acima.'
                : 'As últimas conversas, ligações e e-mails aparecerão aqui.'
            }
          />
        ) : (
          <ul className="space-y-1">
            {items.map((it) => {
              const Icon = channelIcon(it.channel);
              return (
                <li key={it.id}>
                  <Link
                    to={`/interacoes?contact=${contactId}&open=${it.id}`}
                    className="flex items-start gap-3 px-2 py-2 rounded-md hover:bg-muted/40 transition-colors"
                  >
                    <div className="mt-0.5 h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">
                          {it.assunto || it.resumo?.slice(0, 60) || 'Interação'}
                        </p>
                        <span
                          className={cn('h-1.5 w-1.5 rounded-full shrink-0', sentimentColor(it.status))}
                          title={it.status ?? ''}
                        />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <span className="capitalize">{it.channel ?? 'outro'}</span>
                        {it.direction && <span>· {it.direction}</span>}
                        <span>· {formatDate(it.data_interacao || it.created_at)}</span>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
});
UltimasInteracoesCard.displayName = 'UltimasInteracoesCard';
