import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  ChevronRight,
  UserCheck,
  UserX,
  Minus,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Slider } from '@/components/ui/slider';
import type { SimulatedChange } from '@/hooks/useStakeholderSimulator';
import type { StakeholderData } from '@/hooks/useStakeholderAnalysis';

const SUPPORT_LABELS: Record<number, { label: string; color: string; icon: typeof UserCheck }> = {
  5: { label: 'Champion', color: 'text-success', icon: UserCheck },
  4: { label: 'Forte Apoiador', color: 'text-success', icon: TrendingUp },
  3: { label: 'Apoiador', color: 'text-success', icon: TrendingUp },
  2: { label: 'Apoiador Leve', color: 'text-success/70', icon: TrendingUp },
  1: { label: 'Levemente Positivo', color: 'text-muted-foreground', icon: Minus },
  0: { label: 'Neutro', color: 'text-muted-foreground', icon: Minus },
  [-1]: { label: 'Levemente Negativo', color: 'text-muted-foreground', icon: Minus },
  [-2]: { label: 'Cético', color: 'text-warning', icon: TrendingDown },
  [-3]: { label: 'Opositor', color: 'text-destructive/70', icon: TrendingDown },
  [-4]: { label: 'Forte Opositor', color: 'text-destructive', icon: UserX },
  [-5]: { label: 'Bloqueador', color: 'text-destructive', icon: UserX },
};

export function getSupportLabel(support: number) {
  return SUPPORT_LABELS[support] || SUPPORT_LABELS[0];
}

export function StakeholderSelector({
  stakeholder,
  isSelected,
  currentChange,
  onSelect,
  onChangeSupport,
}: {
  stakeholder: StakeholderData;
  isSelected: boolean;
  currentChange?: SimulatedChange;
  onSelect: () => void;
  onChangeSupport: (support: number) => void;
}) {
  const currentSupport = currentChange?.newMetrics.support ?? stakeholder.metrics.support;
  const supportLabel = getSupportLabel(currentSupport);
  const originalLabel = getSupportLabel(stakeholder.metrics.support);
  const hasChanged = currentChange !== undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-3 rounded-lg border-2 transition-all ${
        isSelected
          ? 'border-primary bg-primary/5'
          : hasChanged
            ? 'border-warning/50 bg-warning/5'
            : 'border-border hover:border-primary/50'
      }`}
    >
      <div className="flex items-center gap-3 mb-2">
        <Avatar className="w-8 h-8">
          <AvatarImage src={stakeholder.contact.avatar_url || undefined} />
          <AvatarFallback className="text-xs bg-muted">
            {(stakeholder.contact.first_name || '?')[0]}{(stakeholder.contact.last_name || '?')[0]}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">
            {stakeholder.contact.first_name} {stakeholder.contact.last_name}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {stakeholder.contact.role_title}
          </p>
        </div>
        <Button
          size="sm"
          variant={isSelected ? "default" : "outline"}
          onClick={onSelect}
        >
          {isSelected ? 'Selecionado' : 'Simular'}
        </Button>
      </div>

      {isSelected && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="pt-3 border-t"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Suporte</span>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={originalLabel.color}>
                {stakeholder.metrics.support > 0 ? '+' : ''}{stakeholder.metrics.support}
              </Badge>
              {hasChanged && (
                <>
                  <ChevronRight className="w-3 h-3 text-muted-foreground" />
                  <Badge className={`${supportLabel.color} bg-opacity-20`}>
                    {currentSupport > 0 ? '+' : ''}{currentSupport}
                  </Badge>
                </>
              )}
            </div>
          </div>

          <Slider
            value={[currentSupport]}
            min={-5}
            max={5}
            step={1}
            onValueChange={([value]) => onChangeSupport(value)}
            className="mb-2"
          />

          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Bloqueador</span>
            <span>Neutro</span>
            <span>Champion</span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
