import React, { useState, useMemo } from 'react';
import { Bookmark, BookmarkPlus, Trash2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useSearchPresets } from '@/hooks/useSearchPresets';
import { toast } from 'sonner';
import type { AdvancedFilters } from '@/hooks/useInteractionsAdvancedFilter';

interface Props {
  filters: AdvancedFilters;
  setFilter: <K extends keyof AdvancedFilters>(key: K, value: AdvancedFilters[K]) => void;
  clear: () => void;
  activeCount: number;
}

interface SerializedPayload {
  q: string;
  contact: string;
  company: string;
  canais: string[];
  de?: string;
  ate?: string;
}

function summarize(p: SerializedPayload): string {
  const parts: string[] = [];
  if (p.q) parts.push(`"${p.q.slice(0, 20)}"`);
  if (Array.isArray(p.canais) && p.canais.length > 0) {
    parts.push(`${p.canais.length} canal${p.canais.length > 1 ? 'is' : ''}`);
  }
  if (p.contact) parts.push('pessoa');
  if (p.company) parts.push('empresa');
  if (p.de || p.ate) parts.push('data');
  return parts.join(' · ') || 'sem filtros';
}

function parseDate(iso?: string): Date | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? undefined : d;
}

export const InteracoesPresetsMenu = React.memo(function InteracoesPresetsMenu({
  filters, setFilter, clear, activeCount,
}: Props) {
  const { presets, savePreset, deletePreset } = useSearchPresets('interactions');
  const [isNaming, setIsNaming] = useState(false);
  const [name, setName] = useState('');
  const [open, setOpen] = useState(false);

  const currentPayload: SerializedPayload = useMemo(() => ({
    q: filters.q,
    contact: filters.contact,
    company: filters.company,
    canais: Array.isArray(filters.canais) ? filters.canais : [],
    de: filters.de?.toISOString(),
    ate: filters.ate?.toISOString(),
  }), [filters]);

  const handleSave = () => {
    const trimmed = name.trim().slice(0, 60);
    if (!trimmed) return;
    // Reusa estrutura do hook genérico: armazenamos payload em `filters` como Record<string,string[]>-like via cast
    savePreset({
      name: trimmed,
      filters: {
        q: currentPayload.q ? [currentPayload.q] : [],
        contact: currentPayload.contact ? [currentPayload.contact] : [],
        company: currentPayload.company ? [currentPayload.company] : [],
        canais: currentPayload.canais,
        de: currentPayload.de ? [currentPayload.de] : [],
        ate: currentPayload.ate ? [currentPayload.ate] : [],
      },
      sortBy: '',
      sortOrder: 'desc',
    });
    setName('');
    setIsNaming(false);
    toast.success('Busca salva!');
  };

  const applyPreset = (presetFilters: Record<string, string[]>) => {
    clear();
    const payload: SerializedPayload = {
      q: presetFilters.q?.[0] ?? '',
      contact: presetFilters.contact?.[0] ?? '',
      company: presetFilters.company?.[0] ?? '',
      canais: Array.isArray(presetFilters.canais) ? presetFilters.canais : [],
      de: presetFilters.de?.[0],
      ate: presetFilters.ate?.[0],
    };
    setFilter('q', payload.q);
    setFilter('contact', payload.contact);
    setFilter('company', payload.company);
    setFilter('canais', payload.canais);
    setFilter('de', parseDate(payload.de));
    setFilter('ate', parseDate(payload.ate));
    setOpen(false);
    toast.success('Busca aplicada');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5" aria-label="Buscas salvas">
          <Bookmark className="w-4 h-4" />
          <span className="hidden sm:inline">Buscas</span>
          {presets.length > 0 && (
            <span className="text-xs bg-primary/10 text-primary rounded-full px-1.5">
              {presets.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-3 border-b border-border">
          <h4 className="font-medium text-sm text-foreground">Buscas salvas</h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            Salve combinações de filtros para reutilizar depois
          </p>
        </div>

        {presets.length > 0 && (
          <div className="max-h-64 overflow-y-auto divide-y divide-border">
            {presets.map(preset => {
              const payload: SerializedPayload = {
                q: preset.filters.q?.[0] ?? '',
                contact: preset.filters.contact?.[0] ?? '',
                company: preset.filters.company?.[0] ?? '',
                canais: Array.isArray(preset.filters.canais) ? preset.filters.canais : [],
                de: preset.filters.de?.[0],
                ate: preset.filters.ate?.[0],
              };
              return (
                <div
                  key={preset.id}
                  className="flex items-center justify-between p-2.5 hover:bg-muted/50 cursor-pointer group"
                  onClick={() => applyPreset(preset.filters)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{preset.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{summarize(payload)}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      deletePreset(preset.id);
                      toast('Busca removida');
                    }}
                  >
                    <Trash2 className="w-3 h-3 text-muted-foreground" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {presets.length === 0 && !isNaming && (
          <div className="p-4 text-center text-muted-foreground">
            <Bookmark className="w-6 h-6 mx-auto mb-1.5 opacity-40" />
            <p className="text-xs">Nenhuma busca salva.</p>
            <p className="text-xs mt-0.5">Aplique filtros e clique em "Salvar".</p>
          </div>
        )}

        <div className="p-2.5 border-t border-border">
          {isNaming ? (
            <div className="flex gap-2">
              <Input
                autoFocus
                placeholder="Nome da busca..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                  if (e.key === 'Escape') { setIsNaming(false); setName(''); }
                }}
                maxLength={60}
                className="h-8 text-sm"
              />
              <Button size="sm" className="h-8 px-2" onClick={handleSave} disabled={!name.trim()}>
                <Check className="w-3.5 h-3.5" />
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-xs"
              onClick={() => setIsNaming(true)}
              disabled={activeCount === 0 || presets.length >= 10}
            >
              <BookmarkPlus className="w-3.5 h-3.5" />
              {presets.length >= 10 ? 'Limite de 10 buscas atingido' : 'Salvar busca atual'}
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
});
