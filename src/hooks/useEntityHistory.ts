import { useCallback, useEffect, useState } from 'react';
import type { BookmarkType } from './useEntityBookmarks';

export interface HistoryEntry {
  type: BookmarkType;
  id: string;
  name: string;
}

/**
 * Pilha de navegação do Entity 360 com back/forward (estilo browser).
 * Atalhos: Alt+← / Alt+→.
 */
export function useEntityHistory() {
  const [stack, setStack] = useState<HistoryEntry[]>([]);
  const [cursor, setCursor] = useState(-1);

  const current = cursor >= 0 ? stack[cursor] ?? null : null;
  const canBack = cursor > 0;
  const canForward = cursor >= 0 && cursor < stack.length - 1;

  const push = useCallback((entry: HistoryEntry) => {
    setStack((prevStack) => {
      setCursor((prevCursor) => {
        const truncated = prevStack.slice(0, prevCursor + 1);
        const last = truncated[truncated.length - 1];
        const next = last && last.type === entry.type && last.id === entry.id
          ? truncated
          : [...truncated, entry];
        // Sincroniza stack via setStack abaixo retornando o novo array
        queueMicrotask(() => setStack(next));
        return next.length - 1;
      });
      return prevStack;
    });
  }, []);

  const back = useCallback(() => setCursor((c) => Math.max(-1, c - 1)), []);
  const forward = useCallback(() => setCursor((c) => Math.min(c + 1, 1_000_000)), []);
  const reset = useCallback(() => { setStack([]); setCursor(-1); }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!e.altKey) return;
      if (e.key === 'ArrowLeft' && canBack) { e.preventDefault(); back(); }
      if (e.key === 'ArrowRight' && canForward) { e.preventDefault(); forward(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [back, forward, canBack, canForward]);

  return { current, stack, cursor, canBack, canForward, push, back, forward, reset };
}
