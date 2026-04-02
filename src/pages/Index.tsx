import { useState, lazy, Suspense, useRef, useMemo } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { motion, AnimatePresence } from 'framer-motion';
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
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ScrollProgressBar } from '@/components/dashboard/ScrollProgressBar';
import { WelcomeHeroCard } from '@/components/dashboard/WelcomeHeroCard';
import { OnboardingChecklist } from '@/components/dashboard/OnboardingChecklist';
import { LazySection } from '@/components/dashboard/LazySection';
import { AppLayout } from '@/components/layout/AppLayout';
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import DashboardSkeleton from '@/components/skeletons/DashboardSkeleton';
import { DashboardErrorBoundary } from '@/components/dashboard/DashboardErrorBoundary';
import { useCompatibilityAlerts } from '@/hooks/useCompatibilityAlerts';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useStaggerAnimation } from '@/hooks/useStaggerAnimation';
import { EmptyState } from '@/components/ui/empty-state';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ScrollToTopButton } from '@/components/navigation/ScrollToTopButton';

// Hooks for real data
import { useContacts } from '@/hooks/useContacts';
import { useCompanies } from '@/hooks/useCompanies';
import { useInteractions } from '@/hooks/useInteractions';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import type { ContactRole, SentimentType, Contact, Interaction, InteractionType, RelationshipStage, LifeEvent } from '@/types';
import { getBehavior } from '@/types/behavior';

// Lazy-loaded heavy components
const FloatingQuickActions = lazy(() => import('@/components/quick-actions/FloatingQuickActions').then(m => ({ default: m.FloatingQuickActions })));
const YourDaySection = lazy(() => import('@/components/dashboard/YourDaySection').then(m => ({ default: m.YourDaySection })));
const PreContactBriefing = lazy(() => import('@/components/briefing/PreContactBriefing').then(m => ({ default: m.PreContactBriefing })));

// Dashboard charts — only rendered in "analytics" tab
const ActivityChart = lazy(() => import('@/components/dashboard/DashboardCharts').then(m => ({ default: m.ActivityChart })));
const RelationshipEvolutionChart = lazy(() => import('@/components/dashboard/DashboardCharts').then(m => ({ default: m.RelationshipEvolutionChart })));
const ContactDistributionChart = lazy(() => import('@/components/dashboard/DashboardCharts').then(m => ({ default: m.ContactDistributionChart })));
const RelationshipScoreChart = lazy(() => import('@/components/dashboard/DashboardCharts').then(m => ({ default: m.RelationshipScoreChart })));
const SentimentChart = lazy(() => import('@/components/dashboard/DashboardCharts').then(m => ({ default: m.SentimentChart })));

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

type PeriodFilter = '7d' | '30d' | '90d';

const LazyFallback = () => (
  <Surface level={1} rounded="lg" className="animate-pulse h-32 w-full" />
);

const periodOptions: { value: PeriodFilter; label: string }[] = [
  { value: '7d', label: 'Última Semana' },
  { value: '30d', label: 'Último Mês' },
  { value: '90d', label: 'Últimos 3 Meses' },
];

const TAB_ORDER = ['overview', 'analytics', 'relationships', 'intelligence'];

