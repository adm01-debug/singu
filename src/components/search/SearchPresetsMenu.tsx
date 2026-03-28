import { useState } from 'react';
import { Bookmark, BookmarkPlus, Trash2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useSearchPresets, type SearchPreset } from '@/hooks/useSearchPresets';
import { toast } from 'sonner';

interface SearchPresetsMenuProps {
  context?: string;
  currentFilters: Record<string, string[]>;
  currentSortBy: string;
  currentSortOrder: 'asc' | 'desc';
  currentSearchTerm?: string;
  onApplyPreset: (preset: SearchPreset) => void;
}

export function SearchPresetsMenu({
  context = 'contacts',
  currentFilters,
  currentSortBy,
  currentSortOrder,
  currentSearchTerm,
  onApplyPreset,
}: SearchPresetsMenuProps) {
  const { presets, savePreset, deletePreset } = useSearchPresets(context);
  const [isNaming, setIsNaming] = useState(false);
  const [presetName, setPresetName] = useState('');

  const hasActiveFilters = Object.keys(currentFilters).some(k => currentFilters[k]?.length > 0)
    || currentSearchTerm;

  const handleSave = () => {
    if (!presetName.trim()) return;
    savePreset({
      name: presetName.trim(),
      filters: currentFilters,
      sortBy: currentSortBy,
      sortOrder: currentSortOrder,
      searchTerm: currentSearchTerm,
    });
    setPresetName('');
    setIsNaming(false);
    toast.success('Preset salvo!');
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          aria-label="Presets de busca salvos"
        >
          <Bookmark className="w-4 h-4" />
          <span className="hidden sm:inline">Presets</span>
          {presets.length > 0 && (
            <span className="text-xs bg-primary/10 text-primary rounded-full px-1.5">
              {presets.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="end">
        <div className="p-3 border-b border-border">
          <h4 className="font-medium text-sm text-foreground">Presets de Busca</h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            Salve e reutilize combinações de filtros
          </p>
        </div>

        {/* Saved presets */}
        {presets.length > 0 && (
          <div className="max-h-48 overflow-y-auto divide-y divide-border">
            {presets.map(preset => (
              <div
                key={preset.id}
                className="flex items-center justify-between p-2.5 hover:bg-muted/50 cursor-pointer group"
                onClick={() => onApplyPreset(preset)}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{preset.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {Object.values(preset.filters).flat().length} filtros
                    {preset.searchTerm && ` · "${preset.searchTerm}"`}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 flex-shrink-0"
                  aria-label="Excluir"
                  onClick={(e) => {
                    e.stopPropagation();
                    deletePreset(preset.id);
                    toast('Preset removido');
                  }}
                >
                  <Trash2 className="w-3 h-3 text-muted-foreground" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {presets.length === 0 && !isNaming && (
          <div className="p-4 text-center text-muted-foreground">
            <Bookmark className="w-6 h-6 mx-auto mb-1.5 opacity-40" />
            <p className="text-xs">Nenhum preset salvo</p>
          </div>
        )}

        {/* Save new preset */}
        <div className="p-2.5 border-t border-border">
          {isNaming ? (
            <div className="flex gap-2">
              <Input
                autoFocus
                placeholder="Nome do preset..."
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                className="h-8 text-sm"
              />
              <Button size="sm" className="h-8 px-2" onClick={handleSave} disabled={!presetName.trim()}>
                <Check className="w-3.5 h-3.5" />
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-xs"
              onClick={() => setIsNaming(true)}
              disabled={!hasActiveFilters}
            >
              <BookmarkPlus className="w-3.5 h-3.5" />
              Salvar filtros atuais como preset
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
