import { motion, AnimatePresence } from 'framer-motion';
import { Deal, PIPELINE_STAGES } from '@/hooks/useDeals';
import { PipelineDealCard } from './PipelineDealCard';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PipelineColumnProps {
  stageId: string;
  deals: Deal[];
  onDragStart: (dealId: string) => void;
  onDragEnd: () => void;
  onDrop: (stageId: string) => void;
  isDragOver: boolean;
  onDragOver: (stageId: string) => void;
  onEditDeal: (deal: Deal) => void;
  onDeleteDeal: (id: string) => void;
}

export function PipelineColumn({
  stageId,
  deals,
  onDragStart,
  onDragEnd,
  onDrop,
  isDragOver,
  onDragOver,
  onEditDeal,
  onDeleteDeal,
}: PipelineColumnProps) {
  const stage = PIPELINE_STAGES.find(s => s.id === stageId)!;
  const totalValue = deals.reduce((sum, d) => sum + (d.value || 0), 0);
  const weightedValue = deals.reduce((sum, d) => sum + (d.value || 0) * ((d.probability || 0) / 100), 0);

  return (
    <div
      className={cn(
        'flex flex-col min-w-[280px] max-w-[320px] rounded-xl transition-all duration-200',
        'bg-surface-1 border border-border/50',
        isDragOver && 'ring-2 ring-primary/50 bg-primary/5 scale-[1.01]'
      )}
      onDragOver={(e) => { e.preventDefault(); onDragOver(stageId); }}
      onDragLeave={() => onDragOver('')}
      onDrop={(e) => { e.preventDefault(); onDrop(stageId); }}
    >
      {/* Header */}
      <div className="p-3 border-b border-border/30">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
            <h3 className="font-semibold text-sm text-foreground">{stage.label}</h3>
          </div>
          <Badge variant="secondary" className="text-xs font-mono">
            {deals.length}
          </Badge>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Total: R$ {totalValue.toLocaleString('pt-BR')}</span>
          <span className="text-primary font-medium">
            Pond: R$ {weightedValue.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
          </span>
        </div>
      </div>

      {/* Cards */}
      <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-300px)] min-h-[100px]">
        <AnimatePresence mode="popLayout">
          {deals.map((deal) => (
            <motion.div
              key={deal.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <PipelineDealCard
                deal={deal}
                onDragStart={() => onDragStart(deal.id)}
                onDragEnd={onDragEnd}
                onEdit={() => onEditDeal(deal)}
                onDelete={() => onDeleteDeal(deal.id)}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {deals.length === 0 && (
          <div className="flex items-center justify-center h-20 text-xs text-muted-foreground/50 border border-dashed border-border/30 rounded-lg">
            Arraste deals aqui
          </div>
        )}
      </div>
    </div>
  );
}
