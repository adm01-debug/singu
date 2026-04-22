/**
 * Integração: URL ↔ chips de canais em /interacoes
 *
 * Cobre o ciclo crítico que junta `useInteractionsAdvancedFilter` (parser/whitelist)
 * com `ActiveFiltersBar` (chips com botão de fechar):
 *   1) Abrir /interacoes?canais=… popula `filters.canais` na ordem correta.
 *   2) Clicar no "X" de um chip remove só aquele canal e mantém o param.
 *   3) Remover o último canal apaga `?canais=` da URL (não persiste vazio).
 *
 * Por que integração e não unit:
 * - O bug clássico desta área é a divergência entre a normalização do parser e
 *   o setter (lowercasing/whitelist/dedup). Renderizar os chips reais e clicar
 *   no DOM garante que o caminho de UI usa exatamente a mesma fonte de verdade
 *   já centralizada em `@/lib/canaisInteracao`.
 */
import React, { useEffect } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { useInteractionsAdvancedFilter } from '@/hooks/useInteractionsAdvancedFilter';
import { ActiveFiltersBar } from '@/components/interactions/ActiveFiltersBar';

// `sonner` é usado pelo hook para avisar sobre canais inválidos vindos da URL.
// Mockamos para não vazar toasts em jsdom e para podermos asseverar quando quisermos.
vi.mock('sonner', () => ({
  toast: {
    warning: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// `useDebounce` introduz timers que não interessam aos asserts deste arquivo.
// Devolvemos o valor cru: nenhum dos cenários valida `debouncedQ`.
vi.mock('@/hooks/useDebounce', () => ({
  useDebounce: <T,>(v: T) => v,
}));

// `channelPersistence` toca `localStorage`. O wrapper `MemoryRouter` em jsdom
// já é estável, mas preferimos no-ops para isolar do estado entre testes.
vi.mock('@/lib/channelPersistence', () => ({
  readAppliedCanais: () => null,
  writeAppliedCanais: vi.fn(),
  clearAppliedCanais: vi.fn(),
}));

/**
 * Harness que renderiza a barra de chips real e expõe a URL atual via `data-*`
 * para asserts diretos no DOM — evita acoplar o teste ao formato interno do
 * `URLSearchParams` e simula como o usuário enxergaria o link copiado.
 */
function Harness({ onReady }: { onReady?: (api: ReturnType<typeof useInteractionsAdvancedFilter>) => void }) {
  const adv = useInteractionsAdvancedFilter();
  const location = useLocation();
  useEffect(() => { onReady?.(adv); }, [adv, onReady]);
  return (
    <div>
      <div data-testid="url-search">{location.search}</div>
      <div data-testid="canais-count">{adv.filters.canais.length}</div>
      <div data-testid="canais-csv">{adv.filters.canais.join(',')}</div>
      <ActiveFiltersBar
        filters={adv.filters}
        setFilter={adv.setFilter}
        clear={adv.clear}
        activeCount={adv.activeCount}
        totalCount={100}
        visibleCount={100}
      />
    </div>
  );
}

function renderAt(initial: string) {
  return render(
    <MemoryRouter initialEntries={[initial]}>
      <Harness />
    </MemoryRouter>,
  );
}

/**
 * Encontra o botão "X" do chip cujo texto visível contém `label`.
 * O Badge `closeable` usa aria-label fixo "Remove", então localizamos
 * primeiro o chip pelo texto e descemos para o botão.
 */
function getRemoveButtonForChip(label: string): HTMLButtonElement {
  const chip = screen.getByText(label).closest('[class*="rounded"]');
  if (!chip) throw new Error(`Chip não encontrado para "${label}"`);
  const btn = chip.querySelector('button[aria-label="Remove"]');
  if (!btn) throw new Error(`Botão de remover ausente no chip "${label}"`);
  return btn as HTMLButtonElement;
}

describe('integração /interacoes ?canais= ↔ chips', () => {
  it('hidrata filters.canais a partir da URL preservando ordem e whitelist', () => {
    renderAt('/interacoes?canais=email,call,whatsapp');
    expect(screen.getByTestId('canais-csv').textContent).toBe('email,call,whatsapp');
    expect(screen.getByTestId('canais-count').textContent).toBe('3');
    // Cada canal vira um chip (Email/Ligação/WhatsApp).
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Ligação')).toBeInTheDocument();
    expect(screen.getByText('WhatsApp')).toBeInTheDocument();
  });

  it('remove um canal via clique no X do chip e mantém os demais na URL', async () => {
    const user = userEvent.setup();
    renderAt('/interacoes?canais=email,call,whatsapp');

    await user.click(getRemoveButtonForChip('Email'));

    expect(screen.getByTestId('canais-csv').textContent).toBe('call,whatsapp');
    expect(screen.getByTestId('canais-count').textContent).toBe('2');
    expect(screen.getByTestId('url-search').textContent).toContain('canais=call%2Cwhatsapp');
    expect(screen.queryByText('Email')).not.toBeInTheDocument();
  });

  it('remover o ÚLTIMO canal apaga o param ?canais= da URL', async () => {
    const user = userEvent.setup();
    renderAt('/interacoes?canais=email');

    expect(screen.getByTestId('canais-count').textContent).toBe('1');
    expect(screen.getByTestId('url-search').textContent).toContain('canais=email');

    await user.click(getRemoveButtonForChip('Email'));

    expect(screen.getByTestId('canais-count').textContent).toBe('0');
    expect(screen.getByTestId('canais-csv').textContent).toBe('');
    expect(screen.getByTestId('url-search').textContent).not.toContain('canais=');
  });

  it('alterna chips em sequência e termina sem ?canais= quando esvaziado', async () => {
    const user = userEvent.setup();
    renderAt('/interacoes?canais=email,call,whatsapp');

    await user.click(getRemoveButtonForChip('WhatsApp'));
    expect(screen.getByTestId('canais-csv').textContent).toBe('email,call');

    await user.click(getRemoveButtonForChip('Email'));
    expect(screen.getByTestId('canais-csv').textContent).toBe('call');
    expect(screen.getByTestId('url-search').textContent).toContain('canais=call');

    await user.click(getRemoveButtonForChip('Ligação'));
    expect(screen.getByTestId('canais-count').textContent).toBe('0');
    expect(screen.getByTestId('url-search').textContent).not.toContain('canais=');
  });

  it('descarta valores fora da whitelist mas mantém os válidos', () => {
    renderAt('/interacoes?canais=email,garbage,CALL');
    // `garbage` é descartado; `CALL` é normalizado para minúsculas.
    expect(screen.getByTestId('canais-csv').textContent).toBe('email,call');
    expect(screen.getByTestId('canais-count').textContent).toBe('2');
  });

  it('setFilter("canais", []) programaticamente também limpa o param', () => {
    let api: ReturnType<typeof useInteractionsAdvancedFilter> | null = null;
    render(
      <MemoryRouter initialEntries={['/interacoes?canais=email,call']}>
        <Harness onReady={(a) => { api = a; }} />
      </MemoryRouter>,
    );

    expect(screen.getByTestId('canais-count').textContent).toBe('2');
    act(() => { api!.setFilter('canais', []); });
    expect(screen.getByTestId('canais-count').textContent).toBe('0');
    expect(screen.getByTestId('url-search').textContent).not.toContain('canais=');
  });
});
