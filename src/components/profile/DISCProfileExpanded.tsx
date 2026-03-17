// ==============================================
// DISCProfileExpanded - Enterprise DISC Component
// Componente expandido para página de detalhe do contato
// ==============================================

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Target, Zap, Shield, Heart, TrendingUp, TrendingDown,
  MessageSquare, Clock, AlertTriangle, CheckCircle2, Lightbulb,
  RefreshCw, ChevronDown, ChevronUp, Sparkles, History, BarChart3,
  Users, Star, ArrowRight, Volume2, Eye, Layers
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { DISCBadge, DISCChart } from '@/components/ui/disc-badge';
import { useDISCAnalysis } from '@/hooks/useDISCAnalysis';
import { 
  DISC_PROFILES, 
  DISC_BLEND_PROFILES, 
  getProfileInfo, 
  getBlendProfile,
  getCompatibility 
} from '@/data/discAdvancedData';
import { Contact, DISCProfile } from '@/types';
import { DISCFullProfile } from '@/types/disc';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { logger } from '@/lib/logger';

interface DISCProfileExpandedProps {
  contact: Contact;
  onUpdate?: () => void;
}

const DISC_COLORS = {
  D: { bg: 'bg-red-500/10', text: 'text-red-600', border: 'border-red-500/30', fill: 'hsl(0, 84%, 60%)' },
  I: { bg: 'bg-amber-500/10', text: 'text-amber-600', border: 'border-amber-500/30', fill: 'hsl(45, 93%, 47%)' },
  S: { bg: 'bg-emerald-500/10', text: 'text-emerald-600', border: 'border-emerald-500/30', fill: 'hsl(142, 76%, 36%)' },
  C: { bg: 'bg-blue-500/10', text: 'text-blue-600', border: 'border-blue-500/30', fill: 'hsl(217, 91%, 60%)' }
};

