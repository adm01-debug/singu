import { Link } from 'react-router-dom';
import { MapPin, Users, ArrowUpDown, Banknote, Network, Globe } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Company } from '@/hooks/useCompanies';
import { cn } from '@/lib/utils';
import { toTitleCase, formatCapitalSocial, formatCnpj } from '@/lib/formatters';

/** Visual activity pulse indicator based on last interaction days */
function ActivityPulse({ days }: { days: number | null }) {
  if (days === null) {
    return (
      <div className="flex items-center justify-center gap-0.5">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="w-2 h-3 rounded-sm bg-muted/20" />
        ))}
      </div>
    );
  }

  // 4 bars: each represents a "week zone"
  // Week 1 (0-7d), Week 2 (8-14d), Week 3 (15-21d), Week 4+ (22+d)
  const getBarColor = (weekIndex: number) => {
    const threshold = weekIndex * 7;
    if (days <= threshold + 7) {
      if (weekIndex === 0) return 'bg-success';
      if (weekIndex === 1) return 'bg-success/60';
      if (weekIndex === 2) return 'bg-warning/60';
      return 'bg-destructive/60';
    }
    return 'bg-muted/20';
  };

  // Active bars = how many weeks ago the last interaction was
  const activeBars = Math.min(4, Math.max(1, Math.ceil(days / 7)));
  const pulseColor = days <= 7 ? 'text-success' : days <= 14 ? 'text-warning' : 'text-destructive';

  return (
    <div className="flex items-center justify-center gap-0.5" title={`Última interação: ${days}d atrás`}>
      {[0, 1, 2, 3].map(i => (
        <div
          key={i}
          className={cn(
            'w-2 rounded-sm transition-colors',
            i < activeBars ? (
              i === 0 && days <= 7 ? 'bg-success h-4' :
              i <= 1 && days <= 14 ? 'bg-warning h-3' :
              'bg-destructive/60 h-2'
            ) : 'bg-muted/20 h-2'
          )}
        />
      ))}
    </div>
  );
}

interface CompaniesTableViewProps {
  companies: Company[];
  selectionMode: boolean;
  selectedIds: Set<string>;
  onSelect: (id: string, selected: boolean) => void;
  contactCountMap: Map<string, number>;
  lastInteractionMap: Map<string, number>;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSortChange: (field: string) => void;
}

const healthLabel: Record<string, { label: string; className: string }> = {
  excellent: { label: 'Excelente', className: 'text-success' },
  good: { label: 'Boa', className: 'text-success' },
  average: { label: 'Regular', className: 'text-warning' },
  poor: { label: 'Ruim', className: 'text-destructive' },
};

export function CompaniesTableView({
  companies,
  selectionMode,
  selectedIds,
  onSelect,
  contactCountMap,
  lastInteractionMap,
  sortBy,
  sortOrder,
  onSortChange,
}: CompaniesTableViewProps) {
  const SortButton = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <button
      onClick={() => onSortChange(field)}
      className="flex items-center gap-1 hover:text-foreground transition-colors"
    >
      {children}
      <ArrowUpDown className={cn('w-3 h-3', sortBy === field ? 'text-primary' : 'text-muted-foreground/50')} />
    </button>
  );

  return (
    <div className="border border-border/60 rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-border/40">
            {selectionMode && <TableHead className="w-10" />}
            <TableHead><SortButton field="name">EMPRESA</SortButton></TableHead>
            <TableHead className="hidden md:table-cell">SEGMENTO</TableHead>
            <TableHead className="hidden lg:table-cell">LOCALIZAÇÃO</TableHead>
            <TableHead className="hidden md:table-cell text-center">CONTATOS</TableHead>
            <TableHead className="hidden xl:table-cell">CAPITAL</TableHead>
            <TableHead className="hidden xl:table-cell">GRUPO</TableHead>
            <TableHead className="hidden lg:table-cell">SAÚDE</TableHead>
            <TableHead className="hidden md:table-cell text-center">PULSO</TableHead>
            <TableHead><SortButton field="updated_at">ATUALIZAÇÃO</SortButton></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {companies.map((company) => {
            const count = contactCountMap.get(company.id) || 0;
            const health = healthLabel[company.financial_health || ''];
            const location = [company.city, company.state].filter(Boolean).join(', ');
            const capital = formatCapitalSocial(company.capital_social);
            const cnpjFormatted = formatCnpj(company.cnpj);
            
            return (
              <TableRow
                key={company.id}
                className={cn(
                  'group cursor-pointer border-border/30 hover:bg-muted/20',
                  selectedIds.has(company.id) && 'bg-primary/5'
                )}
              >
                {selectionMode && (
                  <TableCell className="w-10">
                    <Checkbox
                      checked={selectedIds.has(company.id)}
                      onCheckedChange={(c) => onSelect(company.id, c as boolean)}
                    />
                  </TableCell>
                )}
                <TableCell>
                  <Link to={`/empresas/${company.id}`} className="flex items-center gap-3 min-w-0">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-lg bg-muted/40 flex items-center justify-center text-xs font-semibold text-muted-foreground shrink-0">
                        {company.logo_url ? (
                          <img src={company.logo_url} alt="" className="w-8 h-8 rounded-lg object-cover" />
                        ) : (
                          ((company.name || 'E').replace(/^\d+\s*[-–—]\s*/, '')[0] || 'E').toUpperCase()
                        )}
                      </div>
                      {/* RF Status dot */}
                      {company.situacao_rf && (
                        <span className={cn(
                          'absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-background',
                          company.situacao_rf.toUpperCase() === 'ATIVA' ? 'bg-success' : 'bg-destructive'
                        )} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
                        {toTitleCase(company.name)}
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[9px] font-semibold',
                            company.is_customer
                              ? 'border-success/40 text-success bg-success/10'
                              : 'border-primary/40 text-primary bg-primary/10'
                          )}
                        >
                          {company.is_customer ? 'Cliente' : 'Prospect'}
                        </Badge>
                        {cnpjFormatted && (
                          <span className="text-[10px] text-muted-foreground/50 tabular-nums hidden xl:inline">
                            {cnpjFormatted}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                  {company.industry || company.nicho_cliente || '—'}
                </TableCell>
                <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                  {location ? (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3" />
                      {location}
                    </span>
                  ) : '—'}
                </TableCell>
                <TableCell className="hidden md:table-cell text-center">
                  <span className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                    <Users className="w-3 h-3" />
                    {count}
                  </span>
                </TableCell>
                <TableCell className="hidden xl:table-cell text-sm text-muted-foreground">
                  {capital ? (
                    <span className="flex items-center gap-1 tabular-nums">
                      <Banknote className="w-3 h-3" />
                      {capital}
                    </span>
                  ) : '—'}
                </TableCell>
                <TableCell className="hidden xl:table-cell text-sm text-muted-foreground">
                  {company.grupo_economico ? (
                    <span className="flex items-center gap-1 max-w-[140px] truncate">
                      <Network className="w-3 h-3 shrink-0" />
                      {company.grupo_economico}
                    </span>
                  ) : '—'}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {health ? (
                    <span className={cn('text-sm font-medium', health.className)}>{health.label}</span>
                  ) : (
                    <span className="text-sm text-muted-foreground/50">—</span>
                  )}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <ActivityPulse days={lastInteractionMap.get(company.id) ?? null} />
                </TableCell>
                <TableCell className="text-xs text-muted-foreground tabular-nums">
                  {formatDistanceToNow(new Date(company.updated_at), { locale: ptBR, addSuffix: true })}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
