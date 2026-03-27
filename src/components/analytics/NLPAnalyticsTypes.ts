export type PeriodFilter = '7d' | '30d' | '90d' | '365d';

export const periodOptions = [
  { value: '7d', label: 'Últimos 7 dias' },
  { value: '30d', label: 'Últimos 30 dias' },
  { value: '90d', label: 'Últimos 90 dias' },
  { value: '365d', label: 'Último ano' },
];

export const getPeriodDays = (period: PeriodFilter): number => {
  switch (period) {
    case '7d': return 7;
    case '30d': return 30;
    case '90d': return 90;
    case '365d': return 365;
  }
};

export interface NLPStats {
  totalAnalyses: number;
  emotionalStates: {
    state: string;
    count: number;
    avgConfidence: number;
  }[];
  vakDistribution: {
    visual: number;
    auditory: number;
    kinesthetic: number;
    digital: number;
  };
  discDistribution: {
    D: number;
    I: number;
    S: number;
    C: number;
  };
  topValues: {
    name: string;
    count: number;
    avgImportance: number;
  }[];
  objectionTypes: {
    type: string;
    count: number;
    resolved: number;
  }[];
  emotionalTrend: {
    date: string;
    positive: number;
    neutral: number;
    negative: number;
  }[];
}

export const emotionColors: Record<string, string> = {
  'Entusiasmo': 'hsl(142, 76%, 36%)',
  'Confiança': 'hsl(199, 89%, 48%)',
  'Interesse': 'hsl(262, 83%, 58%)',
  'Hesitação': 'hsl(38, 92%, 50%)',
  'Frustração': 'hsl(0, 84%, 60%)',
  'Ceticismo': 'hsl(215, 16%, 47%)',
  'Satisfação': 'hsl(142, 71%, 45%)',
  'Ansiedade': 'hsl(25, 95%, 53%)',
};

export const vakColors = {
  visual: 'hsl(199, 89%, 48%)',
  auditory: 'hsl(142, 76%, 36%)',
  kinesthetic: 'hsl(25, 95%, 53%)',
  digital: 'hsl(262, 83%, 58%)',
};

export const discColors = {
  D: 'hsl(0, 84%, 60%)',
  I: 'hsl(38, 92%, 50%)',
  S: 'hsl(142, 76%, 36%)',
  C: 'hsl(199, 89%, 48%)',
};

export interface TooltipPayloadItem {
  color: string;
  name: string;
  value: number | string;
}

export interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

export const emptyNLPStats: NLPStats = {
  totalAnalyses: 0,
  emotionalStates: [],
  vakDistribution: { visual: 0, auditory: 0, kinesthetic: 0, digital: 0 },
  discDistribution: { D: 0, I: 0, S: 0, C: 0 },
  topValues: [],
  objectionTypes: [],
  emotionalTrend: [],
};
