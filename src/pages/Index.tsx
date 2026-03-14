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
  ShoppingBag,
  LayoutGrid,
  Brain,
  Heart,
  Activity
} from 'lucide-react';
import { ScrollProgressBar } from '@/components/dashboard/ScrollProgressBar';
import { WelcomeHeroCard } from '@/components/dashboard/WelcomeHeroCard';
import { OnboardingChecklist } from '@/components/dashboard/OnboardingChecklist';
import { LazySection } from '@/components/dashboard/LazySection';
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
import { Surface } from '@/components/ui/surface';
import { Typography } from '@/components/ui/typography';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import DashboardSkeleton from '@/components/skeletons/DashboardSkeleton';
import { DashboardErrorBoundary } from '@/components/dashboard/DashboardErrorBoundary';
import { YourDaySection } from '@/components/dashboard/YourDaySection';
import { PreContactBriefing } from '@/components/briefing/PreContactBriefing';
import { useCompatibilityAlerts } from '@/hooks/useCompatibilityAlerts';
import { EmptyState } from '@/components/ui/empty-state';
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
  <Surface level={1} rounded="lg" className="animate-pulse h-32 w-full" />
);

const periodOptions: { value: PeriodFilter; label: string }[] = [
  { value: '7d', label: 'Última Semana' },
  { value: '30d', label: 'Último Mês' },
  { value: '90d', label: 'Últimos 3 Meses' },
];

