import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('framer-motion', () => ({
  motion: new Proxy({}, {
    get: (_, tag) => {
      return ({ children, ...props }: any) => {
        const Element = typeof tag === 'string' ? tag : 'div';
        return <Element {...props}>{children}</Element>;
      };
    },
  }),
  AnimatePresence: ({ children }: any) => <>{children}</>,
  useMotionValue: (v: number) => ({ get: () => v, set: vi.fn(), on: vi.fn(() => vi.fn()) }),
  useSpring: () => ({ get: () => 0, set: vi.fn(), on: vi.fn(() => vi.fn()) }),
}));

vi.mock('react-force-graph-2d', () => ({
  default: vi.fn((props: any) => <div data-testid="force-graph" />),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('@/hooks/useNetworkGraph', () => ({
  useNetworkGraph: () => ({
    graphData: {
      nodes: [
        { id: 'you', name: 'You', type: 'you', val: 12, color: '#3b82f6' },
        { id: 'contact-1', name: 'Alice', type: 'contact', val: 8, color: '#10b981' },
        { id: 'company-1', name: 'Acme Corp', type: 'company', val: 10, color: '#8b5cf6' },
      ],
      links: [
        { source: 'you', target: 'contact-1', value: 2, type: 'interacted' },
        { source: 'contact-1', target: 'company-1', value: 1, type: 'works_at' },
      ],
    },
    loading: false,
    error: null,
    selectedNode: null,
    setSelectedNode: vi.fn(),
    stats: {
      totalNodes: 3,
      totalLinks: 2,
      avgConnections: 1.3,
      clusters: 1,
      topInfluencers: [{ id: 'contact-1', name: 'Alice', connections: 2 }],
    },
    refetch: vi.fn(),
  }),
}));

vi.mock('@/hooks/useHapticFeedback', () => ({
  useHapticFeedback: () => ({ trigger: vi.fn() }),
}));

// Mock IntersectionObserver
window.IntersectionObserver = vi.fn().mockReturnValue({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
});

import { NetworkVisualization } from '../NetworkVisualization';

describe('NetworkVisualization', () => {
  it('renders the component', () => {
    const { container } = render(<NetworkVisualization />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders the force graph', () => {
    render(<NetworkVisualization />);
    expect(screen.getByTestId('force-graph')).toBeInTheDocument();
  });

  it('renders stats', () => {
    render(<NetworkVisualization />);
    expect(screen.getByText(/Nós/)).toBeInTheDocument();
    expect(screen.getByText(/Conexões/)).toBeInTheDocument();
  });

  it('renders title', () => {
    render(<NetworkVisualization />);
    expect(screen.getByText('Mapa de Relacionamentos')).toBeInTheDocument();
  });

  it('renders legend', () => {
    render(<NetworkVisualization />);
    expect(screen.getByText('Legenda')).toBeInTheDocument();
    expect(screen.getByText('Você')).toBeInTheDocument();
    expect(screen.getByText('Empresas')).toBeInTheDocument();
  });

  it('renders top influencers', () => {
    render(<NetworkVisualization />);
    expect(screen.getByText(/Principais Influenciadores/)).toBeInTheDocument();
    expect(screen.getByText(/Alice/)).toBeInTheDocument();
  });

  it('renders zoom controls', () => {
    render(<NetworkVisualization />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(3);
  });

  it('renders filter dropdown', () => {
    render(<NetworkVisualization />);
    expect(screen.getByText('Filtros')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<NetworkVisualization className="custom" />);
    expect(container.firstChild).toHaveClass('custom');
  });
});