const DISCProfileExpanded: React.FC<DISCProfileExpandedProps> = ({ contact, onUpdate }) => {
  const { user } = useAuth();
  const {
    analyzing,
    latestAnalysis,
    analysisHistory,
    analyzeText,
    analyzeContact,
    fetchAnalysisHistory,
    saveManualProfile,
    getProfileInfo: getInfo,
    getCompatibility: getCompat
  } = useDISCAnalysis(contact.id);

  const [expanded, setExpanded] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualScores, setManualScores] = useState({ D: 50, I: 50, S: 50, C: 50 });
  const [manualNotes, setManualNotes] = useState('');
  const [aiAnalyzing, setAiAnalyzing] = useState(false);

  useEffect(() => {
    fetchAnalysisHistory();
  }, [contact.id, fetchAnalysisHistory]);

  const currentProfile = contact.behavior?.discProfile as DISCProfile;
  const currentConfidence = contact.behavior?.discConfidence || 0;
  const profileInfo = currentProfile ? DISC_PROFILES[currentProfile] : null;

  // Trigger AI analysis
  const handleAIAnalysis = async () => {
    setAiAnalyzing(true);
    try {
      // Fetch interactions for this contact
      const { data: interactions } = await supabase
        .from('interactions')
        .select('content, transcription')
        .eq('contact_id', contact.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!interactions || interactions.length === 0) {
        toast.warning('Sem interações para analisar. Adicione interações primeiro.');
        return;
      }

      const texts = interactions
        .map(i => [i.content, i.transcription].filter(Boolean).join(' '))
        .filter(t => t.length > 10);

      if (texts.length === 0) {
        toast.warning('Textos insuficientes nas interações');
        return;
      }

      // Call edge function for AI analysis
      const response = await supabase.functions.invoke('disc-analyzer', {
        body: {
          texts,
          contactId: contact.id,
          userId: user?.id
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast.success('Análise DISC concluída com IA!');
      await fetchAnalysisHistory();
      onUpdate?.();

    } catch (err) {
      logger.error('AI analysis error:', err);
      toast.error('Erro na análise por IA. Tente a análise local.');
      
      // Fallback to local analysis
      await analyzeContact(contact);
      onUpdate?.();
    } finally {
      setAiAnalyzing(false);
    }
  };

  // Save manual profile
  const handleSaveManual = async () => {
    const scores: [string, number][] = [
      ['D', manualScores.D], ['I', manualScores.I], 
      ['S', manualScores.S], ['C', manualScores.C]
    ];
    scores.sort((a, b) => b[1] - a[1]);
    const primary = scores[0][0] as Exclude<DISCProfile, null>;
    const secondary = scores[1][1] >= 40 ? scores[1][0] as Exclude<DISCProfile, null> : null;
    
    const profile: DISCFullProfile = {
      scores: {
        dominance: manualScores.D,
        influence: manualScores.I,
        steadiness: manualScores.S,
        conscientiousness: manualScores.C
      },
      primary,
      secondary,
      blend: secondary ? `${primary}${secondary}` : null
    };
    await saveManualProfile(profile, manualNotes);
    setShowManualEntry(false);
    onUpdate?.();
  };

  // Get seller profile for compatibility
  const [sellerProfile, setSellerProfile] = useState<DISCProfile | null>(null);
  useEffect(() => {
    const fetchSellerProfile = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('nlp_profile')
        .eq('id', user.id)
        .single();
      
      const nlpProfile = data?.nlp_profile as Record<string, unknown> | null;
      if (nlpProfile?.disc) {
        setSellerProfile(nlpProfile.disc as DISCProfile);
      }
    };
    fetchSellerProfile();
  }, [user]);

  const compatibility = currentProfile && sellerProfile 
    ? getCompat(sellerProfile, currentProfile) 
    : null;

  if (!currentProfile && !latestAnalysis && analysisHistory.length === 0) {
    // No profile yet
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            Perfil DISC
          </CardTitle>
          <CardDescription>
            Análise comportamental ainda não realizada
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              Analise o perfil comportamental deste contato para obter insights de comunicação personalizados.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={handleAIAnalysis} 
                disabled={aiAnalyzing}
                className="gap-2"
              >
                {aiAnalyzing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Análise por IA
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowManualEntry(true)}
                className="gap-2"
              >
                <Layers className="w-4 h-4" />
                Definir Manualmente
              </Button>
            </div>
          </div>

          {/* Manual Entry Form */}
          <AnimatePresence>
            {showManualEntry && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 border-t pt-6"
              >
                <h4 className="font-medium mb-4">Definir Perfil Manualmente</h4>
                <div className="space-y-4">
                  {(['D', 'I', 'S', 'C'] as const).map(profile => (
                    <div key={profile} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2">
                          <DISCBadge profile={profile} size="sm" showLabel={false} />
                          {DISC_PROFILES[profile]?.name}
                        </Label>
                        <span className="text-sm font-medium">{manualScores[profile]}%</span>
                      </div>
                      <Slider
                        value={[manualScores[profile]]}
                        onValueChange={([v]) => setManualScores(prev => ({ ...prev, [profile]: v }))}
                        max={100}
                        step={5}
                        className="w-full"
                      />
                    </div>
                  ))}
                  <div className="space-y-2">
                    <Label>Observações</Label>
                    <Textarea
                      value={manualNotes}
                      onChange={e => setManualNotes(e.target.value)}
                      placeholder="Notas sobre a análise..."
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSaveManual} className="flex-1">
                      Salvar Perfil
                    </Button>
                    <Button variant="outline" onClick={() => setShowManualEntry(false)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    );
  }

  // Has profile - show expanded view
  const analysis = latestAnalysis;
  const colors = currentProfile ? DISC_COLORS[currentProfile] : DISC_COLORS['I'];

  return (
    <Card className={cn("transition-all", expanded && "ring-2 ring-primary/20")}>
      <CardHeader className="cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DISCBadge profile={currentProfile} size="lg" />
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {profileInfo?.name || 'Perfil DISC'}
                {currentConfidence > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {currentConfidence}% confiança
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="mt-1">
                {profileInfo?.shortDescription || 'Clique para ver detalhes'}
              </CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="icon">
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </Button>
        </div>
      </CardHeader>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <CardContent className="pt-0">
              <Tabs defaultValue="overview" className="space-y-4">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                  <TabsTrigger value="strategies">Estratégias</TabsTrigger>
                  <TabsTrigger value="compatibility">Compatibilidade</TabsTrigger>
                  <TabsTrigger value="history">Histórico</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-4">
                  {/* Scores Chart */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Scores DISC
                      </h4>
                      {analysis ? (
                        <div className="space-y-3">
                          {(['D', 'I', 'S', 'C'] as const).map(p => {
                            const score = p === 'D' ? analysis.dominanceScore :
                                          p === 'I' ? analysis.influenceScore :
                                          p === 'S' ? analysis.steadinessScore :
                                          analysis.conscientiousnessScore;
                            return (
                              <div key={p} className="space-y-1">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="flex items-center gap-2">
                                    <div 
                                      className="w-3 h-3 rounded-full"
                                      style={{ backgroundColor: DISC_COLORS[p].fill }}
                                    />
                                    {DISC_PROFILES[p]?.name}
                                  </span>
                                  <span className="font-medium">{score}%</span>
                                </div>
                                <Progress value={score} className="h-2" />
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <DISCChart 
                          profile={currentProfile} 
                          className="mx-auto"
                        />
                      )}
                    </div>

                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Lightbulb className="w-4 h-4" />
                        Características
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className={cn("p-3 rounded-lg", colors.bg)}>
                          <p className="font-medium">Motivação Principal</p>
                          <p className="text-muted-foreground">{profileInfo?.coreDrive}</p>
                        </div>
                        <div className={cn("p-3 rounded-lg", colors.bg)}>
                          <p className="font-medium">Maior Receio</p>
                          <p className="text-muted-foreground">{profileInfo?.coreFear}</p>
                        </div>
                        <div className={cn("p-3 rounded-lg", colors.bg)}>
                          <p className="font-medium">Sob Pressão</p>
                          <p className="text-muted-foreground">{profileInfo?.underPressure}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Blend Profile Info */}
                  {analysis?.blendProfile && DISC_BLEND_PROFILES[analysis.blendProfile] && (
                    <div className="p-4 border rounded-lg bg-muted/30">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Layers className="w-4 h-4" />
                        Perfil Blend: {analysis.blendProfile}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {DISC_BLEND_PROFILES[analysis.blendProfile]?.description}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {DISC_BLEND_PROFILES[analysis.blendProfile]?.keyTips.slice(0, 3).map((s, i) => (
                          <Badge key={i} variant="secondary">{s}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button 
                      onClick={handleAIAnalysis} 
                      disabled={aiAnalyzing}
                      size="sm"
                      className="gap-2"
                    >
                      {aiAnalyzing ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                      Re-analisar com IA
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowManualEntry(!showManualEntry)}
                      className="gap-2"
                    >
                      <Layers className="w-4 h-4" />
                      Ajustar Manualmente
                    </Button>
                  </div>

                  {/* Manual Entry */}
                  <AnimatePresence>
                    {showManualEntry && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t pt-4 mt-4"
                      >
                        <div className="space-y-4">
                          {(['D', 'I', 'S', 'C'] as const).map(profile => (
                            <div key={profile} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label className="flex items-center gap-2">
                                  <DISCBadge profile={profile} size="sm" showLabel={false} />
                                  {DISC_PROFILES[profile]?.name}
                                </Label>
                                <span className="text-sm font-medium">{manualScores[profile]}%</span>
                              </div>
                              <Slider
                                value={[manualScores[profile]]}
                                onValueChange={([v]) => setManualScores(prev => ({ ...prev, [profile]: v }))}
                                max={100}
                                step={5}
                              />
                            </div>
                          ))}
                          <Button onClick={handleSaveManual} className="w-full">
                            Salvar Ajustes
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </TabsContent>

                {/* Strategies Tab */}
                <TabsContent value="strategies" className="space-y-4">
                  <Accordion type="single" collapsible defaultValue="opening">
                    <AccordionItem value="opening">
                      <AccordionTrigger className="text-sm">
                        <span className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" />
                          Abertura & Primeiro Contato
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <ul className="space-y-2">
                          {profileInfo?.salesApproach.opening.map((tip, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="presentation">
                      <AccordionTrigger className="text-sm">
                        <span className="flex items-center gap-2">
                          <Eye className="w-4 h-4" />
                          Apresentação & Argumentação
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <ul className="space-y-2">
                          {profileInfo?.salesApproach.presentation.map((tip, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="objections">
                      <AccordionTrigger className="text-sm">
                        <span className="flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          Contorno de Objeções
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <ul className="space-y-2">
                          {profileInfo?.salesApproach.objectionHandling.map((tip, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="closing">
                      <AccordionTrigger className="text-sm">
                        <span className="flex items-center gap-2">
                          <Target className="w-4 h-4" />
                          Técnicas de Fechamento
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <ul className="space-y-2">
                          {profileInfo?.salesApproach.closing.map((tip, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="avoid">
                      <AccordionTrigger className="text-sm">
                        <span className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          O Que Evitar
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <ul className="space-y-2">
                          {profileInfo?.avoidWords.map((word, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-destructive">
                              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                              {word}
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>

                  {/* Power Words */}
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-500" />
                      Palavras de Poder
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {profileInfo?.powerWords.map((word, i) => (
                        <Badge key={i} variant="secondary" className={colors.bg}>
                          {word}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {/* Compatibility Tab */}
                <TabsContent value="compatibility" className="space-y-4">
                {compatibility ? (
                    <>
                      <div className="text-center p-6 border rounded-lg">
                        <div className="flex items-center justify-center gap-4 mb-4">
                          <DISCBadge profile={sellerProfile} size="lg" />
                          <ArrowRight className="w-6 h-6 text-muted-foreground" />
                          <DISCBadge profile={currentProfile} size="lg" />
                        </div>
                        <div className="text-4xl font-bold mb-2 text-primary">
                          {compatibility.score}%
                        </div>
                        <Badge variant="outline">
                          {compatibility.score >= 80 ? 'Alta Compatibilidade' : 
                           compatibility.score >= 60 ? 'Compatibilidade Moderada' : 'Requer Adaptação'}
                        </Badge>
                        <p className="text-muted-foreground mt-4">
                          {compatibility.dynamic}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 border rounded-lg bg-emerald-500/5">
                          <h4 className="font-medium mb-3 flex items-center gap-2 text-emerald-600">
                            <CheckCircle2 className="w-4 h-4" />
                            Dicas de Abordagem
                          </h4>
                          <ul className="space-y-2 text-sm">
                            {compatibility.tips.map((tip, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <ArrowRight className="w-3 h-3 mt-1 flex-shrink-0 text-emerald-500" />
                                {tip}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="p-4 border rounded-lg bg-amber-500/5">
                          <h4 className="font-medium mb-3 flex items-center gap-2 text-amber-600">
                            <AlertTriangle className="w-4 h-4" />
                            Pontos de Atenção
                          </h4>
                          <ul className="space-y-2 text-sm">
                            {compatibility.challenges.map((challenge, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <AlertTriangle className="w-3 h-3 mt-1 flex-shrink-0 text-amber-500" />
                                {challenge}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        Configure seu perfil DISC nas configurações para ver a análise de compatibilidade.
                      </p>
                    </div>
                  )}
                </TabsContent>

                {/* History Tab */}
                <TabsContent value="history">
                  <ScrollArea className="h-[400px]">
                    {analysisHistory.length > 0 ? (
                      <div className="space-y-3">
                        {analysisHistory.map((record, index) => (
                          <motion.div
                            key={record.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={cn(
                              "p-4 border rounded-lg",
                              index === 0 && "ring-2 ring-primary/20"
                            )}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <DISCBadge profile={record.primaryProfile} size="sm" />
                                {record.blendProfile && (
                                  <Badge variant="outline">{record.blendProfile}</Badge>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {formatDistanceToNow(record.analyzedAt, { locale: ptBR, addSuffix: true })}
                              </div>
                            </div>
                            <div className="grid grid-cols-4 gap-2 mt-2">
                              <div className="text-center">
                                <div className="text-xs text-muted-foreground">D</div>
                                <div className="font-medium text-red-600">{record.dominanceScore}%</div>
                              </div>
                              <div className="text-center">
                                <div className="text-xs text-muted-foreground">I</div>
                                <div className="font-medium text-amber-600">{record.influenceScore}%</div>
                              </div>
                              <div className="text-center">
                                <div className="text-xs text-muted-foreground">S</div>
                                <div className="font-medium text-emerald-600">{record.steadinessScore}%</div>
                              </div>
                              <div className="text-center">
                                <div className="text-xs text-muted-foreground">C</div>
                                <div className="font-medium text-blue-600">{record.conscientiousnessScore}%</div>
                              </div>
                            </div>
                            {record.profileSummary && (
                              <p className="text-xs text-muted-foreground mt-2">
                                {record.profileSummary}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                {record.analysisSource === 'ai_analysis' ? 'IA' : 
                                 record.analysisSource === 'manual' ? 'Manual' : 'Automático'}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {record.confidence}% conf.
                              </Badge>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <History className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">
                          Nenhum histórico de análise disponível
                        </p>
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

export default DISCProfileExpanded;
