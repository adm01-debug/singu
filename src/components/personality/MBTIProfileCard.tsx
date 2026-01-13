import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, RefreshCw, Trash2, Lightbulb } from 'lucide-react';
import { Contact, Interaction } from '@/types';
import { useMBTIAnalysis } from '@/hooks/useMBTIAnalysis';
import { MBTI_TYPES, MBTIType } from '@/types/mbti';
import { cn } from '@/lib/utils';

interface MBTIProfileCardProps {
  contact: Contact;
  interactions: Interaction[];
  className?: string;
}

export function MBTIProfileCard({ contact, interactions, className }: MBTIProfileCardProps) {
  const { profile, isAnalyzing, analyze, clear, setManualType } = useMBTIAnalysis(contact);

  const typeInfo = profile ? MBTI_TYPES[profile.type] : null;

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-500" />
            MBTI (16 Tipos)
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
        {!profile || !typeInfo ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Clique em "Analisar" para identificar o tipo MBTI
          </p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{typeInfo.icon}</span>
                <div>
                  <Badge className={cn('text-lg font-bold', typeInfo.bgColor, typeInfo.color)}>
                    {profile.type}
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-1">{typeInfo.nickname}</p>
                </div>
              </div>
              <span className="text-sm text-muted-foreground">{profile.confidence}% confiança</span>
            </div>

            <p className="text-sm">{typeInfo.description}</p>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-1">Forças</h4>
                <div className="flex flex-wrap gap-1">
                  {typeInfo.strengths.slice(0, 3).map(s => (
                    <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-1">Estilo de Decisão</h4>
                <p className="text-xs">{typeInfo.decisionStyle}</p>
              </div>
            </div>

            <div className="pt-3 border-t">
              <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                <Lightbulb className="h-4 w-4 text-yellow-500" />
                Abordagem de Vendas
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {typeInfo.salesTips.slice(0, 3).map((tip, i) => (
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
