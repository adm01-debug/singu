/**
 * Testes do contrato `onAfterRemove` do `ActiveFiltersBar`.
 *
 * Garante:
 *  1. A callback é chamada UMA ÚNICA vez por clique de remoção em cada chip,
 *     em todos os tipos de chip (busca, direção, canal, contato, empresa,
 *     sentimento, datas) e também no botão "Limpar filtros".
 *  2. O componente NÃO quebra (não lança, comportamento esperado preservado)
 *     quando `onAfterRemove` não é passado — a ação de remoção continua
 *     disparando `setFilter`/`clear` normalmente.
 *
 * Por que isso importa: o `wrap` no componente compõe `setFilter` + `onAfterRemove`
 * via useCallback. Um regressão comum é duplicar o efeito ao re-criar handlers
 * dentro de map/JSX, ou esquecer o `?.` opcional e quebrar quando a prop sai.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, within, fireEvent } from '@testing-library/react';
import { ActiveFiltersBar } from '@/components/interactions/ActiveFiltersBar';
import type { AdvancedFilters } from '@/hooks/useInteractionsAdvancedFilter';

function baseFilters(overrides: Partial<AdvancedFilters> = {}): AdvancedFilters {
  return {
    q: '',
    canais: [],
    direcao: 'all',
    contact: '',
    company: '',
    de: undefined,
    ate: undefined,
    sentimento: undefined,
    sortBy: 'recent',
    view: 'list',
    ...overrides,
  } as AdvancedFilters;
}

interface RenderOpts {
  filters?: Partial<AdvancedFilters>;
  /** Quando undefined, NÃO passa a prop — exercita o caminho do `?.()`. */
  onAfterRemove?: (() => void) | undefined;
  withClearDateRange?: boolean;
}

function renderBar(opts: RenderOpts = {}) {
  const setFilter = vi.fn();
  const clear = vi.fn();
  const clearDateRange = vi.fn(() => true);
  const filters = baseFilters(opts.filters);
  const props = {
    filters,
    setFilter,
    clear,
    clearDateRange: opts.withClearDateRange ? clearDateRange : undefined,
    activeCount: 1, // basta >0 para o "Limpar filtros" aparecer
    totalCount: 100,
    visibleCount: 50,
    contactLabel: 'Maria',
    companyLabel: 'Acme',
    onAfterRemove: opts.onAfterRemove,
  } as const;
  // Cast estreito: o componente aceita `onAfterRemove?: () => void`.
  // Em testes do "caminho ausente" passamos undefined deliberadamente.
  const utils = render(<ActiveFiltersBar {...(props as Parameters<typeof ActiveFiltersBar>[0])} />);
  return { ...utils, setFilter, clear, clearDateRange };
}

/**
 * Localiza o botão "X" (close) DENTRO do badge cujo texto inclui `text`.
 * Evita acoplamento à ordem dos chips — se um novo chip for adicionado antes,
 * o teste continua válido.
 */
function clickRemoveOnChip(text: string | RegExp) {
  // O texto do chip pode aparecer em múltiplos lugares (ex.: "WhatsApp"
  // também aparece no resumo "1 canal: WhatsApp"). O chip propriamente
  // dito é o único container que combina o texto + um <button aria-label="Remove">.
  // Estratégia: pegar TODOS os candidatos com o texto e, para cada um, subir
  // até 5 níveis procurando um ancestral que contenha o botão Remove. O
  // primeiro match (que combina texto + botão) é o chip alvo.
  const matches = screen.getAllByText(text);
  for (const node of matches) {
    let cursor: HTMLElement | null = node as HTMLElement;
    for (let i = 0; i < 5 && cursor; i++) {
      const removeBtn = within(cursor).queryByRole('button', { name: /remove/i });
      if (removeBtn) {
        fireEvent.click(removeBtn);
        return removeBtn;
      }
      cursor = cursor.parentElement;
    }
  }
  throw new Error(`Botão de remoção não encontrado para o chip "${String(text)}"`);
}

