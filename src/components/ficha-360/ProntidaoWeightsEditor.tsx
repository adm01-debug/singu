import { memo } from 'react';
import { Sliders, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useProntidaoWeightsStore } from '@/stores/useProntidaoWeightsStore';
import type { ProntidaoWeights } from '@/lib/prontidaoScore';

const FACTORS: Array<{ key: keyof ProntidaoWeights; label: string }> = [
  { key: 'cadence', label: 'Cadência' },
  { key: 'recency', label: 'Recência' },
  { key: 'sentiment', label: 'Sentimento' },
  { key: 'channel', label: 'Canal preferido' },
];

export const ProntidaoWeightsEditor = memo(() => {
  const weights = useProntidaoWeightsStore((s) => s.weights);
  const setWeight = useProntidaoWeightsStore((s) => s.setWeight);
  const reset = useProntidaoWeightsStore((s) => s.reset);

  const total = weights.cadence + weights.recency + weights.sentiment + weights.channel;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground hover:text-foreground"
          aria-label="Personalizar pesos do score"
          title="Personalizar pesos do score"
        >
          <Sliders className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 space-y-4">
        <div className="space-y-1">
          <h4 className="text-sm font-semibold">Personalizar pesos do score</h4>
          <p className="text-xs text-muted-foreground">
            Ajuste a importância de cada fator. As mudanças aplicam ao vivo.
          </p>
        </div>

        <div className="space-y-4">
          {FACTORS.map(({ key, label }) => (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-foreground">{label}</span>
                <span className="tabular-nums text-muted-foreground">{weights[key]}%</span>
              </div>
              <Slider
                min={0}
                max={60}
                step={5}
                value={[weights[key]]}
                onValueChange={(v) => setWeight(key, v[0] ?? 0)}
                aria-label={`Peso de ${label}`}
              />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-border/60">
          <Badge variant="outline" className="text-[11px] tabular-nums">
            Total: {total}%
          </Badge>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={reset}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Restaurar padrão
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
});
ProntidaoWeightsEditor.displayName = 'ProntidaoWeightsEditor';
