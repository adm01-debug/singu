// ==============================================
// NEURO PORTFOLIO DASHBOARD - Enterprise Analytics
// Portfolio-wide neuromarketing insights and metrics
// ==============================================

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Brain,
  Heart,
  AlertTriangle,
  Zap,
  Target,
  TrendingUp,
  Users,
  Lightbulb,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { useContacts } from '@/hooks/useContacts';
import { useNeuromarketing } from '@/hooks/useNeuromarketing';
import { BrainSystem, Neurochemical, PrimalStimulus } from '@/types/neuromarketing';

const NeuroPortfolioDashboard = () => {
  const { contacts } = useContacts();
  const { 
    generateNeuroProfileFromDISC,
    BRAIN_SYSTEM_INFO,
    NEUROCHEMICAL_INFO,
    PRIMAL_STIMULUS_INFO,
    DISC_BRAIN_CORRELATION
  } = useNeuromarketing();
  const [activeTab, setActiveTab] = useState('overview');

  // Calculate brain system distribution
  const brainDistribution = useMemo(() => {
    const distribution: Record<BrainSystem, { count: number; contacts: string[] }> = {
      reptilian: { count: 0, contacts: [] },
      limbic: { count: 0, contacts: [] },
      neocortex: { count: 0, contacts: [] }
    };

    contacts.forEach(contact => {
      const behavior = contact.behavior as { discProfile?: string } | null;
      const discProfile = behavior?.discProfile as 'D' | 'I' | 'S' | 'C' | null;
      
      if (discProfile && DISC_BRAIN_CORRELATION[discProfile]) {
        const brainSystem = DISC_BRAIN_CORRELATION[discProfile].primaryBrain;
        distribution[brainSystem].count++;
        distribution[brainSystem].contacts.push(`${contact.first_name} ${contact.last_name}`);
      }
    });

    return distribution;
  }, [contacts, DISC_BRAIN_CORRELATION]);

  // Pie chart data
  const brainPieData = useMemo(() => [
    { 
      name: BRAIN_SYSTEM_INFO.reptilian.namePt, 
      value: brainDistribution.reptilian.count,
      color: '#EF4444',
      icon: '🦎'
    },
    { 
      name: BRAIN_SYSTEM_INFO.limbic.namePt, 
      value: brainDistribution.limbic.count,
      color: '#EC4899',
      icon: '❤️'
    },
    { 
      name: BRAIN_SYSTEM_INFO.neocortex.namePt, 
      value: brainDistribution.neocortex.count,
      color: '#3B82F6',
      icon: '🧠'
    }
  ], [brainDistribution, BRAIN_SYSTEM_INFO]);

  // Calculate neurochemical profile distribution
  const neurochemicalDistribution = useMemo(() => {
    const distribution: Record<Neurochemical, number> = {
      dopamine: 0,
      oxytocin: 0,
      cortisol: 0,
      serotonin: 0,
      endorphin: 0,
      adrenaline: 0
    };

    contacts.forEach(contact => {
      const behavior = contact.behavior as { discProfile?: string } | null;
      const discProfile = behavior?.discProfile as 'D' | 'I' | 'S' | 'C' | null;
      
      if (discProfile && DISC_BRAIN_CORRELATION[discProfile]) {
        const chem = DISC_BRAIN_CORRELATION[discProfile].dominantNeurochemical;
        distribution[chem]++;
      }
    });

    return distribution;
  }, [contacts, DISC_BRAIN_CORRELATION]);

  // Bar chart data for neurochemicals
  const neurochemicalBarData = useMemo(() => 
    Object.entries(neurochemicalDistribution).map(([chem, count]) => ({
      name: NEUROCHEMICAL_INFO[chem as Neurochemical].namePt,
      count,
      icon: NEUROCHEMICAL_INFO[chem as Neurochemical].icon
    })).sort((a, b) => b.count - a.count),
  [neurochemicalDistribution, NEUROCHEMICAL_INFO]);

  // Calculate recommended stimuli for portfolio
  const portfolioStimuli = useMemo(() => {
    const stimuliCount: Record<PrimalStimulus, number> = {
      self_centered: 0,
      contrast: 0,
      tangible: 0,
      memorable: 0,
      visual: 0,
      emotional: 0
    };

    contacts.forEach(contact => {
      const behavior = contact.behavior as { discProfile?: string } | null;
      const discProfile = behavior?.discProfile as 'D' | 'I' | 'S' | 'C' | null;
      
      if (discProfile && DISC_BRAIN_CORRELATION[discProfile]) {
        DISC_BRAIN_CORRELATION[discProfile].responsiveStimuli.forEach(stim => {
          stimuliCount[stim]++;
        });
      }
    });

    return Object.entries(stimuliCount)
      .map(([stim, count]) => ({
        stimulus: stim as PrimalStimulus,
        count,
        info: PRIMAL_STIMULUS_INFO[stim as PrimalStimulus]
      }))
      .sort((a, b) => b.count - a.count);
  }, [contacts, DISC_BRAIN_CORRELATION, PRIMAL_STIMULUS_INFO]);

  // Radar data for engagement strategies
  const strategyRadarData = useMemo(() => {
    const total = contacts.length || 1;
    return [
      { 
        strategy: 'Urgência/Medo', 
        value: Math.round((brainDistribution.reptilian.count / total) * 100),
        fullMark: 100 
      },
      { 
        strategy: 'Emoção/Confiança', 
        value: Math.round((brainDistribution.limbic.count / total) * 100),
        fullMark: 100 
      },
      { 
        strategy: 'Dados/Lógica', 
        value: Math.round((brainDistribution.neocortex.count / total) * 100),
        fullMark: 100 
      },
      { 
        strategy: 'Visual', 
        value: Math.round((portfolioStimuli.find(s => s.stimulus === 'visual')?.count || 0) / total * 100),
        fullMark: 100 
      },
      { 
        strategy: 'Contraste', 
        value: Math.round((portfolioStimuli.find(s => s.stimulus === 'contrast')?.count || 0) / total * 100),
        fullMark: 100 
      },
      { 
        strategy: 'Tangível', 
        value: Math.round((portfolioStimuli.find(s => s.stimulus === 'tangible')?.count || 0) / total * 100),
        fullMark: 100 
      }
    ];
  }, [brainDistribution, portfolioStimuli, contacts.length]);

  // Decision speed distribution
  const decisionSpeedData = useMemo(() => {
    let impulsive = 0, moderate = 0, analytical = 0;
    
    contacts.forEach(contact => {
      const behavior = contact.behavior as { discProfile?: string } | null;
      const discProfile = behavior?.discProfile as 'D' | 'I' | 'S' | 'C' | null;
      
      if (discProfile === 'D') impulsive++;
      else if (discProfile === 'C') analytical++;
      else moderate++;
    });

    return [
      { name: 'Impulsivo', value: impulsive, color: '#EF4444' },
      { name: 'Moderado', value: moderate, color: '#F59E0B' },
      { name: 'Analítico', value: analytical, color: '#3B82F6' }
    ];
  }, [contacts]);

  const totalWithProfile = brainPieData.reduce((sum, item) => sum + item.value, 0);
  const profileCoverage = contacts.length > 0 
    ? Math.round((totalWithProfile / contacts.length) * 100) 
    : 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <Brain className="h-6 w-6 text-primary" />
              Dashboard Neuromarketing
            </CardTitle>
            <CardDescription>
              Análise neural do seu portfólio de {contacts.length} contatos
            </CardDescription>
          </div>
          <Badge variant={profileCoverage >= 70 ? 'default' : 'secondary'}>
            {profileCoverage}% Perfilados
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="overview" className="text-xs">
              <Activity className="h-4 w-4 mr-1" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="brain" className="text-xs">
              <Brain className="h-4 w-4 mr-1" />
              3 Cérebros
            </TabsTrigger>
            <TabsTrigger value="stimuli" className="text-xs">
              <Zap className="h-4 w-4 mr-1" />
              Estímulos
            </TabsTrigger>
            <TabsTrigger value="chemistry" className="text-xs">
              <Heart className="h-4 w-4 mr-1" />
              Neuroquímica
            </TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-lg bg-destructive dark:bg-destructive/20 border border-destructive dark:border-destructive"
              >
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  <span className="text-sm font-medium">Reptiliano</span>
                </div>
                <p className="text-2xl font-bold text-destructive">{brainDistribution.reptilian.count}</p>
                <p className="text-xs text-muted-foreground">Foco em segurança</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="p-4 rounded-lg bg-primary dark:bg-primary/20 border border-pink-200 dark:border-pink-800"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">Límbico</span>
                </div>
                <p className="text-2xl font-bold text-primary">{brainDistribution.limbic.count}</p>
                <p className="text-xs text-muted-foreground">Foco emocional</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="p-4 rounded-lg bg-info dark:bg-info/20 border border-info dark:border-info"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="h-5 w-5 text-info" />
                  <span className="text-sm font-medium">Neocórtex</span>
                </div>
                <p className="text-2xl font-bold text-info">{brainDistribution.neocortex.count}</p>
                <p className="text-xs text-muted-foreground">Foco analítico</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="p-4 rounded-lg bg-primary/10 border border-primary/20"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">Cobertura</span>
                </div>
                <p className="text-2xl font-bold text-primary">{profileCoverage}%</p>
                <p className="text-xs text-muted-foreground">Contatos perfilados</p>
              </motion.div>
            </div>

            {/* Strategy Radar */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Estratégias Recomendadas para o Portfólio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={strategyRadarData}>
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis 
                        dataKey="strategy" 
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                      />
                      <PolarRadiusAxis 
                        angle={30} 
                        domain={[0, 100]} 
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <Radar
                        name="Relevância"
                        dataKey="value"
                        stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary))"
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* BRAIN SYSTEMS TAB */}
          <TabsContent value="brain" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pie Chart */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Distribuição dos 3 Cérebros</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie>
                        <Pie
                          data={brainPieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {brainPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </RechartsPie>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Brain Details */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Detalhes por Sistema</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[280px]">
                    <div className="space-y-3">
                      {(Object.entries(brainDistribution) as [BrainSystem, { count: number; contacts: string[] }][]).map(([system, data]) => (
                        <div 
                          key={system}
                          className={`p-3 rounded-lg ${BRAIN_SYSTEM_INFO[system].bgColor} border`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{BRAIN_SYSTEM_INFO[system].icon}</span>
                              <span className="font-medium">{BRAIN_SYSTEM_INFO[system].namePt}</span>
                            </div>
                            <Badge variant="secondary">{data.count} contatos</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">
                            {BRAIN_SYSTEM_INFO[system].decisionRole}
                          </p>
                          {data.contacts.length > 0 && (
                            <p className="text-xs truncate">
                              Ex: {data.contacts.slice(0, 3).join(', ')}
                              {data.contacts.length > 3 && ` +${data.contacts.length - 3}`}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Decision Speed */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Velocidade de Decisão do Portfólio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  {decisionSpeedData.map(item => (
                    <div key={item.name} className="flex-1 p-3 rounded-lg bg-muted/50 border text-center">
                      <p className="text-2xl font-bold" style={{ color: item.color }}>{item.value}</p>
                      <p className="text-sm text-muted-foreground">{item.name}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* STIMULI TAB */}
          <TabsContent value="stimuli" className="space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-warning" />
                  6 Estímulos Primários - Ranking do Portfólio
                </CardTitle>
                <CardDescription>
                  Estímulos mais efetivos para seu portfólio baseado em perfis DISC
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {portfolioStimuli.map((item, index) => (
                    <motion.div
                      key={item.stimulus}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-4 rounded-lg border transition-all
                        ${index === 0 ? 'bg-primary/10 border-primary ring-2 ring-primary' : 
                          index === 1 ? 'bg-warning dark:bg-warning/20 border-warning' :
                          'bg-muted/30'}`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{item.info.icon}</span>
                        <Badge variant={index === 0 ? 'default' : 'secondary'}>
                          #{index + 1}
                        </Badge>
                      </div>
                      <h4 className="font-semibold">{item.info.namePt}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.count} contatos respondem
                      </p>
                      <Progress 
                        value={(item.count / (contacts.length || 1)) * 100} 
                        className="h-1.5 mt-2" 
                      />
                    </motion.div>
                  ))}
                </div>

                {/* Top Stimulus Recommendation */}
                {portfolioStimuli[0] && (
                  <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary" />
                      Recomendação Principal
                    </h4>
                    <p className="text-sm">
                      Priorize comunicações com <strong>{portfolioStimuli[0].info.namePt}</strong> - 
                      {' '}{portfolioStimuli[0].info.descriptionPt}
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      {portfolioStimuli[0].info.applicationTips.slice(0, 2).map((tip, i) => (
                        <div key={i} className="flex items-center gap-1">
                          <span className="text-primary">→</span> {tip}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* CHEMISTRY TAB */}
          <TabsContent value="chemistry" className="space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Perfil Neuroquímico do Portfólio</CardTitle>
                <CardDescription>
                  Neuroquímicos dominantes baseados nos perfis comportamentais
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={neurochemicalBarData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        width={100}
                      />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-popover border rounded-lg p-2 shadow-soft">
                                <p className="font-medium">{payload[0].payload.icon} {payload[0].payload.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {payload[0].value} contatos
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar 
                        dataKey="count" 
                        fill="hsl(var(--primary))" 
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Neurochemical Application Tips */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {neurochemicalBarData.slice(0, 4).map((item, index) => {
                const chemKey = Object.entries(NEUROCHEMICAL_INFO).find(
                  ([_, info]) => info.namePt === item.name
                )?.[0] as Neurochemical | undefined;
                
                if (!chemKey) return null;
                const info = NEUROCHEMICAL_INFO[chemKey];
                
                return (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-4 rounded-lg border ${info.bgColor}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{info.icon}</span>
                      <div>
                        <h4 className="font-semibold">{info.namePt}</h4>
                        <p className="text-xs text-muted-foreground">{item.count} contatos</p>
                      </div>
                    </div>
                    <p className="text-sm mb-2">{info.effectPt}</p>
                    <div className="text-xs p-2 bg-background/50 rounded">
                      <span className="font-medium">Aplicação:</span> {info.salesApplication}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default NeuroPortfolioDashboard;
