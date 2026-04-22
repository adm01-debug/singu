import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { useInteractionsAdvancedFilter } from '@/hooks/useInteractionsAdvancedFilter';

const DE_KEY = 'singu-interactions-de-v1';
const ATE_KEY = 'singu-interactions-ate-v1';
const Q_KEY = 'singu-interactions-q-v1';
const CONTACT_KEY = 'singu-interactions-contact-v1';
const COMPANY_KEY = 'singu-interactions-company-v1';

function wrapperFor(initial: string) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(MemoryRouter, { initialEntries: [initial] }, children);
}

/**
 * Persistência do intervalo de datas no localStorage.
 *
 * Comportamento esperado:
 * 1. Aplicar `de`/`ate` via `applyDateRange` → escreve em LS imediatamente
 *    (espelho reativo via useEffect).
 * 2. Recarregar (montagem nova com URL limpa) → restaura `de`/`ate` do LS
 *    sem afetar outros filtros que estão na URL atual.
 * 3. URL ganha sobre LS (precedência): se a URL trouxer datas, o LS é
 *    ignorado naquela hidratação.
 * 4. `clearDateRange` zera URL E limpa o LS (via efeito reativo).
 */
describe('useInteractionsAdvancedFilter › persistência do intervalo de datas', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('escreve `de` e `ate` no localStorage quando aplicados', async () => {
    const { result } = renderHook(() => useInteractionsAdvancedFilter(), {
      wrapper: wrapperFor('/interacoes'),
    });

    act(() => {
      result.current.applyDateRange(new Date('2025-03-01T12:00:00'), new Date('2025-03-31T12:00:00'));
    });

    // useEffects reativos rodam após o commit; aguardamos um microtick.
    await act(async () => { await Promise.resolve(); });

    expect(localStorage.getItem(DE_KEY)).toBe('2025-03-01');
    expect(localStorage.getItem(ATE_KEY)).toBe('2025-03-31');
  });

  it('restaura `de`/`ate` do localStorage no mount quando a URL não os tem, preservando q/contact/company da URL', async () => {
    // Simula sessão anterior: datas estavam aplicadas e ficaram no LS.
    localStorage.setItem(DE_KEY, '2025-04-01');
    localStorage.setItem(ATE_KEY, '2025-04-30');
    // E também q/contact/company de outra fonte (ex.: visita anterior).
    localStorage.setItem(Q_KEY, 'foo');
    localStorage.setItem(CONTACT_KEY, 'c-99');
    localStorage.setItem(COMPANY_KEY, 'co-99');

    // Reload simulado: monta o hook com URL limpa.
    const { result } = renderHook(() => useInteractionsAdvancedFilter(), {
      wrapper: wrapperFor('/interacoes'),
    });

    // Aguarda hidratação one-shot (useEffect inicial + setSearchParams).
    await act(async () => { await Promise.resolve(); });

    expect(result.current.filters.de).toBeInstanceOf(Date);
    expect(result.current.filters.ate).toBeInstanceOf(Date);
    expect((result.current.filters.de as Date).toISOString().slice(0, 10)).toBe('2025-04-01');
    expect((result.current.filters.ate as Date).toISOString().slice(0, 10)).toBe('2025-04-30');
    // Demais filtros do LS também foram restaurados (preservados juntos).
    expect(result.current.filters.q).toBe('foo');
    expect(result.current.filters.contact).toBe('c-99');
    expect(result.current.filters.company).toBe('co-99');
  });

  it('URL ganha sobre LS: se a URL traz `de`/`ate`, o LS é ignorado na hidratação', async () => {
    localStorage.setItem(DE_KEY, '2025-04-01'); // valor antigo
    localStorage.setItem(ATE_KEY, '2025-04-30');

    const { result } = renderHook(() => useInteractionsAdvancedFilter(), {
      wrapper: wrapperFor('/interacoes?de=2025-06-15&ate=2025-06-20'),
    });

    await act(async () => { await Promise.resolve(); });

    expect((result.current.filters.de as Date).toISOString().slice(0, 10)).toBe('2025-06-15');
    expect((result.current.filters.ate as Date).toISOString().slice(0, 10)).toBe('2025-06-20');
  });

  it('preserva canais/q/contact/company na URL ao restaurar datas do LS', async () => {
    localStorage.setItem(DE_KEY, '2025-05-01');
    localStorage.setItem(ATE_KEY, '2025-05-31');

    const { result } = renderHook(() => useInteractionsAdvancedFilter(), {
      wrapper: wrapperFor('/interacoes?q=acme&contact=c-1&company=co-1&canais=email,whatsapp'),
    });

    await act(async () => { await Promise.resolve(); });

    // Datas restauradas do LS
    expect((result.current.filters.de as Date).toISOString().slice(0, 10)).toBe('2025-05-01');
    expect((result.current.filters.ate as Date).toISOString().slice(0, 10)).toBe('2025-05-31');
    // E o que estava na URL permanece intocado
    expect(result.current.filters.q).toBe('acme');
    expect(result.current.filters.contact).toBe('c-1');
    expect(result.current.filters.company).toBe('co-1');
    expect(result.current.filters.canais).toEqual(['email', 'whatsapp']);
  });

  it('clearDateRange remove `de`/`ate` do localStorage (via espelho reativo)', async () => {
    const { result } = renderHook(() => useInteractionsAdvancedFilter(), {
      wrapper: wrapperFor('/interacoes?de=2025-01-01&ate=2025-01-31&q=acme'),
    });

    // Garante que a persistência reativa escreveu o LS após o mount.
    await act(async () => { await Promise.resolve(); });
    expect(localStorage.getItem(DE_KEY)).toBe('2025-01-01');
    expect(localStorage.getItem(ATE_KEY)).toBe('2025-01-31');

    act(() => { result.current.clearDateRange(); });
    await act(async () => { await Promise.resolve(); });

    // URL limpa
    expect(result.current.filters.de).toBeUndefined();
    expect(result.current.filters.ate).toBeUndefined();
    // E o LS também foi limpo (não vai voltar a "ressuscitar" no próximo reload)
    expect(localStorage.getItem(DE_KEY)).toBeNull();
    expect(localStorage.getItem(ATE_KEY)).toBeNull();
    // Outros filtros preservados (q permanece tanto na URL quanto no LS)
    expect(result.current.filters.q).toBe('acme');
  });

  it('valores inválidos no LS são ignorados silenciosamente (não quebram o hook)', async () => {
    localStorage.setItem(DE_KEY, 'data-invalida');
    localStorage.setItem(ATE_KEY, '2025-13-99');

    const { result } = renderHook(() => useInteractionsAdvancedFilter(), {
      wrapper: wrapperFor('/interacoes'),
    });

    await act(async () => { await Promise.resolve(); });

    expect(result.current.filters.de).toBeUndefined();
    expect(result.current.filters.ate).toBeUndefined();
  });
});
