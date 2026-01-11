import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  Heart, 
  Target, 
  MessageSquare, 
  TrendingUp,
  Eye,
  Ear,
  Hand,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Contact } from '@/types';
import { useEmotionalStates } from '@/hooks/useEmotionalStates';
import { useRapportGenerator } from '@/hooks/useRapportGenerator';
import { useHiddenObjections } from '@/hooks/useHiddenObjections';
import { useClientValues } from '@/hooks/useClientValues';

interface Interaction {
  id: string;
  content: string | null;
  transcription?: string | null;
  createdAt?: string;
}

interface QuickNLPInsightsProps {
  contact: Contact;
  interactions: Interaction[];
  className?: string;
}

export function QuickNLPInsights({ contact, interactions, className }: QuickNLPInsightsProps) {
  const { detectEmotionalState, EMOTIONAL_STATE_INFO } = useEmotionalStates();
  const { rapportProfile } = useRapportGenerator(contact);
  const { objectionAnalysis } = useHiddenObjections(
    interactions.map(i => ({
      id: i.id,
      content: i.content || undefined,
      transcription: i.transcription || undefined
    }))
  );
  const { valuesMap } = useClientValues(
    contact,
    interactions.map(i => ({
      id: i.id,
      content: i.content || undefined,
      transcription: i.transcription || undefined
    }))
  );

  // Get emotional state from recent interactions
  const currentEmotionalState = useMemo(() => {
    const recentText = interactions.slice(0, 5).map(i => 
      i.content || i.transcription || ''
    ).join(' ');
    return detectEmotionalState(recentText);
  }, [interactions, detectEmotionalState]);

  // Get VAK profile from behavior
  const behavior = contact.behavior as any;
  const vakProfile = behavior?.vakProfile || { 
    visual: 33, 
    auditory: 33, 
    kinesthetic: 34,
    primary: 'V'
  };
  
  const dominantVAK = typeof vakProfile === 'object' && vakProfile.primary 
    ? vakProfile.primary
    : vakProfile.visual >= vakProfile.auditory && vakProfile.visual >= vakProfile.kinesthetic 
      ? 'V' 
      : vakProfile.auditory >= vakProfile.kinesthetic 
        ? 'A' 
        : 'K';

  const emotionInfo = EMOTIONAL_STATE_INFO[currentEmotionalState.state as keyof typeof EMOTIONAL_STATE_INFO];

  // Calculate resistance level (0-5 scale based on percentage)
  const resistanceLevel = Math.ceil(objectionAnalysis.resistanceLevel / 20);

  // Calculate overall NLP score
  const nlpScore = useMemo(() => {
    let score = 50; // Base score
    
    // Add emotional confidence
    score += currentEmotionalState.confidence * 10;
    
    // Add rapport score
    score += rapportProfile.rapportScore / 10;
    
    // Reduce for objections
    score -= objectionAnalysis.resistanceLevel / 10;
    
    // Add for identified values
    score += Math.min(valuesMap.coreValues.length * 5, 20);
    
    return Math.min(Math.max(Math.round(score), 0), 100);
  }, [currentEmotionalState, rapportProfile, objectionAnalysis, valuesMap]);

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-success';
    if (score >= 50) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      <Card className="bg-gradient-to-r from-primary/5 via-card to-primary/5 border-primary/20">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Quick Insights PNL</h3>
            <Badge variant="outline" className="ml-auto text-xs">
              Score: <span className={cn("font-bold ml-1", getScoreColor(nlpScore))}>{nlpScore}%</span>
            </Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {/* Emotional State */}
            <div className="p-3 rounded-lg bg-card/80 border border-border/50 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-pink-500" />
                <span className="text-xs text-muted-foreground">Emoção</span>
              </div>
              <p className="text-sm font-medium capitalize truncate" title={emotionInfo?.name || currentEmotionalState.state}>
                {emotionInfo?.name || currentEmotionalState.state}
              </p>
              <div className="flex items-center gap-1">
                <Progress 
                  value={currentEmotionalState.confidence * 100} 
                  className="h-1 flex-1" 
                />
                <span className="text-[10px] text-muted-foreground">
                  {Math.round(currentEmotionalState.confidence * 100)}%
                </span>
              </div>
            </div>

            {/* VAK Profile */}
            <div className="p-3 rounded-lg bg-card/80 border border-border/50 space-y-1.5">
              <div className="flex items-center gap-1.5">
                {dominantVAK === 'V' && <Eye className="w-3.5 h-3.5 text-info" />}
                {dominantVAK === 'A' && <Ear className="w-3.5 h-3.5 text-success" />}
                {dominantVAK === 'K' && <Hand className="w-3.5 h-3.5 text-warning" />}
                {!['V', 'A', 'K'].includes(dominantVAK) && <Eye className="w-3.5 h-3.5 text-info" />}
                <span className="text-xs text-muted-foreground">VAK</span>
              </div>
              <p className="text-sm font-medium capitalize">
                {dominantVAK === 'V' ? 'Visual' : 
                 dominantVAK === 'A' ? 'Auditivo' : 
                 dominantVAK === 'K' ? 'Cinestésico' : 'Digital'}
              </p>
              <div className="flex gap-0.5">
                <div 
                  className="h-1 rounded-l bg-info" 
                  style={{ width: `${vakProfile.visual || 33}%` }} 
                  title={`Visual: ${vakProfile.visual || 33}%`}
                />
                <div 
                  className="h-1 bg-success" 
                  style={{ width: `${vakProfile.auditory || 33}%` }} 
                  title={`Auditivo: ${vakProfile.auditory || 33}%`}
                />
                <div 
                  className="h-1 rounded-r bg-warning" 
                  style={{ width: `${vakProfile.kinesthetic || 34}%` }} 
                  title={`Cinestésico: ${vakProfile.kinesthetic || 34}%`}
                />
              </div>
            </div>

            {/* DISC Profile */}
            <div className="p-3 rounded-lg bg-card/80 border border-border/50 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs text-muted-foreground">DISC</span>
              </div>
              <p className="text-sm font-medium">
                {contact.behavior?.discProfile || 'N/A'}
              </p>
              <Badge 
                variant="outline" 
                className={cn(
                  "text-[10px] px-1.5 py-0",
                  contact.behavior?.discProfile === 'D' && 'border-destructive/50 text-destructive',
                  contact.behavior?.discProfile === 'I' && 'border-warning/50 text-warning',
                  contact.behavior?.discProfile === 'S' && 'border-success/50 text-success',
                  contact.behavior?.discProfile === 'C' && 'border-info/50 text-info'
                )}
              >
                {contact.behavior?.discProfile === 'D' && 'Dominante'}
                {contact.behavior?.discProfile === 'I' && 'Influente'}
                {contact.behavior?.discProfile === 'S' && 'Estável'}
                {contact.behavior?.discProfile === 'C' && 'Conforme'}
                {!contact.behavior?.discProfile && 'Não definido'}
              </Badge>
            </div>

            {/* Rapport Score */}
            <div className="p-3 rounded-lg bg-card/80 border border-border/50 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-success" />
                <span className="text-xs text-muted-foreground">Rapport</span>
              </div>
              <p className={cn("text-sm font-medium", getScoreColor(rapportProfile.rapportScore))}>
                {rapportProfile.rapportScore}%
              </p>
              <Progress 
                value={rapportProfile.rapportScore} 
                className="h-1" 
              />
            </div>

            {/* Resistance Level */}
            <div className="p-3 rounded-lg bg-card/80 border border-border/50 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-warning" />
                <span className="text-xs text-muted-foreground">Resistência</span>
              </div>
              <p className="text-sm font-medium capitalize">
                {resistanceLevel <= 1 ? 'Baixa' : 
                 resistanceLevel === 2 ? 'Média' : 
                 resistanceLevel === 3 ? 'Alta' : 
                 resistanceLevel >= 4 ? 'Muito Alta' : 'Mínima'}
              </p>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((level) => (
                  <div 
                    key={level}
                    className={cn(
                      "h-1 flex-1 rounded",
                      level <= resistanceLevel ? 'bg-warning' : 'bg-muted'
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Top Value */}
            <div className="p-3 rounded-lg bg-card/80 border border-border/50 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs text-muted-foreground">Valor Principal</span>
              </div>
              <p className="text-sm font-medium capitalize truncate" title={valuesMap.valueHierarchy[0] || 'N/A'}>
                {valuesMap.valueHierarchy[0] || 'Analisar'}
              </p>
              {valuesMap.motivationalDrivers[0] && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 truncate max-w-full">
                  {valuesMap.motivationalDrivers[0]}
                </Badge>
              )}
            </div>
          </div>

          {/* Quick Tips */}
          {rapportProfile.connectionKeywords.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border/50">
              <div className="flex items-center gap-2 flex-wrap">
                <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Palavras-chave:</span>
                {rapportProfile.connectionKeywords.slice(0, 5).map((keyword, i) => (
                  <Badge key={i} variant="outline" className="text-[10px] px-1.5 py-0">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
