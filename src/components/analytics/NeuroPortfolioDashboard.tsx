// ==============================================
// NEURO PORTFOLIO DASHBOARD - Enterprise Analytics
// Portfolio-wide neuromarketing insights and metrics
// ==============================================

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Brain,
  Heart,
  Zap,
  Activity
} from 'lucide-react';
import { useContacts } from '@/hooks/useContacts';
import { useNeuromarketing } from '@/hooks/useNeuromarketing';
import { BrainSystem, Neurochemical, PrimalStimulus } from '@/types/neuromarketing';
import { NeuroOverviewTab } from './NeuroOverviewTab';
import { NeuroBrainSystemsTab } from './NeuroBrainSystemsTab';
import { NeuroStimuliTab } from './NeuroStimuliTab';
import { NeuroChemistryTab } from './NeuroChemistryTab';

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

          <TabsContent value="overview" className="space-y-6">
            <NeuroOverviewTab
              brainDistribution={brainDistribution}
              profileCoverage={profileCoverage}
              strategyRadarData={strategyRadarData}
            />
          </TabsContent>

          <TabsContent value="brain" className="space-y-6">
            <NeuroBrainSystemsTab
              brainDistribution={brainDistribution}
              brainPieData={brainPieData}
              decisionSpeedData={decisionSpeedData}
              brainSystemInfo={BRAIN_SYSTEM_INFO}
            />
          </TabsContent>

          <TabsContent value="stimuli" className="space-y-6">
            <NeuroStimuliTab
              portfolioStimuli={portfolioStimuli}
              totalContacts={contacts.length}
            />
          </TabsContent>

          <TabsContent value="chemistry" className="space-y-6">
            <NeuroChemistryTab
              neurochemicalBarData={neurochemicalBarData}
              neurochemicalInfo={NEUROCHEMICAL_INFO}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default NeuroPortfolioDashboard;
