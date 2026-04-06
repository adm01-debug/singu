import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
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
import { TrendingUp, TrendingDown, Activity, PieChart as PieChartIcon, BarChart3, Minus } from 'lucide-react';
import { AccessibleChart } from '@/components/ui/accessible-chart';

export type PeriodFilter = '7d' | '30d' | '90d';

interface PeriodComparison {
  current: number;
  previous: number;
  change: number;
  changeType: 'positive' | 'negative' | 'neutral';
}

// Calculate percentage change
const calcChange = (current: number, previous: number): PeriodComparison => {
  const change = previous === 0 ? 0 : Math.round(((current - previous) / previous) * 100);
  return {
    current,
    previous,
    change,
    changeType: change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral',
  };
};

// Activity data generators for different periods with comparison
const getActivityData = (period: PeriodFilter) => {
  const dataByPeriod = {
    '7d': [
      { name: 'Seg', emails: 2, reunioes: 1, ligacoes: 1, prevEmails: 1, prevReunioes: 1, prevLigacoes: 2 },
      { name: 'Ter', emails: 3, reunioes: 2, ligacoes: 1, prevEmails: 2, prevReunioes: 1, prevLigacoes: 1 },
      { name: 'Qua', emails: 4, reunioes: 1, ligacoes: 3, prevEmails: 3, prevReunioes: 2, prevLigacoes: 2 },
      { name: 'Qui', emails: 2, reunioes: 2, ligacoes: 1, prevEmails: 3, prevReunioes: 1, prevLigacoes: 1 },
      { name: 'Sex', emails: 5, reunioes: 2, ligacoes: 2, prevEmails: 4, prevReunioes: 2, prevLigacoes: 1 },
      { name: 'Sab', emails: 1, reunioes: 0, ligacoes: 1, prevEmails: 0, prevReunioes: 0, prevLigacoes: 0 },
      { name: 'Dom', emails: 0, reunioes: 0, ligacoes: 1, prevEmails: 1, prevReunioes: 0, prevLigacoes: 0 },
    ],
    '30d': [
      { name: 'Sem 1', emails: 12, reunioes: 8, ligacoes: 5, prevEmails: 10, prevReunioes: 6, prevLigacoes: 4 },
      { name: 'Sem 2', emails: 15, reunioes: 10, ligacoes: 7, prevEmails: 12, prevReunioes: 8, prevLigacoes: 5 },
      { name: 'Sem 3', emails: 14, reunioes: 6, ligacoes: 8, prevEmails: 11, prevReunioes: 7, prevLigacoes: 6 },
      { name: 'Sem 4', emails: 18, reunioes: 9, ligacoes: 8, prevEmails: 14, prevReunioes: 8, prevLigacoes: 7 },
    ],
    '90d': [
      { name: 'Out', emails: 42, reunioes: 25, ligacoes: 18, prevEmails: 38, prevReunioes: 22, prevLigacoes: 15 },
      { name: 'Nov', emails: 55, reunioes: 32, ligacoes: 25, prevEmails: 45, prevReunioes: 28, prevLigacoes: 20 },
      { name: 'Dez', emails: 48, reunioes: 28, ligacoes: 22, prevEmails: 50, prevReunioes: 30, prevLigacoes: 22 },
    ],
  };
  return dataByPeriod[period];
};

// Activity comparison stats
const getActivityStats = (period: PeriodFilter): { emails: PeriodComparison; reunioes: PeriodComparison; ligacoes: PeriodComparison } => {
  const statsByPeriod = {
    '7d': {
      emails: calcChange(17, 14),
      reunioes: calcChange(8, 7),
      ligacoes: calcChange(10, 7),
    },
    '30d': {
      emails: calcChange(59, 47),
      reunioes: calcChange(33, 29),
      ligacoes: calcChange(28, 22),
    },
    '90d': {
      emails: calcChange(145, 133),
      reunioes: calcChange(85, 80),
      ligacoes: calcChange(65, 57),
    },
  };
  return statsByPeriod[period];
};

// Relationship evolution data by period with comparison
const getEvolutionData = (period: PeriodFilter) => {
  const dataByPeriod = {
    '7d': [
      { period: 'Seg', score: 71, contatos: 68, prevScore: 68 },
      { period: 'Ter', score: 72, contatos: 68, prevScore: 69 },
      { period: 'Qua', score: 73, contatos: 69, prevScore: 70 },
      { period: 'Qui', score: 72, contatos: 69, prevScore: 69 },
      { period: 'Sex', score: 74, contatos: 70, prevScore: 70 },
      { period: 'Sab', score: 74, contatos: 70, prevScore: 71 },
      { period: 'Dom', score: 75, contatos: 70, prevScore: 71 },
    ],
    '30d': [
      { period: 'Sem 1', score: 68, contatos: 62, prevScore: 64 },
      { period: 'Sem 2', score: 70, contatos: 65, prevScore: 66 },
      { period: 'Sem 3', score: 72, contatos: 67, prevScore: 68 },
      { period: 'Sem 4', score: 75, contatos: 70, prevScore: 70 },
    ],
    '90d': [
      { period: 'Out', score: 68, contatos: 55, prevScore: 62 },
      { period: 'Nov', score: 72, contatos: 62, prevScore: 65 },
      { period: 'Dez', score: 75, contatos: 70, prevScore: 68 },
    ],
  };
  return dataByPeriod[period];
};

