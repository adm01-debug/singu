import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { NLPStats } from './NLPAnalyticsTypes';
import { NLPCustomTooltip } from './NLPCustomTooltip';

interface NLPValuesTabProps {
  stats: NLPStats;
}

export function NLPValuesTab({ stats }: NLPValuesTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Values Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Valores dos Clientes</CardTitle>
          <CardDescription>Valores mais frequentes detectados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.topValues}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip content={<NLPCustomTooltip />} />
                <Bar dataKey="count" name="Ocorrências" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Objections */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Objeções por Tipo
          </CardTitle>
          <CardDescription>Taxa de resolução por categoria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.objectionTypes.length > 0 ? (
              stats.objectionTypes.map((objection) => (
                <div key={objection.type} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium capitalize">{objection.type}</span>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">{objection.count} total</span>
                      <Badge variant={objection.resolved > objection.count / 2 ? 'default' : 'secondary'}>
                        {objection.resolved} resolvidas
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={(objection.resolved / objection.count) * 100}
                      className="h-2 flex-1"
                    />
                    <span className="text-xs text-muted-foreground w-12 text-right">
                      {Math.round((objection.resolved / objection.count) * 100)}%
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhuma objeção registrada
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
