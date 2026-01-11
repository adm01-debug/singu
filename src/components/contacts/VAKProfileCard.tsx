import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  Ear,
  Hand,
  Brain,
  Sparkles,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Info,
  Lightbulb,
  MessageSquare,
  Trash2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { Contact } from '@/types';
import { VAKProfile, VAKType, VAK_LABELS, VAK_COMMUNICATION_TIPS } from '@/types/vak';
import { useVAKAnalysis } from '@/hooks/useVAKAnalysis';
import { toast } from 'sonner';

interface VAKProfileCardProps {
  contact: Contact;
  className?: string;
}

const VAK_ICONS: Record<VAKType, typeof Eye> = {
  V: Eye,
  A: Ear,
  K: Hand,
  D: Brain,
};

export function VAKProfileCard({ contact, className }: VAKProfileCardProps) {
  const [profile, setProfile] = useState<VAKProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTips, setShowTips] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  
  const { 
    analyzing, 
    getContactVAKProfile, 
    analyzeContactInteractions,
    clearContactAnalysis,
  } = useVAKAnalysis();

  useEffect(() => {
    loadProfile();
  }, [contact.id]);

  const loadProfile = async () => {
    setLoading(true);
    const vakProfile = await getContactVAKProfile(contact.id);
    setProfile(vakProfile);
    setLoading(false);
  };

  const handleAnalyze = async () => {
    const result = await analyzeContactInteractions(contact.id);
    if (result) {
      setProfile(result);
      toast.success('Análise VAK concluída!', {
        description: `Sistema primário: ${VAK_LABELS[result.primary!].name}`,
      });
    } else {
      toast.error('Não foi possível analisar', {
        description: 'Verifique se existem interações com texto para analisar.',
      });
    }
  };

  const handleClear = async () => {
    const success = await clearContactAnalysis(contact.id);
    if (success) {
      setProfile(null);
      toast.success('Análise VAK removida');
    }
  };

  const renderScoreBar = (type: VAKType, score: number) => {
    const label = VAK_LABELS[type];
    const Icon = VAK_ICONS[type];
    
    return (
      <div key={type} className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4" />
            <span className="font-medium">{label.name}</span>
          </div>
          <span className="text-muted-foreground">{score.toFixed(0)}%</span>
        </div>
        <Progress 
          value={score} 
          className={cn('h-2', profile?.primary === type && 'bg-primary/20')}
        />
      </div>
    );
  };

  if (loading) {
    return (
      <Card className={cn('animate-pulse', className)}>
        <CardHeader className="pb-3">
          <div className="h-5 w-32 bg-muted rounded" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-4 w-full bg-muted rounded" />
            <div className="h-4 w-3/4 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="w-4 h-4 text-primary" />
              Perfil VAK (PNL)
            </CardTitle>
            <CardDescription>
              Sistema Representacional Preferido
            </CardDescription>
          </div>
          <div className="flex gap-1">
            {profile && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={handleClear}
                    >
                      <Trash2 className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Limpar análise</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleAnalyze}
              disabled={analyzing}
              className="gap-1.5"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', analyzing && 'animate-spin')} />
              {analyzing ? 'Analisando...' : profile ? 'Reanalisar' : 'Analisar'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {!profile ? (
          <div className="text-center py-6 text-muted-foreground">
            <Brain className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Nenhuma análise VAK encontrada.</p>
            <p className="text-xs mt-1">
              Clique em "Analisar" para detectar o sistema representacional
              <br />baseado nas interações do contato.
            </p>
          </div>
        ) : (
          <>
            {/* Primary System Badge */}
            {profile.primary && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center justify-center"
              >
                <div className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg border-2',
                  VAK_LABELS[profile.primary].bgColor
                )}>
                  <span className="text-2xl">{VAK_LABELS[profile.primary].icon}</span>
                  <div>
                    <p className={cn('font-bold', VAK_LABELS[profile.primary].color)}>
                      {VAK_LABELS[profile.primary].fullName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Sistema Primário • {profile.confidence}% confiança
                    </p>
                  </div>
                  {profile.secondary && (
                    <Badge variant="outline" className="ml-2">
                      + {VAK_LABELS[profile.secondary].name}
                    </Badge>
                  )}
                </div>
              </motion.div>
            )}

            {/* Score Bars */}
            <div className="space-y-3 pt-2">
              {renderScoreBar('V', profile.scores.visual)}
              {renderScoreBar('A', profile.scores.auditory)}
              {renderScoreBar('K', profile.scores.kinesthetic)}
              {renderScoreBar('D', profile.scores.digital)}
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
              <span>{profile.totalWordsAnalyzed} palavras analisadas</span>
              {profile.lastAnalyzedAt && (
                <span>
                  Última análise: {new Date(profile.lastAnalyzedAt).toLocaleDateString('pt-BR')}
                </span>
              )}
            </div>

            {/* Communication Tips Collapsible */}
            {profile.primary && (
              <Collapsible open={showTips} onOpenChange={setShowTips}>
                <CollapsibleTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-between h-auto py-3"
                  >
                    <div className="flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm font-medium">Dicas de Comunicação</span>
                    </div>
                    {showTips ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <AnimatePresence>
                    {showTips && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4 pt-2"
                      >
                        {/* Use These Words */}
                        <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                          <p className="text-xs font-medium text-green-700 dark:text-green-300 mb-2">
                            ✅ Use estas palavras:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {VAK_COMMUNICATION_TIPS[profile.primary].useWords.map(word => (
                              <Badge 
                                key={word} 
                                variant="secondary" 
                                className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs"
                              >
                                {word}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Avoid These Words */}
                        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                          <p className="text-xs font-medium text-red-700 dark:text-red-300 mb-2">
                            ❌ Evite estas palavras:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {VAK_COMMUNICATION_TIPS[profile.primary].avoidWords.map(word => (
                              <Badge 
                                key={word} 
                                variant="secondary" 
                                className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 text-xs"
                              >
                                {word}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Communication Style */}
                        <div className="p-3 rounded-lg bg-muted/50 border">
                          <p className="text-xs font-medium mb-1">💡 Estilo de Comunicação:</p>
                          <p className="text-sm text-muted-foreground">
                            {VAK_COMMUNICATION_TIPS[profile.primary].communicationStyle}
                          </p>
                        </div>

                        {/* Sales Tips */}
                        <div className="space-y-2">
                          <p className="text-xs font-medium flex items-center gap-1">
                            <MessageSquare className="w-3.5 h-3.5" />
                            Dicas para Vendas:
                          </p>
                          <ul className="space-y-1">
                            {VAK_COMMUNICATION_TIPS[profile.primary].salesTips.map((tip, i) => (
                              <li key={i} className="text-xs text-muted-foreground flex gap-2">
                                <span className="text-primary">•</span>
                                {tip}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Example Templates */}
                        <Collapsible open={showDetails} onOpenChange={setShowDetails}>
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="w-full text-xs">
                              {showDetails ? 'Ocultar exemplos' : 'Ver exemplos de frases'}
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="space-y-2 pt-2">
                              {VAK_COMMUNICATION_TIPS[profile.primary].templateExamples.map((example, i) => (
                                <div 
                                  key={i}
                                  className="p-2 rounded bg-muted/30 text-sm italic text-muted-foreground border-l-2 border-primary"
                                >
                                  "{example}"
                                </div>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CollapsibleContent>
              </Collapsible>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
