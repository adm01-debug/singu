import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Flame, RefreshCw, Trash2, Lightbulb } from 'lucide-react';
import { Contact, Interaction } from '@/types';
import { useTemperamentAnalysis } from '@/hooks/useTemperamentAnalysis';
import { TEMPERAMENT_TYPES, TemperamentType } from '@/types/temperament';
import { cn } from '@/lib/utils';

interface TemperamentProfileCardProps {
  contact: Contact;
  interactions: Interaction[];
  className?: string;
}

export function TemperamentProfileCard({ contact, interactions, className }: TemperamentProfileCardProps) {
  const { profile, isAnalyzing, analyze, clear } = useTemperamentAnalysis(contact);

  const primaryInfo = profile ? TEMPERAMENT_TYPES[profile.primary] : null;

  const temperamentOrder: TemperamentType[] = ['sanguine', 'choleric', 'melancholic', 'phlegmatic'];

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            4 Temperamentos
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
        {!profile || !primaryInfo ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Clique em "Analisar" para identificar o temperamento
          </p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{primaryInfo.icon}</span>
                <div>
                  <Badge className={cn('text-lg font-bold', primaryInfo.bgColor, primaryInfo.color)}>
                    {primaryInfo.name}
                  </Badge>
                  {profile.secondary && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      +{TEMPERAMENT_TYPES[profile.secondary].name}
                    </Badge>
                  )}
                  <p className="text-sm text-muted-foreground mt-1">{primaryInfo.nickname}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm text-muted-foreground">{profile.confidence}%</span>
                <p className="text-xs text-muted-foreground">{primaryInfo.element}</p>
              </div>
            </div>

            <p className="text-sm">{primaryInfo.description}</p>

            {/* Temperament Scores */}
            <div className="space-y-2">
              {temperamentOrder.map((type) => {
                const info = TEMPERAMENT_TYPES[type];
                const score = profile.scores[type];
                return (
                  <div key={type} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span>{info.icon}</span>
                        {info.name}
                      </span>
                      <span className={cn('font-medium', info.color)}>
                        {score}%
                      </span>
                    </div>
                    <Progress value={score} className="h-2" />
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-1">Forças</h4>
                <div className="flex flex-wrap gap-1">
                  {primaryInfo.strengths.slice(0, 3).map(s => (
                    <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-1">Estilo de Decisão</h4>
                <p className="text-xs">{primaryInfo.decisionStyle}</p>
              </div>
            </div>

            <div className="pt-3 border-t">
              <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                <Lightbulb className="h-4 w-4 text-yellow-500" />
                Abordagem de Vendas
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {primaryInfo.salesTips.slice(0, 3).map((tip, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
