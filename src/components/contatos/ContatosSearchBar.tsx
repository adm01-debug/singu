import {
  Search,
  Grid3X3,
  List,
  CheckSquare,
  Keyboard,
  RefreshCw,
  Database,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ContextualHelpTooltip } from '@/components/help/ContextualHelpTooltip';
import { AdvancedDataExporter } from '@/components/data-export/AdvancedDataExporter';
import { SearchPresetsMenu } from '@/components/search/SearchPresetsMenu';
import { FeatureSpotlight } from '@/components/feedback/FeatureSpotlight';
import type { SearchPreset } from '@/hooks/useSearchPresets';

type ViewMode = 'grid' | 'list';

export interface ContatosSearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  selectionMode: boolean;
  onToggleSelectionMode: () => void;
  isEnriching: boolean;
  onEnrichContacts: () => void;
  onShowShortcuts: () => void;
  activeFilters: Record<string, string[]>;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onApplyPreset: (preset: SearchPreset) => void;
}

export const ContatosSearchBar = ({
  searchTerm,
  onSearchChange,
  viewMode,
  onViewModeChange,
  selectionMode,
  onToggleSelectionMode,
  isEnriching,
  onEnrichContacts,
  onShowShortcuts,
  activeFilters,
  sortBy,
  sortOrder,
  onApplyPreset,
}: ContatosSearchBarProps) => {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
        <Input
          placeholder="Buscar por nome, cargo ou email (aceita erros de digitação)..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
          aria-label="Buscar contatos"
          aria-describedby="search-hint"
        />
        <span id="search-hint" className="sr-only">
          A busca é inteligente e aceita erros de digitação
        </span>
      </div>
      <div className="flex items-center gap-2">
        <ContextualHelpTooltip
          title="Busca Inteligente"
          description="A busca usa Fuzzy Search para encontrar resultados mesmo com erros de digitação."
          tips={[
            '"joao" encontra "João Silva"',
            'Busca por nome, email e cargo',
            'Resultados ordenados por relevância',
          ]}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={onEnrichContacts}
          disabled={isEnriching}
          className="gap-2"
          title="Enriquecer contatos com dados do banco externo"
        >
          {isEnriching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
          {isEnriching ? 'Enriquecendo...' : 'Enriquecer'}
        </Button>
        <FeatureSpotlight
          featureId="search-presets"
          title="Novo: Presets de Busca"
          description="Salve combinações de filtros para reutilizar rapidamente. Ideal para buscas que você faz com frequência!"
          position="bottom"
        >
          <SearchPresetsMenu
            context="contacts"
            currentFilters={activeFilters}
            currentSortBy={sortBy}
            currentSortOrder={sortOrder}
            currentSearchTerm={searchTerm}
            onApplyPreset={onApplyPreset}
          />
        </FeatureSpotlight>
        <AdvancedDataExporter entityType="contacts" />
        <Button
          variant="ghost"
          size="icon"
          onClick={onShowShortcuts}
          className="text-muted-foreground"
          aria-label="Ver atalhos de teclado"
        >
          <Keyboard className="w-4 h-4" />
        </Button>
        <Button
          variant={selectionMode ? 'default' : 'outline'}
          size="sm"
          onClick={onToggleSelectionMode}
          className="gap-2"
        >
          <CheckSquare className="w-4 h-4" aria-hidden="true" />
          {selectionMode ? 'Cancelar' : 'Selecionar'}
        </Button>
        <div className="flex items-center gap-1 bg-secondary rounded-lg p-1" role="group" aria-label="Modo de visualização">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => onViewModeChange('grid')}
            className="h-8 w-8"
            aria-label="Visualização em grade"
            aria-pressed={viewMode === 'grid'}
          >
            <Grid3X3 className="w-4 h-4" aria-hidden="true" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => onViewModeChange('list')}
            className="h-8 w-8"
            aria-label="Visualização em lista"
            aria-pressed={viewMode === 'list'}
          >
            <List className="w-4 h-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
};