describe('ActiveFiltersBar — contrato onAfterRemove', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });
  afterEach(() => {
    cleanup();
  });

  // ────────────────────────────────────────────────────────────────────
  // 1) Disparada exatamente UMA vez por remoção, em cada tipo de chip
  // ────────────────────────────────────────────────────────────────────

  it('chip de busca: chama onAfterRemove uma única vez e setFilter("q","")', () => {
    const onAfterRemove = vi.fn();
    const { setFilter } = renderBar({
      filters: { q: 'olá' },
      onAfterRemove,
    });
    clickRemoveOnChip(/Busca/i);
    expect(setFilter).toHaveBeenCalledTimes(1);
    expect(setFilter).toHaveBeenCalledWith('q', '');
    expect(onAfterRemove).toHaveBeenCalledTimes(1);
  });

  it('chip de direção (inbound): uma única chamada e seta direcao=all', () => {
    const onAfterRemove = vi.fn();
    const { setFilter } = renderBar({
      filters: { direcao: 'inbound' },
      onAfterRemove,
    });
    clickRemoveOnChip(/Recebidas/i);
    expect(setFilter).toHaveBeenCalledTimes(1);
    expect(setFilter).toHaveBeenCalledWith('direcao', 'all');
    expect(onAfterRemove).toHaveBeenCalledTimes(1);
  });

  it('chip de pessoa: uma única chamada e limpa contact', () => {
    const onAfterRemove = vi.fn();
    const { setFilter } = renderBar({
      filters: { contact: 'abc12345' },
      onAfterRemove,
    });
    clickRemoveOnChip(/Pessoa/i);
    expect(setFilter).toHaveBeenCalledTimes(1);
    expect(setFilter).toHaveBeenCalledWith('contact', '');
    expect(onAfterRemove).toHaveBeenCalledTimes(1);
  });

  it('chip de empresa: uma única chamada e limpa company', () => {
    const onAfterRemove = vi.fn();
    const { setFilter } = renderBar({
      filters: { company: 'co99' },
      onAfterRemove,
    });
    clickRemoveOnChip(/Empresa/i);
    expect(setFilter).toHaveBeenCalledTimes(1);
    expect(setFilter).toHaveBeenCalledWith('company', '');
    expect(onAfterRemove).toHaveBeenCalledTimes(1);
  });

  it('chip de canal: remove apenas o canal clicado e dispara onAfterRemove uma vez', () => {
    const onAfterRemove = vi.fn();
    const { setFilter } = renderBar({
      filters: { canais: ['whatsapp', 'email', 'call'] },
      onAfterRemove,
    });
    clickRemoveOnChip('Email');
    expect(setFilter).toHaveBeenCalledTimes(1);
    expect(setFilter).toHaveBeenCalledWith('canais', ['whatsapp', 'call']);
    expect(onAfterRemove).toHaveBeenCalledTimes(1);
  });

  it('chip de sentimento: uma única chamada e seta sentimento=undefined', () => {
    const onAfterRemove = vi.fn();
    const { setFilter } = renderBar({
      filters: { sentimento: 'positive' },
      onAfterRemove,
    });
    clickRemoveOnChip(/Sentimento/i);
    expect(setFilter).toHaveBeenCalledTimes(1);
    expect(setFilter).toHaveBeenCalledWith('sentimento', undefined);
    expect(onAfterRemove).toHaveBeenCalledTimes(1);
  });

  it('chip de período "desde": com range completo + clearDateRange, usa atomic clear e dispara onAfterRemove uma vez', () => {
    const onAfterRemove = vi.fn();
    const { setFilter, clearDateRange } = renderBar({
      filters: { de: new Date('2024-01-01'), ate: new Date('2024-02-01') },
      withClearDateRange: true,
      onAfterRemove,
    });
    clickRemoveOnChip(/Período desde/i);
    // Em modo atômico não chama setFilter, chama clearDateRange uma vez.
    expect(clearDateRange).toHaveBeenCalledTimes(1);
    expect(setFilter).not.toHaveBeenCalled();
    expect(onAfterRemove).toHaveBeenCalledTimes(1);
  });

  it('chip de período "desde" sem clearDateRange: cai no fallback setFilter("de", undefined)', () => {
    const onAfterRemove = vi.fn();
    const { setFilter, clearDateRange } = renderBar({
      filters: { de: new Date('2024-01-01') },
      withClearDateRange: false,
      onAfterRemove,
    });
    clickRemoveOnChip(/Período desde/i);
    expect(clearDateRange).not.toHaveBeenCalled();
    expect(setFilter).toHaveBeenCalledTimes(1);
    expect(setFilter).toHaveBeenCalledWith('de', undefined);
    expect(onAfterRemove).toHaveBeenCalledTimes(1);
  });

  it('botão "Limpar filtros": chama clear() e onAfterRemove uma única vez', () => {
    const onAfterRemove = vi.fn();
    const { clear } = renderBar({
      filters: { q: 'algo', canais: ['email'] },
      onAfterRemove,
    });
    fireEvent.click(screen.getByRole('button', { name: /limpar todos os filtros/i }));
    expect(clear).toHaveBeenCalledTimes(1);
    expect(onAfterRemove).toHaveBeenCalledTimes(1);
  });

  it('múltiplas remoções em sequência: dispara onAfterRemove uma vez POR clique', () => {
    const onAfterRemove = vi.fn();
    const { setFilter } = renderBar({
      filters: { q: 'foo', canais: ['whatsapp', 'email'], direcao: 'inbound' },
      onAfterRemove,
    });
    clickRemoveOnChip(/Busca/i);
    clickRemoveOnChip('Email');
    clickRemoveOnChip(/Recebidas/i);
    // 3 cliques → 3 chamadas (não duplicar, não engolir).
    expect(onAfterRemove).toHaveBeenCalledTimes(3);
    expect(setFilter).toHaveBeenCalledTimes(3);
  });

  // ────────────────────────────────────────────────────────────────────
  // 2) Robustez: quando onAfterRemove NÃO é passada
  // ────────────────────────────────────────────────────────────────────

  it('SEM onAfterRemove: clicar para remover chip não lança e ainda chama setFilter', () => {
    const { setFilter } = renderBar({
      filters: { q: 'teste' },
      onAfterRemove: undefined,
    });
    expect(() => clickRemoveOnChip(/Busca/i)).not.toThrow();
    expect(setFilter).toHaveBeenCalledTimes(1);
    expect(setFilter).toHaveBeenCalledWith('q', '');
  });

  it('SEM onAfterRemove: múltiplos cliques em chips diferentes seguem funcionando', () => {
    const { setFilter } = renderBar({
      filters: { q: 'x', canais: ['whatsapp'], direcao: 'outbound' },
      onAfterRemove: undefined,
    });
    expect(() => {
      clickRemoveOnChip(/Busca/i);
      clickRemoveOnChip('WhatsApp');
      clickRemoveOnChip(/Enviadas/i);
    }).not.toThrow();
    expect(setFilter).toHaveBeenCalledTimes(3);
  });

  it('SEM onAfterRemove: botão "Limpar filtros" continua chamando clear()', () => {
    const { clear } = renderBar({
      filters: { q: 'a' },
      onAfterRemove: undefined,
    });
    expect(() => {
      fireEvent.click(screen.getByRole('button', { name: /limpar todos os filtros/i }));
    }).not.toThrow();
    expect(clear).toHaveBeenCalledTimes(1);
  });
});
