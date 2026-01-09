import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, 
  Users, 
  MessageSquare, 
  TrendingUp,
  ArrowRight,
  Clock,
  Sparkles,
  Calendar
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RoleBadge } from '@/components/ui/role-badge';
import { RelationshipScore } from '@/components/ui/relationship-score';
import { SentimentIndicator } from '@/components/ui/sentiment-indicator';
import { mockCompanies, mockContacts, mockActivities, mockInsights } from '@/data/mockData';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import DashboardSkeleton from '@/components/skeletons/DashboardSkeleton';
import {
  ActivityChart,
  RelationshipEvolutionChart,
  ContactDistributionChart,
  RelationshipScoreChart,
  SentimentChart,
  type PeriodFilter,
} from '@/components/dashboard/DashboardCharts';

const periodOptions: { value: PeriodFilter; label: string }[] = [
  { value: '7d', label: 'Última Semana' },
  { value: '30d', label: 'Último Mês' },
  { value: '90d', label: 'Últimos 3 Meses' },
];

const Dashboard = () => {
  const [period, setPeriod] = useState<PeriodFilter>('7d');
  const [loading, setLoading] = useState(true);

  // Simulate loading for demo purposes
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);
  const stats = [
    {
      title: 'Total de Empresas',
      value: mockCompanies.length,
      change: '+2 este mês',
      changeType: 'positive' as const,
      icon: Building2,
      iconColor: 'bg-primary/10 text-primary',
    },
    {
      title: 'Contatos Cadastrados',
      value: mockContacts.length,
      change: '+5 este mês',
      changeType: 'positive' as const,
      icon: Users,
      iconColor: 'bg-success/10 text-success',
    },
    {
      title: 'Interações (7 dias)',
      value: 23,
      change: '+8 vs semana anterior',
      changeType: 'positive' as const,
      icon: MessageSquare,
      iconColor: 'bg-info/10 text-info',
    },
    {
      title: 'Score Médio',
      value: '72%',
      change: '+3% vs mês anterior',
      changeType: 'positive' as const,
      icon: TrendingUp,
      iconColor: 'bg-warning/10 text-warning',
    },
  ];

  const topContacts = mockContacts
    .sort((a, b) => b.relationshipScore - a.relationshipScore)
    .slice(0, 4);

  const recentInsights = mockInsights.slice(0, 3);

  if (loading) {
    return (
      <AppLayout>
        <Header 
          title="Dashboard" 
          subtitle="Visão geral do seu relacionamento com clientes"
          showBreadcrumbs={false}
        />
        <DashboardSkeleton />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Header 
        title="Dashboard" 
        subtitle="Visão geral do seu relacionamento com clientes"
        showBreadcrumbs={false}
      />

      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <StatCard key={stat.title} {...stat} delay={index} />
          ))}
        </div>

        {/* Period Filter */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-5 h-5" />
            <span className="font-medium">Período dos Gráficos</span>
          </div>
          <div className="flex items-center gap-2 bg-secondary/50 p-1 rounded-lg">
            {periodOptions.map((option) => (
              <Button
                key={option.value}
                variant={period === option.value ? "default" : "ghost"}
                size="sm"
                onClick={() => setPeriod(option.value)}
                className={`transition-all ${
                  period === option.value 
                    ? 'shadow-sm' 
                    : 'hover:bg-secondary'
                }`}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Charts Row 1 - Activity and Evolution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ActivityChart period={period} />
          <RelationshipEvolutionChart period={period} />
        </div>

        {/* Charts Row 2 - Distribution and Scores */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ContactDistributionChart />
          <RelationshipScoreChart period={period} />
          <SentimentChart period={period} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Contacts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.7 }}
            className="lg:col-span-2"
          >
            <Card className="h-full">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Melhores Relacionamentos
                </CardTitle>
                <Link to="/contatos">
                  <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                    Ver todos <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="space-y-4">
                {topContacts.map((contact, index) => (
                  <motion.div
                    key={contact.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.8 + index * 0.1 }}
                    className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="w-12 h-12 border-2 border-primary/20">
                        <AvatarImage src={contact.avatar} />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {contact.firstName[0]}{contact.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {contact.firstName} {contact.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {contact.companyName}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <RoleBadge role={contact.role} />
                          <SentimentIndicator sentiment={contact.sentiment} size="sm" />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <p className="text-sm text-muted-foreground">
                          {contact.interactionCount} interações
                        </p>
                        {contact.lastInteraction && (
                          <p className="text-xs text-muted-foreground">
                            Último: {formatDistanceToNow(contact.lastInteraction, { locale: ptBR, addSuffix: true })}
                          </p>
                        )}
                      </div>
                      <RelationshipScore score={contact.relationshipScore} size="sm" />
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Insights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.8 }}
          >
            <Card className="h-full">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-warning" />
                  Insights Recentes
                </CardTitle>
                <Link to="/insights">
                  <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                    Ver todos <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentInsights.map((insight, index) => (
                  <motion.div
                    key={insight.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.9 + index * 0.1 }}
                    className="p-4 rounded-lg border border-border bg-card hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-warning/10 text-warning">
                        {insight.category === 'opportunity' ? 'Oportunidade' : 
                         insight.category === 'personality' ? 'Personalidade' :
                         insight.category === 'preference' ? 'Preferência' : 'Comportamento'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {insight.confidence}% confiança
                      </span>
                    </div>
                    <h4 className="font-medium text-foreground mb-1">{insight.title}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {insight.description}
                    </p>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.9 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Clock className="w-5 h-5 text-muted-foreground" />
                Atividade Recente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockActivities.map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 1 + index * 0.05 }}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-secondary/30 transition-colors"
                  >
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-medium text-foreground">{activity.entityName}</span>
                        <span className="text-muted-foreground"> — {activity.description}</span>
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(activity.createdAt, { locale: ptBR, addSuffix: true })}
                    </span>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
