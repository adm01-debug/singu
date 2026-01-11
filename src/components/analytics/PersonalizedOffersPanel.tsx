import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Gift, Target, AlertTriangle, ChevronDown, Copy, Sparkles, TrendingUp, Clock, MessageSquare } from 'lucide-react';
import { usePersonalizedOffers } from '@/hooks/usePersonalizedOffers';
import { Contact, Interaction } from '@/types';
import { useState } from 'react';
import { toast } from 'sonner';

interface PersonalizedOffersPanelProps {
  contact: Contact;
  interactions: Interaction[];
}

const priorityColors = {
  high: 'bg-success text-success-foreground',
  medium: 'bg-warning text-warning-foreground',
  low: 'bg-muted text-muted-foreground'
};

const categoryLabels: Record<string, string> = {
  product: 'Produto',
  service: 'Serviço',
  upgrade: 'Upgrade',
  addon: 'Adicional',
  renewal: 'Renovação',
  cross_sell: 'Cross-sell'
};

export function PersonalizedOffersPanel({ contact, interactions }: PersonalizedOffersPanelProps) {
  const recommendation = usePersonalizedOffers(contact, interactions);
  const [expandedOffer, setExpandedOffer] = useState<string | null>(null);

  if (!recommendation) return null;

  const copyPitch = (pitch: string) => {
    navigator.clipboard.writeText(pitch);
    toast.success('Pitch copiado!');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Gift className="h-5 w-5 text-primary" />
              Ofertas Personalizadas
            </CardTitle>
            <Badge variant={recommendation.urgencyLevel === 'high' ? 'default' : 'outline'}>
              {recommendation.urgencyLevel === 'high' ? '🔥 Momento Ideal' : recommendation.urgencyLevel === 'medium' ? '✓ Bom Momento' : '⏳ Aguardar'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Readiness Score */}
          <div className="p-4 rounded-lg bg-muted/50">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Prontidão para Compra</span>
              <span className="text-lg font-bold">{recommendation.readinessScore}%</span>
            </div>
            <Progress value={recommendation.readinessScore} className="h-2" />
            <div className="flex flex-wrap gap-2 mt-3">
              {recommendation.buyingSignals.map((signal, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {signal}
                </Badge>
              ))}
            </div>
          </div>

          {/* Strategy */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-2 mb-1">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Canal</span>
              </div>
              <span className="text-sm font-medium">{recommendation.communicationChannel}</span>
            </div>
            <div className="p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Timing</span>
              </div>
              <span className="text-sm font-medium">{recommendation.optimalTiming}</span>
            </div>
            <div className="p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-2 mb-1">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Preço</span>
              </div>
              <span className="text-sm font-medium">{recommendation.priceStrategy}</span>
            </div>
          </div>

          {/* Top Offers */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Ofertas Recomendadas
            </h4>
            {recommendation.topOffers.map((offer) => (
              <Collapsible key={offer.id} open={expandedOffer === offer.id} onOpenChange={() => setExpandedOffer(expandedOffer === offer.id ? null : offer.id)}>
                <CollapsibleTrigger asChild>
                  <div className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{offer.title}</span>
                        <Badge variant="outline" className="text-xs">{categoryLabels[offer.category]}</Badge>
                        <Badge className={priorityColors[offer.priority]}>{offer.priority === 'high' ? 'Alta' : offer.priority === 'medium' ? 'Média' : 'Baixa'}</Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Progress value={offer.matchScore} className="h-1.5 w-20" />
                        <span className="text-xs text-muted-foreground">{offer.matchScore}% match</span>
                      </div>
                    </div>
                    <ChevronDown className={`h-4 w-4 transition-transform ${expandedOffer === offer.id ? 'rotate-180' : ''}`} />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="p-4 border border-t-0 rounded-b-lg space-y-3 bg-muted/20">
                    <div>
                      <span className="text-xs text-muted-foreground">Por que essa oferta?</span>
                      <ul className="mt-1 space-y-1">
                        {offer.matchReasons.map((reason, idx) => (
                          <li key={idx} className="text-sm">✓ {reason}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Abordagem sugerida</span>
                      <p className="text-sm mt-1">{offer.bestApproach}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">Pitch sugerido</span>
                        <Button variant="ghost" size="sm" onClick={() => copyPitch(offer.suggestedPitch)}>
                          <Copy className="h-3 w-3 mr-1" />
                          Copiar
                        </Button>
                      </div>
                      <p className="text-sm italic">"{offer.suggestedPitch}"</p>
                    </div>
                    {offer.objectionRisks.length > 0 && (
                      <div className="p-2 rounded bg-warning/10 border border-warning/20">
                        <span className="text-xs text-warning font-medium">⚠️ Atenção:</span>
                        <ul className="mt-1">
                          {offer.objectionRisks.map((risk, idx) => (
                            <li key={idx} className="text-xs text-warning/80">• {risk}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>

          {/* Offers to Avoid */}
          {recommendation.avoidOffers.length > 0 && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span className="text-sm font-medium text-destructive">Evitar no Momento</span>
              </div>
              {recommendation.avoidOffers.map((avoid, idx) => (
                <div key={idx} className="text-sm text-destructive/80">• {avoid.title}: {avoid.reason}</div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
