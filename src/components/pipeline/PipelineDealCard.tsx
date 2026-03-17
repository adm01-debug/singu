import { Deal } from '@/hooks/useDeals';
import { cn } from '@/lib/utils';
import { OptimizedAvatar } from '@/components/ui/optimized-avatar';
import { Building2, Calendar, MoreHorizontal, Pencil, Trash2, GripVertical } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

interface PipelineDealCardProps {
  deal: Deal;
  onDragStart: () => void;
  onDragEnd: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const priorityColors: Record<string, string> = {
  high: 'border-l-red-500',
  medium: 'border-l-amber-500',
  low: 'border-l-emerald-500',
};

export function PipelineDealCard({ deal, onDragStart, onDragEnd, onEdit, onDelete }: PipelineDealCardProps) {
  const contactName = deal.contact ? `${deal.contact.first_name} ${deal.contact.last_name}` : null;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={cn(
        'group bg-card rounded-lg border border-border/50 p-3 cursor-grab active:cursor-grabbing',
        'hover:shadow-md hover:border-primary/20 transition-all duration-150',
        'border-l-[3px]',
        priorityColors[deal.priority || 'medium'] || priorityColors.medium
      )}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-foreground truncate">{deal.title}</p>
          <p className="text-primary font-bold text-base mt-0.5">
            R$ {(deal.value || 0).toLocaleString('pt-BR')}
          </p>
        </div>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="w-3.5 h-3.5 text-muted-foreground" />
          <DropdownMenu>
            <DropdownMenuTrigger className="p-1 rounded hover:bg-muted">
              <MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="w-3.5 h-3.5 mr-2" /> Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="w-3.5 h-3.5 mr-2" /> Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Contact & Company */}
      <div className="flex items-center gap-2 mb-2">
        {contactName && (
          <div className="flex items-center gap-1.5 min-w-0">
            <OptimizedAvatar
              src={deal.contact?.avatar_url}
              alt={contactName}
              fallback={contactName.charAt(0)}
              size="xs"
            />
            <span className="text-xs text-muted-foreground truncate">{contactName}</span>
          </div>
        )}
        {deal.company && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground truncate">
            <Building2 className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
            <span className="truncate">{deal.company.name}</span>
          </div>
        )}
      </div>

      {/* Bottom row */}
      <div className="flex items-center justify-between">
        {deal.expected_close_date && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" aria-hidden="true" />
            <span>{format(new Date(deal.expected_close_date), 'dd MMM', { locale: ptBR })}</span>
          </div>
        )}
        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
          {deal.probability}%
        </Badge>
      </div>
    </div>
  );
}
