import React, { useState, useMemo, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Search, X, Calendar as CalendarIcon, User, Building2, Check,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import type { AdvancedFilters } from '@/hooks/useInteractionsAdvancedFilter';
import { InteracoesPresetsMenu } from './InteracoesPresetsMenu';
import { CanaisQuickFilter } from './CanaisQuickFilter';
import { DirecaoQuickFilter } from './DirecaoQuickFilter';
import { SortSelect } from './SortSelect';

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
}

export const AdvancedSearchBar = React.memo(function AdvancedSearchBar({
  filters, setFilter, clear, activeCount, contacts, companies, resultsCount, totalCount, applyAll,
}: Props) {
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = () => {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    };
    window.addEventListener('focus-interactions-search', handler);
    return () => window.removeEventListener('focus-interactions-search', handler);
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
        />

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

        <DatePopover label="De" value={filters.de} onChange={(d) => setFilter('de', d)} />
        <DatePopover label="Até" value={filters.ate} onChange={(d) => setFilter('ate', d)} />

        <SortSelect
          value={filters.sort}
          onChange={(v) => setFilter('sort', v)}
          hasQuery={!!filters.q.trim()}
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

function DatePopover({ label, value, onChange }: { label: string; value?: Date; onChange: (d?: Date) => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className={cn('justify-start gap-2', !value && 'text-muted-foreground')}>
          <CalendarIcon className="w-4 h-4" />
          {value ? format(value, "dd MMM yy", { locale: ptBR }) : label}
          {value && (
            <X
              className="w-3.5 h-3.5 ml-1 opacity-60 hover:opacity-100"
              onClick={(e) => { e.stopPropagation(); onChange(undefined); }}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={value} onSelect={onChange} initialFocus className={cn('p-3 pointer-events-auto')} />
      </PopoverContent>
    </Popover>
  );
}
