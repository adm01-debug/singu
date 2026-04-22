import { memo } from 'react';
import { Sparkles, RotateCcw, Calendar, Clock, Smile, Radio } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useProntidaoWeightsStore } from '@/stores/useProntidaoWeightsStore';
import type { ProntidaoWeights } from '@/lib/prontidaoScore';

const FACTORS: Array<{
  key: keyof ProntidaoWeights;
  label: string;
  icon: typeof Calendar;
  hint: string;
}> = [
  { key: 'cadence', label: 'Cadência', icon: Calendar, hint: 'Frequência de contato ao longo do tempo' },
  { key: 'recency', label: 'Recência', icon: Clock, hint: 'Quão recente foi a última interação' },
  { key: 'sentiment', label: 'Sentimento', icon: Smile, hint: 'Tom emocional das conversas' },
  { key: 'channel', label: 'Canal preferido', icon: Radio, hint: 'Uso do canal de maior afinidade' },
];

export const ProntidaoDefaultsSection = memo(() => {
  const defaultWeights = useProntidaoWeightsStore((s) => s.defaultWeights);
  const setDefaultWeight = useProntidaoWeightsStore((s) => s.setDefaultWeight);
  const resetDefaults = useProntidaoWeightsStore((s) => s.resetDefaults);

  const total =
    defaultWeights.cadence +
    defaultWeights.recency +
    defaultWeights.sentiment +
    defaultWeights.channel;

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Score de Prontidão
        </CardTitle>
        <CardDescription>
          Estes pesos definem o cálculo do Score de Prontidão para todas as fichas. Você pode
          sobrescrever pontualmente em uma ficha específica usando o ícone de ajuste no card
          de score.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-5">
          {FACTORS.map(({ key, label, icon: Icon, hint }) => (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <Label className="text-sm font-medium">{label}</Label>
                    <p className="text-xs text-muted-foreground truncate">{hint}</p>
                  </div>
                </div>
                <span className="text-sm font-semibold tabular-nums text-foreground w-12 text-right">
                  {defaultWeights[key]}%
                </span>
              </div>
              <Slider
                min={0}
                max={60}
                step={5}
                value={[defaultWeights[key]]}
                onValueChange={(v) => setDefaultWeight(key, v[0] ?? 0)}
                aria-label={`Peso padrão de ${label}`}
              />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border/60">
          <Badge variant="outline" className="text-xs tabular-nums">
            Total: {total}%
          </Badge>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={resetDefaults}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Restaurar padrões
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});
ProntidaoDefaultsSection.displayName = 'ProntidaoDefaultsSection';
