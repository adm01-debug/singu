import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity } from 'lucide-react';
import type { ChartProps } from './chartUtils';
import { getActivityData, getActivityStats } from './chartUtils';
import { CustomTooltip } from './ChartTooltips';
import { ComparisonBadge } from './ChartTooltips';

export const ActivityChart = ({ period }: ChartProps) => {
  const activityData = getActivityData(period);
  const stats = getActivityStats(period);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <Card className="h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Atividades por Período
            </CardTitle>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            <ComparisonBadge comparison={stats.emails} label="e-mails" />
            <ComparisonBadge comparison={stats.reunioes} label="reuniões" />
            <ComparisonBadge comparison={stats.ligacoes} label="ligações" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityData} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: '10px' }}
                  formatter={(value) => <span className="text-sm text-muted-foreground">{value}</span>}
                />
                <Bar dataKey="emails" name="E-mails" fill="hsl(221, 83%, 53%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="reunioes" name="Reuniões" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="ligacoes" name="Ligações" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