const Dashboard = () => {
  usePageTitle('Dashboard');
  const [period, setPeriod] = useState<PeriodFilter>('7d');
  const [activeTab, setActiveTab] = useState('overview');
  const [tabDirection, setTabDirection] = useState(0); // -1 left, 1 right
  const [briefingOpen, setBriefingOpen] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);
  
  // Real data hooks — single instance, shared with useDashboardStats
  const { contacts, loading: contactsLoading } = useContacts();
  const { companies, loading: companiesLoading } = useCompanies();
  const { interactions, loading: interactionsLoading } = useInteractions();
  const dashboardStats = useDashboardStats({
    contacts,
    companies,
    interactions,
    loading: contactsLoading || companiesLoading || interactionsLoading,
  });
  
  // Check for compatibility alerts
  useCompatibilityAlerts();
  const prefersReducedMotion = useReducedMotion();

  const { loading, topContacts, recentActivities } = dashboardStats;
  const recentActivityAnimations = useStaggerAnimation(recentActivities.length, { baseDelay: 0.025, maxDelay: 0.3, duration: 0.2 });
  const topContactAnimations = useStaggerAnimation(topContacts.length, { baseDelay: 0.025, maxDelay: 0.3, duration: 0.2 });

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

  // Memoized O(1) lookup maps — only recomputed when source data changes
  const companyMap = useMemo(() => new Map(companies.map(c => [c.id, c])), [companies]);
  const interactionsByContact = useMemo(() => {
    const map = new Map<string, typeof interactions>();
    for (const i of interactions) {
      const list = map.get(i.contact_id);
      if (list) list.push(i);
      else map.set(i.contact_id, [i]);
    }
    return map;
  }, [interactions]);

  // Only compute heavy mappings when overview tab is active
  const mappedContacts = useMemo(() => {
    if (activeTab !== 'overview') return [] as Contact[];
    return contacts.map(c => {
      const company = c.company_id ? companyMap.get(c.company_id) : undefined;
      const contactInteractions = interactionsByContact.get(c.id) || [];
      const lastInteraction = contactInteractions.length > 0 
        ? new Date(contactInteractions.reduce((latest, i) => 
            i.created_at > latest ? i.created_at : latest, contactInteractions[0].created_at
          ))
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
  }, [contacts, companyMap, interactionsByContact, activeTab]);

  const mappedInteractions = useMemo(() => {
    if (activeTab !== 'overview') return [] as Interaction[];
    return interactions.map(i => ({
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
  }, [interactions, activeTab]);

  if (loading) {
    return (
      <AppLayout>
        <Header 
          title="Dashboard" 
          subtitle="Visão geral do seu relacionamento com clientes"
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

  const handleTabChange = (value: string) => {
    const oldIndex = TAB_ORDER.indexOf(activeTab);
    const newIndex = TAB_ORDER.indexOf(value);
    setTabDirection(newIndex > oldIndex ? 1 : -1);
    setActiveTab(value);
    // Scroll to tabs area when switching
    tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const tabAnimationVariants = {
    initial: { opacity: 0, x: prefersReducedMotion ? 0 : tabDirection * 20 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: prefersReducedMotion ? 0.01 : 0.2, ease: 'easeOut' as const },
  };

  return (
    <AppLayout>
      <ScrollProgressBar />
      <Header 
        title="Dashboard" 
        subtitle="Visão geral do seu relacionamento com clientes"
      />

      <div className="p-4 md:p-6 space-y-4 md:space-y-5">
        {/* Welcome Hero Card — compact version */}
        <WelcomeHeroCard
          totalContacts={dashboardStats.totalContacts}
          weeklyInteractions={dashboardStats.weeklyInteractions}
          averageScore={dashboardStats.averageScore}
        />

        {/* Onboarding Checklist */}
        <OnboardingChecklist
          hasProfile={hasProfile}
          hasContacts={hasContacts}
          hasCompanies={hasCompanies}
          hasInteractions={hasInteractions}
        />

        {/* Your Day Section — collapsible to save space */}
        <DashboardErrorBoundary sectionName="Seu Dia">
          <YourDaySection />
        </DashboardErrorBoundary>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {stats.map((stat, index) => (
            <StatCard key={stat.title} {...stat} delay={prefersReducedMotion ? 0 : index} />
          ))}
        </div>

        {/* Pre-Contact Briefing — collapsible */}
        <DashboardErrorBoundary sectionName="Briefing">
          <Collapsible open={briefingOpen} onOpenChange={setBriefingOpen}>
            <CollapsibleTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full gap-2 text-muted-foreground hover:text-foreground"
              >
                <Brain className="w-4 h-4" />
                Briefing Pré-Contato
                {briefingOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3">
              <PreContactBriefing compact />
            </CollapsibleContent>
          </Collapsible>
        </DashboardErrorBoundary>

        {/* ===== MODULAR DASHBOARD TABS — sticky header ===== */}
        <div ref={tabsRef}>
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <div className="sticky top-[57px] md:top-0 z-10 bg-background/90 backdrop-blur-xl pb-3 pt-2 -mx-4 md:-mx-6 px-4 md:px-6 border-b border-border/30">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview" className="gap-1.5 text-xs sm:text-sm">
                  <LayoutGrid className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span className="hidden xs:inline truncate">Geral</span>
                  <span className="hidden sm:inline truncate">Visão Geral</span>
                </TabsTrigger>
                <TabsTrigger value="analytics" className="gap-1.5 text-xs sm:text-sm">
                  <BarChart3 className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span className="hidden sm:inline truncate">Analytics</span>
                </TabsTrigger>
                <TabsTrigger value="relationships" className="gap-1.5 text-xs sm:text-sm">
                  <Heart className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span className="hidden sm:inline truncate">Relações</span>
                </TabsTrigger>
                <TabsTrigger value="intelligence" className="gap-1.5 text-xs sm:text-sm">
                  <Brain className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span className="hidden sm:inline truncate">IA</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Tab: Overview */}
            <TabsContent value="overview" className="space-y-5 mt-4">
              <motion.div
                key={`overview-${tabDirection}`}
                initial={tabAnimationVariants.initial}
                animate={tabAnimationVariants.animate}
                transition={tabAnimationVariants.transition}
                className="space-y-5"
              >
              {/* Portfolio Health — contained height */}
              <DashboardErrorBoundary sectionName="Saúde do Portfólio">
                <LazySection fallbackVariant="card" fallbackHeight="h-48">
                  <PortfolioHealthDashboard 
                    contacts={mappedContacts}
                    interactions={mappedInteractions}
                  />
                </LazySection>
              </DashboardErrorBoundary>

              {/* Important Dates */}
              <DashboardErrorBoundary sectionName="Datas Importantes">
                <LazySection fallbackVariant="list" fallbackHeight="h-48">
                  <ImportantDatesCalendar 
                    contacts={mappedContacts}
                    interactions={mappedInteractions}
                  />
                </LazySection>
              </DashboardErrorBoundary>

              {/* Recent Activity + Top Contacts */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Recent Activity */}
                <DashboardErrorBoundary sectionName="Atividade Recente">
                  <motion.div
                    initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: prefersReducedMotion ? 0 : 0.25 }}
                  >
                    <Card className="h-full">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                          Atividade Recente
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="max-h-[320px]">
                          <div className="space-y-2 pr-2">
                            {recentActivities.length === 0 ? (
                              <EmptyState
                                illustration="interactions"
                                title="Nenhuma atividade"
                                description="Suas atividades recentes aparecerão aqui."
                              />
                            ) : (
                              recentActivities.map((activity, index) => {
                                const animation = recentActivityAnimations[index];
                                return (
                                  <motion.div
                                    key={activity.id}
                                    initial={animation?.initial}
                                    animate={animation?.animate}
                                    transition={animation?.transition}
                                    style={animation?.style}
                                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-surface-2 transition-colors"
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
                                );
                              })
                            )}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </motion.div>
                </DashboardErrorBoundary>

                {/* Top Contacts */}
                <DashboardErrorBoundary sectionName="Melhores Relacionamentos">
                  <motion.div
                    initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: prefersReducedMotion ? 0 : 0.25, delay: prefersReducedMotion ? 0 : 0.05 }}
                    className="lg:col-span-2"
                  >
                    <Card className="h-full">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                          <Users className="w-4 h-4 text-primary" aria-hidden="true" />
                          Melhores Relacionamentos
                        </CardTitle>
                        <Link to="/contatos">
                          <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                            Ver todos <ArrowRight className="w-4 h-4 ml-1" aria-hidden="true" />
                          </Button>
                        </Link>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="max-h-[320px]">
                          <div className="space-y-2 pr-2">
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
                              topContacts.map((contact, index) => {
                                const animation = topContactAnimations[index];
                                return (
                                  <motion.div
                                    key={contact.id}
                                    initial={animation?.initial}
                                    animate={animation?.animate}
                                    transition={animation?.transition}
                                    style={animation?.style}
                                  >
                                    <Surface
                                      level={1}
                                      hoverable
                                      rounded="lg"
                                      className="flex items-center justify-between p-3 group"
                                    >
                                      <div className="flex items-center gap-3">
                                        <OptimizedAvatar
                                          src={contact.avatar || undefined}
                                          alt={`${contact.firstName} ${contact.lastName}`}
                                          fallback={`${contact.firstName?.[0] || 'C'}${contact.lastName?.[0] || 'N'}`}
                                          size="md"
                                          className="w-10 h-10 border-2 border-primary/20"
                                        />
                                        <div>
                                          <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                                            {contact.firstName} {contact.lastName}
                                          </p>
                                          <Typography variant="small" as="p">
                                            {contact.companyName}
                                          </Typography>
                                          <div className="flex items-center gap-2 mt-0.5">
                                            <RoleBadge role={contact.role as ContactRole} />
                                            <SentimentIndicator sentiment={contact.sentiment as SentimentType} size="sm" />
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <div className="text-right hidden sm:block">
                                          <Typography variant="small" as="p">
                                            {contact.interactionCount} interações
                                          </Typography>
                                        </div>
                                        <RelationshipScore score={contact.relationshipScore} size="sm" />
                                      </div>
                                    </Surface>
                                  </motion.div>
                                );
                              })
                            )}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </motion.div>
                </DashboardErrorBoundary>
              </div>

              {/* Smart Reminders + Health Alerts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <DashboardErrorBoundary sectionName="Alertas e Lembretes">
                  <div className="space-y-5">
                    <LazySection fallbackVariant="list">
                      <SmartRemindersPanel compact />
                    </LazySection>
                    <LazySection fallbackVariant="card">
                      <HealthAlertsPanel />
                    </LazySection>
                  </div>
                </DashboardErrorBoundary>
                <DashboardErrorBoundary sectionName="Compatibilidade">
                  <div className="space-y-5">
                    <LazySection fallbackVariant="list">
                      <DISCCompatibilityAlerts compact maxItems={3} />
                    </LazySection>
                    <LazySection fallbackVariant="list">
                      <CompatibilityAlertsList maxItems={3} />
                    </LazySection>
                  </div>
                </DashboardErrorBoundary>
              </div>
              </motion.div>
            </TabsContent>

            {/* Tab: Analytics */}
            <TabsContent value="analytics" className="mt-4">
              <motion.div key={`analytics-${tabDirection}`} initial={tabAnimationVariants.initial} animate={tabAnimationVariants.animate} transition={tabAnimationVariants.transition} className="space-y-5">
              {/* Period Filter */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-5 h-5" aria-hidden="true" />
                  <Typography variant="body" className="font-medium">Período dos Gráficos</Typography>
                </div>
                <div className="flex items-center gap-1 bg-secondary/50 p-1 rounded-lg">
                  {periodOptions.map((option) => (
                    <Button
                      key={option.value}
                      variant={period === option.value ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setPeriod(option.value)}
                      className={`text-xs sm:text-sm transition-all ${
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <ActivityChart period={period} />
                  <RelationshipEvolutionChart period={period} />
                </div>
              </DashboardErrorBoundary>

              {/* Charts Row 2 */}
              <DashboardErrorBoundary sectionName="Distribuição e Scores">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  <ContactDistributionChart />
                  <RelationshipScoreChart period={period} />
                  <SentimentChart period={period} />
                </div>
              </DashboardErrorBoundary>
              </motion.div>
            </TabsContent>

            {/* Tab: Relationships */}
            <TabsContent value="relationships" className="mt-4">
              <motion.div key={`relationships-${tabDirection}`} initial={tabAnimationVariants.initial} animate={tabAnimationVariants.animate} transition={tabAnimationVariants.transition} className="space-y-5">
              <DashboardErrorBoundary sectionName="Estatísticas de Relacionamento">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-5 h-5 text-primary" aria-hidden="true" />
                  <Typography variant="h4" gradient>Estatísticas de Relacionamento</Typography>
                </div>
                <LazySection fallbackVariant="chart" fallbackHeight="h-64">
                  <RelationshipStatsPanel />
                </LazySection>
              </DashboardErrorBoundary>

              <DashboardErrorBoundary sectionName="Score de Fechamento">
                <LazySection fallbackVariant="list">
                  <ClosingScoreRanking maxItems={5} showStats={false} compact />
                </LazySection>
                <LazySection fallbackVariant="list" className="mt-5">
                  <ClosingScoreAlertsList maxItems={3} compact />
                </LazySection>
              </DashboardErrorBoundary>
              </motion.div>
            </TabsContent>

            {/* Tab: Intelligence */}
            <TabsContent value="intelligence" className="mt-4">
              <motion.div key={`intelligence-${tabDirection}`} initial={tabAnimationVariants.initial} animate={tabAnimationVariants.animate} transition={tabAnimationVariants.transition} className="space-y-5">
              <DashboardErrorBoundary sectionName="Padrões de Compra">
                <div className="flex items-center gap-2 mb-4">
                  <ShoppingBag className="w-5 h-5 text-primary" aria-hidden="true" />
                  <Typography variant="h4" gradient>Padrões de Compra e Comportamento</Typography>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <LazySection fallbackVariant="chart">
                    <PurchasePatternsPanel compact />
                  </LazySection>
                  <LazySection fallbackVariant="card">
                    <BehaviorAlertsPanel compact />
                  </LazySection>
                </div>
              </DashboardErrorBoundary>

              <DashboardErrorBoundary sectionName="Inteligência de Negócios">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-5 h-5 text-primary" aria-hidden="true" />
                  <Typography variant="h4" gradient>Inteligência de Negócios</Typography>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  <LazySection fallbackVariant="chart">
                    <ChurnPredictionPanel compact />
                  </LazySection>
                  <LazySection fallbackVariant="chart">
                    <BestTimeToContactPanel compact />
                  </LazySection>
                  <LazySection fallbackVariant="chart">
                    <DealVelocityPanel compact />
                  </LazySection>
                </div>
                
                <div className="mt-5">
                  <LazySection fallbackVariant="chart" fallbackHeight="h-64">
                    <RFMAnalysisPanel compact />
                  </LazySection>
                </div>
              </DashboardErrorBoundary>
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Floating Components */}
      <ScrollToTopButton />
      <FloatingQuickActions />
    </AppLayout>
  );
};

export default Dashboard;
