import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  ChevronRight,
  Globe,
  Search,
  Rocket,
  Clock,
  Link,
  Sparkles
} from 'lucide-react';
import { useMetaprogramAnalysis } from '@/hooks/useMetaprogramAnalysis';
import { 
  MetaprogramProfile, 
  METAPROGRAM_LABELS,
  MotivationDirection,
  ReferenceFrame,
  WorkingStyle,
  ChunkSize,
  ActionFilter,
  ComparisonStyle
} from '@/types/metaprograms';
import { motion, AnimatePresence } from 'framer-motion';

interface MetaprogramProfileCardProps {
  contactId: string;
  contactName: string;
  interactions: Array<{ id: string; content: string; transcription?: string }>;
}

type MetaprogramType = 'motivation' | 'reference' | 'working' | 'chunk' | 'action' | 'comparison';
type MetaprogramValue = MotivationDirection | ReferenceFrame | WorkingStyle | ChunkSize | ActionFilter | ComparisonStyle;

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

  const getMetaprogramIcon = (type: MetaprogramType, value: MetaprogramValue): React.ReactNode => {
    switch (type) {
      case 'motivation':
        return value === 'toward' ? <Target className="h-4 w-4" /> : <Shield className="h-4 w-4" />;
      case 'reference':
        return value === 'internal' ? <Compass className="h-4 w-4" /> : <Users className="h-4 w-4" />;
      case 'working':
        return value === 'options' ? <GitBranch className="h-4 w-4" /> : <List className="h-4 w-4" />;
      case 'chunk':
        return value === 'general' ? <Globe className="h-4 w-4" /> : <Search className="h-4 w-4" />;
      case 'action':
        return value === 'proactive' ? <Rocket className="h-4 w-4" /> : <Clock className="h-4 w-4" />;
      case 'comparison':
        return value === 'sameness' ? <Link className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />;
      default:
        return <Brain className="h-4 w-4" />;
    }
  };

  const getLabels = (type: MetaprogramType, value: MetaprogramValue) => {
    switch (type) {
      case 'motivation':
        return METAPROGRAM_LABELS.motivationDirection[value as MotivationDirection];
      case 'reference':
        return METAPROGRAM_LABELS.referenceFrame[value as ReferenceFrame];
      case 'working':
        return METAPROGRAM_LABELS.workingStyle[value as WorkingStyle];
      case 'chunk':
        return METAPROGRAM_LABELS.chunkSize[value as ChunkSize];
      case 'action':
        return METAPROGRAM_LABELS.actionFilter[value as ActionFilter];
      case 'comparison':
        return METAPROGRAM_LABELS.comparisonStyle[value as ComparisonStyle];
    }
  };

  const renderMetaprogramBadge = (
    type: MetaprogramType,
    value: MetaprogramValue,
    confidence: number
  ) => {
    const labels = getLabels(type, value);
    const icon = getMetaprogramIcon(type, value);

    return (
      <div className={`p-3 rounded-lg border ${labels.color}`}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">{labels.icon}</span>
          <span className="font-semibold text-sm">{labels.name}</span>
          <Badge variant="outline" className="ml-auto text-xs">
            {confidence}%
          </Badge>
        </div>
        <p className="text-xs opacity-80 mb-2">{labels.description}</p>
        <Progress value={confidence} className="h-1.5" />
      </div>
    );
  };

  const renderCommunicationTips = (profile: MetaprogramProfile) => {
    const allTips = [
      { type: 'motivation' as MetaprogramType, value: profile.motivationDirection, label: METAPROGRAM_LABELS.motivationDirection[profile.motivationDirection] },
      { type: 'reference' as MetaprogramType, value: profile.referenceFrame, label: METAPROGRAM_LABELS.referenceFrame[profile.referenceFrame] },
      { type: 'working' as MetaprogramType, value: profile.workingStyle, label: METAPROGRAM_LABELS.workingStyle[profile.workingStyle] },
      { type: 'chunk' as MetaprogramType, value: profile.chunkSize, label: METAPROGRAM_LABELS.chunkSize[profile.chunkSize] },
      { type: 'action' as MetaprogramType, value: profile.actionFilter, label: METAPROGRAM_LABELS.actionFilter[profile.actionFilter] },
      { type: 'comparison' as MetaprogramType, value: profile.comparisonStyle, label: METAPROGRAM_LABELS.comparisonStyle[profile.comparisonStyle] },
    ];

    return (
      <ScrollArea className="h-[400px]">
        <div className="space-y-4 pr-4">
          {allTips.map(({ type, value, label }) => (
            <div key={type}>
              <h4 className="font-medium flex items-center gap-2 mb-2 text-sm">
                {getMetaprogramIcon(type, value)}
                <span className="text-lg">{label.icon}</span>
                {label.name}
              </h4>
              <ul className="space-y-1">
                {label.communicationTips.map((tip: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <ChevronRight className="h-3 w-3 mt-0.5 text-primary flex-shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </ScrollArea>
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
            Metaprogramas (6 Padrões)
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

                  {/* Metaprogram cards - Grid layout for 6 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {renderMetaprogramBadge('motivation', profile.motivationDirection, profile.motivationConfidence)}
                    {renderMetaprogramBadge('reference', profile.referenceFrame, profile.referenceConfidence)}
                    {renderMetaprogramBadge('working', profile.workingStyle, profile.workingConfidence)}
                    {renderMetaprogramBadge('chunk', profile.chunkSize, profile.chunkConfidence)}
                    {renderMetaprogramBadge('action', profile.actionFilter, profile.actionConfidence)}
                    {renderMetaprogramBadge('comparison', profile.comparisonStyle, profile.comparisonConfidence)}
                  </div>
                </TabsContent>

                <TabsContent value="tips">
                  {renderCommunicationTips(profile)}
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
