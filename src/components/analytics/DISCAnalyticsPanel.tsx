// ==============================================
// DISCAnalyticsPanel - Enterprise DISC Dashboard
// ==============================================

import { useEffect, useState } from 'react';
import { Brain, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useDISCAnalysis } from '@/hooks/useDISCAnalysis';
import { DISC_PROFILES } from '@/data/discAdvancedData';
import { DISCProfile } from '@/types';
import { getContactBehavior } from '@/lib/contact-utils';
import { logger } from '@/lib/logger';
import { ContactWithDISC, DISC_COLORS } from './DISCAnalyticsTypes';
import { DISCStatsCards } from './DISCStatsCards';
import { DISCDistributionTab } from './DISCDistributionTab';
import { DISCPerformanceTab } from './DISCPerformanceTab';
import { DISCInsightsTab } from './DISCInsightsTab';
import { DISCContactsTab } from './DISCContactsTab';

const DISCAnalyticsPanel = () => {
  const { user } = useAuth();
  const { dashboardData, fetchDashboardData } = useDISCAnalysis();
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<ContactWithDISC[]>([]);
  const [stats, setStats] = useState({
    totalProfiled: 0,
    avgConfidence: 0,
    mostCommon: 'I' as DISCProfile,
    recentAnalyses: 0
  });

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Fetch contacts with DISC profiles
      const { data: contactsData } = await supabase
        .from('contacts')
        .select(`
          id, first_name, last_name, avatar_url, behavior, relationship_score,
          companies(name)
        `)
        .eq('user_id', user.id);

      const mappedContacts: ContactWithDISC[] = (contactsData || [])
        .map(c => {
          const behavior = getContactBehavior(c);
          return {
            id: c.id,
            firstName: c.first_name,
            lastName: c.last_name,
            avatar: c.avatar_url || undefined,
            discProfile: behavior?.discProfile as DISCProfile,
            discConfidence: behavior?.discConfidence,
            relationshipScore: c.relationship_score || 0,
            companyName: (c.companies as { name: string } | null)?.name
          };
        })
        .filter(c => c.discProfile);

      setContacts(mappedContacts);

      // Calculate stats
      const profileCounts: Record<string, number> = { D: 0, I: 0, S: 0, C: 0 };
      let totalConfidence = 0;
      let confidenceCount = 0;

      mappedContacts.forEach(c => {
        if (c.discProfile && c.discProfile in profileCounts) {
          profileCounts[c.discProfile]++;
        }
        if (c.discConfidence) {
          totalConfidence += c.discConfidence;
          confidenceCount++;
        }
      });

      const mostCommon = (Object.entries(profileCounts)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || 'I') as DISCProfile;

      // Fetch recent analyses
      const { count: recentCount } = await supabase
        .from('disc_analysis_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('analyzed_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      setStats({
        totalProfiled: mappedContacts.length,
        avgConfidence: confidenceCount > 0 ? Math.round(totalConfidence / confidenceCount) : 0,
        mostCommon,
        recentAnalyses: recentCount || 0
      });

      // Fetch dashboard data
      await fetchDashboardData();

    } catch (err) {
      logger.error('Error loading DISC data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-80" />)}
        </div>
      </div>
    );
  }

  // Prepare chart data
  const distributionData = (['D', 'I', 'S', 'C'] as const).map(profile => ({
    name: DISC_PROFILES[profile]?.name || profile,
    value: contacts.filter(c => c.discProfile === profile).length,
    profile,
    color: DISC_COLORS[profile]
  }));

  const compatibilityRadarData = (['D', 'I', 'S', 'C'] as const).map(profile => {
    const profileContacts = contacts.filter(c => c.discProfile === profile);
    const avgScore = profileContacts.length > 0
      ? Math.round(profileContacts.reduce((sum, c) => sum + c.relationshipScore, 0) / profileContacts.length)
      : 0;
    return {
      profile: DISC_PROFILES[profile]?.name || profile,
      score: avgScore,
      fullMark: 100
    };
  });

  // Group by blend profiles
  const blendCounts: Record<string, number> = {};
  contacts.forEach(c => {
    const behavior = c.discProfile;
    if (behavior) {
      blendCounts[behavior] = (blendCounts[behavior] || 0) + 1;
    }
  });

  const blendData = Object.entries(blendCounts)
    .map(([blend, count]) => ({ blend, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary" />
            DISC Analytics
          </h2>
          <p className="text-muted-foreground">
            Análise comportamental do portfólio de contatos
          </p>
        </div>
        <Button onClick={loadData} variant="outline" size="sm" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <DISCStatsCards stats={stats} />

      {/* Main Content Tabs */}
      <Tabs defaultValue="distribution" className="space-y-6">
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="distribution">Distribuição</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="contacts">Contatos</TabsTrigger>
        </TabsList>

        <TabsContent value="distribution" className="space-y-6">
          <DISCDistributionTab
            distributionData={distributionData}
            blendData={blendData}
            totalProfiled={stats.totalProfiled}
          />
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <DISCPerformanceTab
            compatibilityRadarData={compatibilityRadarData}
            contacts={contacts}
          />
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <DISCInsightsTab
            compatibilityInsights={dashboardData?.compatibilityInsights}
          />
        </TabsContent>

        <TabsContent value="contacts">
          <DISCContactsTab contacts={contacts} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DISCAnalyticsPanel;
