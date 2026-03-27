import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  ArrowUp,
  ArrowDown,
  BarChart3,
  PieChart as PieChartIcon,
} from 'lucide-react';
import { RFMDashboardStats } from '@/types/rfm';

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  suffix?: string;
  color: string;
  trend?: 'up' | 'down';
}

export function MetricCard({ icon, label, value, suffix = '', color, trend }: MetricCardProps) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-950/50',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-950/50',
    red: 'bg-red-100 text-red-600 dark:bg-red-950/50',
    emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50'
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            {icon}
          </div>
          {trend && (
            <div className={trend === 'up' ? 'text-emerald-600' : 'text-red-600'}>
              {trend === 'up' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
            </div>
          )}
        </div>
        <div className="mt-4">
          <div className="text-2xl font-bold">
            {value}
            {suffix && <span className="text-sm font-normal text-muted-foreground">{suffix}</span>}
          </div>
          <div className="text-sm text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function PriorityCard({
  label,
  count,
  total,
  color
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

  const colorClasses: Record<string, { bg: string; bar: string }> = {
    red: { bg: 'bg-red-100 dark:bg-red-950/30', bar: 'bg-red-500' },
    orange: { bg: 'bg-orange-100 dark:bg-orange-950/30', bar: 'bg-orange-500' },
    blue: { bg: 'bg-blue-100 dark:bg-blue-950/30', bar: 'bg-blue-500' },
    gray: { bg: 'bg-gray-100 dark:bg-gray-800', bar: 'bg-gray-500' }
  };

  return (
    <div className={`p-4 rounded-lg ${colorClasses[color].bg}`}>
      <div className="text-sm font-medium">{label}</div>
      <div className="text-2xl font-bold mt-1">{count}</div>
      <div className="mt-2">
        <div className="h-2 bg-white/50 rounded-full overflow-hidden">
          <div
            className={`h-full ${colorClasses[color].bar} transition-all`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="text-xs text-muted-foreground mt-1">{percentage}%</div>
      </div>
    </div>
  );
}

interface RFMOverviewChartsProps {
  segmentChartData: Array<{ name: string; value: number; color: string }>;
  scoreDistributionData: Array<{ score: string; Recência: number; Frequência: number; Monetário: number }>;
  dashboardStats: RFMDashboardStats;
}

export function RFMOverviewCharts({
  segmentChartData,
  scoreDistributionData,
  dashboardStats
}: RFMOverviewChartsProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Segment Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Distribuição por Segmento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={segmentChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {segmentChartData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Score Distribution Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Distribuição de Scores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scoreDistributionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="score" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="Recência" fill="#3b82f6" />
                  <Bar dataKey="Frequência" fill="#22c55e" />
                  <Bar dataKey="Monetário" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Priority Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Prioridade de Comunicação</CardTitle>
          <CardDescription>
            Distribuição de contatos por urgência de contato
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <PriorityCard
              label="Urgente"
              count={dashboardStats.priorityDistribution.urgent}
              total={dashboardStats.totalAnalyzed}
              color="red"
            />
            <PriorityCard
              label="Alta"
              count={dashboardStats.priorityDistribution.high}
              total={dashboardStats.totalAnalyzed}
              color="orange"
            />
            <PriorityCard
              label="Média"
              count={dashboardStats.priorityDistribution.medium}
              total={dashboardStats.totalAnalyzed}
              color="blue"
            />
            <PriorityCard
              label="Baixa"
              count={dashboardStats.priorityDistribution.low}
              total={dashboardStats.totalAnalyzed}
              color="gray"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
