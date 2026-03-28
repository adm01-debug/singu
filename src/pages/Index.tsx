import { useState, useMemo } from 'react';
import {
  LayoutGrid,
  BarChart3,
  Brain,
  Heart,
} from 'lucide-react';
import { ScrollProgressBar } from '@/components/dashboard/ScrollProgressBar';
import { WelcomeHeroCard } from '@/components/dashboard/WelcomeHeroCard';
import { OnboardingChecklist } from '@/components/dashboard/OnboardingChecklist';
import { DashboardStatCards } from '@/components/dashboard/DashboardStatCards';
import { RecentActivityCard } from '@/components/dashboard/RecentActivityCard';
import { TopContactsCard } from '@/components/dashboard/TopContactsCard';
import {
  OverviewTabContent,
  AnalyticsTabContent,
  RelationshipsTabContent,
  IntelligenceTabContent,
} from '@/components/dashboard/DashboardTabContent';
import { AppLayout } from '@/components/layout/AppLayout';
import { FloatingQuickActions } from '@/components/quick-actions/FloatingQuickActions';
import { Header } from '@/components/layout/Header';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardErrorBoundary } from '@/components/dashboard/DashboardErrorBoundary';
import { YourDaySection } from '@/components/dashboard/YourDaySection';
import { PreContactBriefing } from '@/components/briefing/PreContactBriefing';
import { useCompatibilityAlerts } from '@/hooks/useCompatibilityAlerts';
import DashboardSkeleton from '@/components/skeletons/DashboardSkeleton';

// Hooks for real data
import { useContacts } from '@/hooks/useContacts';
import { useCompanies } from '@/hooks/useCompanies';
import { useInteractions } from '@/hooks/useInteractions';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import type { ContactRole, SentimentType, Contact, Interaction, InteractionType, RelationshipStage, LifeEvent } from '@/types';
import { getBehavior } from '@/types/behavior';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');

  // Real data hooks
  const { contacts } = useContacts();
  const { companies } = useCompanies();
  const { interactions } = useInteractions();
  const dashboardStats = useDashboardStats();

  // Check for compatibility alerts
  useCompatibilityAlerts();

  const { loading, topContacts, recentActivities } = dashboardStats;

  // Map contacts array for portfolio health
  const mappedContacts = useMemo(() => contacts.map(c => {
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
  }) as Contact[], [contacts, companies, interactions]);

  const mappedInteractions = useMemo(() => interactions.map(i => ({
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
  })) as Interaction[], [interactions]);

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
        {/* Welcome Hero Card */}
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

        {/* Pre-Contact Briefing */}
        <DashboardErrorBoundary sectionName="Briefing">
          <PreContactBriefing compact className="mb-2" />
        </DashboardErrorBoundary>

        {/* Your Day Section */}
        <DashboardErrorBoundary sectionName="Seu Dia">
          <YourDaySection />
        </DashboardErrorBoundary>

        {/* Stats Grid */}
        <DashboardStatCards dashboardStats={dashboardStats} />

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

          <OverviewTabContent
            mappedContacts={mappedContacts}
            mappedInteractions={mappedInteractions}
            recentActivityNode={<RecentActivityCard activities={recentActivities} />}
            topContactsNode={<TopContactsCard contacts={topContacts} />}
          />

          <AnalyticsTabContent />
          <RelationshipsTabContent />
          <IntelligenceTabContent />
        </Tabs>
      </div>

      {/* Floating Quick Actions */}
      <FloatingQuickActions />
    </AppLayout>
  );
};

export default Dashboard;
