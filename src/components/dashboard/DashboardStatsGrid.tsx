import { Building2, Users, MessageSquare, TrendingUp } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import type { DashboardStats } from '@/hooks/useDashboardStats';

interface DashboardStatsGridProps {
  stats: DashboardStats;
  prefersReducedMotion: boolean;
}

function generateSparkline(current: number, seed: number): number[] {
  const points: number[] = [];
  for (let i = 0; i < 7; i++) {
    const noise = Math.sin(seed * (i + 1)) * 0.3;
    const trend = i / 6;
    points.push(Math.max(0, Math.round(current * (0.5 + trend * 0.5 + noise))));
  }
  return points;
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Meta: 80% · ✨ Excelente';
  if (score >= 60) return 'Meta: 80% · Bom progresso';
  if (score >= 40) return 'Meta: 80% · Em evolução';
  return 'Meta: 80% · Precisa melhorar';
}

function getInteractionLabel(count: number): string {
  if (count === 0) return 'Nenhuma interação esta semana';
  if (count < 5) return 'Comece a engajar mais!';
  if (count < 15) return 'Bom ritmo de engajamento';
  return 'Engajamento intenso 🔥';
}

export function DashboardStatsGrid({ stats, prefersReducedMotion }: DashboardStatsGridProps) {
  const companyChangeType = stats.companyChange?.startsWith('+') && stats.companyChange !== '+0' ? 'positive' as const : 'neutral' as const;
  const contactChangeType = stats.contactChange?.startsWith('+') && stats.contactChange !== '+0' ? 'positive' as const : 'neutral' as const;
  const interactionChangeType = stats.weeklyInteractions > 0 ? 'positive' as const : 'neutral' as const;
  const scoreChangeType = stats.averageScore > 50 ? 'positive' as const : stats.averageScore > 25 ? 'neutral' as const : 'negative' as const;

  const cards = [
    {
      title: 'Total de Empresas',
      value: stats.totalCompanies,
      change: stats.companyChange,
      changeType: companyChangeType,
      icon: Building2,
      gradientTone: 'primary' as const,
      sparkline: generateSparkline(stats.totalCompanies, 1),
    },
    {
      title: 'Contatos Cadastrados',
      value: stats.totalContacts,
      change: stats.contactChange,
      changeType: contactChangeType,
      icon: Users,
      gradientTone: 'success' as const,
      sparkline: generateSparkline(stats.totalContacts, 2),
    },
    {
      title: 'Interações (7 dias)',
      value: stats.weeklyInteractions,
      change: stats.interactionChange,
      changeType: interactionChangeType,
      icon: MessageSquare,
      gradientTone: 'premium' as const,
      sparkline: generateSparkline(stats.weeklyInteractions || 1, 3),
      emptyAction: stats.weeklyInteractions === 0 ? { label: 'Registrar interação', href: '/interacoes' } : undefined,
      subtitle: getInteractionLabel(stats.weeklyInteractions),
    },
    {
      title: 'Score Médio',
      value: `${stats.averageScore}%`,
      change: stats.scoreChange,
      changeType: scoreChangeType,
      icon: TrendingUp,
      gradientTone: 'warning' as const,
      sparkline: generateSparkline(stats.averageScore || 1, 4),
      subtitle: getScoreLabel(stats.averageScore),
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {cards.map((stat, index) => (
        <StatCard
          key={stat.title}
          {...stat}
          delay={prefersReducedMotion ? 0 : index}
          variant={index === 0 ? 'elevated' : 'default'}
        />
      ))}
    </div>
  );
}
