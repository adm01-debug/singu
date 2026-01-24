// ==============================================
// DISCAnalyticsPanel - Enterprise DISC Dashboard
// ==============================================

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar, AreaChart, Area, Legend
} from 'recharts';
import {
  Brain, Users, TrendingUp, TrendingDown, Minus, Target, Zap,
  RefreshCw, AlertCircle, CheckCircle2, Lightbulb, ArrowRight,
  Award, BarChart3, Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { OptimizedAvatar } from '@/components/ui/optimized-avatar';
import { DISCBadge } from '@/components/ui/disc-badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useDISCAnalysis } from '@/hooks/useDISCAnalysis';
import { DISC_PROFILES, DISC_BLEND_PROFILES, getProfileInfo } from '@/data/discAdvancedData';
import { DISCProfile } from '@/types';
import { getContactBehavior } from '@/lib/contact-utils';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface ContactWithDISC {
  id: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  discProfile: DISCProfile;
  discConfidence?: number;
  relationshipScore: number;
  companyName?: string;
}

const DISC_COLORS = {
  D: 'hsl(0, 84%, 60%)',      // Red
  I: 'hsl(45, 93%, 47%)',     // Yellow/Orange
  S: 'hsl(142, 76%, 36%)',    // Green
  C: 'hsl(217, 91%, 60%)'     // Blue
};

const DISC_BG_COLORS = {
  D: 'bg-red-500/10 text-red-600',
  I: 'bg-amber-500/10 text-amber-600',
  S: 'bg-emerald-500/10 text-emerald-600',
  C: 'bg-blue-500/10 text-blue-600'
};

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
      console.error('Error loading DISC data:', err);
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <Users className="w-8 h-8 text-primary" />
                <Badge variant="outline">Total</Badge>
              </div>
              <p className="text-3xl font-bold mt-2">{stats.totalProfiled}</p>
              <p className="text-sm text-muted-foreground">Contatos perfilados</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <Target className="w-8 h-8 text-emerald-500" />
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600">
                  {stats.avgConfidence}%
                </Badge>
              </div>
              <p className="text-3xl font-bold mt-2">{stats.avgConfidence}%</p>
              <p className="text-sm text-muted-foreground">Confiança média</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <Award className="w-8 h-8" style={{ color: DISC_COLORS[stats.mostCommon || 'I'] }} />
                <DISCBadge profile={stats.mostCommon} size="sm" />
              </div>
              <p className="text-3xl font-bold mt-2">
                {DISC_PROFILES[stats.mostCommon || 'I']?.name}
              </p>
              <p className="text-sm text-muted-foreground">Perfil predominante</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <Activity className="w-8 h-8 text-purple-500" />
                <Badge variant="outline" className="bg-purple-500/10 text-purple-600">
                  7 dias
                </Badge>
              </div>
              <p className="text-3xl font-bold mt-2">{stats.recentAnalyses}</p>
              <p className="text-sm text-muted-foreground">Análises recentes</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="distribution" className="space-y-6">
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="distribution">Distribuição</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="contacts">Contatos</TabsTrigger>
        </TabsList>

        {/* Distribution Tab */}
        <TabsContent value="distribution" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Distribuição por Perfil</CardTitle>
                <CardDescription>
                  Proporção de cada perfil DISC no portfólio
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={distributionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ profile, value }) => `${profile}: ${value}`}
                      >
                        {distributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ payload }) => {
                          if (payload && payload.length > 0) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-card border rounded-lg p-3 shadow-lg">
                                <p className="font-medium">{data.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {data.value} contatos
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Bar Chart - Profile Counts */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contagem por Perfil</CardTitle>
                <CardDescription>
                  Número de contatos em cada perfil DISC
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={distributionData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="profile" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {distributionData.map((entry, index) => (
                          <Cell key={`bar-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Blend Profiles */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Perfis Blend Mais Comuns</CardTitle>
              <CardDescription>
                Combinações de perfis identificadas no portfólio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {blendData.map((item, index) => (
                  <div key={item.blend} className="flex items-center gap-4">
                    <div className="w-8 text-center text-sm font-medium text-muted-foreground">
                      #{index + 1}
                    </div>
                    <DISCBadge profile={item.blend as DISCProfile} size="sm" />
                    <div className="flex-1">
                      <Progress 
                        value={(item.count / stats.totalProfiled) * 100} 
                        className="h-2"
                      />
                    </div>
                    <span className="text-sm font-medium w-12 text-right">
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Radar Chart - Score by Profile */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Score de Relacionamento por Perfil</CardTitle>
                <CardDescription>
                  Média de relationship score por tipo DISC
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={compatibilityRadarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="profile" />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} />
                      <Radar
                        name="Score"
                        dataKey="score"
                        stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary))"
                        fillOpacity={0.5}
                      />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Top Performers by Profile */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Top Performers por Perfil</CardTitle>
                <CardDescription>
                  Contatos com melhor score em cada categoria
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(['D', 'I', 'S', 'C'] as const).map(profile => {
                    const topContact = contacts
                      .filter(c => c.discProfile === profile)
                      .sort((a, b) => b.relationshipScore - a.relationshipScore)[0];

                    if (!topContact) return null;

                    return (
                      <div key={profile} className="flex items-center gap-3">
                        <DISCBadge profile={profile} size="sm" showLabel={false} />
                        <OptimizedAvatar
                          src={topContact.avatar}
                          alt={`${topContact.firstName} ${topContact.lastName}`}
                          fallback={`${topContact.firstName[0]}${topContact.lastName[0]}`}
                          size="sm"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {topContact.firstName} {topContact.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {topContact.companyName || 'Sem empresa'}
                          </p>
                        </div>
                        <Badge variant="outline" className={DISC_BG_COLORS[profile]}>
                          {topContact.relationshipScore}%
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Best Compatibility */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  Melhor Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <DISCBadge 
                      profile={dashboardData?.compatibilityInsights?.bestPerforming || 'I'} 
                      size="lg" 
                    />
                    <div>
                      <p className="font-medium">
                        {DISC_PROFILES[dashboardData?.compatibilityInsights?.bestPerforming || 'I']?.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Perfil com melhor taxa de conversão
                      </p>
                    </div>
                  </div>
                  <div className="p-3 bg-emerald-500/10 rounded-lg">
                    <p className="text-sm text-emerald-700 dark:text-emerald-400">
                      <Lightbulb className="w-4 h-4 inline mr-1" />
                      Priorize contatos com este perfil para maximizar resultados
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Needs Improvement */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                  Oportunidade de Melhoria
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <DISCBadge 
                      profile={dashboardData?.compatibilityInsights?.needsImprovement || 'C'} 
                      size="lg" 
                    />
                    <div>
                      <p className="font-medium">
                        {DISC_PROFILES[dashboardData?.compatibilityInsights?.needsImprovement || 'C']?.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Perfil com maior potencial de crescimento
                      </p>
                    </div>
                  </div>
                  <div className="p-3 bg-amber-500/10 rounded-lg">
                    <p className="text-sm text-amber-700 dark:text-amber-400">
                      <Lightbulb className="w-4 h-4 inline mr-1" />
                      Estude as estratégias específicas para este perfil
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dicas por Perfil</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(['D', 'I', 'S', 'C'] as const).map(profile => {
                  const info = DISC_PROFILES[profile];
                  return (
                    <div key={profile} className={cn(
                      "p-4 rounded-lg border",
                      DISC_BG_COLORS[profile].replace('text-', 'border-')
                    )}>
                      <div className="flex items-center gap-2 mb-2">
                        <DISCBadge profile={profile} size="sm" showLabel={false} />
                        <span className="font-medium">{info?.name}</span>
                      </div>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        {info?.salesApproach.presentation.slice(0, 2).map((tip, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <ArrowRight className="w-3 h-3 mt-1 flex-shrink-0" />
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contacts Tab */}
        <TabsContent value="contacts">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contatos Perfilados</CardTitle>
              <CardDescription>
                Lista de contatos com análise DISC
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-2">
                  {contacts
                    .sort((a, b) => b.relationshipScore - a.relationshipScore)
                    .map(contact => (
                      <Link 
                        key={contact.id}
                        to={`/contatos/${contact.id}`}
                        className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <OptimizedAvatar
                          src={contact.avatar}
                          alt={`${contact.firstName} ${contact.lastName}`}
                          fallback={`${contact.firstName[0]}${contact.lastName[0]}`}
                          size="md"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">
                            {contact.firstName} {contact.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {contact.companyName || 'Sem empresa'}
                          </p>
                        </div>
                        <DISCBadge profile={contact.discProfile} size="sm" />
                        {contact.discConfidence && (
                          <Badge variant="outline" className="text-xs">
                            {contact.discConfidence}% conf.
                          </Badge>
                        )}
                        <Badge 
                          variant="outline"
                          className={cn(
                            contact.relationshipScore >= 70 ? 'bg-emerald-500/10 text-emerald-600' :
                            contact.relationshipScore >= 40 ? 'bg-amber-500/10 text-amber-600' :
                            'bg-red-500/10 text-red-600'
                          )}
                        >
                          {contact.relationshipScore}%
                        </Badge>
                      </Link>
                    ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DISCAnalyticsPanel;
