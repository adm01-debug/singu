import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Linkedin,
  Twitter,
  Instagram,
  RefreshCw,
  ExternalLink,
  Clock,
  Users,
  Briefcase,
  MapPin,
  Award,
  TrendingUp,
  Settings,
  Play,
  Brain,
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useSocialProfiles, type SocialProfile } from '@/hooks/useSocialProfiles';
import { PLATFORM_CONFIG, LIFE_EVENT_CONFIG, INFLUENCE_LEVEL_CONFIG, type SocialPlatform, type LifeEventType } from '@/types/social';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SocialProfilesPanelProps {
  contactId: string;
  linkedinUrl?: string | null;
  twitterUrl?: string | null;
  instagramUrl?: string | null;
  className?: string;
}

const PlatformIcon: React.FC<{ platform: SocialPlatform; className?: string }> = ({ platform, className }) => {
  const icons = {
    linkedin: Linkedin,
    twitter: Twitter,
    instagram: Instagram,
  };
  const Icon = icons[platform];
  return <Icon className={className} />;
};

export function SocialProfilesPanel({
  contactId,
  linkedinUrl,
  twitterUrl,
  instagramUrl,
  className,
}: SocialProfilesPanelProps) {
  const {
    profiles,
    lifeEvents,
    behaviorAnalysis,
    schedules,
    loading,
    scraping,
    analyzing,
    scrapeProfile,
    analyzeBehavior,
    configureSchedule,
    dismissLifeEvent,
  } = useSocialProfiles(contactId);

  const [activeTab, setActiveTab] = useState('profiles');
  const [expandedProfile, setExpandedProfile] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [urls, setUrls] = useState({
    linkedin: linkedinUrl || '',
    twitter: twitterUrl || '',
    instagram: instagramUrl || '',
  });

  const handleScrape = async (platform: SocialPlatform) => {
    const url = urls[platform];
    if (!url) return;
    await scrapeProfile(platform, url);
  };

  const handleConfigureSchedule = async (
    platform: SocialPlatform,
    frequency: number,
    enabled: boolean
  ) => {
    const url = urls[platform];
    if (!url) return;
    await configureSchedule(platform, url, frequency, 'normal', enabled);
  };

  const getProfileByPlatform = (platform: SocialPlatform): SocialProfile | undefined => {
    return profiles.find(p => p.platform === platform);
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            Inteligência Social
          </CardTitle>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSettings(!showSettings)}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Configurações de Monitoramento</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button
              variant="default"
              size="sm"
              onClick={analyzeBehavior}
              disabled={analyzing || profiles.length === 0}
            >
              {analyzing ? (
                <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Brain className="h-4 w-4 mr-1" />
              )}
              Analisar
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="profiles">Perfis</TabsTrigger>
            <TabsTrigger value="events" className="relative">
              Eventos
              {lifeEvents.length > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 text-xs">
                  {lifeEvents.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="behavior">Comportamento</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          {/* Settings Panel */}
          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mb-4"
              >
                <div className="bg-muted/50 rounded-lg p-4 space-y-4">
                  <h4 className="font-medium text-sm">Configurar URLs e Monitoramento</h4>
                  {(['linkedin', 'twitter', 'instagram'] as SocialPlatform[]).map(platform => {
                    const config = PLATFORM_CONFIG[platform];
                    const schedule = schedules.find(s => s.platform === platform);
                    
                    return (
                      <div key={platform} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <PlatformIcon platform={platform} className={`h-4 w-4 ${config.color}`} />
                          <Label className="text-sm">{config.name}</Label>
                        </div>
                        <div className="flex gap-2">
                          <Input
                            placeholder={config.placeholder}
                            value={urls[platform]}
                            onChange={(e) => setUrls(prev => ({ ...prev, [platform]: e.target.value }))}
                            className="flex-1 text-sm"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleScrape(platform)}
                            disabled={scraping || !urls[platform]}
                          >
                            {scraping ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={schedule?.enabled ?? false}
                              onCheckedChange={(checked) => 
                                handleConfigureSchedule(platform, schedule?.frequency_days ?? 7, checked)
                              }
                              disabled={!urls[platform]}
                            />
                            <span className="text-muted-foreground">Monitorar automaticamente</span>
                          </div>
                          <Select
                            value={String(schedule?.frequency_days ?? 7)}
                            onValueChange={(val) => 
                              handleConfigureSchedule(platform, parseInt(val), schedule?.enabled ?? true)
                            }
                            disabled={!urls[platform]}
                          >
                            <SelectTrigger className="w-32 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">Diário</SelectItem>
                              <SelectItem value="3">A cada 3 dias</SelectItem>
                              <SelectItem value="7">Semanal</SelectItem>
                              <SelectItem value="14">Quinzenal</SelectItem>
                              <SelectItem value="30">Mensal</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Profiles Tab */}
          <TabsContent value="profiles" className="space-y-3">
            {profiles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Nenhum perfil social coletado ainda.</p>
                <p className="text-sm mt-1">Configure as URLs acima e clique em "Play" para começar.</p>
              </div>
            ) : (
              profiles.map(profile => {
                const config = PLATFORM_CONFIG[profile.platform as SocialPlatform];
                const isExpanded = expandedProfile === profile.id;

                return (
                  <Collapsible
                    key={profile.id}
                    open={isExpanded}
                    onOpenChange={() => setExpandedProfile(isExpanded ? null : profile.id)}
                  >
                    <div className="border rounded-lg p-3">
                      <CollapsibleTrigger asChild>
                        <div className="flex items-center justify-between cursor-pointer">
                          <div className="flex items-center gap-3">
                            <PlatformIcon 
                              platform={profile.platform as SocialPlatform} 
                              className={`h-5 w-5 ${config?.color}`} 
                            />
                            <div>
                              <p className="font-medium text-sm">{config?.name}</p>
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {profile.headline || profile.current_position || 'Sem título'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(profile.last_scraped_at), { 
                                addSuffix: true, 
                                locale: ptBR 
                              })}
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </div>
                        </div>
                      </CollapsibleTrigger>

                      <CollapsibleContent className="pt-3 space-y-3">
                        {profile.current_company && (
                          <div className="flex items-center gap-2 text-sm">
                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                            <span>{profile.current_position} @ {profile.current_company}</span>
                          </div>
                        )}
                        {profile.location && (
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>{profile.location}</span>
                          </div>
                        )}
                        {(profile.followers_count || profile.following_count) && (
                          <div className="flex items-center gap-4 text-sm">
                            <span className="flex items-center gap-1">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              {profile.followers_count?.toLocaleString()} seguidores
                            </span>
                            {profile.following_count && (
                              <span className="text-muted-foreground">
                                {profile.following_count?.toLocaleString()} seguindo
                              </span>
                            )}
                          </div>
                        )}
                        {profile.skills && profile.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {profile.skills.slice(0, 8).map((skill, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                            {profile.skills.length > 8 && (
                              <Badge variant="outline" className="text-xs">
                                +{profile.skills.length - 8}
                              </Badge>
                            )}
                          </div>
                        )}
                        {profile.profile_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-center"
                            onClick={() => window.open(profile.profile_url!, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Ver Perfil Completo
                          </Button>
                        )}
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                );
              })
            )}
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="space-y-3">
            {lifeEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Nenhum evento de vida detectado ainda.</p>
                <p className="text-sm mt-1">Os eventos serão detectados automaticamente.</p>
              </div>
            ) : (
              lifeEvents.map(event => {
                const eventConfig = LIFE_EVENT_CONFIG[event.event_type as LifeEventType];
                
                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`border rounded-lg p-3 ${eventConfig?.color || 'bg-muted/50'}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{eventConfig?.icon || '📌'}</span>
                        <div>
                          <p className="font-medium text-sm">{event.event_title}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {event.event_description}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {event.platform}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(event.created_at), { 
                                addSuffix: true, 
                                locale: ptBR 
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => dismissLifeEvent(event.id)}
                      >
                        ✓
                      </Button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </TabsContent>

          {/* Behavior Tab */}
          <TabsContent value="behavior" className="space-y-4">
            {!behaviorAnalysis ? (
              <div className="text-center py-8 text-muted-foreground">
                <Brain className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Nenhuma análise comportamental disponível.</p>
                <p className="text-sm mt-1">Clique em "Analisar" para gerar insights.</p>
              </div>
            ) : (
              <>
                {/* Big Five Traits */}
                {behaviorAnalysis.personality_traits && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <Award className="h-4 w-4" />
                      Traços de Personalidade (Big Five)
                    </h4>
                    {Object.entries(behaviorAnalysis.personality_traits).map(([trait, data]) => {
                      const traitLabels: Record<string, string> = {
                        openness: 'Abertura',
                        conscientiousness: 'Conscienciosidade',
                        extraversion: 'Extroversão',
                        agreeableness: 'Amabilidade',
                        neuroticism: 'Neuroticismo',
                      };
                      
                      return (
                        <div key={trait} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>{traitLabels[trait] || trait}</span>
                            <span className="text-muted-foreground">
                              {Math.round((data as any).score * 100)}%
                            </span>
                          </div>
                          <Progress value={(data as any).score * 100} className="h-2" />
                          {(data as any).indicators?.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                              {(data as any).indicators.slice(0, 2).join(', ')}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Communication Style */}
                {behaviorAnalysis.communication_style && (
                  <div className="space-y-2 pt-2 border-t">
                    <h4 className="font-medium text-sm">Estilo de Comunicação</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <Badge variant="outline">
                        {behaviorAnalysis.communication_style.formality === 'formal' ? 'Formal' : 
                         behaviorAnalysis.communication_style.formality === 'informal' ? 'Informal' : 'Equilibrado'}
                      </Badge>
                      <Badge variant="outline">
                        {behaviorAnalysis.communication_style.approach === 'technical' ? 'Técnico' : 
                         behaviorAnalysis.communication_style.approach === 'emotional' ? 'Emocional' : 'Equilibrado'}
                      </Badge>
                      <Badge variant="outline">
                        {behaviorAnalysis.communication_style.directness === 'direct' ? 'Direto' : 
                         behaviorAnalysis.communication_style.directness === 'indirect' ? 'Indireto' : 'Equilibrado'}
                      </Badge>
                      <Badge variant="outline">
                        {behaviorAnalysis.communication_style.preferred_format === 'visual' ? 'Visual' : 
                         behaviorAnalysis.communication_style.preferred_format === 'textual' ? 'Textual' : 'Equilibrado'}
                      </Badge>
                    </div>
                    {behaviorAnalysis.communication_style.tips?.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-muted-foreground font-medium">Dicas:</p>
                        <ul className="text-xs text-muted-foreground list-disc list-inside">
                          {behaviorAnalysis.communication_style.tips.map((tip, i) => (
                            <li key={i}>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Influence Level */}
                {behaviorAnalysis.influence_level && (
                  <div className="space-y-2 pt-2 border-t">
                    <h4 className="font-medium text-sm">Nível de Influência</h4>
                    <div className="flex items-center gap-2">
                      <Badge className={INFLUENCE_LEVEL_CONFIG[behaviorAnalysis.influence_level]?.color}>
                        {INFLUENCE_LEVEL_CONFIG[behaviorAnalysis.influence_level]?.label}
                      </Badge>
                      {behaviorAnalysis.influence_score && (
                        <span className="text-sm text-muted-foreground">
                          ({Math.round(behaviorAnalysis.influence_score * 100)}%)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {INFLUENCE_LEVEL_CONFIG[behaviorAnalysis.influence_level]?.description}
                    </p>
                  </div>
                )}

                {/* Interests & Topics */}
                {(behaviorAnalysis.interests?.length || behaviorAnalysis.topics?.length) && (
                  <div className="space-y-2 pt-2 border-t">
                    <h4 className="font-medium text-sm">Interesses e Tópicos</h4>
                    <div className="flex flex-wrap gap-1">
                      {behaviorAnalysis.interests?.map((interest, i) => (
                        <Badge key={`i-${i}`} variant="secondary" className="text-xs">
                          {interest}
                        </Badge>
                      ))}
                      {behaviorAnalysis.topics?.map((topic, i) => (
                        <Badge key={`t-${i}`} variant="outline" className="text-xs">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-4">
            {!behaviorAnalysis?.sales_insights ? (
              <div className="text-center py-8 text-muted-foreground">
                <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Nenhum insight de vendas disponível.</p>
                <p className="text-sm mt-1">Execute uma análise para gerar insights.</p>
              </div>
            ) : (
              <>
                {/* Executive Summary */}
                {behaviorAnalysis.executive_summary && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                    <h4 className="font-medium text-sm mb-2">📋 Resumo Executivo</h4>
                    <p className="text-sm">{behaviorAnalysis.executive_summary}</p>
                  </div>
                )}

                {/* Best Approaches */}
                {behaviorAnalysis.sales_insights.best_approaches?.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      ✅ Melhores Abordagens
                    </h4>
                    <ul className="space-y-1">
                      {behaviorAnalysis.sales_insights.best_approaches.map((approach, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <span className="text-success">•</span>
                          {approach}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Rapport Topics */}
                {behaviorAnalysis.sales_insights.rapport_topics?.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      💬 Tópicos para Rapport
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {behaviorAnalysis.sales_insights.rapport_topics.map((topic, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Decision Triggers */}
                {behaviorAnalysis.sales_insights.decision_triggers?.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      🎯 Gatilhos de Decisão
                    </h4>
                    <ul className="space-y-1">
                      {behaviorAnalysis.sales_insights.decision_triggers.map((trigger, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <span className="text-primary">→</span>
                          {trigger}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* What to Avoid */}
                {behaviorAnalysis.sales_insights.avoid?.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-destructive" />
                      O Que Evitar
                    </h4>
                    <ul className="space-y-1">
                      {behaviorAnalysis.sales_insights.avoid.map((item, i) => (
                        <li key={i} className="text-sm flex items-start gap-2 text-destructive">
                          <span>✗</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Contact Preferences */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                  {behaviorAnalysis.sales_insights.optimal_contact_time && (
                    <div className="text-center p-2 bg-muted/50 rounded">
                      <Clock className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Melhor horário</p>
                      <p className="text-sm font-medium">
                        {behaviorAnalysis.sales_insights.optimal_contact_time}
                      </p>
                    </div>
                  )}
                  {behaviorAnalysis.sales_insights.preferred_channel && (
                    <div className="text-center p-2 bg-muted/50 rounded">
                      <Users className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Canal preferido</p>
                      <p className="text-sm font-medium">
                        {behaviorAnalysis.sales_insights.preferred_channel}
                      </p>
                    </div>
                  )}
                </div>

                {/* Keywords */}
                {behaviorAnalysis.keywords?.length > 0 && (
                  <div className="space-y-2 pt-2 border-t">
                    <h4 className="font-medium text-sm">🔑 Palavras-chave</h4>
                    <div className="flex flex-wrap gap-1">
                      {behaviorAnalysis.keywords.map((kw, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {kw}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
