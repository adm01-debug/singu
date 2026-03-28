import { DISCProfile, DISC_LABELS } from '@/types';
import { VAKType, VAK_LABELS } from '@/types/vak';
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

export interface PortfolioCompatibilityReportProps {
  className?: string;
}

export interface SalespersonProfile {
  vakProfile: VAKType | null;
  discProfile: DISCProfile | null;
  metaprograms: {
    motivationDirection: string | null;
    referenceFrame: string | null;
    workingStyle: string | null;
    chunkSize: string | null;
    actionFilter: string | null;
    comparisonStyle: string | null;
  };
}

export interface ContactWithCompatibility {
  id: string;
  firstName: string;
  lastName: string;
  company?: string;
  discProfile: DISCProfile | null;
  vakProfile: VAKType | null;
  compatibilityScore: number;
  discScore: number;
  vakScore: number;
  metaprogramScore: number;
  level: 'excellent' | 'good' | 'moderate' | 'challenging';
  opportunities: string[];
  challenges: string[];
  relationshipScore: number | null;
  lastInteraction?: string;
}

export interface PortfolioStats {
  total: number;
  excellent: number;
  good: number;
  moderate: number;
  challenging: number;
  averageCompatibility: number;
  topOpportunities: ContactWithCompatibility[];
  needsAttention: ContactWithCompatibility[];
}

// DISC Compatibility Matrix
export const DISC_COMPATIBILITY: Record<DISCProfile, Record<DISCProfile, number>> = {
  D: { D: 60, I: 85, S: 50, C: 70 },
  I: { D: 85, I: 70, S: 80, C: 55 },
  S: { D: 50, I: 80, S: 75, C: 85 },
  C: { D: 70, I: 55, S: 85, C: 65 },
};

// VAK Compatibility
export const VAK_COMPATIBILITY: Record<VAKType, Record<VAKType, number>> = {
  V: { V: 100, A: 70, K: 60, D: 75 },
  A: { V: 70, A: 100, K: 65, D: 80 },
  K: { V: 60, A: 65, K: 100, D: 55 },
  D: { V: 75, A: 80, K: 55, D: 100 },
};

export const LEVEL_CONFIG = {
  excellent: {
    label: 'Excelente',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100 dark:bg-emerald-950/30',
    icon: CheckCircle2,
    description: 'Alta compatibilidade, comunicação natural',
  },
  good: {
    label: 'Boa',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-950/30',
    icon: TrendingUp,
    description: 'Compatibilidade favorável com pequenos ajustes',
  },
  moderate: {
    label: 'Moderada',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100 dark:bg-amber-950/30',
    icon: AlertTriangle,
    description: 'Requer adaptação consciente',
  },
  challenging: {
    label: 'Desafiadora',
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-950/30',
    icon: AlertTriangle,
    description: 'Demanda esforço extra de adaptação',
  },
};

export function getDISCAdaptation(seller: DISCProfile, client: DISCProfile): string {
  const adaptations: Record<string, string> = {
    'D-S': 'Desacelere e demonstre segurança',
    'D-C': 'Traga mais dados e detalhes',
    'I-C': 'Seja mais objetivo e factual',
    'I-D': 'Foque em resultados rápidos',
    'S-D': 'Seja mais direto e decisivo',
    'S-I': 'Mostre mais entusiasmo',
    'C-I': 'Adicione conexão emocional',
    'C-D': 'Resuma e vá direto ao ponto',
  };
  return adaptations[`${seller}-${client}`] || 'Adapte seu estilo de comunicação';
}
