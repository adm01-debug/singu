import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  RefreshCw, 
  Trash2, 
  Target, 
  Shield, 
  Compass, 
  Users, 
  GitBranch, 
  List,
  Lightbulb,
  ChevronRight
} from 'lucide-react';
import { useMetaprogramAnalysis } from '@/hooks/useMetaprogramAnalysis';
import { 
  MetaprogramProfile, 
  METAPROGRAM_LABELS,
  MotivationDirection,
  ReferenceFrame,
  WorkingStyle
} from '@/types/metaprograms';
import { motion, AnimatePresence } from 'framer-motion';

interface MetaprogramProfileCardProps {
  contactId: string;
  contactName: string;
  interactions: Array<{ id: string; content: string; transcription?: string }>;
}

export function MetaprogramProfileCard({ 
  contactId, 
  contactName, 
  interactions 
}: MetaprogramProfileCardProps) {
  const [profile, setProfile] = useState<MetaprogramProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  const { 
    loading: analyzing,
    getContactMetaprogramProfile,
    analyzeContactInteractions,
    clearContactAnalysis
  } = useMetaprogramAnalysis();

  useEffect(() => {
    loadProfile();
  }, [contactId]);

  const loadProfile = async () => {
    setIsLoading(true);
    const result = await getContactMetaprogramProfile(contactId);
    setProfile(result);
    setIsLoading(false);
  };

  const handleAnalyze = async () => {
    await analyzeContactInteractions(contactId, interactions);
    await loadProfile();
  };

  const handleClear = async () => {
    await clearContactAnalysis(contactId);
    setProfile(null);
  };

  const renderMetaprogramBadge = (
    type: 'motivation' | 'reference' | 'working',
    value: MotivationDirection | ReferenceFrame | WorkingStyle,
    confidence: number
  ) => {
    let labels: any;
    let icon: React.ReactNode;
    
    switch (type) {
      case 'motivation':
        labels = METAPROGRAM_LABELS.motivationDirection[value as MotivationDirection];
        icon = value === 'toward' ? <Target className="h-4 w-4" /> : <Shield className="h-4 w-4" />;
        break;
      case 'reference':
        labels = METAPROGRAM_LABELS.referenceFrame[value as ReferenceFrame];
        icon = value === 'internal' ? <Compass className="h-4 w-4" /> : <Users className="h-4 w-4" />;
        break;
      case 'working':
        labels = METAPROGRAM_LABELS.workingStyle[value as WorkingStyle];
        icon = value === 'options' ? <GitBranch className="h-4 w-4" /> : <List className="h-4 w-4" />;
        break;
    }

    return (
      <div className={`p-4 rounded-lg border ${labels.color}`}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">{labels.icon}</span>
          <span className="font-semibold">{labels.name}</span>
          <Badge variant="outline" className="ml-auto">
            {confidence}% confiança
          </Badge>
        </div>
        <p className="text-sm opacity-80 mb-3">{labels.description}</p>
        <Progress value={confidence} className="h-2" />
      </div>
    );
  };

  const renderCommunicationTips = (
    motivation: MotivationDirection,
    reference: ReferenceFrame,
    working: WorkingStyle
  ) => {
    const motivationTips = METAPROGRAM_LABELS.motivationDirection[motivation].communicationTips;
    const referenceTips = METAPROGRAM_LABELS.referenceFrame[reference].communicationTips;
    const workingTips = METAPROGRAM_LABELS.workingStyle[working].communicationTips;

    return (
      <div className="space-y-4">
        <div>
          <h4 className="font-medium flex items-center gap-2 mb-2">
            {motivation === 'toward' ? <Target className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
            Motivação: {METAPROGRAM_LABELS.motivationDirection[motivation].name}
          </h4>
          <ul className="space-y-1">
            {motivationTips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <ChevronRight className="h-4 w-4 mt-0.5 text-primary" />
                {tip}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-medium flex items-center gap-2 mb-2">
            {reference === 'internal' ? <Compass className="h-4 w-4" /> : <Users className="h-4 w-4" />}
            Referência: {METAPROGRAM_LABELS.referenceFrame[reference].name}
          </h4>
          <ul className="space-y-1">
            {referenceTips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <ChevronRight className="h-4 w-4 mt-0.5 text-primary" />
                {tip}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-medium flex items-center gap-2 mb-2">
            {working === 'options' ? <GitBranch className="h-4 w-4" /> : <List className="h-4 w-4" />}
            Estilo: {METAPROGRAM_LABELS.workingStyle[working].name}
          </h4>
          <ul className="space-y-1">
            {workingTips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <ChevronRight className="h-4 w-4 mt-0.5 text-primary" />
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Metaprogramas
          </CardTitle>
          <div className="flex gap-2">
            {profile && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleClear}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleAnalyze}
              disabled={analyzing || interactions.length === 0}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${analyzing ? 'animate-spin' : ''}`} />
              {analyzing ? 'Analisando...' : 'Analisar'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <AnimatePresence mode="wait">
          {!profile ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-8 text-muted-foreground"
            >
              <Brain className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>Nenhuma análise de metaprogramas ainda</p>
              <p className="text-sm mt-1">
                {interactions.length > 0 
                  ? `Clique em "Analisar" para processar ${interactions.length} interações`
                  : 'Adicione interações para habilitar a análise'}
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                  <TabsTrigger value="tips">Dicas de Comunicação</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  {/* Overall confidence */}
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-yellow-500" />
                      <span className="text-sm font-medium">Confiança Geral</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={profile.overallConfidence} className="w-24 h-2" />
                      <span className="text-sm font-medium">{profile.overallConfidence}%</span>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    Baseado em {profile.analyzedInteractions} interações analisadas
                  </p>

                  {/* Metaprogram cards */}
                  <div className="space-y-3">
                    {renderMetaprogramBadge('motivation', profile.motivationDirection, profile.motivationConfidence)}
                    {renderMetaprogramBadge('reference', profile.referenceFrame, profile.referenceConfidence)}
                    {renderMetaprogramBadge('working', profile.workingStyle, profile.workingConfidence)}
                  </div>
                </TabsContent>

                <TabsContent value="tips">
                  {renderCommunicationTips(
                    profile.motivationDirection,
                    profile.referenceFrame,
                    profile.workingStyle
                  )}
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
