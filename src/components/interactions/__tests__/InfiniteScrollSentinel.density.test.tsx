import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { InfiniteScrollSentinel } from '../InfiniteScrollSentinel';
import { DensityProvider, notifyDensityChange } from '@/contexts/DensityContext';

const makeRef = () => createRef<HTMLDivElement>();

beforeEach(() => {
  localStorage.clear();
});

describe('InfiniteScrollSentinel — densidade ambiente', () => {
  it('usa "comfortable" por padrão (sem provider, sem localStorage)', () => {
    const { container } = render(
      <InfiniteScrollSentinel sentinelRef={makeRef()} hasMore total={100} totalLoaded={10} />,
    );
    // 3 skeletons no modo comfortable
    expect(container.querySelectorAll('.h-20').length).toBe(3);
  });

  it('lê "compact" do localStorage automaticamente', () => {
    localStorage.setItem('singu-table-density', 'compact');
    notifyDensityChange();
    const { container } = render(
      <InfiniteScrollSentinel sentinelRef={makeRef()} hasMore total={100} totalLoaded={10} />,
    );
    // 2 CompactItemSkeleton, cada um com avatar .h-7.w-7
    expect(container.querySelectorAll('.h-7.w-7').length).toBe(2);
    expect(container.querySelectorAll('.h-20').length).toBe(0);
  });

  it('DensityProvider tem prioridade sobre localStorage', () => {
    localStorage.setItem('singu-table-density', 'comfortable');
    const { container } = render(
      <DensityProvider value="compact">
        <InfiniteScrollSentinel sentinelRef={makeRef()} hasMore total={100} totalLoaded={10} />
      </DensityProvider>,
    );
    expect(container.querySelectorAll('.h-7.w-7').length).toBe(2);
    expect(container.querySelectorAll('.h-20').length).toBe(0);
  });

  it('prop density explícita sobrescreve provider', () => {
    const { container } = render(
      <DensityProvider value="compact">
        <InfiniteScrollSentinel
          sentinelRef={makeRef()}
          hasMore
          total={100}
          totalLoaded={10}
          density="comfortable"
        />
      </DensityProvider>,
    );
    expect(container.querySelectorAll('.h-20').length).toBe(3);
  });

  it('mantém estado final independente da densidade', () => {
    localStorage.setItem('singu-table-density', 'compact');
    render(
      <InfiniteScrollSentinel
        sentinelRef={makeRef()}
        hasMore={false}
        total={50}
        totalLoaded={50}
      />,
    );
    expect(screen.getByText(/Fim da lista — 50 interações exibidas/)).toBeInTheDocument();
  });
});
