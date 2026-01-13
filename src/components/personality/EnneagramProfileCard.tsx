import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, RefreshCw, Trash2, Lightbulb, TrendingUp, TrendingDown } from 'lucide-react';
import { Contact, Interaction } from '@/types';
import { useEnneagramAnalysis } from '@/hooks/useEnneagramAnalysis';
import { ENNEAGRAM_TYPES, ENNEAGRAM_TRIADS } from '@/types/enneagram';
import { cn } from '@/lib/utils';

interface EnneagramProfileCardProps {
  contact: Contact;
  interactions: Interaction[];
  className?: string;
}

export function EnneagramProfileCard({ contact, interactions, className }: EnneagramProfileCardProps) {
  const { profile, isAnalyzing, analyze, clear } = useEnneagramAnalysis(contact);

  const typeInfo = profile ? ENNEAGRAM_TYPES[profile.type] : null;
  const triadInfo = typeInfo ? ENNEAGRAM_TRIADS[typeInfo.triads] : null;

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Heart className="h-5 w-5 text-rose-500" />
            Eneagrama
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
            Clique em "Analisar" para identificar o tipo do Eneagrama
          </p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{typeInfo.icon}</span>
                <div>
                  <Badge className={cn('text-lg font-bold', typeInfo.bgColor, typeInfo.color)}>
                    Tipo {profile.type}{profile.wing ? `w${profile.wing}` : ''}
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-1">{typeInfo.nickname}</p>
                </div>
              </div>
              <span className="text-sm text-muted-foreground">{profile.confidence}%</span>
            </div>

            <p className="text-sm">{typeInfo.description}</p>

            {triadInfo && (
              <Badge variant="outline" className="text-xs">
                {triadInfo.name}
              </Badge>
            )}

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-2 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">Motivação Central</p>
                <p className="text-xs">{typeInfo.coreDesire}</p>
              </div>
              <div className="p-2 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">Medo Central</p>
                <p className="text-xs">{typeInfo.coreFear}</p>
              </div>
            </div>

            <div className="flex gap-2 text-xs">
              <div className="flex items-center gap-1 text-green-600">
                <TrendingUp className="h-3 w-3" />
                <span>Cresce → Tipo {typeInfo.growthDirection}</span>
              </div>
              <div className="flex items-center gap-1 text-red-600">
                <TrendingDown className="h-3 w-3" />
                <span>Estresse → Tipo {typeInfo.stressDirection}</span>
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
