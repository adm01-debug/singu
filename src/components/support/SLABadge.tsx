import { Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Props {
  deadline: string | null;
  resolvedAt?: string | null;
  className?: string;
}

/**
 * Visual SLA indicator: green (>2h left), yellow (<2h left), red (overdue), gray (resolved/none).
 */
export function SLABadge({ deadline, resolvedAt, className }: Props) {
  if (!deadline) return null;

  if (resolvedAt) {
    return (
      <Badge variant="outline" className={cn('h-5 text-[10px] gap-1 border-green-500/30 text-green-600', className)}>
        <CheckCircle2 className="h-3 w-3" /> SLA OK
      </Badge>
    );
  }

  const now = Date.now();
  const due = new Date(deadline).getTime();
  const diffMs = due - now;
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffMs < 0) {
    const overdueH = Math.abs(Math.round(diffHours));
    return (
      <Badge variant="outline" className={cn('h-5 text-[10px] gap-1 border-red-500/40 bg-red-500/10 text-red-600', className)}>
        <AlertTriangle className="h-3 w-3" /> SLA vencido {overdueH}h
      </Badge>
    );
  }

  const isWarning = diffHours < 2;
  const label = diffHours < 1
    ? `${Math.round(diffHours * 60)}min`
    : `${Math.round(diffHours)}h`;

  return (
    <Badge
      variant="outline"
      className={cn(
        'h-5 text-[10px] gap-1',
        isWarning
          ? 'border-orange-500/40 bg-orange-500/10 text-orange-600'
          : 'border-blue-500/30 text-blue-600',
        className,
      )}
    >
      <Clock className="h-3 w-3" /> SLA em {label}
    </Badge>
  );
}
