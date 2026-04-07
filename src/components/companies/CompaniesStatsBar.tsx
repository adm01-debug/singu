import { useMemo } from 'react';
import { Building2, Users, CheckCircle2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Company } from '@/hooks/useCompanies';

interface CompaniesStatsBarProps {
  companies: Company[];
  contactCountMap?: Map<string, number>;
  className?: string;
}

export function CompaniesStatsBar({ companies, contactCountMap, className }: CompaniesStatsBarProps) {
  const stats = useMemo(() => {
    const total = companies.length;
    const customers = companies.filter(c => c.is_customer).length;
    const totalContacts = contactCountMap
      ? Array.from(contactCountMap.values()).reduce((sum, v) => sum + v, 0)
      : 0;
    const needsAttention = companies.filter(c => {
      const daysSince = Math.floor((Date.now() - new Date(c.updated_at).getTime()) / (1000 * 60 * 60 * 24));
      return daysSince > 30;
    }).length;

    return { total, customers, totalContacts, needsAttention };
  }, [companies, contactCountMap]);

  const items = [
    {
      icon: Building2,
      label: 'Total',
      value: stats.total,
      color: 'text-primary',
    },
    {
      icon: CheckCircle2,
      label: 'Clientes',
      value: stats.customers,
      color: 'text-success',
    },
    {
      icon: Users,
      label: 'Contatos',
      value: stats.totalContacts,
      color: 'text-info',
    },
    {
      icon: AlertTriangle,
      label: 'Sem contato +30d',
      value: stats.needsAttention,
      color: stats.needsAttention > 0 ? 'text-warning' : 'text-muted-foreground',
    },
  ];

  return (
    <div className={cn('grid grid-cols-2 sm:grid-cols-4 gap-2', className)}>
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
            </p>
            <p className="text-[10px] text-muted-foreground/70 truncate">{item.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
