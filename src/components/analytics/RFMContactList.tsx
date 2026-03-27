import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Search,
  ChevronRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { RFM_SEGMENTS, RFMSegment, RFMContactSummary } from '@/types/rfm';
import { SEGMENT_ICONS } from './RFMConstants';

function PriorityBadge({ priority }: { priority: string }) {
  const config: Record<string, { color: string; label: string }> = {
    urgent: { color: 'bg-red-100 text-red-700', label: 'Urgente' },
    high: { color: 'bg-orange-100 text-orange-700', label: 'Alta' },
    medium: { color: 'bg-blue-100 text-blue-700', label: 'Média' },
    low: { color: 'bg-gray-100 text-gray-700', label: 'Baixa' }
  };

  const cfg = config[priority] || config.medium;

  return (
    <Badge className={`${cfg.color} border-0`}>
      {cfg.label}
    </Badge>
  );
}

function ContactRFMCard({ summary }: { summary: RFMContactSummary }) {
  const rfm = summary.rfmAnalysis;
  if (!rfm) return null;

  const segment = RFM_SEGMENTS[rfm.segment];

  return (
    <Link to={`/contatos/${summary.contactId}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              {summary.avatarUrl ? (
                <img
                  src={summary.avatarUrl}
                  alt={summary.contactName}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <span className="text-lg font-medium">
                  {summary.contactName.charAt(0)}
                </span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{summary.contactName}</div>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={`${segment.bgColor} ${segment.color} border-0`}>
                  {SEGMENT_ICONS[rfm.segment]}
                  <span className="ml-1">{segment.name}</span>
                </Badge>
                <span className="text-xs text-muted-foreground">
                  R$ {rfm.totalMonetaryValue.toLocaleString('pt-BR')}
                </span>
              </div>
            </div>

            {/* RFM Scores */}
            <div className="flex gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground">R</div>
                      <div className="font-bold">{rfm.recencyScore}</div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Recência</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground">F</div>
                      <div className="font-bold">{rfm.frequencyScore}</div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Frequência</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground">M</div>
                      <div className="font-bold">{rfm.monetaryScore}</div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Monetário</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Priority */}
            <div>
              <PriorityBadge priority={rfm.communicationPriority} />
            </div>

            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

interface RFMContactListProps {
  filteredContacts: RFMContactSummary[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  segmentFilter: string;
  onSegmentFilterChange: (value: string) => void;
  priorityFilter: string;
  onPriorityFilterChange: (value: string) => void;
}

export function RFMContactList({
  filteredContacts,
  searchTerm,
  onSearchChange,
  segmentFilter,
  onSegmentFilterChange,
  priorityFilter,
  onPriorityFilterChange,
}: RFMContactListProps) {
  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar contatos..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={segmentFilter} onValueChange={onSegmentFilterChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Segmento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Segmentos</SelectItem>
            {Object.entries(RFM_SEGMENTS).map(([key, seg]) => (
              <SelectItem key={key} value={key}>{seg.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={onPriorityFilterChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Prioridade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Prioridades</SelectItem>
            <SelectItem value="urgent">Urgente</SelectItem>
            <SelectItem value="high">Alta</SelectItem>
            <SelectItem value="medium">Média</SelectItem>
            <SelectItem value="low">Baixa</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Contacts List */}
      <ScrollArea className="h-[600px]">
        <div className="space-y-3">
          {filteredContacts.map(summary => (
            <ContactRFMCard key={summary.contactId} summary={summary} />
          ))}
          {filteredContacts.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              Nenhum contato encontrado com os filtros aplicados
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
