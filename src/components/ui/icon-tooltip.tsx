import { ReactNode } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface IconTooltipProps {
  children: ReactNode;
  content: ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  delayDuration?: number;
  className?: string;
  shortcut?: string[];
}

export function IconTooltip({
  children,
  content,
  side = 'top',
  align = 'center',
  delayDuration = 300,
  className,
  shortcut,
}: IconTooltipProps) {
  return (
    <Tooltip delayDuration={delayDuration}>
      <TooltipTrigger asChild>
        {children}
      </TooltipTrigger>
      <TooltipContent 
        side={side} 
        align={align}
        className={cn('flex items-center gap-2', className)}
      >
        <span>{content}</span>
        {shortcut && shortcut.length > 0 && (
          <span className="flex items-center gap-0.5 ml-1">
            {shortcut.map((key, i) => (
              <kbd
                key={i}
                className="px-1.5 py-0.5 text-[10px] font-mono bg-muted rounded border border-border"
              >
                {key}
              </kbd>
            ))}
          </span>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

// Pre-configured tooltips for common actions
export function ActionTooltips() {
  return null; // This is just a namespace for tooltip presets
}

ActionTooltips.Edit = ({ children }: { children: ReactNode }) => (
  <IconTooltip content="Editar" shortcut={['E']}>
    {children}
  </IconTooltip>
);

ActionTooltips.Delete = ({ children }: { children: ReactNode }) => (
  <IconTooltip content="Excluir" shortcut={['D']}>
    {children}
  </IconTooltip>
);

ActionTooltips.Save = ({ children }: { children: ReactNode }) => (
  <IconTooltip content="Salvar" shortcut={['⌘', 'S']}>
    {children}
  </IconTooltip>
);

ActionTooltips.Search = ({ children }: { children: ReactNode }) => (
  <IconTooltip content="Buscar" shortcut={['⌘', 'K']}>
    {children}
  </IconTooltip>
);

ActionTooltips.Add = ({ children }: { children: ReactNode }) => (
  <IconTooltip content="Adicionar" shortcut={['⌘', 'N']}>
    {children}
  </IconTooltip>
);

ActionTooltips.Close = ({ children }: { children: ReactNode }) => (
  <IconTooltip content="Fechar" shortcut={['Esc']}>
    {children}
  </IconTooltip>
);

ActionTooltips.Refresh = ({ children }: { children: ReactNode }) => (
  <IconTooltip content="Atualizar" shortcut={['⌘', 'R']}>
    {children}
  </IconTooltip>
);

ActionTooltips.Settings = ({ children }: { children: ReactNode }) => (
  <IconTooltip content="Configurações" shortcut={['Alt', ',']}>
    {children}
  </IconTooltip>
);

ActionTooltips.Help = ({ children }: { children: ReactNode }) => (
  <IconTooltip content="Atalhos de teclado" shortcut={['?']}>
    {children}
  </IconTooltip>
);

ActionTooltips.Favorite = ({ children, isFavorite }: { children: ReactNode; isFavorite?: boolean }) => (
  <IconTooltip content={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}>
    {children}
  </IconTooltip>
);

ActionTooltips.Copy = ({ children }: { children: ReactNode }) => (
  <IconTooltip content="Copiar" shortcut={['⌘', 'C']}>
    {children}
  </IconTooltip>
);

ActionTooltips.Share = ({ children }: { children: ReactNode }) => (
  <IconTooltip content="Compartilhar">
    {children}
  </IconTooltip>
);

ActionTooltips.More = ({ children }: { children: ReactNode }) => (
  <IconTooltip content="Mais opções">
    {children}
  </IconTooltip>
);

ActionTooltips.Filter = ({ children }: { children: ReactNode }) => (
  <IconTooltip content="Filtrar">
    {children}
  </IconTooltip>
);

ActionTooltips.Sort = ({ children }: { children: ReactNode }) => (
  <IconTooltip content="Ordenar">
    {children}
  </IconTooltip>
);

ActionTooltips.Export = ({ children }: { children: ReactNode }) => (
  <IconTooltip content="Exportar">
    {children}
  </IconTooltip>
);

ActionTooltips.Import = ({ children }: { children: ReactNode }) => (
  <IconTooltip content="Importar">
    {children}
  </IconTooltip>
);
