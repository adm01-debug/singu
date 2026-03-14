import { useState, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, 
  Users, 
  MessageSquare, 
  TrendingUp,
  ArrowRight,
  Clock,
  Calendar,
  BarChart3,
  Target,
  ShoppingBag
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { FloatingQuickActions } from '@/components/quick-actions/FloatingQuickActions';
import { Header } from '@/components/layout/Header';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OptimizedAvatar } from '@/components/ui/optimized-avatar';
import { RoleBadge } from '@/components/ui/role-badge';
import { RelationshipScore } from '@/components/ui/relationship-score';
import { SentimentIndicator } from '@/components/ui/sentiment-indicator';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import DashboardSkeleton from '@/components/skeletons/DashboardSkeleton';
import { DashboardErrorBoundary } from '@/components/dashboard/DashboardErrorBoundary';
import { YourDaySection } from '@/components/dashboard/YourDaySection';
import { PreContactBriefing } from '@/components/briefing/PreContactBriefing';
import { useCompatibilityAlerts } from '@/hooks/useCompatibilityAlerts';
import {
  ActivityChart,
  RelationshipEvolutionChart,
  ContactDistributionChart,
  RelationshipScoreChart,
  SentimentChart,
  type PeriodFilter,
} from '@/components/dashboard/DashboardCharts';

// Hooks for real data
import { useContacts } from '@/hooks/useContacts';
import { useCompanies } from '@/hooks/useCompanies';
import { useInteractions } from '@/hooks/useInteractions';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import type { ContactRole, SentimentType, Contact, Interaction, InteractionType, RelationshipStage, LifeEvent } from '@/types';
import { getBehavior } from '@/types/behavior';

// Lazy-loaded below-the-fold components
const SmartRemindersPanel = lazy(() => import('@/components/smart-reminders/SmartRemindersPanel').then(m => ({ default: m.SmartRemindersPanel })));
const RelationshipStatsPanel = lazy(() => import('@/components/dashboard/RelationshipStatsPanel').then(m => ({ default: m.RelationshipStatsPanel })));
const PortfolioHealthDashboard = lazy(() => import('@/components/dashboard/PortfolioHealthDashboard').then(m => ({ default: m.PortfolioHealthDashboard })));
const HealthAlertsPanel = lazy(() => import('@/components/dashboard/HealthAlertsPanel').then(m => ({ default: m.HealthAlertsPanel })));
const ImportantDatesCalendar = lazy(() => import('@/components/dashboard/ImportantDatesCalendar').then(m => ({ default: m.ImportantDatesCalendar })));
const CompatibilityAlertsList = lazy(() => import('@/components/triggers/CompatibilityAlertsList').then(m => ({ default: m.CompatibilityAlertsList })));
const ClosingScoreAlertsList = lazy(() => import('@/components/analytics/ClosingScoreAlertsList').then(m => ({ default: m.ClosingScoreAlertsList })));
const ClosingScoreRanking = lazy(() => import('@/components/analytics/ClosingScoreRanking').then(m => ({ default: m.ClosingScoreRanking })));
const ChurnPredictionPanel = lazy(() => import('@/components/analytics/ChurnPredictionPanel').then(m => ({ default: m.ChurnPredictionPanel })));
const BestTimeToContactPanel = lazy(() => import('@/components/analytics/BestTimeToContactPanel').then(m => ({ default: m.BestTimeToContactPanel })));
const DealVelocityPanel = lazy(() => import('@/components/analytics/DealVelocityPanel').then(m => ({ default: m.DealVelocityPanel })));
const PurchasePatternsPanel = lazy(() => import('@/components/analytics/PurchasePatternsPanel').then(m => ({ default: m.PurchasePatternsPanel })));
const BehaviorAlertsPanel = lazy(() => import('@/components/analytics/BehaviorAlertsPanel').then(m => ({ default: m.BehaviorAlertsPanel })));
const RFMAnalysisPanel = lazy(() => import('@/components/analytics/RFMAnalysisPanel').then(m => ({ default: m.RFMAnalysisPanel })));
const DISCCompatibilityAlerts = lazy(() => import('@/components/disc').then(m => ({ default: m.DISCCompatibilityAlerts })));

const LazyFallback = () => (
  <div className="animate-pulse rounded-lg bg-muted/50 h-32 w-full" />
);

const periodOptions: { value: PeriodFilter; label: string }[] = [
  { value: '7d', label: 'Última Semana' },
  { value: '30d', label: 'Último Mês' },
  { value: '90d', label: 'Últimos 3 Meses' },
];

