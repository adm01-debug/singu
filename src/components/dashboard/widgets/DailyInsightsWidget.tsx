import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useDailyInsights } from '@/hooks/useReportsAnalytics';
import { Sparkles } from 'lucide-react';

export const DailyInsightsWidget = React.memo(function DailyInsightsWidget() {
  const { data: insights, isLoading } = useDailyInsights();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Insights do Dia</CardTitle>
        </CardHeader>
        <CardContent><Skeleton className="h-28" /></CardContent>
      </Card>
    );
  }

  if (!insights || !Array.isArray(insights) || insights.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Insights do Dia
          <Badge variant="outline" className="text-[10px] ml-auto">{insights.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {insights.slice(0, 5).map((insight: Record<string, unknown>, i: number) => (
            <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-muted/30">
              <span className="text-sm mt-0.5">💡</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{String(insight.title || insight.insight || '')}</p>
                {insight.description && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{String(insight.description)}</p>
                )}
                {insight.action && (
                  <p className="text-xs text-primary mt-1">→ {String(insight.action)}</p>
                )}
              </div>
              {insight.priority && (
                <Badge variant="outline" className="text-[10px] shrink-0">{String(insight.priority)}</Badge>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});

export default DailyInsightsWidget;
