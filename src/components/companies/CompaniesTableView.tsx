import { Link } from 'react-router-dom';
import { Building2, MapPin, Users, ArrowUpDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
import { toTitleCase } from '@/lib/formatters';

interface CompaniesTableViewProps {
  companies: Company[];
  selectionMode: boolean;
  selectedIds: Set<string>;
  onSelect: (id: string, selected: boolean) => void;
  contactCountMap: Map<string, number>;
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
            <TableHead className="hidden lg:table-cell">SAÚDE</TableHead>
            <TableHead><SortButton field="updated_at">ATUALIZAÇÃO</SortButton></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {companies.map((company) => {
            const count = contactCountMap.get(company.id) || 0;
            const health = healthLabel[company.financial_health || ''];
            const location = [company.city, company.state].filter(Boolean).join(', ');
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
                    <div className="w-8 h-8 rounded-lg bg-muted/40 flex items-center justify-center text-xs font-semibold text-muted-foreground shrink-0">
                      {company.logo_url ? (
                        <img src={company.logo_url} alt="" className="w-8 h-8 rounded-lg object-cover" />
                      ) : (
                        (company.name || 'E')[0].toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
                        {toTitleCase(company.name)}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[9px] font-semibold mt-0.5',
                          company.is_customer
                            ? 'border-success/40 text-success bg-success/10'
                            : 'border-primary/40 text-primary bg-primary/10'
                        )}
                      >
                        {company.is_customer ? 'Cliente' : 'Prospect'}
                      </Badge>
                    </div>
                  </Link>
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                  {company.industry || '—'}
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
                <TableCell className="hidden lg:table-cell">
                  {health ? (
                    <span className={cn('text-sm font-medium', health.className)}>{health.label}</span>
                  ) : (
                    <span className="text-sm text-muted-foreground/50">—</span>
                  )}
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
