import { Brain, Target, TrendingUp, Sparkles, AlertTriangle, Heart, Lightbulb, Zap } from 'lucide-react';

export interface AIInsight {
  category: string;
  title: string;
  description: string;
  action_suggestion: string;
  confidence: number;
  actionable: boolean;
  contact_id?: string;
  priority: string;
}

export const categoryIcons: Record<string, React.ElementType> = {
  personality: Brain,
  preference: Target,
  behavior: TrendingUp,
  opportunity: Sparkles,
  risk: AlertTriangle,
  relationship: Heart,
  sentiment: Lightbulb,
  action: Zap,
};

export const categoryColors: Record<string, string> = {
  personality: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  preference: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  behavior: 'bg-green-500/10 text-green-500 border-green-500/20',
  opportunity: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  risk: 'bg-red-500/10 text-red-500 border-red-500/20',
  relationship: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
  sentiment: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
  action: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
};

export const categoryLabels: Record<string, string> = {
  personality: 'Personalidade',
  preference: 'Preferência',
  behavior: 'Comportamento',
  opportunity: 'Oportunidade',
  risk: 'Risco',
  relationship: 'Relacionamento',
  sentiment: 'Sentimento',
  action: 'Ação',
};

export const priorityColors: Record<string, string> = {
  high: 'bg-red-500/10 text-red-500 border-red-500/30',
  medium: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
  low: 'bg-green-500/10 text-green-500 border-green-500/30',
};
