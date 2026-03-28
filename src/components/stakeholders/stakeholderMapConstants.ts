import {
  Crown,
  Shield,
  Bell,
  Eye,
  UserCheck,
  TrendingUp,
  Minus,
  TrendingDown,
  UserX,
} from 'lucide-react';

export const QUADRANT_CONFIG = {
  manage_closely: {
    label: 'Gerenciar de Perto',
    icon: Crown,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    borderColor: 'border-primary/30',
    description: 'Alto poder e alto interesse - stakeholders críticos',
  },
  keep_satisfied: {
    label: 'Manter Satisfeito',
    icon: Shield,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    borderColor: 'border-warning/30',
    description: 'Alto poder, baixo interesse - evite frustrar',
  },
  keep_informed: {
    label: 'Manter Informado',
    icon: Bell,
    color: 'text-info',
    bgColor: 'bg-info/10',
    borderColor: 'border-info/30',
    description: 'Baixo poder, alto interesse - bons aliados',
  },
  monitor: {
    label: 'Monitorar',
    icon: Eye,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/50',
    borderColor: 'border-muted',
    description: 'Baixo poder e baixo interesse - verificar periodicamente',
  },
};

export const RISK_COLORS = {
  low: 'bg-success/10 text-success border-success/30',
  medium: 'bg-warning/10 text-warning border-warning/30',
  high: 'bg-destructive/10 text-destructive border-destructive/30',
};

export const SUPPORT_CONFIG = {
  champion: { icon: UserCheck, color: 'text-success', label: 'Champion' },
  supporter: { icon: TrendingUp, color: 'text-success', label: 'Apoiador' },
  neutral: { icon: Minus, color: 'text-muted-foreground', label: 'Neutro' },
  skeptic: { icon: TrendingDown, color: 'text-warning', label: 'Cético' },
  blocker: { icon: UserX, color: 'text-destructive', label: 'Bloqueador' },
};

export function getSupportType(support: number): keyof typeof SUPPORT_CONFIG {
  if (support >= 4) return 'champion';
  if (support >= 1) return 'supporter';
  if (support >= -1) return 'neutral';
  if (support >= -3) return 'skeptic';
  return 'blocker';
}

export const safeInitial = (value: unknown, fallback = '?') => String(value ?? fallback).charAt(0);
