import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useOptimalContactWindows } from '@/hooks/useInteractionsRpc';
import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function rateClass(rate: number): string {
  if (rate >= 80) return 'bg-success text-success-foreground';
  if (rate >= 60) return 'bg-success/60';
  if (rate >= 40) return 'bg-primary/40';
  if (rate >= 20) return 'bg-primary/20';
  return 'bg-muted/30';
}

export const OptimalContactWindowsChart = React.memo(function OptimalContactWindowsChart({ contactId }: { contactId?: string }) {
  const { data: windows, isLoading } = useOptimalContactWindows(contactId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Janelas Ideais de Contato</CardTitle>
        </CardHeader>
        <CardContent><Skeleton className="h-40" /></CardContent>
      </Card>
    );
  }

  if (!windows || windows.length === 0) return null;

  // Build best windows sorted by success_rate
  const top = [...windows].sort((a, b) => b.success_rate - a.success_rate).slice(0, 6);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          Janelas Ideais de Contato
        </CardTitle>
        <CardDescription className="text-xs">Melhores horários para abordar este contato</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {top.map((w, i) => (
            <div
              key={`${w.day_of_week}-${w.hour}`}
              className={cn(
                'rounded-lg p-3 text-center transition-colors',
                i === 0 ? 'ring-1 ring-success' : '',
                'bg-muted/30'
              )}
            >
              <p className="text-xs text-muted-foreground">{DAYS[w.day_of_week]}</p>
              <p className="text-lg font-bold">{w.hour}h</p>
              <Badge variant="outline" className={cn('text-[10px] mt-1', rateClass(w.success_rate))}>
                {w.success_rate.toFixed(0)}% sucesso
              </Badge>
              <p className="text-[9px] text-muted-foreground mt-0.5">{w.total_attempts} tentativas</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});

export default OptimalContactWindowsChart;
