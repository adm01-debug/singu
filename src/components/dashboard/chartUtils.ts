import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export type PeriodFilter = '7d' | '30d' | '90d';

export interface PeriodComparison {
  current: number;
  previous: number;
  change: number;
  changeType: 'positive' | 'negative' | 'neutral';
}

export interface ChartProps {
  period: PeriodFilter;
}

// Calculate percentage change
export const calcChange = (current: number, previous: number): PeriodComparison => {
  const change = previous === 0 ? 0 : Math.round(((current - previous) / previous) * 100);
  return {
    current,
    previous,
    change,
    changeType: change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral',
  };
};

// Activity data generators for different periods with comparison
export const getActivityData = (period: PeriodFilter) => {
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
export const getActivityStats = (period: PeriodFilter): { emails: PeriodComparison; reunioes: PeriodComparison; ligacoes: PeriodComparison } => {
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
export const getEvolutionData = (period: PeriodFilter) => {
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
export const getEvolutionStats = (period: PeriodFilter): { score: PeriodComparison; contatos: PeriodComparison } => {
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
export const getRelationshipData = (period: PeriodFilter) => {
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
export const contactsByRole = [
  { name: 'Proprietário', value: 12, color: 'hsl(280, 67%, 45%)' },
  { name: 'Gerente', value: 18, color: 'hsl(221, 83%, 53%)' },
  { name: 'Comprador', value: 15, color: 'hsl(142, 76%, 36%)' },
  { name: 'Contato', value: 25, color: 'hsl(215, 16%, 47%)' },
];

// Sentiment distribution by period with comparison
export const getSentimentData = (period: PeriodFilter) => {
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
export const getSentimentStats = (period: PeriodFilter): { positivo: PeriodComparison; negativo: PeriodComparison } => {
  const data = getSentimentData(period);
  return {
    positivo: calcChange(data[0].value, data[0].prevValue),
    negativo: calcChange(data[2].value, data[2].prevValue),
  };
};

export interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color?: string; dataKey?: string }>;
  label?: string;
}

export const getComparisonIcon = (changeType: PeriodComparison['changeType']) => {
  return changeType === 'positive' ? TrendingUp :
         changeType === 'negative' ? TrendingDown : Minus;
};

export const getComparisonColorClass = (changeType: PeriodComparison['changeType']) => {
  return changeType === 'positive' ? 'text-success bg-success/10' :
         changeType === 'negative' ? 'text-destructive bg-destructive/10' :
         'text-muted-foreground bg-muted';
};
