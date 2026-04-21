import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { InfiniteScrollSentinel } from '../InfiniteScrollSentinel';

function makeRef() {
  return createRef<HTMLDivElement>();
}

describe('InfiniteScrollSentinel', () => {
  it('não renderiza nada quando total=0', () => {
    const { container } = render(
      <InfiniteScrollSentinel sentinelRef={makeRef()} hasMore total={0} totalLoaded={0} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('exibe progressbar com aria-values e contador no estado hasMore', () => {
    render(
      <InfiniteScrollSentinel sentinelRef={makeRef()} hasMore total={100} totalLoaded={10} />
    );
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '10');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    const fill = bar.firstElementChild as HTMLElement;
    expect(fill.style.width).toBe('10%');
    expect(screen.getByText(/10 de 100/)).toBeInTheDocument();
  });

  it('exibe estado final sem barra quando !hasMore', () => {
    render(
      <InfiniteScrollSentinel sentinelRef={makeRef()} hasMore={false} total={50} totalLoaded={50} />
    );
    expect(screen.getByText(/Fim da lista — 50 interações exibidas/)).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('renderiza 3 skeletons em comfortable e 2 em compact', () => {
    const { container, rerender } = render(
      <InfiniteScrollSentinel sentinelRef={makeRef()} hasMore total={100} totalLoaded={10} />
    );
    // 3 skeletons + 1 progress fill div = 4 .rounded-* — contar pelos skeletons via className h-20
    expect(container.querySelectorAll('.h-20').length).toBe(3);

    rerender(
      <InfiniteScrollSentinel sentinelRef={makeRef()} hasMore total={100} totalLoaded={10} density="compact" />
    );
    expect(container.querySelectorAll('.h-12').length).toBe(2);
    expect(container.querySelectorAll('.h-20').length).toBe(0);
  });

  it('aplica atributos de acessibilidade no estado de carregamento', () => {
    const { container } = render(
      <InfiniteScrollSentinel sentinelRef={makeRef()} hasMore total={100} totalLoaded={10} />
    );
    const live = container.querySelector('[aria-live="polite"]');
    expect(live).not.toBeNull();
    expect(live).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-label', 'Carregando mais interações');
  });
});
