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
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Activity, PieChart as PieChartIcon, BarChart3 } from 'lucide-react';

export type PeriodFilter = '7d' | '30d' | '90d';

// Activity data generators for different periods
const getActivityData = (period: PeriodFilter) => {
  const dataByPeriod = {
    '7d': [
      { name: 'Seg', interacoes: 4, emails: 2, reunioes: 1, ligacoes: 1 },
      { name: 'Ter', interacoes: 6, emails: 3, reunioes: 2, ligacoes: 1 },
      { name: 'Qua', interacoes: 8, emails: 4, reunioes: 1, ligacoes: 3 },
      { name: 'Qui', interacoes: 5, emails: 2, reunioes: 2, ligacoes: 1 },
      { name: 'Sex', interacoes: 9, emails: 5, reunioes: 2, ligacoes: 2 },
      { name: 'Sab', interacoes: 2, emails: 1, reunioes: 0, ligacoes: 1 },
      { name: 'Dom', interacoes: 1, emails: 0, reunioes: 0, ligacoes: 1 },
    ],
    '30d': [
      { name: 'Sem 1', interacoes: 25, emails: 12, reunioes: 8, ligacoes: 5 },
      { name: 'Sem 2', interacoes: 32, emails: 15, reunioes: 10, ligacoes: 7 },
      { name: 'Sem 3', interacoes: 28, emails: 14, reunioes: 6, ligacoes: 8 },
      { name: 'Sem 4', interacoes: 35, emails: 18, reunioes: 9, ligacoes: 8 },
    ],
    '90d': [
      { name: 'Out', interacoes: 85, emails: 42, reunioes: 25, ligacoes: 18 },
      { name: 'Nov', interacoes: 112, emails: 55, reunioes: 32, ligacoes: 25 },
      { name: 'Dez', interacoes: 98, emails: 48, reunioes: 28, ligacoes: 22 },
    ],
  };
  return dataByPeriod[period];
};

// Relationship evolution data by period
const getEvolutionData = (period: PeriodFilter) => {
  const dataByPeriod = {
    '7d': [
      { period: 'Seg', score: 71, contatos: 68 },
      { period: 'Ter', score: 72, contatos: 68 },
      { period: 'Qua', score: 73, contatos: 69 },
      { period: 'Qui', score: 72, contatos: 69 },
      { period: 'Sex', score: 74, contatos: 70 },
      { period: 'Sab', score: 74, contatos: 70 },
      { period: 'Dom', score: 75, contatos: 70 },
    ],
    '30d': [
      { period: 'Sem 1', score: 68, contatos: 62 },
      { period: 'Sem 2', score: 70, contatos: 65 },
      { period: 'Sem 3', score: 72, contatos: 67 },
      { period: 'Sem 4', score: 75, contatos: 70 },
    ],
    '90d': [
      { period: 'Out', score: 68, contatos: 55 },
      { period: 'Nov', score: 72, contatos: 62 },
      { period: 'Dez', score: 75, contatos: 70 },
    ],
  };
  return dataByPeriod[period];
};

// Relationship score distribution by period
const getRelationshipData = (period: PeriodFilter) => {
  const dataByPeriod = {
    '7d': [
      { name: 'Excelente (80-100)', value: 8, color: 'hsl(142, 76%, 36%)' },
      { name: 'Bom (60-79)', value: 15, color: 'hsl(221, 83%, 53%)' },
      { name: 'Regular (40-59)', value: 12, color: 'hsl(38, 92%, 50%)' },
      { name: 'Fraco (0-39)', value: 5, color: 'hsl(0, 84%, 60%)' },
    ],
    '30d': [
      { name: 'Excelente (80-100)', value: 10, color: 'hsl(142, 76%, 36%)' },
      { name: 'Bom (60-79)', value: 18, color: 'hsl(221, 83%, 53%)' },
      { name: 'Regular (40-59)', value: 14, color: 'hsl(38, 92%, 50%)' },
      { name: 'Fraco (0-39)', value: 6, color: 'hsl(0, 84%, 60%)' },
    ],
    '90d': [
      { name: 'Excelente (80-100)', value: 12, color: 'hsl(142, 76%, 36%)' },
      { name: 'Bom (60-79)', value: 22, color: 'hsl(221, 83%, 53%)' },
      { name: 'Regular (40-59)', value: 16, color: 'hsl(38, 92%, 50%)' },
      { name: 'Fraco (0-39)', value: 8, color: 'hsl(0, 84%, 60%)' },
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

// Sentiment distribution by period
const getSentimentData = (period: PeriodFilter) => {
  const dataByPeriod = {
    '7d': [
      { name: 'Positivo', value: 45, color: 'hsl(142, 76%, 36%)' },
      { name: 'Neutro', value: 35, color: 'hsl(215, 16%, 47%)' },
      { name: 'Negativo', value: 8, color: 'hsl(0, 84%, 60%)' },
    ],
    '30d': [
      { name: 'Positivo', value: 52, color: 'hsl(142, 76%, 36%)' },
      { name: 'Neutro', value: 42, color: 'hsl(215, 16%, 47%)' },
      { name: 'Negativo', value: 12, color: 'hsl(0, 84%, 60%)' },
    ],
    '90d': [
      { name: 'Positivo', value: 68, color: 'hsl(142, 76%, 36%)' },
      { name: 'Neutro', value: 55, color: 'hsl(215, 16%, 47%)' },
      { name: 'Negativo', value: 18, color: 'hsl(0, 84%, 60%)' },
    ],
  };
  return dataByPeriod[period];
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color?: string }>;
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

interface ChartProps {
  period: PeriodFilter;
}

export const ActivityChart = ({ period }: ChartProps) => {
  const activityData = getActivityData(period);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Atividades por Período
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px]">
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

export const RelationshipEvolutionChart = ({ period }: ChartProps) => {
  const evolutionData = getEvolutionData(period);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
    >
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-success" />
            Evolução do Relacionamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={evolutionData}>
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
                  name="Score Médio"
                  stroke="hsl(221, 83%, 53%)"
                  fillOpacity={1}
                  fill="url(#colorScore)"
                  strokeWidth={2}
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
              </AreaChart>
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
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.5 }}
    >
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-warning" />
            Scores de Relacionamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={relationshipData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
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
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.6 }}
    >
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Activity className="w-5 h-5 text-accent" />
            Análise de Sentimento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sentimentData} layout="vertical">
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
                <Bar dataKey="value" name="Contatos" radius={[0, 4, 4, 0]}>
                  {sentimentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
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
