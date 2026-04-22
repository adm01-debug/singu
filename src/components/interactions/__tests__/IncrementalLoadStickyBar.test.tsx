import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { IncrementalLoadStickyBar } from '../IncrementalLoadStickyBar';

describe('IncrementalLoadStickyBar', () => {
  it('não renderiza quando !hasMore', () => {
    const { container } = render(
      <IncrementalLoadStickyBar hasMore={false} totalLoaded={50} total={50} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('não renderiza quando total=0', () => {
    const { container } = render(
      <IncrementalLoadStickyBar hasMore totalLoaded={0} total={0} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('exibe contagem e restantes quando hasMore', () => {
    render(<IncrementalLoadStickyBar hasMore totalLoaded={15} total={100} />);
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toHaveTextContent(/Exibindo/);
    expect(status).toHaveTextContent('15');
    expect(status).toHaveTextContent('100');
    expect(status).toHaveTextContent(/85 restantes/);
  });

  it('usa singular para 1 restante', () => {
    render(<IncrementalLoadStickyBar hasMore totalLoaded={99} total={100} />);
    expect(screen.getByRole('status')).toHaveTextContent(/1 restante(?!s)/);
  });

  it('aplica top offset via style inline', () => {
    render(
      <IncrementalLoadStickyBar hasMore totalLoaded={10} total={100} topOffset="3.5rem" />,
    );
    expect(screen.getByRole('status')).toHaveStyle({ top: '3.5rem' });
  });

  it('barra de progresso reflete percentual carregado', () => {
    const { container } = render(
      <IncrementalLoadStickyBar hasMore totalLoaded={25} total={100} />,
    );
    const fill = container.querySelector('[aria-hidden="true"] > div') as HTMLElement;
    expect(fill).toBeTruthy();
    expect(fill.style.width).toBe('25%');
  });
});
