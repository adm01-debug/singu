import { useMemo } from 'react';
import { Users, TrendingUp, Star, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Contact } from '@/hooks/useContacts';

interface ContactsStatsBarProps {
  contacts: Contact[];
  className?: string;
}

export function ContactsStatsBar({ contacts, className }: ContactsStatsBarProps) {
  const stats = useMemo(() => {
    const total = contacts.length;
    const avgScore = total > 0
      ? Math.round(contacts.reduce((sum, c) => sum + (c.relationship_score || 0), 0) / total)
      : 0;
    const excellent = contacts.filter(c => (c.relationship_score || 0) >= 80).length;
    const needsAttention = contacts.filter(c => {
      const daysSince = Math.floor((Date.now() - new Date(c.updated_at).getTime()) / (1000 * 60 * 60 * 24));
      return daysSince > 30;
    }).length;

    return { total, avgScore, excellent, needsAttention };
  }, [contacts]);

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-success';
    if (score >= 50) return 'text-primary';
    if (score >= 30) return 'text-warning';
    return 'text-destructive';
  };

  const items = [
    {
      icon: Users,
      label: 'Total',
      value: stats.total,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      icon: TrendingUp,
      label: 'Score médio',
      value: stats.avgScore,
      suffix: '/100',
      color: getScoreColor(stats.avgScore),
      bgColor: stats.avgScore >= 70 ? 'bg-success/10' : stats.avgScore >= 50 ? 'bg-primary/10' : 'bg-warning/10',
    },
    {
      icon: Star,
      label: 'Excelentes',
      value: stats.excellent,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      icon: AlertTriangle,
      label: 'Sem contato +30d',
      value: stats.needsAttention,
      color: stats.needsAttention > 0 ? 'text-warning' : 'text-muted-foreground',
      bgColor: stats.needsAttention > 0 ? 'bg-warning/10' : 'bg-muted/50',
    },
  ];

  return (
    <div className={cn(
      'grid grid-cols-2 sm:grid-cols-4 gap-2',
      className
    )}>
      {items.map((item) => (
        <div
          key={item.label}
          className={cn(
            'flex items-center gap-2.5 rounded-lg border border-border/30 px-3 py-2.5',
            'bg-card/40 transition-colors duration-150',
            'hover:bg-muted/30'
          )}
        >
          <item.icon className={cn('w-4 h-4 shrink-0', item.color)} />
          <div className="min-w-0">
            <p className={cn('text-base font-semibold tabular-nums leading-tight', item.color)}>
              {item.value}
              {item.suffix && <span className="text-xs text-muted-foreground font-normal">{item.suffix}</span>}
            </p>
            <p className="text-[10px] text-muted-foreground/70 truncate">{item.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
