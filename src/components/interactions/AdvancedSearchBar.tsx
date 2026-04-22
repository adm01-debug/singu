import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search, X, User, Building2, Check, Sigma,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import type { AdvancedFilters } from '@/hooks/useInteractionsAdvancedFilter';
import { InteracoesPresetsMenu } from './InteracoesPresetsMenu';
import { CanaisQuickFilter } from './CanaisQuickFilter';
import { DirecaoQuickFilter } from './DirecaoQuickFilter';
import { SortChips } from './SortChips';
import { DateRangePopover } from './DateRangePopover';
import { ViewModeChips } from './ViewModeChips';

interface ContactOption { id: string; label: string }
interface CompanyOption { id: string; label: string }

interface Props {
  filters: AdvancedFilters;
  setFilter: <K extends keyof AdvancedFilters>(key: K, value: AdvancedFilters[K]) => void;
  clear: () => void;
  activeCount: number;
  contacts: ContactOption[];
  companies: CompanyOption[];
  resultsCount: number;
  totalCount: number;
  applyAll?: (next: Partial<AdvancedFilters>) => void;
  applyDateRange: (de?: Date, ate?: Date) => boolean;
  channelCounts?: Record<string, number>;
}

export const AdvancedSearchBar = React.memo(function AdvancedSearchBar({
  filters, setFilter, clear, activeCount, contacts, companies, resultsCount, totalCount, applyAll, applyDateRange, channelCounts,
}: Props) {
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = () => {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    };
    const caretEndHandler = () => {
      const el = searchInputRef.current;
      if (!el) return;
      const len = el.value?.length ?? 0;
      el.focus({ preventScroll: true });
      try { el.setSelectionRange(len, len); } catch { /* noop */ }
    };
    window.addEventListener('focus-interactions-search', handler);
    window.addEventListener('focus-interactions-search-caret-end', caretEndHandler);
    return () => {
      window.removeEventListener('focus-interactions-search', handler);
      window.removeEventListener('focus-interactions-search-caret-end', caretEndHandler);
    };
  }, []);

  const selectedContact = useMemo(
    () => contacts.find(c => c.id === filters.contact),
    [contacts, filters.contact]
  );
  const selectedCompany = useMemo(
    () => companies.find(c => c.id === filters.company),
    [companies, filters.company]
  );

  return (
    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/60 pb-3 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[260px] max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            data-interacoes-search
            placeholder="Buscar palavra-chave em título, conteúdo ou tags..."
            value={filters.q}
            onChange={(e) => setFilter('q', e.target.value)}
            className={cn('pl-10', filters.q && 'pr-10')}
          />
          {filters.q && (
            <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setFilter('q', '')}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <CanaisQuickFilter
          canais={filters.canais}
          onChange={(next) => setFilter('canais', next)}
          counts={channelCounts}
        />

        <ChannelsTotalBadge counts={channelCounts} />

        <DirecaoQuickFilter
          value={filters.direcao}
          onChange={(v) => setFilter('direcao', v)}
        />

        <EntityPicker
          icon={User}
          placeholder="Pessoa"
          options={contacts}
          selected={selectedContact}
          onSelect={(id) => setFilter('contact', id)}
        />

        <EntityPicker
          icon={Building2}
          placeholder="Empresa"
          options={companies}
          selected={selectedCompany}
          onSelect={(id) => setFilter('company', id)}
        />

        <DateRangePopover de={filters.de} ate={filters.ate} applyDateRange={applyDateRange} />

        <SortChips
          value={filters.sort}
          onChange={(v) => setFilter('sort', v)}
          hasQuery={!!filters.q.trim()}
          channelCounts={channelCounts}
        />

        <ViewModeChips
          value={filters.view}
          onChange={(v) => setFilter('view', v)}
        />

        <InteracoesPresetsMenu
          filters={filters}
          setFilter={setFilter}
          clear={clear}
          activeCount={activeCount}
          onApplyAll={applyAll}
        />

        {activeCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clear} className="gap-1 text-muted-foreground">
            <X className="w-4 h-4" /> Limpar tudo
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <div className="ml-auto text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{resultsCount}</span> de {totalCount} interações
          {activeCount > 0 && <> · <span className="text-primary">{activeCount} filtro{activeCount > 1 ? 's' : ''} ativo{activeCount > 1 ? 's' : ''}</span></>}
        </div>
      </div>
    </div>
  );
});

/**
 * Total geral de interações no escopo atual (somatório dos canais visíveis).
 * Fica visível ao lado do seletor de canais para o usuário ter o "tamanho do
 * universo filtrado" sem precisar recorrer aos chips de busca avançada.
 */
function ChannelsTotalBadge({ counts }: { counts?: Record<string, number> }) {
  const { total, channelsCount } = useMemo(() => {
    if (!counts) return { total: 0, channelsCount: 0 };
    const values = Object.values(counts);
    return {
      total: values.reduce((acc, n) => acc + (Number.isFinite(n) ? n : 0), 0),
      channelsCount: values.filter((n) => n > 0).length,
    };
  }, [counts]);

  if (!counts || total === 0) return null;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            role="status"
            aria-label={`Total de ${total} interações no escopo atual`}
            className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-border bg-muted/40 text-xs text-muted-foreground"
          >
            <Sigma className="w-3.5 h-3.5" />
            <span className="tabular-nums font-semibold text-foreground">{total}</span>
            <span className="hidden sm:inline">interaç{total === 1 ? 'ão' : 'ões'}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[260px] text-xs">
          Somatório dos canais no escopo atual ({channelsCount} cana{channelsCount === 1 ? 'l' : 'is'} com interações).
          Atualiza conforme você ajusta busca, pessoa, empresa, período ou sentimento.
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface EntityPickerProps {
  icon: typeof User;
  placeholder: string;
  options: { id: string; label: string }[];
  selected?: { id: string; label: string };
  onSelect: (id: string) => void;
}

function EntityPicker({ icon: Icon, placeholder, options, selected, onSelect }: EntityPickerProps) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className={cn('justify-start gap-2 max-w-[200px]', !selected && 'text-muted-foreground')}>
          <Icon className="w-4 h-4 shrink-0" />
          <span className="truncate">{selected?.label ?? placeholder}</span>
          {selected && (
            <X
              className="w-3.5 h-3.5 ml-1 shrink-0 opacity-60 hover:opacity-100"
              onClick={(e) => { e.stopPropagation(); onSelect(''); }}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[260px] p-0" align="start">
        <Command>
          <CommandInput placeholder={`Buscar ${placeholder.toLowerCase()}...`} />
          <CommandList>
            <CommandEmpty>Nenhum resultado.</CommandEmpty>
            <CommandGroup>
              {options.slice(0, 100).map(opt => (
                <CommandItem
                  key={opt.id}
                  value={opt.label}
                  onSelect={() => { onSelect(opt.id); setOpen(false); }}
                >
                  <Check className={cn('mr-2 h-4 w-4', selected?.id === opt.id ? 'opacity-100' : 'opacity-0')} />
                  <span className="truncate">{opt.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
