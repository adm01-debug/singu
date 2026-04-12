import { MessageSquare, Clock, Zap, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useCommunicationIntel, type CommunicationIntel } from '@/hooks/useCommunicationIntel';
import { cn } from '@/lib/utils';

export function CommunicationIntelWidget() {
  const { data, isLoading, error } = useCommunicationIntel();

  if (isLoading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-5 w-48" /></CardHeader>
        <CardContent className="space-y-2">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-12" />)}
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <MessageSquare className="h-4 w-4" /> Inteligência de Comunicação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground text-center py-4">Erro ao carregar dados</p>
        </CardContent>
      </Card>
    );
  }

  const records = (Array.isArray(data) ? data : [data]) as CommunicationIntel[];

  if (records.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <MessageSquare className="h-4 w-4 text-primary" /> Inteligência de Comunicação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground text-center py-4">Dados insuficientes</p>
        </CardContent>
      </Card>
    );
  }

  // Top 5 by engagement
  const top = records
    .filter(r => r.contact_name)
    .sort((a, b) => (b.engagement_score ?? 0) - (a.engagement_score ?? 0))
    .slice(0, 6);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquare className="h-5 w-5 text-primary" />
          Inteligência de Comunicação
        </CardTitle>
        <CardDescription>Canal preferido, tempo de resposta e engajamento por contato</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {top.map((r, i) => (
            <div key={r.contact_id || i} className="flex items-center gap-3 p-2.5 rounded-lg border text-sm">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{r.contact_name}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  {r.preferred_channel && (
                    <span className="flex items-center gap-1">
                      <Zap className="h-3 w-3" /> {r.preferred_channel}
                    </span>
                  )}
                  {r.best_time && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {r.best_time}
                    </span>
                  )}
                  {r.avg_response_time_min != null && (
                    <span>{Math.round(r.avg_response_time_min)}min resp.</span>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                {r.engagement_score != null && (
                  <div className="flex items-center gap-1">
                    <TrendingUp className={cn('h-3 w-3',
                      r.engagement_score >= 70 ? 'text-success' :
                      r.engagement_score >= 40 ? 'text-warning' : 'text-destructive'
                    )} />
                    <span className="text-xs font-semibold">{Math.round(r.engagement_score)}%</span>
                  </div>
                )}
                {r.response_rate != null && (
                  <Badge variant="outline" className="text-[10px]">
                    {Math.round(r.response_rate * 100)}% resp.
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