const Dashboard = () => {
  const [period, setPeriod] = useState<PeriodFilter>('7d');
  
  // Real data hooks
  const { contacts } = useContacts();
  const { companies } = useCompanies();
  const { interactions } = useInteractions();
  const dashboardStats = useDashboardStats();
  
  // Check for compatibility alerts
  useCompatibilityAlerts();

  const { loading, topContacts, recentActivities } = dashboardStats;

  // Build stats from real data
  const stats = [
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

  // Map contacts array for portfolio health
  const mappedContacts = contacts.map(c => {
    const company = companies.find(co => co.id === c.company_id);
    const contactInteractions = interactions.filter(i => i.contact_id === c.id);
    const lastInteraction = contactInteractions.length > 0 
      ? new Date(contactInteractions.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0].created_at)
      : undefined;
    
    return {
      id: c.id,
      firstName: c.first_name,
      lastName: c.last_name,
      email: c.email || '',
      phone: c.phone || '',
      whatsapp: c.whatsapp || undefined,
      linkedin: c.linkedin || undefined,
      instagram: c.instagram || undefined,
      twitter: c.twitter || undefined,
      role: (c.role as ContactRole) || 'contact',
      companyId: c.company_id || '',
      companyName: company?.name || '',
      relationshipScore: c.relationship_score || 0,
      sentiment: (c.sentiment as SentimentType) || 'neutral',
      avatar: c.avatar_url || undefined,
      interactionCount: contactInteractions.length,
      lastInteraction,
      createdAt: new Date(c.created_at),
      updatedAt: new Date(c.updated_at),
      tags: c.tags || [],
      notes: c.notes || '',
      hobbies: c.hobbies || [],
      interests: c.interests || [],
      familyInfo: c.family_info || undefined,
      personalNotes: c.personal_notes || undefined,
      behavior: getBehavior(c.behavior) || {
        discProfile: null,
        discConfidence: 0,
        preferredChannel: 'whatsapp',
        formalityLevel: 3 as const,
        decisionCriteria: [],
        needsApproval: false,
        decisionPower: 5,
        supportLevel: 5,
        influencedByIds: [],
        influencesIds: [],
        currentChallenges: [],
        competitorsUsed: [],
      },
      lifeEvents: (Array.isArray(c.life_events) ? c.life_events as unknown as LifeEvent[] : []),
      relationshipStage: (c.relationship_stage as RelationshipStage) || 'unknown',
      roleTitle: c.role_title || '',
      birthday: c.birthday ? new Date(c.birthday) : undefined,
    };
  }) as Contact[];

  const mappedInteractions = interactions.map(i => ({
    id: i.id,
    contactId: i.contact_id,
    companyId: i.company_id || '',
    type: (i.type as InteractionType) || 'note',
    title: i.title,
    content: i.content || '',
    sentiment: (i.sentiment as SentimentType) || 'neutral',
    followUpRequired: i.follow_up_required || false,
    followUpDate: i.follow_up_date ? new Date(i.follow_up_date) : undefined,
    tags: i.tags || [],
    keyInsights: i.key_insights || [],
    initiatedBy: (i.initiated_by as 'us' | 'them') || 'us',
    duration: i.duration || undefined,
    responseTime: i.response_time || undefined,
    attachments: i.attachments || [],
    createdAt: new Date(i.created_at),
  })) as Interaction[];

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

      {/* Pre-Contact Briefing Modal */}
      <PreContactBriefing />

      <div className="p-6 space-y-6">
        {/* Pre-Contact Briefings Compact */}
        <DashboardErrorBoundary sectionName="Briefing">
          <PreContactBriefing compact className="mb-2" />
        </DashboardErrorBoundary>

        {/* Your Day Section */}
        <DashboardErrorBoundary sectionName="Seu Dia">
          <YourDaySection />
        </DashboardErrorBoundary>

        {/* Portfolio Health Dashboard - Lazy */}
        <DashboardErrorBoundary sectionName="Saúde do Portfólio">
          <Suspense fallback={<LazyFallback />}>
            <PortfolioHealthDashboard 
              contacts={mappedContacts}
              interactions={mappedInteractions}
            />
          </Suspense>
        </DashboardErrorBoundary>

        {/* Important Dates Calendar - Lazy */}
        <DashboardErrorBoundary sectionName="Datas Importantes">
          <Suspense fallback={<LazyFallback />}>
            <ImportantDatesCalendar 
              contacts={mappedContacts}
              interactions={mappedInteractions}
            />
          </Suspense>
        </DashboardErrorBoundary>

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

        {/* Charts Row 1 */}
        <DashboardErrorBoundary sectionName="Gráficos de Atividade">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ActivityChart period={period} />
            <RelationshipEvolutionChart period={period} />
          </div>
        </DashboardErrorBoundary>

        {/* Charts Row 2 */}
        <DashboardErrorBoundary sectionName="Distribuição e Scores">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ContactDistributionChart />
            <RelationshipScoreChart period={period} />
            <SentimentChart period={period} />
          </div>
        </DashboardErrorBoundary>

        {/* Relationship Statistics Section - Lazy */}
        <DashboardErrorBoundary sectionName="Estatísticas de Relacionamento">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Estatísticas de Relacionamento</h2>
            </div>
            <Suspense fallback={<LazyFallback />}>
              <RelationshipStatsPanel />
            </Suspense>
          </motion.div>
        </DashboardErrorBoundary>

        {/* Purchase Patterns + Behavior Alerts - Lazy */}
        <DashboardErrorBoundary sectionName="Padrões de Compra">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.52 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <ShoppingBag className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Padrões de Compra e Comportamento</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Suspense fallback={<LazyFallback />}>
                <PurchasePatternsPanel compact />
              </Suspense>
              <Suspense fallback={<LazyFallback />}>
                <BehaviorAlertsPanel compact />
              </Suspense>
            </div>
          </motion.div>
        </DashboardErrorBoundary>

        {/* AI Insights Section - Lazy */}
        <DashboardErrorBoundary sectionName="Inteligência de Negócios">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.55 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Inteligência de Negócios</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Suspense fallback={<LazyFallback />}>
                <ChurnPredictionPanel compact />
              </Suspense>
              <Suspense fallback={<LazyFallback />}>
                <BestTimeToContactPanel compact />
              </Suspense>
              <Suspense fallback={<LazyFallback />}>
                <DealVelocityPanel compact />
              </Suspense>
            </div>
            
            <div className="mt-6">
              <Suspense fallback={<LazyFallback />}>
                <RFMAnalysisPanel compact />
              </Suspense>
            </div>
            
            <Suspense fallback={<LazyFallback />}>
              <ClosingScoreRanking maxItems={5} showStats={false} compact className="mt-6" />
            </Suspense>
          </motion.div>
        </DashboardErrorBoundary>

        {/* Smart Reminders + Health Alerts + Top Contacts - Lazy */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <DashboardErrorBoundary sectionName="Alertas e Lembretes">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.65 }}
              className="space-y-6"
            >
              <Suspense fallback={<LazyFallback />}>
                <SmartRemindersPanel compact />
              </Suspense>
              <Suspense fallback={<LazyFallback />}>
                <HealthAlertsPanel />
              </Suspense>
              <Suspense fallback={<LazyFallback />}>
                <DISCCompatibilityAlerts compact maxItems={3} />
              </Suspense>
              <Suspense fallback={<LazyFallback />}>
                <ClosingScoreAlertsList maxItems={3} compact />
              </Suspense>
              <Suspense fallback={<LazyFallback />}>
                <CompatibilityAlertsList maxItems={3} />
              </Suspense>
            </motion.div>
          </DashboardErrorBoundary>

          {/* Top Contacts */}
          <DashboardErrorBoundary sectionName="Melhores Relacionamentos">
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
                  {topContacts.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      Nenhum contato cadastrado ainda
                    </p>
                  ) : (
                    topContacts.map((contact, index) => (
                      <motion.div
                        key={contact.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.8 + index * 0.1 }}
                        className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-4">
                          <OptimizedAvatar 
                            src={contact.avatar || undefined}
                            alt={`${contact.firstName} ${contact.lastName}`}
                            fallback={`${contact.firstName?.[0] || 'C'}${contact.lastName?.[0] || 'N'}`}
                            size="md"
                            className="w-12 h-12 border-2 border-primary/20"
                          />
                          <div>
                            <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                              {contact.firstName} {contact.lastName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {contact.companyName}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <RoleBadge role={contact.role as ContactRole} />
                              <SentimentIndicator sentiment={contact.sentiment as SentimentType} size="sm" />
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
                    ))
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </DashboardErrorBoundary>
        </div>

        {/* Recent Activity */}
        <DashboardErrorBoundary sectionName="Atividade Recente">
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
                  {recentActivities.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      Nenhuma atividade recente
                    </p>
                  ) : (
                    recentActivities.map((activity, index) => (
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
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </DashboardErrorBoundary>
      </div>
      
      {/* Floating Quick Actions */}
      <FloatingQuickActions />
    </AppLayout>
  );
};

export default Dashboard;
