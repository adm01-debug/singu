import React from 'react';
import { ArrowUpDown } from 'lucide-react';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import type { SortKey } from '@/lib/sortInteractions';

interface Props {
  value: SortKey;
  onChange: (value: SortKey) => void;
  hasQuery: boolean;
}

export const SortSelect = React.memo(function SortSelect({ value, onChange, hasQuery }: Props) {
  const effective: SortKey = value === 'relevance' && !hasQuery ? 'recent' : value;
  return (
    <Select value={effective} onValueChange={(v) => onChange(v as SortKey)}>
      <SelectTrigger className="h-9 w-auto gap-2 px-3 text-sm" aria-label="Ordenar lista">
        <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
        <span className="hidden sm:inline">
          <SelectValue />
        </span>
      </SelectTrigger>
      <SelectContent align="end">
        <SelectItem value="recent">Mais recentes</SelectItem>
        <SelectItem value="oldest">Mais antigas</SelectItem>
        <SelectItem
          value="relevance"
          disabled={!hasQuery}
          title={!hasQuery ? 'Disponível ao buscar por palavra-chave' : undefined}
        >
          Melhor correspondência
        </SelectItem>
        <SelectItem value="entity">Por pessoa/empresa</SelectItem>
      </SelectContent>
    </Select>
  );
});
