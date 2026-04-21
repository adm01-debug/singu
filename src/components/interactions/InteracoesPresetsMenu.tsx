import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Bookmark, BookmarkPlus, Trash2, Check, Download, Link2, Upload, FileJson, Star, Sparkles, Pencil, RefreshCw, X } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSearchPresets, type PresetSortMode } from '@/hooks/useSearchPresets';
import { toast } from 'sonner';
import type { AdvancedFilters } from '@/hooks/useInteractionsAdvancedFilter';
import { ImportPresetsDialog } from './ImportPresetsDialog';
import {
  buildBundle,
  bundleToBase64Url,
  downloadBundleAsFile,
  dedupeNameAgainst,
  type ExportablePreset,
} from '@/lib/searchPresetTransport';
import { suggestInteracoesPresetName } from '@/lib/suggestPresetName';

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
  sort?: string;
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
  const { presets, sortedPresets, sortMode, setSortMode, savePreset, deletePreset, updatePreset, toggleFavorite, markAsUsed } = useSearchPresets('interactions');
  const [isNaming, setIsNaming] = useState(false);
  const [name, setName] = useState('');
  const [open, setOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);
  const [pendingFilterUpdate, setPendingFilterUpdate] = useState<typeof presets[number] | null>(null);

  useEffect(() => {
    if (editingId) {
      requestAnimationFrame(() => renameInputRef.current?.select());
    }
  }, [editingId]);

  const handleStartNaming = () => {
    const suggested = suggestInteracoesPresetName(filters);
    const finalName = dedupeNameAgainst(presets.map((p) => p.name), suggested);
    setName(finalName);
    setIsNaming(true);
  };

  const handleRegenerateSuggestion = () => {
    const suggested = suggestInteracoesPresetName(filters);
    const finalName = dedupeNameAgainst(presets.map((p) => p.name), suggested);
    setName(finalName);
    requestAnimationFrame(() => inputRef.current?.select());
  };

  useEffect(() => {
    if (isNaming) {
      requestAnimationFrame(() => inputRef.current?.select());
    }
  }, [isNaming]);

  const currentPayload: SerializedPayload = useMemo(() => ({
    q: filters.q,
    contact: filters.contact,
    company: filters.company,
    canais: Array.isArray(filters.canais) ? filters.canais : [],
    de: filters.de?.toISOString(),
    ate: filters.ate?.toISOString(),
    sort: filters.sort,
  }), [filters]);

  const handleSave = () => {
    const trimmed = name.trim().slice(0, 60);
    if (!trimmed) return;
    savePreset({
      name: trimmed,
      filters: {
        q: currentPayload.q ? [currentPayload.q] : [],
        contact: currentPayload.contact ? [currentPayload.contact] : [],
        company: currentPayload.company ? [currentPayload.company] : [],
        canais: currentPayload.canais,
        de: currentPayload.de ? [currentPayload.de] : [],
        ate: currentPayload.ate ? [currentPayload.ate] : [],
        sort: currentPayload.sort ? [currentPayload.sort] : [],
      },
      sortBy: '',
      sortOrder: 'desc',
    });
    setName('');
    setIsNaming(false);
    toast.success('Busca salva!');
  };

  const applyPreset = (preset: typeof presets[number]) => {
    const presetFilters = preset.filters;
    clear();
    const payload: SerializedPayload = {
      q: presetFilters.q?.[0] ?? '',
      contact: presetFilters.contact?.[0] ?? '',
      company: presetFilters.company?.[0] ?? '',
      canais: Array.isArray(presetFilters.canais) ? presetFilters.canais : [],
      de: presetFilters.de?.[0],
      ate: presetFilters.ate?.[0],
      sort: presetFilters.sort?.[0],
    };
    setFilter('q', payload.q);
    setFilter('contact', payload.contact);
    setFilter('company', payload.company);
    setFilter('canais', payload.canais);
    setFilter('de', parseDate(payload.de));
    setFilter('ate', parseDate(payload.ate));
    const validSorts = ['recent', 'oldest', 'relevance', 'entity'] as const;
    type SortVal = typeof validSorts[number];
    const nextSort: SortVal = (validSorts as readonly string[]).includes(payload.sort ?? '')
      ? (payload.sort as SortVal)
      : 'recent';
    setFilter('sort', nextSort);
    markAsUsed(preset.id);
    setOpen(false);
    toast.success('Busca aplicada');
  };

  const exportOne = (preset: typeof presets[number]) => {
    const item: ExportablePreset = {
      name: preset.name,
      filters: preset.filters,
      sortBy: preset.sortBy,
      sortOrder: preset.sortOrder,
    };
    downloadBundleAsFile(buildBundle([item]));
    toast.success('JSON baixado');
  };

  const copyLink = async (preset: typeof presets[number]) => {
    const item: ExportablePreset = {
      name: preset.name,
      filters: preset.filters,
      sortBy: preset.sortBy,
      sortOrder: preset.sortOrder,
    };
    const b64 = bundleToBase64Url(buildBundle([item]));
    const url = `${window.location.origin}/interacoes?preset=${b64}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copiado');
    } catch {
      toast.error('Falha ao copiar link');
    }
  };

  const exportAll = () => {
    const items: ExportablePreset[] = presets.map(p => ({
      name: p.name,
      filters: p.filters,
      sortBy: p.sortBy,
      sortOrder: p.sortOrder,
    }));
    downloadBundleAsFile(buildBundle(items));
    toast.success(`${items.length} busca${items.length > 1 ? 's' : ''} exportada${items.length > 1 ? 's' : ''}`);
  };

  return (
    <>
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
        <PopoverContent className="w-96 p-0" align="end">
          <div className="p-3 border-b border-border">
            <h4 className="font-medium text-sm text-foreground">Buscas salvas</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Salve, exporte e compartilhe combinações de filtros
            </p>
          </div>

          {presets.length > 0 && (
            <div className="px-3 py-2 border-b border-border flex items-center gap-2">
              <span className="text-xs text-muted-foreground shrink-0">Ordenar:</span>
              <Select value={sortMode} onValueChange={(v) => setSortMode(v as PresetSortMode)}>
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="favoritos" className="text-xs">Favoritos</SelectItem>
                  <SelectItem value="mais-usados" className="text-xs">Mais usados</SelectItem>
                  <SelectItem value="recentes" className="text-xs">Mais recentes</SelectItem>
                  <SelectItem value="alfabetica" className="text-xs">Alfabética</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {sortedPresets.length > 0 && (
            <div className="max-h-64 overflow-y-auto divide-y divide-border">
              {sortedPresets.map(preset => {
                const payload: SerializedPayload = {
                  q: preset.filters.q?.[0] ?? '',
                  contact: preset.filters.contact?.[0] ?? '',
                  company: preset.filters.company?.[0] ?? '',
                  canais: Array.isArray(preset.filters.canais) ? preset.filters.canais : [],
                  de: preset.filters.de?.[0],
                  ate: preset.filters.ate?.[0],
                };
                const usage = preset.usageCount ?? 0;
                return (
                  <div
                    key={preset.id}
                    className="flex items-center justify-between p-2.5 hover:bg-muted/50 cursor-pointer group"
                    onClick={() => applyPreset(preset)}
                  >
                    <button
                      type="button"
                      className="mr-2 flex-shrink-0 p-0.5 rounded hover:bg-muted"
                      title={preset.isFavorite ? 'Remover dos favoritos' : 'Marcar como favorito'}
                      aria-label={preset.isFavorite ? 'Remover dos favoritos' : 'Marcar como favorito'}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(preset.id);
                      }}
                    >
                      <Star
                        className={
                          preset.isFavorite
                            ? 'w-3.5 h-3.5 fill-primary text-primary'
                            : 'w-3.5 h-3.5 text-muted-foreground'
                        }
                      />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{preset.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {summarize(payload)}
                        {usage >= 3 && <span className="ml-1.5">· Usado {usage}x</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        title="Baixar JSON"
                        onClick={(e) => { e.stopPropagation(); exportOne(preset); }}
                      >
                        <Download className="w-3 h-3 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        title="Copiar link"
                        onClick={(e) => { e.stopPropagation(); copyLink(preset); }}
                      >
                        <Link2 className="w-3 h-3 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        title="Remover"
                        onClick={(e) => {
                          e.stopPropagation();
                          deletePreset(preset.id);
                          toast('Busca removida');
                        }}
                      >
                        <Trash2 className="w-3 h-3 text-muted-foreground" />
                      </Button>
                    </div>
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

          <div className="p-2.5 border-t border-border space-y-1.5">
            {isNaming ? (
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
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
                {!name.trim() && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-2"
                    onClick={handleRegenerateSuggestion}
                    title="Sugerir nome com base nos filtros"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                  </Button>
                )}
                <Button size="sm" className="h-8 px-2" onClick={handleSave} disabled={!name.trim()}>
                  <Check className="w-3.5 h-3.5" />
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 text-xs"
                onClick={handleStartNaming}
                disabled={activeCount === 0 || presets.length >= 10}
              >
                <BookmarkPlus className="w-3.5 h-3.5" />
                {presets.length >= 10 ? 'Limite de 10 buscas atingido' : 'Salvar busca atual'}
              </Button>
            )}

            <div className="flex gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 justify-start gap-2 text-xs"
                onClick={() => { setOpen(false); setImportOpen(true); }}
              >
                <Upload className="w-3.5 h-3.5" />
                Importar buscas
              </Button>
              {presets.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 justify-start gap-2 text-xs"
                  onClick={exportAll}
                  title="Baixar todas como JSON"
                >
                  <FileJson className="w-3.5 h-3.5" />
                  Exportar todas
                </Button>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <ImportPresetsDialog open={importOpen} onOpenChange={setImportOpen} />
    </>
  );
});
