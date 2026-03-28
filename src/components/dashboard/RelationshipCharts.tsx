import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
  Line,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, PieChart as PieChartIcon, BarChart3 } from 'lucide-react';
import type { ChartProps } from './chartUtils';
import {
  calcChange,
  getEvolutionData,
  getEvolutionStats,
  getRelationshipData,
  contactsByRole,
} from './chartUtils';
import { CustomTooltip, PieTooltip, ComparisonBadge } from './ChartTooltips';

export const RelationshipEvolutionChart = ({ period }: ChartProps) => {
  const evolutionData = getEvolutionData(period);
  const stats = getEvolutionStats(period);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
    >
      <Card className="h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-success" />
              Evolução do Relacionamento
            </CardTitle>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            <ComparisonBadge comparison={stats.score} label="score" />
            <ComparisonBadge comparison={stats.contatos} label="contatos" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={evolutionData}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorContatos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="period"
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
                <Area
                  type="monotone"
                  dataKey="score"
                  name="Score Atual"
                  stroke="hsl(221, 83%, 53%)"
                  fillOpacity={1}
                  fill="url(#colorScore)"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="prevScore"
                  name="Score Anterior"
                  stroke="hsl(221, 83%, 53%)"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  dot={false}
                  opacity={0.5}
                />
                <Area
                  type="monotone"
                  dataKey="contatos"
                  name="Total Contatos"
                  stroke="hsl(142, 76%, 36%)"
                  fillOpacity={1}
                  fill="url(#colorContatos)"
                  strokeWidth={2}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export const ContactDistributionChart = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay: 0.4 }}
  >
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <PieChartIcon className="w-5 h-5 text-info" />
          Distribuição por Função
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={contactsByRole}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={{ stroke: 'hsl(var(--muted-foreground))' }}
              >
                {contactsByRole.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

export const RelationshipScoreChart = ({ period }: ChartProps) => {
  const relationshipData = getRelationshipData(period);
  const totalCurrent = relationshipData.reduce((sum, item) => sum + item.value, 0);
  const totalPrevious = relationshipData.reduce((sum, item) => sum + item.prevValue, 0);
  const excellentComparison = calcChange(relationshipData[0].value, relationshipData[0].prevValue);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.5 }}
    >
      <Card className="h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-warning" />
              Scores de Relacionamento
            </CardTitle>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            <ComparisonBadge comparison={excellentComparison} label="excelentes" />
            <ComparisonBadge comparison={calcChange(totalCurrent, totalPrevious)} label="total" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={relationshipData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                >
                  {relationshipData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
