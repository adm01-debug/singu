import { memo, useEffect, useState } from 'react';
import { Sliders, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  useProntidaoWeightsStore,
  useEffectiveProntidaoWeights,
} from '@/stores/useProntidaoWeightsStore';
import type { ProntidaoWeights } from '@/lib/prontidaoScore';

const FACTORS: Array<{ key: keyof ProntidaoWeights; label: string }> = [
  { key: 'cadence', label: 'Cadência' },
  { key: 'recency', label: 'Recência' },
  { key: 'sentiment', label: 'Sentimento' },
  { key: 'channel', label: 'Canal preferido' },
];

type Scope = 'global' | 'local';

interface Props {
  contactId?: string;
}

export const ProntidaoWeightsEditor = memo(({ contactId }: Props) => {
  const setDefaultWeight = useProntidaoWeightsStore((s) => s.setDefaultWeight);
  const setSessionOverrideWeight = useProntidaoWeightsStore((s) => s.setSessionOverrideWeight);
  const clearSessionOverride = useProntidaoWeightsStore((s) => s.clearSessionOverride);
  const resetDefaults = useProntidaoWeightsStore((s) => s.resetDefaults);
  const sessionOverride = useProntidaoWeightsStore((s) => s.sessionOverride);

  const hasOverrideForContact =
    !!contactId && sessionOverride?.contactId === contactId;

  const [scope, setScope] = useState<Scope>(hasOverrideForContact ? 'local' : 'global');

  // Atualiza escopo quando troca de contato
  useEffect(() => {
    setScope(hasOverrideForContact ? 'local' : 'global');
  }, [contactId, hasOverrideForContact]);

  // Pesos exibidos: efetivos para o contato (override se existir, senão padrão)
  const displayedWeights = useEffectiveProntidaoWeights(contactId);
  const total =
    displayedWeights.cadence +
    displayedWeights.recency +
    displayedWeights.sentiment +
    displayedWeights.channel;

  const localDisabled = !contactId;

  const handleChange = (key: keyof ProntidaoWeights, value: number) => {
    if (scope === 'local' && contactId) {
      setSessionOverrideWeight(contactId, key, value);
    } else {
      setDefaultWeight(key, value);
    }
  };

  const handleReset = () => {
    if (scope === 'local') clearSessionOverride();
    else resetDefaults();
  };

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

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Escopo do ajuste</Label>
          <RadioGroup
            value={scope}
            onValueChange={(v) => setScope(v as Scope)}
            aria-label="Escopo dos pesos"
            className="gap-1.5"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="global" id="scope-global" />
              <Label htmlFor="scope-global" className="text-xs font-normal cursor-pointer">
                Aplicar a todas as fichas
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="local" id="scope-local" disabled={localDisabled} />
              <Label
                htmlFor="scope-local"
                className={`text-xs font-normal ${localDisabled ? 'opacity-50' : 'cursor-pointer'}`}
              >
                Apenas nesta tela
              </Label>
            </div>
          </RadioGroup>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            O padrão vale para todas as fichas. O override desta tela é temporário e termina ao
            trocar de contato.
          </p>
        </div>

        <div className="space-y-4 pt-1 border-t border-border/60">
          {FACTORS.map(({ key, label }) => (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-foreground">{label}</span>
                <span className="tabular-nums text-muted-foreground">{displayedWeights[key]}%</span>
              </div>
              <Slider
                min={0}
                max={60}
                step={5}
                value={[displayedWeights[key]]}
                onValueChange={(v) => handleChange(key, v[0] ?? 0)}
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
            onClick={handleReset}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {scope === 'local' ? 'Limpar override' : 'Restaurar padrão'}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
});
ProntidaoWeightsEditor.displayName = 'ProntidaoWeightsEditor';
