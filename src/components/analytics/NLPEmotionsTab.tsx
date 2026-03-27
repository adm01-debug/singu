import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { NLPStats } from './NLPAnalyticsTypes';
import { emotionColors } from './NLPAnalyticsTypes';
import { NLPCustomTooltip } from './NLPCustomTooltip';

interface NLPEmotionsTabProps {
  stats: NLPStats;
}

export function NLPEmotionsTab({ stats }: NLPEmotionsTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Estados Emocionais por Frequência</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.emotionalStates} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis type="number" />
                <YAxis dataKey="state" type="category" width={100} tick={{ fontSize: 12 }} />
                <Tooltip content={<NLPCustomTooltip />} />
                <Bar dataKey="count" name="Ocorrências" radius={[0, 4, 4, 0]}>
                  {stats.emotionalStates.map((entry) => (
                    <Cell
                      key={entry.state}
                      fill={emotionColors[entry.state] || 'hsl(var(--primary))'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detalhes dos Estados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.emotionalStates.length > 0 ? (
              stats.emotionalStates.map((emotion) => (
                <div key={emotion.state} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: emotionColors[emotion.state] || 'hsl(var(--primary))' }}
                    />
                    <span className="font-medium">{emotion.state}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">
                      {emotion.count} vezes
                    </span>
                    <Badge variant="outline">
                      {emotion.avgConfidence}% confiança
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhum estado emocional registrado
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
