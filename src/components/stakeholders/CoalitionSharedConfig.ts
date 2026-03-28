import {
  UserCheck,
  UserX,
  Minus,
  Scale,
} from 'lucide-react';

export const COALITION_TYPE_CONFIG = {
  support: {
    icon: UserCheck,
    color: 'text-success',
    bgColor: 'bg-success/10',
    borderColor: 'border-success/30',
    label: 'Apoio',
  },
  opposition: {
    icon: UserX,
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    borderColor: 'border-destructive/30',
    label: 'Oposição',
  },
  neutral: {
    icon: Minus,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    borderColor: 'border-warning/30',
    label: 'Neutro',
  },
  mixed: {
    icon: Scale,
    color: 'text-info',
    bgColor: 'bg-info/10',
    borderColor: 'border-info/30',
    label: 'Misto',
  },
};

export const RISK_CONFIG = {
  low: { color: 'text-success', bgColor: 'bg-success/10', label: 'Baixo' },
  medium: { color: 'text-warning', bgColor: 'bg-warning/10', label: 'Médio' },
  high: { color: 'text-destructive', bgColor: 'bg-destructive/10', label: 'Alto' },
};
