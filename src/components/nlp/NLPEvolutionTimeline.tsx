// ==============================================
// NLP Evolution Timeline - Visual History of Profile Changes
// Enterprise Level Component
// ==============================================

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import {
  Eye, Ear, Hand, Brain, TrendingUp, TrendingDown, Minus,
  Calendar, RefreshCw, Info, ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { VAK_LABELS, VAKType } from '@/types/vak';
import { EMOTIONAL_STATE_INFO } from '@/data/nlpAdvancedData';
import { EmotionalState } from '@/types/nlp-advanced';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { logger } from "@/lib/logger";

interface NLPEvolutionTimelineProps {
  contactId: string;
  contactName?: string;
  className?: string;
}

type Period = '7d' | '30d' | '90d' | '180d';
type AnalysisType = 'vak' | 'emotional' | 'all';

interface VAKDataPoint {
  date: string;
  displayDate: string;
  visual: number;
  auditory: number;
  kinesthetic: number;
  digital: number;
  dominant: VAKType;
}

interface EmotionalDataPoint {
  date: string;
  displayDate: string;
  state: EmotionalState;
  confidence: number;
  stateScore: number; // -1 to 1 scale
}

const VAK_COLORS = {
  visual: '#8b5cf6',
  auditory: '#3b82f6',
  kinesthetic: '#22c55e',
  digital: '#64748b'
};

const getEmotionalScore = (state: EmotionalState): number => {
  const positiveStates = ['excited', 'confident', 'interested', 'curious', 'hopeful'];
  const negativeStates = ['frustrated', 'anxious', 'resistant', 'skeptical', 'hesitant'];
  
  if (positiveStates.includes(state)) return 1;
  if (negativeStates.includes(state)) return -1;
  return 0;
};

const NLPEvolutionTimeline: React.FC<NLPEvolutionTimelineProps> = ({
  contactId,
  contactName,
  className
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('30d');
  const [activeTab, setActiveTab] = useState<AnalysisType>('all');
  const [vakData, setVakData] = useState<VAKDataPoint[]>([]);
  const [emotionalData, setEmotionalData] = useState<EmotionalDataPoint[]>([]);

  useEffect(() => {
    if (user && contactId) {
      fetchEvolutionData();
    }
  }, [user, contactId, period]);

  const fetchEvolutionData = async () => {
    setLoading(true);
    try {
      const periodDays = {
        '7d': 7,
        '30d': 30,
        '90d': 90,
        '180d': 180
      }[period];

      const startDate = subDays(new Date(), periodDays).toISOString();

      // Fetch VAK history
      const { data: vakHistory } = await supabase
        .from('vak_analysis_history')
        .select('created_at, visual_score, auditory_score, kinesthetic_score, digital_score')
        .eq('contact_id', contactId)
        .eq('user_id', user!.id)
        .gte('created_at', startDate)
        .order('created_at', { ascending: true });

      // Fetch emotional history
      const { data: emotionalHistory } = await supabase
        .from('emotional_states_history')
        .select('created_at, emotional_state, confidence')
        .eq('contact_id', contactId)
        .eq('user_id', user!.id)
        .gte('created_at', startDate)
        .order('created_at', { ascending: true });

      // Process VAK data
      const processedVak: VAKDataPoint[] = (vakHistory || []).map(entry => {
        const scores = {
          visual: entry.visual_score || 0,
          auditory: entry.auditory_score || 0,
          kinesthetic: entry.kinesthetic_score || 0,
          digital: entry.digital_score || 0
        };
        
        const maxScore = Math.max(...Object.values(scores));
        const dominant = (Object.keys(scores) as Array<keyof typeof scores>)
          .find(k => scores[k] === maxScore) || 'visual';
        
        const typeMap: Record<string, VAKType> = {
          visual: 'V', auditory: 'A', kinesthetic: 'K', digital: 'D'
        };

        return {
          date: entry.created_at,
          displayDate: format(new Date(entry.created_at), 'dd/MM', { locale: ptBR }),
          ...scores,
          dominant: typeMap[dominant]
        };
      });

      // Process emotional data
      const processedEmotional: EmotionalDataPoint[] = (emotionalHistory || []).map(entry => ({
        date: entry.created_at,
        displayDate: format(new Date(entry.created_at), 'dd/MM', { locale: ptBR }),
        state: entry.emotional_state as EmotionalState,
        confidence: entry.confidence || 50,
        stateScore: getEmotionalScore(entry.emotional_state as EmotionalState)
      }));

      setVakData(processedVak);
      setEmotionalData(processedEmotional);
    } catch (error) {
      logger.error('Error fetching evolution data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate trends
  const vakTrend = useMemo(() => {
    if (vakData.length < 2) return null;
    
    const recent = vakData.slice(-5);
    const earlier = vakData.slice(0, 5);
    
    const recentDominant = recent.reduce((acc, d) => {
      acc[d.dominant] = (acc[d.dominant] || 0) + 1;
      return acc;
    }, {} as Record<VAKType, number>);
    
    const earlierDominant = earlier.reduce((acc, d) => {
      acc[d.dominant] = (acc[d.dominant] || 0) + 1;
      return acc;
    }, {} as Record<VAKType, number>);
    
    const currentDominant = Object.entries(recentDominant)
      .sort((a, b) => b[1] - a[1])[0]?.[0] as VAKType;
    const previousDominant = Object.entries(earlierDominant)
      .sort((a, b) => b[1] - a[1])[0]?.[0] as VAKType;
    
    return {
      current: currentDominant,
      previous: previousDominant,
      changed: currentDominant !== previousDominant,
      stability: currentDominant === previousDominant ? 'stable' : 'evolving'
    };
  }, [vakData]);

  const emotionalTrend = useMemo(() => {
    if (emotionalData.length < 3) return null;
    
    const recent = emotionalData.slice(-3);
    const avgScore = recent.reduce((acc, d) => acc + d.stateScore, 0) / recent.length;
    
    return {
      trend: avgScore > 0.3 ? 'improving' : avgScore < -0.3 ? 'declining' : 'stable',
      avgConfidence: Math.round(recent.reduce((acc, d) => acc + d.confidence, 0) / recent.length),
      currentState: recent[recent.length - 1]?.state || 'neutral'
    };
  }, [emotionalData]);

  // Radar chart data for current profile
  const radarData = useMemo(() => {
    if (vakData.length === 0) return [];
    
    const latest = vakData[vakData.length - 1];
    return [
      { subject: 'Visual', value: latest?.visual || 0, fullMark: 100 },
      { subject: 'Auditivo', value: latest?.auditory || 0, fullMark: 100 },
      { subject: 'Cinestésico', value: latest?.kinesthetic || 0, fullMark: 100 },
      { subject: 'Digital', value: latest?.digital || 0, fullMark: 100 }
    ];
  }, [vakData]);

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  const hasData = vakData.length > 0 || emotionalData.length > 0;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Evolução do Perfil PNL
            </CardTitle>
            <CardDescription>
              {contactName ? `Histórico de ${contactName}` : 'Mudanças ao longo do tempo'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 dias</SelectItem>
                <SelectItem value="30d">30 dias</SelectItem>
                <SelectItem value="90d">3 meses</SelectItem>
                <SelectItem value="180d">6 meses</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={fetchEvolutionData}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {!hasData ? (
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>Nenhum dado de evolução disponível</p>
            <p className="text-sm mt-1">Analise mais interações para ver o histórico</p>
          </div>
        ) : (
          <>
            {/* Trend Indicators */}
            <div className="grid grid-cols-2 gap-3">
              {vakTrend && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-2 mb-2">
                    {vakTrend.current === 'V' ? <Eye className="w-4 h-4 text-secondary" /> :
                     vakTrend.current === 'A' ? <Ear className="w-4 h-4 text-info" /> :
                     vakTrend.current === 'K' ? <Hand className="w-4 h-4 text-success" /> :
                     <Brain className="w-4 h-4 text-muted-foreground" />}
                    <span className="text-sm font-medium">Sistema VAK</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge className={VAK_LABELS[vakTrend.current]?.bgColor}>
                      {VAK_LABELS[vakTrend.current]?.name}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {vakTrend.stability === 'stable' ? '✓ Estável' : '↔ Em evolução'}
                    </span>
                  </div>
                </motion.div>
              )}

              {emotionalTrend && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-2 mb-2">
                    {emotionalTrend.trend === 'improving' ? 
                      <TrendingUp className="w-4 h-4 text-success" /> :
                     emotionalTrend.trend === 'declining' ?
                      <TrendingDown className="w-4 h-4 text-destructive" /> :
                      <Minus className="w-4 h-4 text-warning" />}
                    <span className="text-sm font-medium">Estado Emocional</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge className={EMOTIONAL_STATE_INFO[emotionalTrend.currentState]?.bgColor || 'bg-muted'}>
                      {EMOTIONAL_STATE_INFO[emotionalTrend.currentState]?.icon}{' '}
                      {EMOTIONAL_STATE_INFO[emotionalTrend.currentState]?.name}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {emotionalTrend.trend === 'improving' ? '📈 Melhorando' :
                       emotionalTrend.trend === 'declining' ? '📉 Atenção' : '➡️ Estável'}
                    </span>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Charts */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as AnalysisType)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">Visão Geral</TabsTrigger>
                <TabsTrigger value="vak">VAK</TabsTrigger>
                <TabsTrigger value="emotional">Emocional</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-4">
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Radar Chart - Current Profile */}
                  {radarData.length > 0 && (
                    <div className="bg-muted/30 rounded-lg p-4">
                      <h4 className="text-sm font-medium mb-3">Perfil VAK Atual</h4>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart data={radarData}>
                            <PolarGrid stroke="hsl(var(--border))" />
                            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                            <Radar
                              name="Perfil"
                              dataKey="value"
                              stroke="hsl(var(--primary))"
                              fill="hsl(var(--primary))"
                              fillOpacity={0.3}
                            />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {/* Emotional Timeline Mini */}
                  {emotionalData.length > 0 && (
                    <div className="bg-muted/30 rounded-lg p-4">
                      <h4 className="text-sm font-medium mb-3">Tendência Emocional</h4>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={emotionalData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="displayDate" tick={{ fontSize: 10 }} />
                            <YAxis domain={[-1, 1]} tick={{ fontSize: 10 }} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'hsl(var(--card))',
                                border: '1px solid hsl(var(--border))'
                              }}
                              formatter={(value: number, name: string) => [
                                value > 0 ? 'Positivo' : value < 0 ? 'Negativo' : 'Neutro',
                                'Estado'
                              ]}
                            />
                            <Area
                              type="monotone"
                              dataKey="stateScore"
                              stroke="#22c55e"
                              fill="url(#emotionalGradient)"
                            />
                            <defs>
                              <linearGradient id="emotionalGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.4} />
                              </linearGradient>
                            </defs>
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="vak" className="mt-4">
                {vakData.length > 0 ? (
                  <div className="bg-muted/30 rounded-lg p-4">
                    <h4 className="text-sm font-medium mb-3">Evolução dos Sistemas VAK</h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={vakData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="displayDate" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))'
                            }}
                          />
                          <Legend />
                          <Area
                            type="monotone"
                            dataKey="visual"
                            name="Visual"
                            stackId="1"
                            stroke={VAK_COLORS.visual}
                            fill={VAK_COLORS.visual}
                            fillOpacity={0.6}
                          />
                          <Area
                            type="monotone"
                            dataKey="auditory"
                            name="Auditivo"
                            stackId="1"
                            stroke={VAK_COLORS.auditory}
                            fill={VAK_COLORS.auditory}
                            fillOpacity={0.6}
                          />
                          <Area
                            type="monotone"
                            dataKey="kinesthetic"
                            name="Cinestésico"
                            stackId="1"
                            stroke={VAK_COLORS.kinesthetic}
                            fill={VAK_COLORS.kinesthetic}
                            fillOpacity={0.6}
                          />
                          <Area
                            type="monotone"
                            dataKey="digital"
                            name="Digital"
                            stackId="1"
                            stroke={VAK_COLORS.digital}
                            fill={VAK_COLORS.digital}
                            fillOpacity={0.6}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Sem dados VAK suficientes para o período</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="emotional" className="mt-4">
                {emotionalData.length > 0 ? (
                  <div className="space-y-4">
                    <div className="bg-muted/30 rounded-lg p-4">
                      <h4 className="text-sm font-medium mb-3">Histórico Emocional</h4>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={emotionalData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="displayDate" tick={{ fontSize: 11 }} />
                            <YAxis 
                              domain={[0, 100]} 
                              tick={{ fontSize: 11 }}
                              label={{ value: 'Confiança', angle: -90, position: 'insideLeft', fontSize: 10 }}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'hsl(var(--card))',
                                border: '1px solid hsl(var(--border))'
                              }}
                              formatter={(value: number, name: string) => [
                                `${value}%`,
                                'Confiança'
                              ]}
                            />
                            <Line
                              type="monotone"
                              dataKey="confidence"
                              stroke="hsl(var(--primary))"
                              strokeWidth={2}
                              dot={{ r: 4 }}
                              activeDot={{ r: 6 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* State History List */}
                    <div className="bg-muted/30 rounded-lg p-4">
                      <h4 className="text-sm font-medium mb-3">Últimos Estados Detectados</h4>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {emotionalData.slice(-5).reverse().map((entry, idx) => {
                          const info = EMOTIONAL_STATE_INFO[entry.state];
                          return (
                            <div key={idx} className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <span>{info?.icon || '😐'}</span>
                                <span>{info?.name || entry.state}</span>
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <span>{entry.confidence}%</span>
                                <span>{entry.displayDate}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Sem dados emocionais suficientes para o período</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default NLPEvolutionTimeline;