// Evolution comparison stats
const getEvolutionStats = (period: PeriodFilter): { score: PeriodComparison; contatos: PeriodComparison } => {
  const statsByPeriod = {
    '7d': {
      score: calcChange(75, 71),
      contatos: calcChange(70, 68),
    },
    '30d': {
      score: calcChange(75, 70),
      contatos: calcChange(70, 62),
    },
    '90d': {
      score: calcChange(75, 68),
      contatos: calcChange(70, 55),
    },
  };
  return statsByPeriod[period];
};

// Relationship score distribution by period with comparison
const getRelationshipData = (period: PeriodFilter) => {
  const dataByPeriod = {
    '7d': [
      { name: 'Excelente', value: 8, prevValue: 7, color: 'hsl(142, 76%, 36%)' },
      { name: 'Bom', value: 15, prevValue: 14, color: 'hsl(221, 83%, 53%)' },
      { name: 'Regular', value: 12, prevValue: 13, color: 'hsl(38, 92%, 50%)' },
      { name: 'Fraco', value: 5, prevValue: 6, color: 'hsl(0, 84%, 60%)' },
    ],
    '30d': [
      { name: 'Excelente', value: 10, prevValue: 8, color: 'hsl(142, 76%, 36%)' },
      { name: 'Bom', value: 18, prevValue: 15, color: 'hsl(221, 83%, 53%)' },
      { name: 'Regular', value: 14, prevValue: 16, color: 'hsl(38, 92%, 50%)' },
      { name: 'Fraco', value: 6, prevValue: 8, color: 'hsl(0, 84%, 60%)' },
    ],
    '90d': [
      { name: 'Excelente', value: 12, prevValue: 9, color: 'hsl(142, 76%, 36%)' },
      { name: 'Bom', value: 22, prevValue: 18, color: 'hsl(221, 83%, 53%)' },
      { name: 'Regular', value: 16, prevValue: 20, color: 'hsl(38, 92%, 50%)' },
      { name: 'Fraco', value: 8, prevValue: 11, color: 'hsl(0, 84%, 60%)' },
    ],
  };
  return dataByPeriod[period];
};

// Contact distribution by role (same for all periods)
const contactsByRole = [
  { name: 'Proprietário', value: 12, color: 'hsl(280, 67%, 45%)' },
  { name: 'Gerente', value: 18, color: 'hsl(221, 83%, 53%)' },
  { name: 'Comprador', value: 15, color: 'hsl(142, 76%, 36%)' },
  { name: 'Contato', value: 25, color: 'hsl(215, 16%, 47%)' },
];

// Sentiment distribution by period with comparison
const getSentimentData = (period: PeriodFilter) => {
  const dataByPeriod = {
    '7d': [
      { name: 'Positivo', value: 45, prevValue: 42, color: 'hsl(142, 76%, 36%)' },
      { name: 'Neutro', value: 35, prevValue: 38, color: 'hsl(215, 16%, 47%)' },
      { name: 'Negativo', value: 8, prevValue: 10, color: 'hsl(0, 84%, 60%)' },
    ],
    '30d': [
      { name: 'Positivo', value: 52, prevValue: 45, color: 'hsl(142, 76%, 36%)' },
      { name: 'Neutro', value: 42, prevValue: 45, color: 'hsl(215, 16%, 47%)' },
      { name: 'Negativo', value: 12, prevValue: 16, color: 'hsl(0, 84%, 60%)' },
    ],
    '90d': [
      { name: 'Positivo', value: 68, prevValue: 55, color: 'hsl(142, 76%, 36%)' },
      { name: 'Neutro', value: 55, prevValue: 60, color: 'hsl(215, 16%, 47%)' },
      { name: 'Negativo', value: 18, prevValue: 25, color: 'hsl(0, 84%, 60%)' },
    ],
  };
  return dataByPeriod[period];
};

// Sentiment comparison stats
const getSentimentStats = (period: PeriodFilter): { positivo: PeriodComparison; negativo: PeriodComparison } => {
  const data = getSentimentData(period);
  return {
    positivo: calcChange(data[0].value, data[0].prevValue),
    negativo: calcChange(data[2].value, data[2].prevValue),
  };
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color?: string; dataKey?: string }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="font-medium text-foreground mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm text-muted-foreground">
            <span style={{ color: entry.color }} className="font-medium">
              {entry.name}:
            </span>{' '}
            {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const PieTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="font-medium text-foreground">{payload[0].name}</p>
        <p className="text-sm text-muted-foreground">
          Quantidade: <span className="font-medium">{payload[0].value}</span>
        </p>
      </div>
    );
  }
  return null;
};

// Comparison badge component
const ComparisonBadge = ({ comparison, label }: { comparison: PeriodComparison; label: string }) => {
  const Icon = comparison.changeType === 'positive' ? TrendingUp : 
               comparison.changeType === 'negative' ? TrendingDown : Minus;
  const colorClass = comparison.changeType === 'positive' ? 'text-success bg-success/10' : 
                     comparison.changeType === 'negative' ? 'text-destructive bg-destructive/10' : 
                     'text-muted-foreground bg-muted';
  
  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
      <Icon className="w-3 h-3" />
      <span>{comparison.change > 0 ? '+' : ''}{comparison.change}%</span>
      <span className="text-muted-foreground ml-1">{label}</span>
    </div>
  );
};

interface ChartProps {
  period: PeriodFilter;
}

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
          <AccessibleChart
            summary="Atividades por período — emails, reuniões e ligações"
            data={activityData.map(d => ({ label: d.name, value: `${d.emails}e / ${d.reunioes}r / ${d.ligacoes}l` }))}
            columns={['Período', 'E-mails / Reuniões / Ligações']}
          >
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
          </AccessibleChart>
        </CardContent>
      </Card>
    </motion.div>
  );
};

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
