import { Gauge, AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDealVelocityBenchmark } from '@/hooks/useDealVelocityBenchmark';
import { cn } from '@/lib/utils';

interface Props {
  contactId: string;
}

const VELOCITY_COLORS: Record<string, string> = {
  fast: 'text-success',
  normal: 'text-warning',
  slow: 'text-destructive',
};

export function DealVelocityCard({ contactId }: Props) {
  const { data } = useDealVelocityBenchmark(contactId);

  if (!data) return null;

  const vsTeam = data.vs_team_avg;
  const vsSegment = data.vs_segment_avg;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Gauge className="h-4 w-4 text-info" />
          Velocidade de Deal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          {data.avg_days_to_close != null && (
            <div className="rounded-lg border p-2.5 text-center">
              <p className="text-xs text-muted-foreground">Média p/ fechar</p>
              <p className="text-lg font-bold text-foreground">{data.avg_days_to_close}d</p>
            </div>
          )}
          {data.current_deal_age != null && (
            <div className="rounded-lg border p-2.5 text-center">
              <p className="text-xs text-muted-foreground">Deal atual</p>
              <p className="text-lg font-bold text-foreground">{data.current_deal_age}d</p>
            </div>
          )}
        </div>

        {data.velocity_rating && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Rating:</span>
            <Badge variant="outline" className={cn('text-xs', VELOCITY_COLORS[data.velocity_rating] || '')}>
              {data.velocity_rating}
            </Badge>
          </div>
        )}

        {data.bottleneck_stage && (
          <div className="flex items-center gap-2 text-xs">
            <AlertTriangle className="h-3 w-3 text-warning" />
            <span className="text-muted-foreground">Gargalo: <span className="font-medium text-foreground">{data.bottleneck_stage}</span></span>
          </div>
        )}

        <div className="space-y-1">
          {vsTeam != null && (
            <div className="flex items-center gap-2 text-xs">
              {vsTeam > 0 ? <TrendingDown className="h-3 w-3 text-destructive" /> : vsTeam < 0 ? <TrendingUp className="h-3 w-3 text-success" /> : <Minus className="h-3 w-3" />}
              <span className="text-muted-foreground">vs Time: {vsTeam > 0 ? '+' : ''}{vsTeam}%</span>
            </div>
          )}
          {vsSegment != null && (
            <div className="flex items-center gap-2 text-xs">
              {vsSegment > 0 ? <TrendingDown className="h-3 w-3 text-destructive" /> : vsSegment < 0 ? <TrendingUp className="h-3 w-3 text-success" /> : <Minus className="h-3 w-3" />}
              <span className="text-muted-foreground">vs Segmento: {vsSegment > 0 ? '+' : ''}{vsSegment}%</span>
            </div>
          )}
        </div>

        {data.action_recommendation && (
          <p className="text-xs text-muted-foreground bg-muted/50 rounded-md p-2">{data.action_recommendation}</p>
        )}
      </CardContent>
    </Card>
  );
}
