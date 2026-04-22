/**
 * Testes do utilitário `preserveScroll`.
 *
 * Cenário-alvo: ao remover um chip de filtro numa lista longa, o documento
 * encolhe e o navegador clampa `scrollY` para o novo máximo, gerando um
 * "salto" visual. `preserveScroll` precisa:
 *  - capturar `scrollY` ANTES da mutação,
 *  - re-aplicar em dois rAFs (depois do commit + layout),
 *  - clampar pela nova altura quando a posição original ficou inválida,
 *  - não chamar `scrollTo` quando o delta é desprezível (< 1px).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { preserveScroll } from '@/lib/preserveScroll';

/** Avança N frames de rAF na ordem em que foram agendados. */
async function flushFrames(n: number): Promise<void> {
  for (let i = 0; i < n; i++) {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  }
}

describe('preserveScroll', () => {
  let scrollSpy: ReturnType<typeof vi.fn>;
  let originalScrollTo: typeof window.scrollTo;

  beforeEach(() => {
    // jsdom não implementa rAF realista — instalamos um shim baseado em
    // setTimeout(0) para que `flushFrames` consiga aguardar o agendamento.
    if (typeof window.requestAnimationFrame !== 'function') {
      (window as unknown as { requestAnimationFrame: (cb: FrameRequestCallback) => number }).requestAnimationFrame =
        (cb: FrameRequestCallback) => setTimeout(() => cb(performance.now()), 0) as unknown as number;
    }
    scrollSpy = vi.fn();
    originalScrollTo = window.scrollTo;
    // jsdom: `window.scrollTo` é noop e não atualiza `scrollY`. Espionamos.
    window.scrollTo = scrollSpy as unknown as typeof window.scrollTo;
  });

  afterEach(async () => {
    // Drena rAFs pendentes ANTES de restaurar o spy/scrollY: caso contrário
    // callbacks agendados pela chamada do teste atual poderiam disparar
    // durante o próximo `beforeEach` (já com novo spy) e poluir suas
    // contagens — bug clássico de leak entre testes assíncronos.
    await flushFrames(3);
    window.scrollTo = originalScrollTo;
    vi.restoreAllMocks();
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });
  });

  function setLayout(opts: { scrollY: number; scrollHeight: number; innerHeight: number }) {
    Object.defineProperty(window, 'scrollY', { configurable: true, value: opts.scrollY });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: opts.innerHeight });
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      configurable: true,
      value: opts.scrollHeight,
    });
  }

  it('captura scrollY no momento da chamada', () => {
    setLayout({ scrollY: 1234, scrollHeight: 5000, innerHeight: 800 });
    const handle = preserveScroll();
    expect(handle.y).toBe(1234);
  });

  it('re-aplica scroll após dois rAFs (commit + layout estabilizado)', async () => {
    // Página longa: usuário em scrollY=3000 numa lista de 10.000.
    setLayout({ scrollY: 3000, scrollHeight: 10_000, innerHeight: 800 });
    preserveScroll();

    // Antes dos rAFs, nada foi chamado — não queremos fazer scroll prematuro
    // antes do React commitar a nova altura.
    expect(scrollSpy).not.toHaveBeenCalled();

    // Simula o comportamento real do navegador: ao encolher o documento para
    // 3500 (cabe a posição original com folga), o `scrollY` PERMANECE em 3000.
    // Para forçar o caminho de restauração, simulamos que algum efeito colateral
    // moveu o scroll para 0 (cenário real: foco em chip rolou a página).
    setLayout({ scrollY: 0, scrollHeight: 9000, innerHeight: 800 });
    await flushFrames(4);

    expect(scrollSpy).toHaveBeenCalledTimes(1);
    const call = scrollSpy.mock.calls[0]?.[0] as ScrollToOptions;
    expect(call.top).toBe(3000);
    expect(call.behavior).toBe('auto');
  });

  it('clampa para o novo máximo quando o documento encolheu abaixo da posição', async () => {
    // Captura: o usuário estava em scrollY=3000 numa lista de 10.000.
    setLayout({ scrollY: 3000, scrollHeight: 10_000, innerHeight: 800 });
    preserveScroll();

    // Após remover o chip, a lista encolheu drasticamente: nova altura 1.500.
    // O navegador clampou silenciosamente scrollY para 700 (= 1500 - 800).
    // preserveScroll deve detectar a divergência e re-emitir scrollTo(700) —
    // confirmando que NÃO tenta voltar para 3000 (impossível) nem deixa o
    // valor clampado errado.
    setLayout({ scrollY: 700, scrollHeight: 1500, innerHeight: 800 });
    await flushFrames(4);

    expect(scrollSpy).toHaveBeenCalledTimes(1);
    const call = scrollSpy.mock.calls[0]?.[0] as ScrollToOptions;
    expect(call.top).toBe(700);
  });

  it('não chama scrollTo quando o delta é desprezível (< 1px)', async () => {
    // Posição original cabe folgadamente na nova altura E o navegador já está
    // exatamente lá → evita acionar listeners de scroll por nada.
    setLayout({ scrollY: 1000, scrollHeight: 5000, innerHeight: 800 });
    preserveScroll();
    setLayout({ scrollY: 1000, scrollHeight: 4500, innerHeight: 800 });
    await flushFrames(2);

    expect(scrollSpy).not.toHaveBeenCalled();
  });

  it('não tenta posições negativas quando a página encolhe abaixo da viewport', async () => {
    setLayout({ scrollY: 200, scrollHeight: 4000, innerHeight: 800 });
    preserveScroll();

    // Página encolheu para menos que innerHeight → max teórico negativo.
    // Deve clampar em 0, nunca em valor negativo.
    setLayout({ scrollY: 0, scrollHeight: 500, innerHeight: 800 });
    await flushFrames(2);

    if (scrollSpy.mock.calls.length > 0) {
      const call = scrollSpy.mock.calls[0]?.[0] as ScrollToOptions;
      expect(call.top).toBeGreaterThanOrEqual(0);
    }
  });

  it('restore() é idempotente — chamar manualmente duas vezes não duplica scroll', async () => {
    setLayout({ scrollY: 2000, scrollHeight: 8000, innerHeight: 800 });
    const handle = preserveScroll();

    // Após o re-render, posição válida; o rAF agenda 1 chamada.
    setLayout({ scrollY: 2000, scrollHeight: 7000, innerHeight: 800 });
    await flushFrames(2);
    const callsAfterAuto = scrollSpy.mock.calls.length;

    // Chamar manualmente quando já está na posição correta deve ser no-op
    // (delta < 1px). Caso contrário, escreveria de novo.
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 2000 });
    handle.restore();
    expect(scrollSpy.mock.calls.length).toBe(callsAfterAuto);
  });

  it('é seguro em ambiente sem DOM (SSR-safe)', () => {
    const originalWindow = globalThis.window;
    // simulando ambiente sem window (cast já cobre o delete)
    delete (globalThis as { window?: unknown }).window;
    try {
      const handle = preserveScroll();
      expect(handle.y).toBe(0);
      expect(() => handle.restore()).not.toThrow();
    } finally {
      globalThis.window = originalWindow;
    }
  });
});
