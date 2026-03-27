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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import {
  Eye,
  Users,
  Sparkles,
  Activity,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { NLPStats } from './NLPAnalyticsTypes';
import { discColors } from './NLPAnalyticsTypes';
import { NLPCustomTooltip } from './NLPCustomTooltip';

interface NLPOverviewTabProps {
  stats: NLPStats;
  radarData: { subject: string; value: number }[];
  discChartData: { name: string; value: number; profile: string }[];
}

export function NLPOverviewTab({ stats, radarData, discChartData }: NLPOverviewTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Emotional Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Tendência Emocional (7 dias)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.emotionalTrend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis dataKey="date" className="text-muted-foreground" tick={{ fontSize: 12 }} />
                <YAxis className="text-muted-foreground" tick={{ fontSize: 12 }} />
                <Tooltip content={<NLPCustomTooltip />} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="positive"
                  name="Positivo"
                  stackId="1"
                  stroke="hsl(142, 76%, 36%)"
                  fill="hsl(142, 76%, 36%)"
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="neutral"
                  name="Neutro"
                  stackId="1"
                  stroke="hsl(215, 16%, 47%)"
                  fill="hsl(215, 16%, 47%)"
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="negative"
                  name="Negativo"
                  stackId="1"
                  stroke="hsl(0, 84%, 60%)"
                  fill="hsl(0, 84%, 60%)"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* VAK Radar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-primary" />
            Distribuição VAK
          </CardTitle>
          <CardDescription>Perfis sensoriais agregados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid className="stroke-border/50" />
                <PolarAngleAxis dataKey="subject" className="text-muted-foreground" tick={{ fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Radar
                  name="VAK Score"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.4}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* DISC Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Distribuição DISC
          </CardTitle>
          <CardDescription>Perfis comportamentais dos contatos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={discChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                >
                  {discChartData.map((entry) => (
                    <Cell
                      key={entry.profile}
                      fill={discColors[entry.profile as keyof typeof discColors]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Top Values */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Principais Valores Detectados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.topValues.length > 0 ? (
              stats.topValues.slice(0, 6).map((value, index) => (
                <div key={value.name} className="flex items-center gap-3">
                  <span className="text-sm font-medium w-6 text-muted-foreground">
                    {index + 1}.
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{value.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {value.count} ocorrências
                      </span>
                    </div>
                    <Progress value={value.avgImportance * 10} className="h-2" />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhum valor detectado ainda
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
