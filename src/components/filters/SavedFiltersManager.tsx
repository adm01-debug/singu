import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useSavedFilters, SavedFilter } from '@/hooks/useSavedFilters';
import {
  Bookmark,
  BookmarkCheck,
  ChevronDown,
  Copy,
  Pencil,
  Plus,
  Star,
  StarOff,
  Trash2,
  X,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SavedFiltersManagerProps {
  type: 'contacts' | 'companies' | 'interactions';
  currentFilters: Record<string, unknown>;
  onApplyFilter: (filters: Record<string, unknown>) => void;
  onClearFilter: () => void;
}

export function SavedFiltersManager({
  type,
  currentFilters,
  onApplyFilter,
  onClearFilter,
}: SavedFiltersManagerProps) {
  const {
    filters,
    activeFilter,
    saveFilter,
    deleteFilter,
    applyFilter,
    clearActiveFilter,
    setDefaultFilter,
    renameFilter,
    duplicateFilter,
    getMostUsedFilters,
  } = useSavedFilters(type);

  const [isOpen, setIsOpen] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<SavedFilter | null>(null);

  const hasActiveFilters = Object.keys(currentFilters).some(
    key => currentFilters[key] !== undefined && currentFilters[key] !== '' && currentFilters[key] !== null
  );

  const handleSaveFilter = () => {
    if (!filterName.trim()) return;
    saveFilter(filterName.trim(), currentFilters);
    setFilterName('');
    setIsSaveDialogOpen(false);
  };

  const handleApplyFilter = (filter: SavedFilter) => {
    const appliedFilters = applyFilter(filter);
    onApplyFilter(appliedFilters);
    setIsOpen(false);
  };

  const handleClearFilter = () => {
    clearActiveFilter();
    onClearFilter();
  };

  const handleRenameFilter = () => {
    if (!selectedFilter || !filterName.trim()) return;
    renameFilter(selectedFilter.id, filterName.trim());
    setFilterName('');
    setIsRenameDialogOpen(false);
    setSelectedFilter(null);
  };

  const openRenameDialog = (filter: SavedFilter) => {
    setSelectedFilter(filter);
    setFilterName(filter.name);
    setIsRenameDialogOpen(true);
  };

  const mostUsed = getMostUsedFilters(3);

  const typeLabels = {
    contacts: 'Contatos',
    companies: 'Empresas',
    interactions: 'Interações',
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              {activeFilter ? (
                <>
                  <BookmarkCheck className="h-4 w-4 text-primary" />
                  <span className="max-w-24 truncate">{activeFilter.name}</span>
                </>
              ) : (
                <>
                  <Bookmark className="h-4 w-4" />
                  <span>Filtros Salvos</span>
                </>
              )}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Filtros de {typeLabels[type]}</span>
              {filters.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {filters.length}
                </Badge>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            {filters.length === 0 ? (
              <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                Nenhum filtro salvo ainda
              </div>
            ) : (
              <>
                {mostUsed.length > 0 && (
                  <>
                    <DropdownMenuLabel className="text-xs text-muted-foreground">
                      Mais usados
                    </DropdownMenuLabel>
                    {mostUsed.map(filter => (
                      <DropdownMenuItem
                        key={filter.id}
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => handleApplyFilter(filter)}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {filter.isDefault && (
                            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                          )}
                          <span className="truncate">{filter.name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          {filter.usageCount}x
                        </span>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                  </>
                )}

                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Todos os filtros
                </DropdownMenuLabel>
                {filters.map(filter => (
                  <DropdownMenuItem
                    key={filter.id}
                    className="flex items-center justify-between group cursor-pointer"
                  >
                    <div
                      className="flex items-center gap-2 min-w-0 flex-1"
                      onClick={() => handleApplyFilter(filter)}
                    >
                      {filter.isDefault && (
                        <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                      )}
                      <div className="min-w-0">
                        <span className="block truncate">{filter.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(filter.updatedAt), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDefaultFilter(filter.isDefault ? null : filter.id);
                        }}
                      >
                        {filter.isDefault ? (
                          <StarOff className="h-3 w-3" />
                        ) : (
                          <Star className="h-3 w-3" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          openRenameDialog(filter);
                        }}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateFilter(filter.id);
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteFilter(filter.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </DropdownMenuItem>
                ))}
              </>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 cursor-pointer"
              disabled={!hasActiveFilters}
              onClick={() => setIsSaveDialogOpen(true)}
            >
              <Plus className="h-4 w-4" />
              <span>Salvar filtro atual</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {activeFilter && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleClearFilter}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Save Filter Dialog */}
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Salvar Filtro</DialogTitle>
            <DialogDescription>
              Dê um nome para este conjunto de filtros para usar novamente depois.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Nome do filtro"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveFilter()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveFilter} disabled={!filterName.trim()}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Filter Dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Renomear Filtro</DialogTitle>
            <DialogDescription>
              Digite um novo nome para o filtro.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Novo nome"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRenameFilter()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenameDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleRenameFilter} disabled={!filterName.trim()}>
              Renomear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default SavedFiltersManager;
