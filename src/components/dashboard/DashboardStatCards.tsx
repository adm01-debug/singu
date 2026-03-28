import { Building2, Users, MessageSquare, TrendingUp } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface DashboardStats {
  totalCompanies: number;
  totalContacts: number;
  weeklyInteractions: number;
  averageScore: number;
  companyChange: number;
  contactChange: number;
  interactionChange: number;
  scoreChange: number;
}

function buildStats(dashboardStats: DashboardStats) {
  return [
    {
      title: 'Total de Empresas',
      value: dashboardStats.totalCompanies,
      change: dashboardStats.companyChange,
      changeType: 'positive' as const,
      icon: Building2,
      iconColor: 'bg-primary/10 text-primary',
    },
    {
      title: 'Contatos Cadastrados',
      value: dashboardStats.totalContacts,
      change: dashboardStats.contactChange,
      changeType: 'positive' as const,
      icon: Users,
      iconColor: 'bg-success/10 text-success',
    },
    {
      title: 'Interações (7 dias)',
      value: dashboardStats.weeklyInteractions,
      change: dashboardStats.interactionChange,
      changeType: 'positive' as const,
      icon: MessageSquare,
      iconColor: 'bg-info/10 text-info',
    },
    {
      title: 'Score Médio',
      value: `${dashboardStats.averageScore}%`,
      change: dashboardStats.scoreChange,
      changeType: 'positive' as const,
      icon: TrendingUp,
      iconColor: 'bg-warning/10 text-warning',
    },
  ];
}

interface DashboardStatCardsProps {
  dashboardStats: DashboardStats;
}

export const DashboardStatCards = ({ dashboardStats }: DashboardStatCardsProps) => {
  const prefersReducedMotion = useReducedMotion();
  const stats = buildStats(dashboardStats);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <StatCard key={stat.title} {...stat} delay={prefersReducedMotion ? 0 : index} />
      ))}
    </div>
  );
};
