import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from 'recharts';
import {
  Users,
  Target,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CustomTooltip, DISC_COLORS } from './TriggerAnalyticsTypes';

interface DiscChartEntry {
  name: string;
  profile: string;
  usages: number;
  successRate: number;
  rating: number;
}

interface ResultPieEntry {
  name: string;
  value: number;
  color: string;
}

interface RadarDataEntry {
  trigger: string;
  D: number;
  I: number;
  S: number;
  C: number;
}

interface OverviewTabProps {
  discChartData: DiscChartEntry[];
  resultPieData: ResultPieEntry[];
  radarData: RadarDataEntry[];
}

export function OverviewTab({ discChartData, resultPieData, radarData }: OverviewTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* DISC Performance Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4" />
              Performance por Perfil DISC
            </CardTitle>
            <CardDescription>Taxa de sucesso e nota média por perfil</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={discChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="successRate" name="Taxa Sucesso %" fill="hsl(142, 76%, 36%)" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="rating" name="Nota Média %" fill="hsl(45, 93%, 47%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Result Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="w-4 h-4" />
              Distribuição de Resultados
            </CardTitle>
            <CardDescription>Resultados dos gatilhos utilizados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={resultPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {resultPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Radar Chart - Trigger effectiveness by DISC */}
      {radarData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Efetividade dos Gatilhos por DISC
            </CardTitle>
            <CardDescription>Taxa de sucesso dos principais gatilhos em cada perfil</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="trigger" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <Radar name="Dominante (D)" dataKey="D" stroke={DISC_COLORS.D} fill={DISC_COLORS.D} fillOpacity={0.2} />
                  <Radar name="Influente (I)" dataKey="I" stroke={DISC_COLORS.I} fill={DISC_COLORS.I} fillOpacity={0.2} />
                  <Radar name="Estável (S)" dataKey="S" stroke={DISC_COLORS.S} fill={DISC_COLORS.S} fillOpacity={0.2} />
                  <Radar name="Conforme (C)" dataKey="C" stroke={DISC_COLORS.C} fill={DISC_COLORS.C} fillOpacity={0.2} />
                  <Legend />
                  <Tooltip content={<CustomTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
