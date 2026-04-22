import { useState } from 'react';
import { Bookmark, Check, MoreVertical, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useSavedViews } from '@/hooks/useSavedViews';
import {
  SAVED_VIEWS_MAX_PER_SCOPE,
  SAVED_VIEWS_NAME_MAX_LENGTH,
} from '@/config/savedViews.config';
import { cn } from '@/lib/utils';

interface Props {
  /** Escopo lógico, geralmente o pathname (ex.: `/interacoes`). */
  scope: string;
  className?: string;
}

/**
 * Botão + dropdown para salvar e reaplicar visualizações nomeadas
 * (filtros + sort + paginação). Persistência local; sem backend.
 */
export function SavedViewsMenu({ scope, className }: Props) {
  const { views, currentQuery, save, apply, remove } = useSavedViews(scope);
  const [name, setName] = useState('');
  const [open, setOpen] = useState(false);
  const [savePopoverOpen, setSavePopoverOpen] = useState(false);

  const trimmed = name.trim();
  const hasFilters = currentQuery.length > 0;

  const handleSave = (overwrite = false) => {
    if (!trimmed) {
      toast.warning('Dê um nome para a visualização');
      return;
    }
    const result = save({ name: trimmed, overwrite });
    if (result.ok) {
      toast.success('Visualização salva', { description: result.view.name });
      setName('');
      setSavePopoverOpen(false);
      setOpen(false);
      return;
    }
    if (result.reason === 'duplicate') {
      toast.warning('Já existe uma visualização com esse nome', {
        description: 'Use outro nome ou sobrescreva.',
        action: { label: 'Sobrescrever', onClick: () => handleSave(true) },
      });
      return;
    }
    if (result.reason === 'limit-reached') {
      toast.error(`Limite de ${SAVED_VIEWS_MAX_PER_SCOPE} visualizações atingido`, {
        description: 'Apague alguma antes de salvar uma nova.',
      });
      return;
    }
    toast.error('Não foi possível salvar a visualização');
  };

  return (
    <div className={cn('inline-flex', className)}>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            aria-label="Visualizações salvas"
          >
            <Bookmark className="w-4 h-4" />
            <span className="hidden sm:inline">Visualizações</span>
            {views.length > 0 && (
              <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] tabular-nums text-muted-foreground">
                {views.length}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-72">
          <DropdownMenuLabel className="flex items-center justify-between">
            <span>Visualizações salvas</span>
            <Popover open={savePopoverOpen} onOpenChange={setSavePopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 px-2 text-xs"
                  disabled={!hasFilters}
                  title={hasFilters ? 'Salvar visualização atual' : 'Aplique filtros para salvar'}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Salvar atual
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72 space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="saved-view-name" className="text-xs">
                    Nome da visualização
                  </Label>
                  <Input
                    id="saved-view-name"
                    autoFocus
                    placeholder="Ex.: Meu pipeline"
                    value={name}
                    maxLength={SAVED_VIEWS_NAME_MAX_LENGTH}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSave(false);
                      }
                    }}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Salva filtros, ordenação e paginação atuais.
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setName('');
                      setSavePopoverOpen(false);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button size="sm" onClick={() => handleSave(false)} disabled={!trimmed}>
                    <Check className="w-3.5 h-3.5 mr-1" />
                    Salvar
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          {views.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs text-muted-foreground">
              Nenhuma visualização salva ainda.
              <br />
              Aplique filtros e clique em <strong>Salvar atual</strong>.
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto py-1">
              {views.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center gap-1 px-1"
                >
                  <DropdownMenuItem
                    className="flex-1 cursor-pointer"
                    onSelect={(e) => {
                      e.preventDefault();
                      apply(v);
                      setOpen(false);
                      toast.success('Visualização aplicada', { description: v.name });
                    }}
                  >
                    <Bookmark className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                    <span className="truncate">{v.name}</span>
                  </DropdownMenuItem>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        aria-label={`Opções para ${v.name}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onSelect={(e) => {
                          e.preventDefault();
                          remove(v.id);
                          toast.success('Visualização removida', { description: v.name });
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