const Dashboard = () => {
  const [period, setPeriod] = useState<PeriodFilter>('7d');
  const [activeTab, setActiveTab] = useState('overview');
  
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

  // Check if user has data for onboarding
  const hasProfile = !!dashboardStats.totalContacts || !!dashboardStats.totalCompanies;
  const hasContacts = dashboardStats.totalContacts > 0;
  const hasCompanies = dashboardStats.totalCompanies > 0;
  const hasInteractions = dashboardStats.weeklyInteractions > 0;

  return (
    <AppLayout>
      <ScrollProgressBar />
      <Header 
        title="Dashboard" 
        subtitle="Visão geral do seu relacionamento com clientes"
        showBreadcrumbs={false}
      />

      <div className="p-6 space-y-6">
        {/* Welcome Hero Card (#13) */}
        <WelcomeHeroCard
          totalContacts={dashboardStats.totalContacts}
          weeklyInteractions={dashboardStats.weeklyInteractions}
          averageScore={dashboardStats.averageScore}
        />

        {/* Onboarding Checklist (#26) */}
        <OnboardingChecklist
          hasProfile={hasProfile}
          hasContacts={hasContacts}
          hasCompanies={hasCompanies}
          hasInteractions={hasInteractions}
        />

        {/* Pre-Contact Briefing - single instance */}
        <DashboardErrorBoundary sectionName="Briefing">
          <PreContactBriefing compact className="mb-2" />
        </DashboardErrorBoundary>

        {/* Your Day Section */}
        <DashboardErrorBoundary sectionName="Seu Dia">
          <YourDaySection />
        </DashboardErrorBoundary>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <StatCard key={stat.title} {...stat} delay={index} />
          ))}
        </div>

        {/* Modular Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="overview" className="gap-2">
              <LayoutGrid className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">Visão Geral</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="relationships" className="gap-2">
              <Heart className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">Relacionamentos</span>
            </TabsTrigger>
            <TabsTrigger value="intelligence" className="gap-2">
              <Brain className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">Inteligência</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab: Overview */}
          <TabsContent value="overview" className="space-y-6 mt-0">
            {/* Portfolio Health */}
            <DashboardErrorBoundary sectionName="Saúde do Portfólio">
              <Suspense fallback={<LazyFallback />}>
                <PortfolioHealthDashboard 
                  contacts={mappedContacts}
                  interactions={mappedInteractions}
                />
              </Suspense>
            </DashboardErrorBoundary>

            {/* Important Dates */}
            <DashboardErrorBoundary sectionName="Datas Importantes">
              <Suspense fallback={<LazyFallback />}>
                <ImportantDatesCalendar 
                  contacts={mappedContacts}
                  interactions={mappedInteractions}
                />
              </Suspense>
            </DashboardErrorBoundary>

            {/* Recent Activity + Top Contacts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Activity */}
              <DashboardErrorBoundary sectionName="Atividade Recente">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="h-full">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <Clock className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
                        Atividade Recente
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {recentActivities.length === 0 ? (
                          <EmptyState
                            illustration="interactions"
                            title="Nenhuma atividade"
                            description="Suas atividades recentes aparecerão aqui."
                          />
                        ) : (
                          recentActivities.map((activity, index) => (
                            <motion.div
                              key={activity.id}
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.2, delay: index * 0.03 }}
                              className="flex items-center gap-4 p-3 rounded-lg hover:bg-surface-2 transition-colors"
                            >
                              <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm truncate">
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

              {/* Top Contacts */}
              <DashboardErrorBoundary sectionName="Melhores Relacionamentos">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.05 }}
                  className="lg:col-span-2"
                >
                  <Card className="h-full">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" aria-hidden="true" />
                        Melhores Relacionamentos
                      </CardTitle>
                      <Link to="/contatos">
                        <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                          Ver todos <ArrowRight className="w-4 h-4 ml-1" aria-hidden="true" />
                        </Button>
                      </Link>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {topContacts.length === 0 ? (
                        <EmptyState
                          illustration="contacts"
                          title="Nenhum contato"
                          description="Adicione contatos para ver seus melhores relacionamentos."
                          actions={[
                            { label: 'Adicionar contato', onClick: () => {}, variant: 'default' }
                          ]}
                        />
                      ) : (
                        topContacts.map((contact, index) => (
                          <Surface
                            key={contact.id}
                            level={1}
                            hoverable
                            rounded="lg"
                            className="flex items-center justify-between p-4 group"
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
                                <Typography variant="small" as="p">
                                  {contact.companyName}
                                </Typography>
                                <div className="flex items-center gap-2 mt-1">
                                  <RoleBadge role={contact.role as ContactRole} />
                                  <SentimentIndicator sentiment={contact.sentiment as SentimentType} size="sm" />
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right hidden sm:block">
                                <Typography variant="small" as="p">
                                  {contact.interactionCount} interações
                                </Typography>
                                {contact.lastInteraction && (
                                  <p className="text-xs text-muted-foreground">
                                    Último: {formatDistanceToNow(contact.lastInteraction, { locale: ptBR, addSuffix: true })}
                                  </p>
                                )}
                              </div>
                              <RelationshipScore score={contact.relationshipScore} size="sm" />
                            </div>
                          </Surface>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </DashboardErrorBoundary>
            </div>

            {/* Smart Reminders + Health Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DashboardErrorBoundary sectionName="Alertas e Lembretes">
                <div className="space-y-6">
                  <Suspense fallback={<LazyFallback />}>
                    <SmartRemindersPanel compact />
                  </Suspense>
                  <Suspense fallback={<LazyFallback />}>
                    <HealthAlertsPanel />
                  </Suspense>
                </div>
              </DashboardErrorBoundary>
              <DashboardErrorBoundary sectionName="Compatibilidade">
                <div className="space-y-6">
                  <Suspense fallback={<LazyFallback />}>
                    <DISCCompatibilityAlerts compact maxItems={3} />
                  </Suspense>
                  <Suspense fallback={<LazyFallback />}>
                    <CompatibilityAlertsList maxItems={3} />
                  </Suspense>
                </div>
              </DashboardErrorBoundary>
            </div>
          </TabsContent>

          {/* Tab: Analytics */}
          <TabsContent value="analytics" className="space-y-6 mt-0">
            {/* Period Filter */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-5 h-5" aria-hidden="true" />
                <Typography variant="body" className="font-medium">Período dos Gráficos</Typography>
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
            </div>

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
          </TabsContent>

          {/* Tab: Relationships */}
          <TabsContent value="relationships" className="space-y-6 mt-0">
            {/* Relationship Statistics */}
            <DashboardErrorBoundary sectionName="Estatísticas de Relacionamento">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-primary" aria-hidden="true" />
                <Typography variant="h4" gradient>Estatísticas de Relacionamento</Typography>
              </div>
              <Suspense fallback={<LazyFallback />}>
                <RelationshipStatsPanel />
              </Suspense>
            </DashboardErrorBoundary>

            {/* Closing Score */}
            <DashboardErrorBoundary sectionName="Score de Fechamento">
              <Suspense fallback={<LazyFallback />}>
                <ClosingScoreRanking maxItems={5} showStats={false} compact />
              </Suspense>
              <Suspense fallback={<LazyFallback />}>
                <ClosingScoreAlertsList maxItems={3} compact />
              </Suspense>
            </DashboardErrorBoundary>
          </TabsContent>

          {/* Tab: Intelligence */}
          <TabsContent value="intelligence" className="space-y-6 mt-0">
            {/* Purchase Patterns */}
            <DashboardErrorBoundary sectionName="Padrões de Compra">
              <div className="flex items-center gap-2 mb-4">
                <ShoppingBag className="w-5 h-5 text-primary" aria-hidden="true" />
                <Typography variant="h4" gradient>Padrões de Compra e Comportamento</Typography>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Suspense fallback={<LazyFallback />}>
                  <PurchasePatternsPanel compact />
                </Suspense>
                <Suspense fallback={<LazyFallback />}>
                  <BehaviorAlertsPanel compact />
                </Suspense>
              </div>
            </DashboardErrorBoundary>

            {/* Business Intelligence */}
            <DashboardErrorBoundary sectionName="Inteligência de Negócios">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-primary" aria-hidden="true" />
                <Typography variant="h4" gradient>Inteligência de Negócios</Typography>
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
            </DashboardErrorBoundary>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Floating Quick Actions */}
      <FloatingQuickActions />
    </AppLayout>
  );
};

export default Dashboard;