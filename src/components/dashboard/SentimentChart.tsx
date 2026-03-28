import { motion } from 'framer-motion';
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
import { Activity } from 'lucide-react';
import type { ChartProps } from './chartUtils';
import { getSentimentData, getSentimentStats } from './chartUtils';
import { CustomTooltip, ComparisonBadge } from './ChartTooltips';

export const SentimentChart = ({ period }: ChartProps) => {
  const sentimentData = getSentimentData(period);
  const stats = getSentimentStats(period);

  // Prepare data for comparison bar chart
  const comparisonData = sentimentData.map(item => ({
    ...item,
    change: item.value - item.prevValue,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.6 }}
    >
      <Card className="h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Activity className="w-5 h-5 text-accent" />
              Análise de Sentimento
            </CardTitle>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            <ComparisonBadge comparison={stats.positivo} label="positivo" />
            <ComparisonBadge comparison={stats.negativo} label="negativo" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  type="number"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  width={80}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Atual" radius={[0, 4, 4, 0]}>
                  {comparisonData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
                <Bar dataKey="prevValue" name="Anterior" radius={[0, 4, 4, 0]} opacity={0.4}>
                  {comparisonData.map((entry, index) => (
                    <Cell key={`cell-prev-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
