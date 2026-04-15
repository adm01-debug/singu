import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useHandoffQueue, useRespondHandoff } from '@/hooks/useHandoffQueue';
import { useSalesTeam } from '@/hooks/useSalesTeam';
import { STATUS_LABELS } from '@/types/leadRouting';
import type { HandoffRequest, SalesTeamMember } from '@/types/leadRouting';
import { Check, X, ArrowRight, Clock, Inbox } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function QualificationBadges({ data }: { data: HandoffRequest['qualification_data'] }) {
  if (!data) return null;
  const items = [
    data.budget && { label: 'Budget', value: data.budget },
    data.authority && { label: 'Autoridade', value: data.authority },
    data.need && { label: 'Necessidade', value: data.need },
    data.timeline && { label: 'Timeline', value: data.timeline },
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  if (items.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {items.map((item) => (
        <Badge key={item.label} variant="outline" className="text-xs">
          {item.label}: {item.value}
        </Badge>
      ))}
      {data.relationship_score != null && (
        <Badge variant="secondary" className="text-xs">
          Score: {data.relationship_score}
        </Badge>
      )}
      {data.disc_profile && (
        <Badge variant="secondary" className="text-xs">
          DISC: {data.disc_profile}
        </Badge>
      )}
    </div>
  );
}

function statusColor(status: HandoffRequest['status']): string {
  const map: Record<string, string> = {
    pending: 'bg-warning/10 text-warning border-warning/30',
    accepted: 'bg-success/10 text-success border-success/30',
    rejected: 'bg-destructive/10 text-destructive border-destructive/30',
    expired: 'bg-muted text-muted-foreground',
    cancelled: 'bg-muted text-muted-foreground',
  };
  return map[status] ?? '';
}

function getMemberName(id: string, membersMap: Map<string, SalesTeamMember>): string {
  return membersMap.get(id)?.name ?? 'Desconhecido';
}

export default function HandoffQueueTab() {
  const { data: handoffs = [], isLoading } = useHandoffQueue();
  const { data: members = [] } = useSalesTeam();
  const respond = useRespondHandoff();

  const membersMap = useMemo(() => {
    const map = new Map<string, SalesTeamMember>();
    if (Array.isArray(members)) {
      members.forEach((m) => map.set(m.id, m));
    }
    return map;
  }, [members]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
      </div>
    );
  }

  const pending = handoffs.filter((h) => h.status === 'pending');
  const resolved = handoffs.filter((h) => h.status !== 'pending');

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Clock className="h-4 w-4 text-warning" />
          Pendentes ({pending.length})
        </h3>
        {pending.length === 0 ? (
          <Card className="border border-dashed">
            <CardContent className="p-8 text-center text-muted-foreground">
              <Inbox className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">Nenhum handoff pendente</p>
              <p className="text-xs mt-1">Handoffs SDR → Closer aparecerão aqui quando solicitados.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {pending.map((h) => (
              <Card key={h.id} className="border border-warning/30">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-sm flex-wrap">
                        <span className="font-medium">{getMemberName(h.from_member_id, membersMap)}</span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="font-medium">
                          {h.to_member_id ? getMemberName(h.to_member_id, membersMap) : 'Qualquer Closer'}
                        </span>
                        <Badge className={statusColor(h.status)}>{STATUS_LABELS[h.status]}</Badge>
                      </div>
                      {h.handoff_reason && (
                        <p className="text-xs text-muted-foreground mt-1">{h.handoff_reason}</p>
                      )}
                      <QualificationBadges data={h.qualification_data} />
                      {h.notes && <p className="text-xs mt-2 italic text-muted-foreground">{h.notes}</p>}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(h.created_at), { addSuffix: true, locale: ptBR })}
                        {' · SLA: '}{h.sla_hours}h
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => respond.mutate({ id: h.id, action: 'accept' })}
                        disabled={respond.isPending}
                      >
                        <Check className="h-4 w-4 mr-1" /> Aceitar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => respond.mutate({ id: h.id, action: 'reject' })}
                        disabled={respond.isPending}
                      >
                        <X className="h-4 w-4 mr-1" /> Rejeitar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {resolved.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3">Histórico ({resolved.length})</h3>
          <div className="space-y-2">
            {resolved.slice(0, 20).map((h) => (
              <Card key={h.id} className="border">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <Badge className={statusColor(h.status)}>{STATUS_LABELS[h.status]}</Badge>
                      <span className="text-muted-foreground">
                        {getMemberName(h.from_member_id, membersMap)} → {h.to_member_id ? getMemberName(h.to_member_id, membersMap) : '—'}
                      </span>
                      {h.handoff_reason && <span className="text-muted-foreground text-xs">· {h.handoff_reason}</span>}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(h.created_at), { addSuffix: true, locale: ptBR })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
