import { cn } from '@/lib/utils';
import { RelationshipStage, RELATIONSHIP_STAGE_LABELS } from '@/types';
import { motion } from 'framer-motion';

const stageColors: Record<RelationshipStage, string> = {
  unknown: 'bg-gray-100 text-gray-600 border-gray-200',
  prospect: 'bg-slate-100 text-slate-600 border-slate-200',
  qualified_lead: 'bg-blue-100 text-blue-600 border-blue-200',
  opportunity: 'bg-indigo-100 text-indigo-600 border-indigo-200',
  negotiation: 'bg-purple-100 text-purple-600 border-purple-200',
  customer: 'bg-green-100 text-green-600 border-green-200',
  loyal_customer: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  advocate: 'bg-teal-100 text-teal-700 border-teal-200',
  at_risk: 'bg-orange-100 text-orange-600 border-orange-200',
  lost: 'bg-red-100 text-red-600 border-red-200',
};

const stageOrder: RelationshipStage[] = [
  'unknown',
  'prospect',
  'qualified_lead',
  'opportunity',
  'negotiation',
  'customer',
  'loyal_customer',
  'advocate',
];

interface RelationshipStageBadgeProps {
  stage: RelationshipStage;
  className?: string;
}

export function RelationshipStageBadge({ stage, className }: RelationshipStageBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border',
        stageColors[stage],
        className
      )}
    >
      {RELATIONSHIP_STAGE_LABELS[stage]}
    </span>
  );
}

interface RelationshipFunnelProps {
  currentStage: RelationshipStage;
  className?: string;
}

export function RelationshipFunnel({ currentStage, className }: RelationshipFunnelProps) {
  const currentIndex = stageOrder.indexOf(currentStage);

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-1">
        {stageOrder.slice(0, 6).map((stage, index) => {
          const isPast = index < currentIndex;
          const isCurrent = stage === currentStage;
          const isFuture = index > currentIndex;

          return (
            <div key={stage} className="flex items-center flex-1">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  'h-2 flex-1 rounded-full transition-colors',
                  isPast && 'bg-success',
                  isCurrent && 'bg-primary',
                  isFuture && 'bg-muted'
                )}
              />
              {index < 5 && (
                <div className={cn(
                  'w-1 h-1 rounded-full mx-0.5',
                  index < currentIndex ? 'bg-success' : 'bg-muted'
                )} />
              )}
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Prospect</span>
        <span>Cliente</span>
        <span>Fiel</span>
      </div>
    </div>
  );
}
