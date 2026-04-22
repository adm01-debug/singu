import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  /** Há mais itens não exibidos? Quando false, a barra não renderiza. */
  hasMore: boolean;
  /** Quantos itens já estão visíveis. */
  totalLoaded: number;
  /** Quantos itens existem no total (após filtros). */
  total: number;
  /** Classe extra para customizar offset/sticky-top no container hospedeiro. */
  className?: string;
  /**
   * Offset CSS para a posição sticky (ex.: '0px', '3.5rem'). Default: 0.
   * Use quando houver header fixo acima.
   */
  topOffset?: string;
}

/**
 * Indicador sticky no topo de uma seção de lista com carregamento incremental.
 *
 * Aparece **antes** do sentinela ser atingido, sinalizando ao usuário que
 * mais itens serão revelados conforme rolar — útil em listas longas onde
 * o sentinela está muito abaixo da viewport. Permanece visível durante
 * todo o carregamento progressivo e some quando `hasMore` vira false.
 *
 * Não é interativo: serve como pista visual + status acessível (`role="status"`),
 * complementando o `InfiniteScrollSentinel` que fica no fim da lista.
 */
export const IncrementalLoadStickyBar = React.memo(function IncrementalLoadStickyBar({
  hasMore,
  totalLoaded,
  total,
  className,
  topOffset = '0px',
}: Props) {
  if (!hasMore || total === 0) return null;
  const pct = Math.min(100, Math.round((totalLoaded / total) * 100));
  const remaining = Math.max(0, total - totalLoaded);

  return (
    <div
      role="status"
      aria-live="polite"
      style={{ top: topOffset }}
      className={cn(
        'sticky z-10 -mx-2 mb-2 px-3 py-1.5 rounded-md',
        'bg-background/85 backdrop-blur-sm border border-border/60 shadow-sm',
        'flex items-center gap-2 text-xs text-muted-foreground',
        className,
      )}
    >
      <Loader2 className="h-3 w-3 animate-spin text-primary shrink-0" aria-hidden="true" />
      <span className="tabular-nums">
        Exibindo <strong className="text-foreground font-medium">{totalLoaded}</strong> de{' '}
        <strong className="text-foreground font-medium">{total}</strong>
        <span className="hidden sm:inline"> · {remaining} {remaining === 1 ? 'restante' : 'restantes'}</span>
      </span>
      <div
        className="ml-auto h-1 w-16 sm:w-24 rounded-full bg-muted overflow-hidden"
        aria-hidden="true"
      >
        <div
          className="h-full bg-primary/70 transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
});
