import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Brain, RefreshCw, Trash2, Lightbulb } from 'lucide-react';
import { Contact, Interaction } from '@/types';
import { useBigFiveAnalysis } from '@/hooks/useBigFiveAnalysis';
import { BIG_FIVE_TRAITS, BigFiveTrait } from '@/types/big-five';
import { cn } from '@/lib/utils';

interface BigFiveProfileCardProps {
  contact: Contact;
  interactions: Interaction[];
  className?: string;
}

export function BigFiveProfileCard({ contact, interactions, className }: BigFiveProfileCardProps) {
  const { profile, isAnalyzing, analyze, clear } = useBigFiveAnalysis(contact);

  const traits: { key: BigFiveTrait; label: string; score: number }[] = profile ? [
    { key: 'O', label: 'Abertura', score: profile.scores.openness },
    { key: 'C', label: 'Conscienciosidade', score: profile.scores.conscientiousness },
    { key: 'E', label: 'Extroversão', score: profile.scores.extraversion },
    { key: 'A', label: 'Amabilidade', score: profile.scores.agreeableness },
    { key: 'N', label: 'Neuroticismo', score: profile.scores.neuroticism }
  ] : [];

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            Big Five (OCEAN)
          </CardTitle>
          <div className="flex gap-2">
            {profile && (
              <Button variant="ghost" size="sm" onClick={clear}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => analyze(interactions)}
              disabled={isAnalyzing || interactions.length === 0}
            >
              <RefreshCw className={cn('h-4 w-4 mr-1', isAnalyzing && 'animate-spin')} />
              {profile ? 'Reanalisar' : 'Analisar'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!profile ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Clique em "Analisar" para gerar o perfil Big Five
          </p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Confiança: {profile.confidence}%</span>
            </div>
            
            <div className="space-y-3">
              {traits.map(({ key, label, score }) => (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span>{BIG_FIVE_TRAITS[key].icon}</span>
                      {label}
                    </span>
                    <span className={cn('font-medium', BIG_FIVE_TRAITS[key].color)}>
                      {score}%
                    </span>
                  </div>
                  <Progress value={score} className="h-2" />
                </div>
              ))}
            </div>

            {profile.communicationTips.length > 0 && (
              <div className="pt-3 border-t">
                <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                  <Lightbulb className="h-4 w-4 text-yellow-500" />
                  Dicas de Comunicação
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {profile.communicationTips.slice(0, 4).map((tip, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
