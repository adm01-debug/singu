import { Heart, Handshake, Star, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useRapportIntel, type RapportIntelRecord } from '@/hooks/useRapportIntel';
import { cn } from '@/lib/utils';

export function RapportIntelWidget() {
  const { data, isLoading, error } = useRapportIntel();

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
            <Handshake className="h-4 w-4" /> Inteligência de Rapport
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground text-center py-4">Erro ao carregar dados</p>
        </CardContent>
      </Card>
    );
  }

  const records = (Array.isArray(data) ? data : [data]) as RapportIntelRecord[];

  if (records.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Handshake className="h-4 w-4 text-primary" /> Inteligência de Rapport
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground text-center py-4">Dados insuficientes</p>
        </CardContent>
      </Card>
    );
  }

  const top = records
    .filter(r => r.contact_name)
    .sort((a, b) => (b.rapport_score ?? 0) - (a.rapport_score ?? 0))
    .slice(0, 6);

  const getQualityColor = (score?: number) => {
    if (!score) return 'text-muted-foreground';
    if (score >= 80) return 'text-success';
    if (score >= 50) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Handshake className="h-5 w-5 text-primary" />
          Inteligência de Rapport
        </CardTitle>
        <CardDescription>Qualidade de conexão e dicas de aproximação</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[300px] overflow-y-auto">
          {top.map((r, i) => (
            <div key={r.contact_id || i} className="p-2.5 rounded-lg border space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-medium text-sm text-foreground truncate">{r.contact_name}</p>
                <div className="flex items-center gap-2">
                  {r.connection_quality && (
                    <Badge variant="outline" className="text-[10px]">{r.connection_quality}</Badge>
                  )}
                  {r.rapport_score != null && (
                    <span className={cn('text-sm font-bold', getQualityColor(r.rapport_score))}>
                      {Math.round(r.rapport_score)}
                    </span>
                  )}
                </div>
              </div>
              {r.rapport_score != null && <Progress value={r.rapport_score} className="h-1.5" />}
              {r.shared_interests && Array.isArray(r.shared_interests) && r.shared_interests.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap">
                  <Star className="h-3 w-3 text-warning shrink-0" />
                  {r.shared_interests.slice(0, 3).map((interest, j) => (
                    <Badge key={j} variant="secondary" className="text-[10px]">{interest}</Badge>
                  ))}
                </div>
              )}
              {r.rapport_tips && Array.isArray(r.rapport_tips) && r.rapport_tips.length > 0 && (
                <div className="flex items-start gap-1 text-xs text-muted-foreground">
                  <Lightbulb className="h-3 w-3 text-warning shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{r.rapport_tips[0]}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
